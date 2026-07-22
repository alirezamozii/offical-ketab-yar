import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { getOrCreateGuestId } from '@/lib/session'
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
 * Prisma `select` projection for the recommendation candidate query —
 * `BookListItem` shape only, so we skip `description` (the heavy text field)
 * and `id`/`createdAt`/`language` that the recs engine doesn't use.
 *
 * NOTE: `toListItem` below still emits a `description` key (string) for API-
 * contract compatibility with `BookListItem`, but uses an empty string when
 * the projection didn't fetch it. The dashboard "personalized recommendations"
 * card doesn't render descriptions, so the empty value is fine.
 */
const REC_SELECT = {
  id: true,
  slug: true,
  title: true,
  author: { select: { name: true, nameFa: true, slug: true, id: true } },
  coverFrom: true,
  coverTo: true,
  coverAccent: true,
  coverImage: true,
  coverImageUrl: true,
  coverBlurhash: true,
  genres: true,
  level: true,
  rating: true,
  reviewCount: true,
  viewCount: true,
  pageCount: true,
  isPremium: true,
  publishedYear: true,
} satisfies Prisma.BookSelect

type RecRow = Prisma.BookGetPayload<{ select: typeof REC_SELECT }>

function toListItem(b: RecRow) {
  return {
    id: b.id,
    slug: b.slug,
    title: b.title,
    author: b.author?.name ?? '',
    authorId: b.author?.id,
    authorSlug: b.author?.slug,
    authorNameFa: b.author?.nameFa,
    description: '', // intentionally empty — recs card doesn't render descriptions
    coverFrom: b.coverFrom,
    coverTo: b.coverTo,
    coverAccent: b.coverAccent,
    coverImage: b.coverImage,
    coverImageUrl: b.coverImageUrl,
    coverBlurhash: b.coverBlurhash,
    genres: parseGenres(b.genres),
    level: b.level,
    rating: b.rating,
    reviewCount: b.reviewCount,
    viewCount: b.viewCount,
    pageCount: b.pageCount,
    isPremium: b.isPremium,
    publishedYear: b.publishedYear,
  }
}

/**
 * Cache-Control for recommendation responses. Recommendations are guest-scoped
 * (derived from each guest's reading history) so the response MUST use
 * `private` — a `public` directive would let a shared CDN cache one guest's
 * recs and serve them to another guest, leaking reading-history signal.
 * The browser may cache briefly; the in-process L1 cache (in cache.wrap below)
 * is keyed on the guest id so it never cross-contaminates.
 */
const REC_CACHE_CONTROL = 'private, max-age=120, s-maxage=300'

export async function GET(req: NextRequest) {
  const { id: guestId } = await getOrCreateGuestId()
  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit')) || 6, 12)
  const cacheKey = `rec:${guestId}:${limit}`

  try {
    const payload = await cache.wrap(cacheKey, async () => {
      // 1. gather the user's reading history
      const progress = await db.readingProgress.findMany({
        where: { guestId },
      })
      const readSlugs = new Set(progress.map((p) => p.bookSlug))

      // 2. no history → top-rated books the user hasn't started
      if (readSlugs.size === 0) {
        const books = await db.book.findMany({
          where: { slug: { notIn: [...readSlugs] }, isPublished: true },
          orderBy: { rating: 'desc' },
          take: limit,
          select: REC_SELECT,
        })
        return {
          books: books.map(toListItem),
          reason: 'top-rated' as const,
          topGenre: '',
        }
      }

      // 3. collect genres + levels from books the user has read
      const readBooks = await db.book.findMany({
        where: { slug: { in: [...readSlugs] } },
        select: { genres: true, level: true },
      })
      const genreScore = new Map<string, number>()
      const levelScore = new Map<string, number>()
      for (const b of readBooks) {
        for (const g of parseGenres(b.genres)) {
          genreScore.set(g, (genreScore.get(g) || 0) + 1)
        }
        levelScore.set(b.level, (levelScore.get(b.level) || 0) + 1)
      }

      // 4. score unread books by genre + level overlap
      const candidates = await db.book.findMany({
        where: { slug: { notIn: [...readSlugs] }, isPublished: true },
        select: REC_SELECT,
      })
      const scored = candidates.map((b) => {
        let score = 0
        for (const g of parseGenres(b.genres)) {
          score += (genreScore.get(g) || 0) * 2
        }
        score += (levelScore.get(b.level) || 0) * 1
        // small rating boost
        score += b.rating * 0.1
        return { b, score }
      })
      scored.sort((a, z) => z.score - a.score)

      const top = scored.slice(0, limit).map((s) => toListItem(s.b))

      // determine the dominant genre for the reason text
      let topGenre = ''
      let topGenreScore = 0
      for (const [g, s] of genreScore) {
        if (s > topGenreScore) {
          topGenre = g
          topGenreScore = s
        }
      }

      return {
        books: top,
        reason: topGenre ? ('genre' as const) : ('top-rated' as const),
        topGenre,
      }
    }, TTL.RECOMMENDATIONS)

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': REC_CACHE_CONTROL },
    })
  } catch (err) {
    console.error('[/api/recommendations] GET failed:', err)
    // A failure to compute recs shouldn't break the dashboard. Return an
    // empty list with the 'top-rated' reason so the UI can render a graceful
    // empty state rather than a 500 error.
    return NextResponse.json(
      { books: [], reason: 'top-rated' as const, topGenre: '' },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
