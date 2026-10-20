/// <reference lib="webworker" />
/**
 * Service worker — offline-first for Bookzi.
 *
 * Strategy matrix (all cache names are STABLE across builds so previously
 * cached pages/books keep working after a deploy):
 *
 *   • Navigations (HTML)          NetworkFirst(3s) → bookzi-nav
 *     Every visited page is replayable offline; when nothing is cached the
 *     precached home page (app shell) is served instead.
 *   • RSC payloads (SPA nav)      NetworkFirst(3s) → bookzi-rsc
 *     Client-side <Link> navigation works offline for visited/prefetched
 *     routes instead of dying with a router error.
 *   • /api/books/<slug>/pages     StaleWhileRevalidate → bookzi-book-content (90d)
 *     The offline-reading workhorse — filled by the prefetcher/download flow.
 *   • Other read-only /api GETs   StaleWhileRevalidate → bookzi-api (7d)
 *     Dashboard/library/widgets render from last-known data offline.
 *     /api/auth/* is never cached (login state must stay truthful).
 *   • Static assets               CacheFirst → bookzi-static (dev: NetworkFirst)
 *   • Dictionary (POST)           StaleWhileRevalidate → bookzi-dictionary
 *   • OG images                   StaleWhileRevalidate → bookzi-og
 *
 * Account mutations (POST/PUT/PATCH/DELETE) bypass caching entirely and are
 * never replayed in the background — they simply fail offline and the app
 * re-syncs through normal usage when connectivity returns.
 */

import {
  BackgroundSyncQueueStore,
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  Serwist,
  StaleWhileRevalidate,
  type PrecacheEntry,
} from 'serwist'

const isDev =
  typeof self !== 'undefined' &&
  (self.location.hostname === 'localhost' ||
    self.location.hostname === '127.0.0.1' ||
    self.location.hostname.endsWith('.space-z.ai') ||
    self.location.hostname.endsWith('.preview.z.ai'))

// The precache manifest is injected by @serwist/next at build time (the
// placeholder below is replaced with the actual asset list). It's not a
// real global at type-check time, so we declare it locally.
declare const __BUILD_REVISION__: string

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST?: (PrecacheEntry | string)[]
}

// ---------------------------------------------------------------------------
// Precache — build-injected assets + the hard-coded "must-work-offline" app
// shell. Precaching `/` guarantees the offline fallback always has the real
// app to serve, never an interstitial.
// ---------------------------------------------------------------------------
const HARDCODED_PRECACHE: PrecacheEntry[] = [
  // The app shell: when a navigation can't be served from the network or
  // runtime caches, we serve the real home page — the user keeps using the
  // app offline; there is no separate "offline" interstitial page.
  { url: '/', revision: __BUILD_REVISION__ },
  { url: '/manifest.json', revision: __BUILD_REVISION__ },
  { url: '/icons/icon-192.png', revision: __BUILD_REVISION__ },
  { url: '/icons/icon-512.png', revision: __BUILD_REVISION__ },
]

// ---------------------------------------------------------------------------
// Runtime caching — see file header for the strategy matrix.
// ---------------------------------------------------------------------------
const STATIC_ASSETS_MATCHER = ({ url, request }: { url: URL; request: Request }) => {
  // Next.js fingerprinted build assets — immutable URLs, safe to cache
  // essentially forever (with a 60-entry cap to bound disk usage).
  if (url.origin !== self.location.origin) return false
  if (url.pathname.startsWith('/_next/static/')) return true
  // PWA icons, favicons, apple-touch-icon — versioned by `revision` in
  // the precache; runtime cache is just a fast path.
  if (url.pathname.startsWith('/icons/')) return true
  // next/font self-hosted fonts (woff2) are served from /_next/static/media
  // and would already match above; the destination check catches any
  // edge-case fonts loaded from elsewhere.
  if (request.destination === 'font') return true
  if (request.destination === 'image') return true
  return false
}

const BOOK_CONTENT_MATCHER = ({ url }: { url: URL }) =>
  // `/api/books/<slug>/pages?from=...&to=...` — chunked reader content.
  // Caching this is what makes a previously-opened book readable offline.
  /^\/api\/books\/[^/]+\/pages/.test(url.pathname)

const DICTIONARY_MATCHER = ({ url }: { url: URL }) =>
  url.pathname === '/api/dictionary'

const OG_IMAGE_MATCHER = ({ url }: { url: URL }) =>
  url.pathname.startsWith('/api/og/')

const READER_PAGE_MATCHER = ({ url }: { url: URL }) =>
  url.origin === self.location.origin && url.pathname.startsWith('/books/read/')

/**
 * RSC flight-payload requests (App Router client navigation and <Link>
 * prefetch). Both carry the `RSC: 1` header; navigations never do. URLs are
 * distinguished by Next's `?_rsc=` parameter, so plain URL cache keys are
 * already per-route.
 */
const RSC_MATCHER = ({ url, request }: { url: URL; request: Request }) =>
  url.origin === self.location.origin &&
  request.method === 'GET' &&
  request.headers.get('RSC') === '1'

/**
 * Catch-all for read-only public/user GET APIs. Never matches /api/auth/*
 * (login/session state must not be served stale) and only ever matches GET,
 * so mutations are structurally excluded from caching.
 */
const READ_API_MATCHER = ({ url }: { url: URL }) =>
  url.origin === self.location.origin &&
  url.pathname.startsWith('/api/') &&
  !url.pathname.startsWith('/api/auth/')

