import { describe, it, expect, vi } from 'vitest'

vi.mock('../../lib/payload', () => ({
  getPayloadClient: vi.fn(),
}))

vi.mock('@/lib/auth-session', () => ({
  requireOwner: vi.fn(),
}))

import {
  normalizePages,
  normalizeChapters,
  parseAuthorNameAndInput,
  buildBookData,
} from '../../payload/components/action-helpers'

describe('importBookAction helper functions', () => {
  describe('normalizePages', () => {
    it('normalizes raw page objects and sorts by pageNumber', () => {
      const raw = [
        { pageNumber: 2, english: 'Page 2', farsi: 'صفحه ۲' },
        { pageNumber: 1, english: 'Page 1' },
      ]

      const pages = normalizePages(raw)
      expect(pages).toHaveLength(2)
      expect(pages[0].pageNumber).toBe(1)
      expect(pages[0].farsi).toBe('')
      expect(pages[1].pageNumber).toBe(2)
      expect(pages[1].type).toBe('text')
    })

    it('assigns 1-indexed pageNumbers if missing and defaults non-array inputs', () => {
      const pages = normalizePages(null as any)
      expect(pages).toEqual([])
    })
  })

  describe('normalizeChapters', () => {
    it('normalizes raw chapter objects', () => {
      const raw = [
        { title: 'Chapter One', titleFa: 'فصل اول', startPage: 1 },
      ]

      const chapters = normalizeChapters(raw)
      expect(chapters).toHaveLength(1)
      expect(chapters[0].title).toBe('Chapter One')
      expect(chapters[0].slug).toBe('chapter-one')
      expect(chapters[0].order).toBe(1)
    })
  })

  describe('parseAuthorNameAndInput', () => {
    it('parses string author input', () => {
      const result = parseAuthorNameAndInput({ author: '  Charles Dickens  ' })
      expect(result.authorName).toBe('Charles Dickens')
      expect(result.authorInput).toBeNull()
    })

    it('parses object author input', () => {
      const authorObj = { name: 'Leo Tolstoy', bio: 'Russian author' }
      const result = parseAuthorNameAndInput({ author: authorObj })
      expect(result.authorName).toBe('Leo Tolstoy')
      expect(result.authorInput).toEqual(authorObj)
    })

    it('throws when author name is invalid or missing', () => {
      expect(() => parseAuthorNameAndInput({})).toThrow('نام نویسنده (author) نامعتبر یا خالی است.')
    })
  })

  describe('buildBookData', () => {
    it('builds flat book object with sensible defaults', () => {
      const raw = {
        title: 'War and Peace',
        level: 'C1',
        publishedYear: 1869,
      }

      const bookData = buildBookData(raw, 'war-and-peace', 'author-1', [], [])
      expect(bookData.title).toBe('War and Peace')
      expect(bookData.slug).toBe('war-and-peace')
      expect(bookData.author).toBe('author-1')
      expect(bookData.level).toBe('C1')
      expect(bookData.publishedYear).toBe(1869)
      expect(bookData.isPublished).toBe(true)
      expect(bookData.coverFrom).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(bookData.coverTo).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(bookData.coverAccent).toMatch(/^#[0-9a-fA-F]{6}$/)
    })
  })
})
