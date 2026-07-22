/**
 * In-memory TTL cache tests.
 *
 * Covers `src/lib/cache.ts`:
 *   - get/set round-trip
 *   - TTL expiry (lazy eviction on read)
 *   - delete / clear
 *   - wrap (read-through helper)
 *   - ttlMs <= 0 → treat as "don't cache"
 *
 * We use `vi.useFakeTimers()` for deterministic TTL tests.
 *
 * All assertions exercise real behaviour — no filler.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cache, TTL } from '@/lib/cache'

beforeEach(() => {
  cache.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('cache.get / cache.set', () => {
  it('returns undefined for a missing key', () => {
    expect(cache.get('missing')).toBeUndefined()
  })

  it('round-trips a value within the TTL window', () => {
    cache.set('k', { a: 1 }, 1000)
    expect(cache.get('k')).toEqual({ a: 1 })
  })

  it('preserves reference identity (no JSON round-trip)', () => {
    const date = new Date('2024-06-04')
    cache.set('d', date, 1000)
    expect(cache.get('d')).toBe(date) // === same reference
  })

  it('returns undefined after the TTL expires (lazy eviction)', () => {
    cache.set('k', 'v', 1000)
    vi.advanceTimersByTime(999)
    expect(cache.get('k')).toBe('v')
    vi.advanceTimersByTime(2)
    expect(cache.get('k')).toBeUndefined()
  })

  it('treats ttlMs <= 0 as "don\'t cache" (defensive)', () => {
    cache.set('k', 'v', 0)
    expect(cache.get('k')).toBeUndefined()
    cache.set('k', 'v', -10)
    expect(cache.get('k')).toBeUndefined()
  })
})

describe('cache.delete', () => {
  it('removes a stored key', () => {
    cache.set('k', 'v', 1000)
    cache.delete('k')
    expect(cache.get('k')).toBeUndefined()
  })

  it('is a no-op for a missing key (no throw)', () => {
    expect(() => cache.delete('never-set')).not.toThrow()
  })
})

describe('cache.clear', () => {
  it('removes every cached entry', () => {
    cache.set('a', 1, 1000)
    cache.set('b', 2, 1000)
    cache.clear()
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBeUndefined()
  })
})

describe('cache.wrap (read-through)', () => {
  it('calls fn on a cache miss and stores the result', async () => {
    const fn = vi.fn().mockResolvedValue('computed')
    const r1 = await cache.wrap('k', fn, 1000)
    expect(r1).toBe('computed')
    expect(fn).toHaveBeenCalledTimes(1)
    // Second call — should hit the cache, fn NOT called again.
    const r2 = await cache.wrap('k', fn, 1000)
    expect(r2).toBe('computed')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('re-calls fn after the TTL expires', async () => {
    const fn = vi.fn().mockResolvedValue('v')
    await cache.wrap('k', fn, 1000)
    vi.advanceTimersByTime(1001)
    await cache.wrap('k', fn, 1000)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('does NOT cache rejected promises (caller still sees the error)', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('upstream-down'))
    await expect(cache.wrap('k', fn, 1000)).rejects.toThrow('upstream-down')
    // Next call should also call fn (the rejection wasn't cached).
    await expect(cache.wrap('k', fn, 1000)).rejects.toThrow('upstream-down')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})

describe('TTL constants', () => {
  it('exports sensible default TTLs (all positive integers)', () => {
    expect(TTL.BOOKS_LIST).toBeGreaterThan(0)
    expect(TTL.GENRES).toBeGreaterThan(TTL.BOOKS_LIST)
    expect(TTL.SEARCH).toBeGreaterThan(0)
    expect(TTL.RECOMMENDATIONS).toBeGreaterThan(0)
  })
})