/**
 * Dictionary POST cache-key plugin.
 *
 * `/api/dictionary` is a POST endpoint whose body is `{ word: "xyz" }`. The
 * URL is identical for every lookup, so naive URL-based caching would
 * return the wrong definition for any word after the first. This plugin
 * rewrites the cache key to `/api/dictionary?w=<word>` so each word gets
 * its own cache entry. The original request is unchanged — only the cache
 * key is affected.
 */
const dictionaryCacheKeyPlugin = {
  cacheKeyWillBeUsed: async ({
    request,
  }: {
    request: Request
  }): Promise<string | Request> => {
    if (request.method !== 'POST') return request
    try {
      const cloned = request.clone()
      const body = (await cloned.json().catch(() => null)) as
        | { word?: unknown; context?: unknown }
        | null
      const word =
        body && typeof body.word === 'string' && body.word.length > 0
          ? body.word
          : ''
      return `/api/dictionary?w=${encodeURIComponent(word)}&context=${encodeURIComponent(typeof body?.context === 'string' ? body.context : '')}`
    } catch {
      return request
    }
  },
}

// Retire the background-sync queue (mutations are never replayed) and delete
// caches from retired strategies: pre-stable-name caches and the per-build
// `bookzi-reader-<revision>` caches, which stranded every offline book after
// each deploy.
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const queue = new BackgroundSyncQueueStore('bookzi-sync-queue')
    for (const entry of await queue.getAll()) await queue.deleteEntry(entry.id)
    const legacyExact = ['bookzi-pages', 'bookzi-fresh-api', 'ketab-pages']
    const names = await caches.keys()
    await Promise.all(
      names
        .filter((name) => legacyExact.includes(name) || /^bookzi-reader-/.test(name))
        .map((name) => caches.delete(name)),
    )
  })())
})

const serwist = new Serwist({
  precacheEntries: [...(self.__SW_MANIFEST || []), ...HARDCODED_PRECACHE],
  skipWaiting: true,
  clientsClaim: true,
  // Navigation preload makes the first navigation snappy: the browser
  // starts the network request in parallel with SW boot, so we don't pay
  // the SW startup cost on the critical path.
  navigationPreload: true,
  disableDevLogs: true,
  runtimeCaching: [
    // ─── CacheFirst: immutable static assets (NetworkFirst in development to avoid stale dev content) ───
    {
      matcher: STATIC_ASSETS_MATCHER,
      handler: isDev
        ? new NetworkFirst({
            cacheName: 'bookzi-static',
            networkTimeoutSeconds: 3,
            plugins: [
              new ExpirationPlugin({
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              }),
            ],
          })
        : new CacheFirst({
            cacheName: 'bookzi-static',
            plugins: [
              new ExpirationPlugin({
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              }),
            ],
          }),
    },
    // ─── StaleWhileRevalidate: book content (offline reading) ───────────
    {
      matcher: BOOK_CONTENT_MATCHER,
      method: 'GET',
      handler: new StaleWhileRevalidate({
        cacheName: 'bookzi-book-content',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
          }),
        ],
      }),
    },
    // ─── StaleWhileRevalidate: dictionary (POST + body-aware cache key) ─
    {
      matcher: DICTIONARY_MATCHER,
      method: 'POST',
      handler: new StaleWhileRevalidate({
        cacheName: 'bookzi-dictionary',
        plugins: [
          dictionaryCacheKeyPlugin,
          new ExpirationPlugin({
            maxEntries: 500,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          }),
        ],
      }),
    },
    // ─── StaleWhileRevalidate: OG images ────────────────────────────────
    {
      matcher: OG_IMAGE_MATCHER,
      method: 'GET',
      handler: new StaleWhileRevalidate({
        cacheName: 'bookzi-og',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
          }),
        ],
      }),
    },
    // ─── NetworkFirst: reader pages (HTML + the prefetcher's plain GET) ─
    // Stable cache name — this is what keeps downloaded books readable
    // across deploys (the old per-revision name stranded them).
    {
      matcher: READER_PAGE_MATCHER,
      method: 'GET',
      handler: new NetworkFirst({
        cacheName: 'bookzi-nav',
        networkTimeoutSeconds: 3,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          }),
        ],
      }),
    },
    // ─── NetworkFirst: RSC payloads (offline client-side navigation) ────
    {
      matcher: RSC_MATCHER,
      method: 'GET',
      handler: new NetworkFirst({
        cacheName: 'bookzi-rsc',
        networkTimeoutSeconds: 3,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 120,
            maxAgeSeconds: 60 * 60 * 24 * 14, // 14 days
          }),
        ],
      }),
    },
    // ─── StaleWhileRevalidate: read-only GET APIs (offline widgets) ─────
    {
      matcher: READ_API_MATCHER,
      method: 'GET',
      handler: new StaleWhileRevalidate({
        cacheName: 'bookzi-api',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 300,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
          }),
        ],
      }),
    },
    // ─── NetworkFirst: all other HTML navigations ───────────────────────
    // Visited pages replay offline; when even that fails, the precached
    // app shell (home) is served by the fallback below instead of the
    // browser's "no internet" screen.
    {
      matcher: ({ request }) => request.mode === 'navigate',
      handler: new NetworkFirst({
        cacheName: 'bookzi-nav',
        networkTimeoutSeconds: 3,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          }),
        ],
      }),
    },
  ],
  // When a navigation fails entirely (offline + nothing cached), serve the
  // precached app shell (home page) so the user keeps using the app — cached
  // books and pages are reachable from there via the cached RSC payloads.
  // There is deliberately no separate "offline" page in this chain.
  fallbacks: {
    entries: [
      {
        url: '/',
        matcher: ({ request }: { request: Request }) =>
          request.mode === 'navigate',
      },
    ],
  },
})

serwist.addEventListeners()
