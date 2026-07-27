import { describe, it, expect, beforeEach } from 'vitest'
import {
  buildBookWhereClause,
  buildBookOrderBy,
  paginateBookResults,
  type BookListRow,
} from '@/lib/books-query'
import { verifyGuestId, signIdWithFingerprint } from '@/lib/session'
import { isRateLimitBypassed, rateLimit } from '@/lib/rate-limit'

describe('API & Library Query Helper Tests', () => {
  it('builds search where clauses correctly', () => {
    const where = buildBookWhereClause({ q: 'alice', level: 'B1', genre: 'fiction' })
    expect(where.isPublished).toBe(true)
    expect(where.level).toBe('B1')
    expect(where.genres).toEqual({ contains: 'fiction' })
    expect(where.OR).toHaveLength(4)
  })

  it('builds ordering clauses correctly for sort options', () => {
    expect(buildBookOrderBy('rating')).toEqual({ rating: 'desc' })
    expect(buildBookOrderBy('views')).toEqual({ viewCount: 'desc' })
    expect(buildBookOrderBy('title')).toEqual({ title: 'asc' })
  })

  it('paginates book lists accurately', () => {
    const mockBooks: BookListRow[] = [
      {
        id: '1',
        slug: 'book-1',
        title: 'Book 1',
        author: { id: 'a1', name: 'Author 1', nameFa: 'نویسنده ۱', slug: 'author-1' },
        description: 'Desc 1',
        coverFrom: '#000',
        coverTo: '#fff',
        coverAccent: '#ccc',
        coverImage: null,
        coverImageUrl: '',
        coverBlurhash: '',
        genres: '["fiction"]',
        level: 'B1',
        rating: 4.5,
        reviewCount: 10,
        viewCount: 100,
        pageCount: 200,
        isPremium: false,
        isPublished: true,
        publishedYear: 2020,
        allowDownload: true,
      },
    ]

    const result = paginateBookResults(mockBooks, undefined, 10, undefined, undefined)
    expect(result).toHaveLength(1)
    expect(result[0].slug).toBe('book-1')
  })
})

describe('Guest Session & Fingerprint Security Tests', () => {
  it('verifies signed guest IDs correctly', () => {
    const guestId = 'g_test123'
    const rawCookie = `${guestId}.${signIdWithFingerprint(guestId)}`
    const verified = verifyGuestId(rawCookie)
    expect(verified).toBe(guestId)
  })

  it('rejects tampered guest cookies', () => {
    const rawCookie = 'g_test123.invalid_signature'
    const verified = verifyGuestId(rawCookie)
    expect(verified).toBeNull()
  })

  it('verifies client fingerprint when provided', () => {
    const guestId = 'g_test123'
    const fingerprint = 'sha256_ip_ua_hash'
    const rawCookie = `${guestId}.${signIdWithFingerprint(guestId, fingerprint)}`
    const verified = verifyGuestId(rawCookie, fingerprint)
    expect(verified).toBe(guestId)
  })
})

describe('Rate Limit & Administrative Bypass Tests', () => {
  beforeEach(() => {
    delete process.env.RATE_LIMIT_BYPASS_SECRET
  })

  it('correctly calculates rate limits', () => {
    const key = `test_key_${Date.now()}`
    const r1 = rateLimit({ key, limit: 2, windowMs: 60000 })
    expect(r1.ok).toBe(true)
    expect(r1.remaining).toBe(1)

    const r2 = rateLimit({ key, limit: 2, windowMs: 60000 })
    expect(r2.ok).toBe(true)
    expect(r2.remaining).toBe(0)

    const r3 = rateLimit({ key, limit: 2, windowMs: 60000 })
    expect(r3.ok).toBe(false)
    expect(r3.retryAfter).toBeGreaterThan(0)
  })

  it('validates rate limit bypass secret headers', () => {
    process.env.RATE_LIMIT_BYPASS_SECRET = 'super-secret-bypass'
    const validReq = new Request('http://localhost/api/test', {
      headers: { 'x-rate-limit-bypass': 'super-secret-bypass' },
    })
    expect(isRateLimitBypassed(validReq)).toBe(true)

    const invalidReq = new Request('http://localhost/api/test', {
      headers: { 'x-rate-limit-bypass': 'wrong-secret' },
    })
    expect(isRateLimitBypassed(invalidReq)).toBe(false)
  })
})
