/**
 * Tiny in-memory TTL cache for API route responses.
 *
 * Design goals:
 *  - Zero dependencies, framework-agnostic, runs in any Node/Bun runtime.
 *  - Lazy expiry on read (no background sweep needed at this scale — the
 *    catalog is ~20 books / ~6 genres, so even worst-case cache size is
 *    bounded by the number of distinct query combinations).
 *  - Module-level singleton, preserved across Next.js HMR reloads via
 *    `globalThis` (same pattern as Prisma's client singleton in `db.ts`).
 *  - Type-safe via generics; values are reference-stored (no JSON round-trip
 *    — preserves Date instances, Map, etc.).
 *
 * Not a replacement for `Cache-Control` headers / CDN caching — this is the
 * L1 cache that sits *in front of* Prisma so a hot API endpoint doesn't
 * re-issue the same DB query on every request. Pair with `s-maxage` /
 * `stale-while-revalidate` for shared-CDN caching.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

type GlobalWithCache = typeof globalThis & {
  __kyTtlCache?: Map<string, CacheEntry<unknown>>
  /**
   * In-flight producer promises keyed by cache key. When N concurrent
   * callers miss the cache for the same key, only the first one runs the
   * producer; the others await the same promise. Entries are deleted on
   * both success and failure so a rejected producer is re-tried on the
   * next call. Lives on `globalThis` for the same HMR-stability reason
   * as `__kyTtlCache`.
   */
  __kyInflightCache?: Map<string, Promise<unknown>>
}

const g = globalThis as GlobalWithCache

function store(): Map<string, CacheEntry<unknown>> {
  if (!g.__kyTtlCache) {
    g.__kyTtlCache = new Map<string, CacheEntry<unknown>>()
  }
  return g.__kyTtlCache
}

function inflightStore(): Map<string, Promise<unknown>> {
  if (!g.__kyInflightCache) {
    g.__kyInflightCache = new Map<string, Promise<unknown>>()
  }
  return g.__kyInflightCache
}

export const cache = {
  /**
   * Read a cached value. Returns `undefined` if the key is missing or the
   * entry has expired (expired entries are evicted lazily on read).
   */
  get<T>(key: string): T | undefined {
    const entry = store().get(key) as CacheEntry<T> | undefined
    if (!entry) return undefined
    if (Date.now() >= entry.expiresAt) {
      store().delete(key)
      return undefined
    }
    return entry.value
  },

  /**
   * Write a value with a TTL (in milliseconds). After `ttlMs` the value is
   * considered stale and subsequent `get()` calls will return `undefined`.
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    if (ttlMs <= 0) {
      store().delete(key)
      return
    }
    const s = store()
    s.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    })
    // O(1) LRU eviction using Map's insertion order tracking
    if (s.size > 1000) {
      const oldestKey = s.keys().next().value
      if (oldestKey !== undefined) {
        s.delete(oldestKey)
      }
    }
  },

  /** Remove a single key. Safe to call on a missing key. */
  delete(key: string): void {
    store().delete(key)
  },

  /** Remove every cached entry. Useful for tests / manual busting. */
  clear(): void {
    store().clear()
  },

  /**
   * Read-through helper: returns the cached value if fresh, otherwise calls
   * `fn`, stores the result with `ttlMs`, and returns it. `fn` may be async
   * — the resolved value is cached (rejected promises are not cached).
   *
   * In-flight deduplication: if N concurrent callers miss the cache for the
   * same key (e.g. 5 simultaneous GET /api/books requests when the cache is
   * cold), only the FIRST caller runs the producer. The others await the
   * same Promise — without this, all 5 would race to re-run the same DB
   * query (a classic thundering-herd / cache-stampede problem). The
   * in-flight entry is deleted on both success and failure so a rejected
   * producer is re-tried on the next call (matches the "don't cache
   * rejections" contract tested in cache.test.ts).
   */
  async wrap<T>(key: string, fn: () => Promise<T>, ttlMs: number): Promise<T> {
    const hit = cache.get<T>(key)
    if (hit !== undefined) return hit

    // Reuse an in-flight producer if another caller already kicked one off.
    const inflight = inflightStore()
    const existing = inflight.get(key) as Promise<T> | undefined
    if (existing) return existing

    // Build the producer promise. `Promise.resolve(fn())` ensures we capture
    // both sync throws and async rejections in the same `.catch()` handler
    // (a bare `fn().then(...)` would let a sync throw escape the dedup).
    const p = Promise.resolve(fn())
      .then((value) => {
        cache.set(key, value, ttlMs)
        inflight.delete(key)
        return value
      })
      .catch((err) => {
        inflight.delete(key)
        throw err
      })
    inflight.set(key, p)
    return p
  },
}

/**
 * Convenience TTL constants (milliseconds) — keep these in one place so the
 * cache policy for the whole API surface is auditable at a glance.
 */
export const TTL = {
  /** Book lists — short, because reviews/views can change. */
  BOOKS_LIST: 60_000,
  /** Genre aggregation — rarely changes (only when books are added). */
  GENRES: 5 * 60_000,
  /** Search results — short, because users type fast and expect freshness. */
  SEARCH: 30_000,
  /** Per-guest recommendations — short, recomputed as the user reads. */
  RECOMMENDATIONS: 60_000,
} as const
