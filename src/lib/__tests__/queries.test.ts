/**
 * src/lib/__tests__/queries.test.ts
 * ---------------------------------------------------------------
 * Tests for the TanStack Query fetch helpers + query key factory.
 *
 * Covers: query key shapes, fetchXp error handling, fetchBooksBySlugs
 * empty-array handling.
 *
 * Owner: Phase 8 R-TEST.2
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { queryKeys, fetchXp, fetchBooksBySlugs, fetchVocabulary } from '@/lib/api/queries'

// Mock global fetch
const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

describe('queryKeys', () => {
  it('xp key is a stable array', () => {
    expect(queryKeys.xp).toEqual(['xp'])
    expect(queryKeys.xp).toBe(queryKeys.xp) // referential stability
  })

  it('booksBySlugs includes the slugs array', () => {
    expect(queryKeys.booksBySlugs(['a', 'b'])).toEqual(['books', 'slugs', ['a', 'b']])
  })

  it('leaderboard key includes the period', () => {
    expect(queryKeys.leaderboard('weekly')).toEqual(['leaderboard', 'weekly'])
  })

  it('dailyWords key is nested under vocabulary', () => {
    expect(queryKeys.dailyWords).toEqual(['vocabulary', 'daily-words'])
  })
})

describe('fetchXp', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns parsed JSON on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ totalXP: 100, level: 5, booksCompleted: 2, pagesRead: 50, streakDays: 3 }),
    })
    const result = await fetchXp()
    expect(result.totalXP).toBe(100)
    expect(result.level).toBe(5)
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })
    await expect(fetchXp()).rejects.toThrow('Failed to fetch XP')
  })
})

describe('fetchBooksBySlugs', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns empty array for empty slugs', async () => {
    const result = await fetchBooksBySlugs([])
    expect(result).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns parsed array on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ slug: 'alice', title: 'Alice' }],
    })
    const result = await fetchBooksBySlugs(['alice'])
    expect(result).toHaveLength(1)
  })

  it('returns empty array on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })
    const result = await fetchBooksBySlugs(['test'])
    expect(result).toEqual([])
  })
})

describe('fetchVocabulary', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns parsed array on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: '1', word: 'test' }],
    })
    const result = await fetchVocabulary()
    expect(result).toHaveLength(1)
  })

  it('returns empty array on failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })
    const result = await fetchVocabulary()
    expect(result).toEqual([])
  })
})
