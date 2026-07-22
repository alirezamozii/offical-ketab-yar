/// <reference lib="webworker" />
/**
 * Ketab-Yar Service Worker — built by `@serwist/next` from this source.
 *
 * Compiled output: `public/sw.js` (generated at build time, never checked
 * in). In development (`NODE_ENV === 'development'`) the Serwist plugin is
 * disabled via `next.config.ts`, so no `sw.js` is emitted and the dev
 * server is untouched.
 *
 * ─── What this SW does ──────────────────────────────────────────────────
 *
 * 1. **Precaches** the Next.js build assets (auto-injected by Serwist at
 *    build time) plus a small hard-coded list of must-have offline URLs:
 *    the `/offline` page, `manifest.json`, and the three PWA PNG icons.
 *    These are fetched at SW install time and served from cache when the
 *    network drops.
 *
 * 2. **Runtime caching** (per audit 11 §5):
 *    - `CacheFirst` for static assets (`/_next/static/`, `/icons/`, fonts,
 *      images, scripts, styles) — they're fingerprinted so they never
 *      change URL; cache them indefinitely (with an expiration cap so the
 *      cache doesn't grow forever).
 *    - `StaleWhileRevalidate` for book content
 *      (`/api/books/[slug]/pages`), dictionary lookups
 *      (`/api/dictionary` — POST, cache key includes the request body so
 *      different words don't collide), and OG images (`/api/og/*`).
 *      These are the resources that make the **reader work offline**.
 *    - `NetworkFirst` for fresh-data APIs (`/api/leaderboard`,
 *      `/api/reading/progress` GET) — prefer the network, fall back to a
 *      short-cached copy when offline.
 *    - `NetworkFirst` for HTML navigations, with a 3-second network
 *      timeout. When this errors (offline + nothing in cache), the
 *      `fallbacks.entries` rule serves the precached `/offline` page.
 *
 * 3. **Offline fallback** for navigations: any `mode: 'navigate'` request
 *    that fails (offline, no cache) is answered with the precached
 *    `/offline` page. This is what makes the offline page *actually
 *    reachable* offline — the audit (11 §5) flagged that without a SW the
 *    `/offline` route is a UX lie.
 *
 * 4. `skipWaiting` + `clientsClaim` so a new SW takes over immediately on
 *    the next navigation, rather than waiting for all tabs to close.
 *
 * ─── Notes ──────────────────────────────────────────────────────────────
 *
 * - The precache manifest (Next.js build assets + `public/` files matching
 *   `globPublicPatterns`) is injected by Serwist's webpack plugin at build
 *   time, replacing the placeholder spread in `precacheEntries` below. We
 *   guard with `|| []` so the file is valid TypeScript even before injection.
 * - We do NOT cache POST `/api/reading/progress` (the progress-write
 *   endpoint). The reader's `mergeLocalProgress` already writes to
 *   localStorage; the server POST is fire-and-forget and is silently
 *   dropped when offline. A future task should add a BackgroundSync queue
 *   to replay these — see audit 11 §5 item #22.
 */

import {
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
  // Core routes
  { url: '/', revision: 'v1' },
  { url: '/library', revision: 'v1' },
  // The branded offline page — the navigation fallback target.
  { url: '/offline', revision: 'v1' },
  // PWA manifest + icons (Chrome reads these from the precache when
  // rendering the install prompt / app icon).
  { url: '/manifest.json', revision: 'v1' },
  { url: '/icons/icon-192.png', revision: 'v1' },
  { url: '/icons/icon-512.png', revision: 'v1' },
  { url: '/icons/icon-maskable-512.png', revision: 'v1' },
  { url: '/apple-touch-icon.png', revision: 'v1' },
]

// ---------------------------------------------------------------------------
// Runtime caching — see file header for the strategy matrix.
// ---------------------------------------------------------------------------
const STATIC_ASSETS_MATCHER = ({ url, request }: { url: URL; request: Request }) => {
  // Next.js fingerprinted build assets — immutable URLs, safe to cache
  // essentially forever (with a 60-entry cap to bound disk usage).
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
  url.pathname === '/api/leaderboard' ||
  url.pathname === '/api/reading/progress'

const NAVIGATE_MATCHER = ({ request, url }: { request: Request; url: URL }) =>
  request.mode === 'navigate' || url.pathname.startsWith('/books/read/')

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
        | { word?: unknown }
        | null
      const word =
        body && typeof body.word === 'string' && body.word.length > 0
          ? body.word
          : ''
      return `/api/dictionary?w=${encodeURIComponent(word)}`
    } catch {
      return request
    }
  },
}

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
            cacheName: 'ketab-static',
            networkTimeoutSeconds: 3,
            plugins: [
              new ExpirationPlugin({
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              }),
            ],
          })
        : new CacheFirst({
            cacheName: 'ketab-static',
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
        cacheName: 'ketab-book-content',
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
        cacheName: 'ketab-dictionary',
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
        cacheName: 'ketab-og',
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
        cacheName: 'ketab-fresh-api',
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
      matcher: NAVIGATE_MATCHER,
      handler: new NetworkFirst({
        cacheName: 'ketab-pages',
        networkTimeoutSeconds: 3,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
          }),
        ],
      }),
    },
  ],
  // When a navigation request errors (offline + nothing in the runtime
  // cache), serve the precached `/offline` page instead of the browser's
  // default "no internet" screen. The audit (11 §5) flagged that the
  // /offline page was unreachable without a SW — this is the fix.
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher: ({ request }: { request: Request }) =>
          request.mode === 'navigate',
      },
    ],
  },
})

serwist.addEventListeners()
