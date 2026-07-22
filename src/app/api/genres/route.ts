import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cache, TTL } from '@/lib/cache'

function parseGenres(raw: string): string[] {
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.map(String) : []
  } catch {
    return []
  }
}

/**
 * Genre aggregation endpoint.
 *
 * Genres change rarely (only when books are added/removed), so this response
 * is aggressively cached — 5 min in-process + 5 min browser/CDN.
 *
 * The underlying query already uses a tight `select` projection
 * (`genres`, `viewCount` only); the win here is *caching*, not projection.
 */
const GENRES_CACHE_CONTROL = 'public, max-age=300, s-maxage=600'

export async function GET(req: NextRequest) {
  try {
    const sort = req.nextUrl.searchParams.get('sort') || 'count'
    const cacheKey = `genres:${sort}`

    const genres = await cache.wrap(cacheKey, async () => {
      const books = await db.book.findMany({
        select: { genres: true, viewCount: true },
      })
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
    console.error('[/api/genres] GET failed:', err)
    // An empty catalog (fresh install) yields `[]`, not a 500 — only return
    // 500 for actual DB / cache failures.
    return NextResponse.json(
      { error: 'بارگذاری ژانرها ناموفق بود.' },
      { status: 500 },
    )
  }
}
