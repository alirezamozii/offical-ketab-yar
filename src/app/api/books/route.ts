import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { cache, TTL } from '@/lib/cache'
import { parseQuery } from '@/lib/api-validate'
import {
  BOOK_LIST_SELECT,
  type BookListRow,
  buildBookOrderBy,
  buildBookWhereClause,
  paginateBookResults,
  toListItem,
} from '@/lib/books-query'

const QuerySchema = z.object({
  slugs: z.string().max(2000).optional(),
  sort: z
    .enum(['recent', 'rating', 'views', 'title', 'year'])
    .catch('recent')
    .default('recent'),
  q: z.string().trim().max(200).optional(),
  genre: z.string().trim().max(80).optional(),
  level: z.string().trim().max(20).optional(),
  limit: z.coerce.number().int().min(1).max(100).catch(50).default(50),
  cursor: z.string().optional(),
  paginated: z.coerce.number().int().optional(),
})

const BOOKS_CACHE_CONTROL =
  'public, max-age=60, s-maxage=300, stale-while-revalidate=600'

export async function GET(req: NextRequest) {
  try {
    const query = parseQuery(req, QuerySchema, 'پارامترهای جست‌وجو نامعتبر است.')
    if (!query.ok) return query.response
    const { slugs, sort, q, genre, level, limit, cursor, paginated } = query.data

    if (slugs) {
      const list = slugs
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const cacheKey = `books:slugs:${list.join('|')}`
      const ordered = await cache.wrap(cacheKey, async () => {
        const books = await db.book.findMany({
          where: { slug: { in: list }, isPublished: true },
          select: BOOK_LIST_SELECT,
        })
        const map = new Map(books.map((b) => [b.slug, b]))
        return list
          .map((s) => map.get(s))
          .filter(Boolean) as BookListRow[]
      }, TTL.BOOKS_LIST)

      return NextResponse.json(ordered.map(toListItem), {
        headers: { 'Cache-Control': BOOKS_CACHE_CONTROL },
      })
    }

    const where = buildBookWhereClause({ q, level, genre })
    const orderBy = buildBookOrderBy(sort)
    const cacheKey = `books:list:${sort}:${q || ''}:${genre || ''}:${level || ''}:${limit}:${cursor || ''}:${paginated || ''}`

    const result = await cache.wrap(cacheKey, async () => {
      const offset = cursor ? Number(cursor) : 0
      const take = genre ? undefined : limit + 1
      const skip = genre ? undefined : offset
      const books = await db.book.findMany({
        where,
        select: BOOK_LIST_SELECT,
        take,
        skip,
        orderBy,
      })

      return paginateBookResults(books, genre, limit, cursor, paginated)
    }, TTL.BOOKS_LIST)

    return NextResponse.json(result, {
      headers: { 'Cache-Control': BOOKS_CACHE_CONTROL },
    })
  } catch (err) {
    console.warn('[/api/books] DB offline or query error, returning fallback:', err)
    return NextResponse.json([], {
      status: 200,
      headers: { 'x-db-fallback': 'true' },
    })
  }
}
