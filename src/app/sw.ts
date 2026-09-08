/// <reference lib="webworker" />
/** Service worker: public content caches only; account mutations are never replayed. */

import {
  BackgroundSyncQueueStore,
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
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
// Precache — build-injected assets + a small hard-coded "must-work-offline"
// list. The hard-coded entries are fetched at install time and cached for
// offline use. `/offline` is a Next.js route (not a static file) but Serwist
// can precache any URL reachable from the SW's scope.
// ---------------------------------------------------------------------------
const HARDCODED_PRECACHE: PrecacheEntry[] = [
  { url: '/offline.html', revision: __BUILD_REVISION__ },
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

const FRESH_API_MATCHER = ({ url }: { url: URL }) =>
  url.origin === self.location.origin && url.pathname === '/api/leaderboard'

const READER_PAGE_MATCHER = ({ url }: { url: URL }) =>
  url.origin === self.location.origin && url.pathname.startsWith('/books/read/')

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

// Retire already-stored requests from the unsafe, account-agnostic queue.
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const queue = new BackgroundSyncQueueStore('bookzi-sync-queue')
    for (const entry of await queue.getAll()) await queue.deleteEntry(entry.id)
    for (const name of ['bookzi-pages', 'bookzi-fresh-api']) await caches.delete(name)
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
    // Mutations use the network directly; there is no background replay.
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
    // ─── NetworkFirst: fresh-data APIs (leaderboard, reading progress) ──
    {
      matcher: FRESH_API_MATCHER,
      method: 'GET',
      handler: new NetworkFirst({
        cacheName: 'bookzi-fresh-api',
        networkTimeoutSeconds: 3,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: 60 * 5, // 5 minutes — fresh data matters
          }),
        ],
      }),
    },
    // ─── NetworkFirst: HTML navigations (enables offline /offline) ──────
    {
      matcher: READER_PAGE_MATCHER,
      method: 'GET',
      handler: new NetworkFirst({
        cacheName: `bookzi-reader-${__BUILD_REVISION__}`,
        networkTimeoutSeconds: 3,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
          }),
        ],
      }),
    },
    {
      matcher: ({ request }) => request.mode === 'navigate',
      handler: new NetworkOnly(),
    },
  ],
  // When a navigation request errors (offline + nothing in the runtime
  // cache), serve the precached `/offline` page instead of the browser's
  // default "no internet" screen. The audit (11 §5) flagged that the
  // /offline page was unreachable without a SW — this is the fix.
  fallbacks: {
    entries: [
      {
        url: '/offline.html',
        matcher: ({ request }: { request: Request }) =>
          request.mode === 'navigate',
      },
    ],
  },
})

serwist.addEventListeners()
