/**
 * Token-bucket rate limiter tests.
 *
 * Covers `src/lib/rate-limit.ts`:
 *   - rateLimit(): allows up to `limit` requests per window
 *   - over-limit requests return ok=false with a positive retryAfter
 *   - the bucket resets after `windowMs` elapses
 *   - rateLimitKey() joins parts with ':'
 *
 * We use `vi.useFakeTimers()` for deterministic window-reset tests.
 *
 * All assertions exercise real behaviour — no filler.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { rateLimit, rateLimitKey } from '@/lib/rate-limit'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('rateLimit (token bucket)', () => {
  it('allows the first request and reports remaining capacity', () => {
    const r = rateLimit({ key: 'ip:1', limit: 5, windowMs: 60_000 })
    expect(r.ok).toBe(true)
    expect(r.remaining).toBe(4)
    expect(r.retryAfter).toBe(0)
  })

  it('allows up to `limit` requests in the same window', () => {
    for (let i = 0; i < 5; i++) {
      const r = rateLimit({ key: 'ip:2', limit: 5, windowMs: 60_000 })
      expect(r.ok).toBe(true)
    }
  })

  it('blocks the (limit+1)-th request', () => {
    for (let i = 0; i < 5; i++) {
      rateLimit({ key: 'ip:3', limit: 5, windowMs: 60_000 })
    }
    const r = rateLimit({ key: 'ip:3', limit: 5, windowMs: 60_000 })
    expect(r.ok).toBe(false)
    expect(r.remaining).toBe(0)
    expect(r.retryAfter).toBeGreaterThan(0)
  })

  it('resets the bucket after windowMs elapses', () => {
    // Exhaust the bucket.
    for (let i = 0; i < 5; i++) {
      rateLimit({ key: 'ip:4', limit: 5, windowMs: 60_000 })
    }
    // Over limit right now.
    expect(rateLimit({ key: 'ip:4', limit: 5, windowMs: 60_000 }).ok).toBe(false)
    // Advance time past the window.
    vi.advanceTimersByTime(60_001)
    // Should be allowed again — fresh bucket.
    const r = rateLimit({ key: 'ip:4', limit: 5, windowMs: 60_000 })
    expect(r.ok).toBe(true)
    expect(r.remaining).toBe(4)
  })

  it('isolates buckets by key (different IPs are tracked separately)', () => {
    // Exhaust IP A.
    for (let i = 0; i < 3; i++) {
      rateLimit({ key: 'ip:A', limit: 3, windowMs: 60_000 })
    }
    expect(rateLimit({ key: 'ip:A', limit: 3, windowMs: 60_000 }).ok).toBe(false)
    // IP B should still have its full quota.
    const r = rateLimit({ key: 'ip:B', limit: 3, windowMs: 60_000 })
    expect(r.ok).toBe(true)
    expect(r.remaining).toBe(2)
  })

  it('retryAfter is at least 1 second (never 0 when blocked)', () => {
    for (let i = 0; i < 3; i++) {
      rateLimit({ key: 'ip:5', limit: 3, windowMs: 60_000 })
    }
    const r = rateLimit({ key: 'ip:5', limit: 3, windowMs: 60_000 })
    expect(r.ok).toBe(false)
    expect(r.retryAfter).toBeGreaterThanOrEqual(1)
  })

  it('remaining is non-negative even after the bucket is exhausted', () => {
    for (let i = 0; i < 5; i++) {
      rateLimit({ key: 'ip:6', limit: 5, windowMs: 60_000 })
    }
    const r = rateLimit({ key: 'ip:6', limit: 5, windowMs: 60_000 })
    expect(r.remaining).toBe(0)
  })

  it('limit=0 blocks every request', () => {
    const r = rateLimit({ key: 'ip:7', limit: 0, windowMs: 60_000 })
    expect(r.ok).toBe(false)
  })
})

describe('rateLimitKey', () => {
  it('joins parts with ":"', () => {
    expect(rateLimitKey('ai-chat', 'u:abc')).toBe('ai-chat:u:abc')
    expect(rateLimitKey('a', 'b', 'c')).toBe('a:b:c')
  })

  it('returns the single part when only one is given', () => {
    expect(rateLimitKey('solo')).toBe('solo')
  })

  it('returns "" for no parts', () => {
    expect(rateLimitKey()).toBe('')
  })
})
