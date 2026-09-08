import { describe, expect, it } from 'vitest'
import { mergeServerProgress } from '@/lib/sync-data'

describe('cross-device reading position', () => {
  it('converts API positions to the reader index and retains distinct books', () => {
    const result = mergeServerProgress({}, ['first', 'second'].map(bookSlug => ({
      bookSlug, currentPage: 12, percent: 30, lastReadAt: '2026-09-06T00:00:00Z',
    })))
    expect(Object.keys(result)).toEqual(['first', 'second'])
    expect(result.first.currentPage).toBe(11)
  })

  it('preserves a more recent offline reading position', () => {
    const local = { currentPage: 22, totalPages: 40, percent: 58, ts: Date.parse('2026-09-06T01:00:00Z') }
    expect(mergeServerProgress({ book: local }, [{
      bookSlug: 'book', currentPage: 12, percent: 30, lastReadAt: '2026-09-06T00:00:00Z',
    }]).book).toEqual(local)
  })
})
