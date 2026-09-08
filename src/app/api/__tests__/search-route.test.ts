import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { cache } from '@/lib/cache'

const mocks = vi.hoisted(() => ({ pages: vi.fn(), books: vi.fn() }))
vi.mock('@/lib/db', () => ({ db: { bookPage: { findMany: mocks.pages }, book: { findMany: mocks.books } } }))
import { GET } from '../search/route'

beforeEach(() => {
  cache.clear()
  mocks.pages.mockReset().mockResolvedValue([])
  mocks.books.mockReset().mockResolvedValue([])
})

it('restricts exact, fuzzy and metadata searches to published books', async () => {
  const response = await GET(new NextRequest('http://localhost/api/search?q=hidden+draft'))
  expect(response.status).toBe(200)
  expect(mocks.pages).toHaveBeenCalledTimes(2)
  for (const [query] of mocks.pages.mock.calls) {
    expect(query.where.book.isPublished).toBe(true)
    expect(query.select.english).toBe(true)
    expect(query.include).toBeUndefined()
  }
  expect(mocks.books.mock.calls[0][0].where.isPublished).toBe(true)
})

it('matches any selected genre consistently for metadata and page results', async () => {
  await GET(new NextRequest('http://localhost/api/search?q=alice&genre=fantasy,fiction'))
  const expected = [{ genres: { contains: 'fantasy' } }, { genres: { contains: 'fiction' } }]
  expect(mocks.pages.mock.calls[0][0].where.book.OR).toEqual(expected)
  expect(mocks.books.mock.calls[0][0].where.AND).toEqual([{ OR: expected }])
})
