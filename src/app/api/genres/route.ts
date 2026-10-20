import { NextRequest, NextResponse } from 'next/server'
import { db, safeQuery } from '@/lib/db'
import { parseGenres } from '@/lib/books-query'
import { cache, TTL } from '@/lib/cache'

/**
 * Genre aggregation endpoint.
 *
 * Cached in-process + CDN, invalidated automatically via revalidateBook()
 * whenever books or their categories are created/updated in the CMS.
 */
const GENRES_CACHE_CONTROL = 'public, max-age=60, s-maxage=120'

export async function GET(req: NextRequest) {
  try {
    const sort = req.nextUrl.searchParams.get('sort') || 'count'
    const cacheKey = `genres:${sort}`

    const genres = await cache.wrap(cacheKey, async () => {
      let books = await safeQuery(
        () =>
          db.book.findMany({
            where: { isPublished: true },
            select: { genres: true, viewCount: true },
          }),
        [],
        2500,
      )

      if (!books || books.length === 0) {
        try {
          const { getPayloadClient } = await import('@/lib/payload')
          const payload = await getPayloadClient()
          const payloadBooks = await payload.find({
            collection: 'books',
            where: { isPublished: { equals: true } },
            limit: 100,
          })
          if (payloadBooks?.docs?.length > 0) {
            books = payloadBooks.docs.map((b: any) => ({
              genres: JSON.stringify(parseGenres(b.genres)),
              viewCount: Number(b.viewCount) || 0,
            }))
          }
        } catch {
          // payload fallback optional
        }
      }

      const map = new Map<string, { count: number; views: number }>()
      for (const b of books) {
        for (const g of parseGenres(b.genres)) {
          const cur = map.get(g) || { count: 0, views: 0 }
          cur.count += 1
          cur.views += b.viewCount
          map.set(g, cur)
        }
      }
      return Array.from(map.entries())
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) =>
          sort === 'views'
            ? b.views - a.views || b.count - a.count
            : b.count - a.count || b.views - a.views,
        )
    }, TTL.GENRES)

    return NextResponse.json(genres, {
      headers: { 'Cache-Control': GENRES_CACHE_CONTROL },
    })
  } catch (err) {
    console.warn('[/api/genres] DB offline or query error, returning fallback:', err)
    return NextResponse.json([], {
      status: 200,
      headers: { 'x-db-fallback': 'true' },
    })
  }
}
