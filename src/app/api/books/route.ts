import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import type { BookListItem } from '@/lib/data'
import { cache, TTL } from '@/lib/cache'
import { parseQuery } from '@/lib/api-validate'

// ── Query-param schema ──────────────────────────────────────────────────────
// All params optional. `sort` is validated as one of the known enum values;
// any unknown value is coerced back to 'recent' via the catch() so the
// behaviour stays backwards-compatible (the original code silently fell back
// to 'recent' on unknown sorts). `limit` is coerced to an integer in
// [1, 100] (default 50). `slugs`, `q`, `genre`, `level` are plain strings —
// only validated for type + sane max length.
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


function parseGenres(raw: string): string[] {
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.map(String) : []
  } catch {
    return []
  }
}

/**
 * Prisma `select` projection for the list shape. Includes the `author`
 * relation (selecting only the fields we need) so we can flatten
 * `author.name` into the `BookListItem.author` string field. Also pulls
 * the legacy `coverImage` (color-extraction pipeline) and the new
 * `coverImageUrl` + `coverBlurhash` (CMS-managed blur-up covers).
 */
const BOOK_LIST_SELECT = {
  id: true,
  slug: true,
  title: true,
  author: { select: { id: true, name: true, nameFa: true, slug: true } },
  description: true,
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
  isPublished: true,
  publishedYear: true,
  allowDownload: true,
} satisfies Prisma.BookSelect

type BookListRow = Prisma.BookGetPayload<{ select: typeof BOOK_LIST_SELECT }>

function toListItem(b: BookListRow): BookListItem {
  return {
    id: b.id,
    slug: b.slug,
    title: b.title,
    author: b.author?.name ?? '',
    authorId: b.author?.id,
    authorSlug: b.author?.slug,
    authorNameFa: b.author?.nameFa,
    description: b.description,
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
    isPublished: b.isPublished,
    publishedYear: b.publishedYear,
    allowDownload: b.allowDownload,
  }
}

/** Cache-Control header for book-list responses — served stale from CDN while revalidating. */
const BOOKS_CACHE_CONTROL =
  'public, max-age=60, s-maxage=300, stale-while-revalidate=600'

export async function GET(req: NextRequest) {
  try {
    // ── Validate query params with zod ─────────────────────────────────────
    // parseQuery converts URLSearchParams → plain object, then safeParse's
    // it. On failure we return a 400 with Persian error + zod details.
    const query = parseQuery(req, QuerySchema, 'پارامترهای جست‌وجو نامعتبر است.')
    if (!query.ok) return query.response
    const { slugs, sort, q, genre, level, limit, cursor, paginated } = query.data


    // ─── slugs shortcut ────────────────────────────────────────────────────
    // Used by "continue reading" / favorites — keep response fast & cacheable.
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

    // ─── main list query ──────────────────────────────────────────────────
    const where: Prisma.BookWhereInput = { isPublished: true }
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { author: { name: { contains: q } } },
        { author: { nameFa: { contains: q } } },
      ]
    }
    if (level) where.level = level
    if (genre) {
      // Pre-filter at the SQL layer. Genres are stored as a JSON string
      // like `["fiction","drama"]`; a substring `contains` match narrows the
      // candidate pool significantly. This is intentionally loose (it can match
      // `"non-fiction"` when the user asked for `"fiction"`) — the strict
      // `parseGenres(...).includes(genre)` check below rejects false positives.
      // Without this pre-filter the in-memory step would have to load every
      // book in the catalog on every genre query.
      where.genres = { contains: genre }
    }

    const orderBy: Prisma.BookOrderByWithRelationInput[] | Prisma.BookOrderByWithRelationInput =
      sort === 'rating'
        ? { rating: 'desc' }
        : sort === 'views'
          ? { viewCount: 'desc' }
          : sort === 'title'
            ? { title: 'asc' }
            : sort === 'year'
              ? [{ publishedYear: 'desc' as const }, { title: 'asc' as const }]
              : { createdAt: 'desc' }

    // Cache key includes every dimension that affects the result set so a
    // different sort/filter/limit combo gets its own entry.
    const cacheKey = `books:list:${sort}:${q || ''}:${genre || ''}:${level || ''}:${limit}:${cursor || ''}:${paginated || ''}`

    const result = await cache.wrap(cacheKey, async () => {
      // When filtering by genre, drop `take: limit` from the SQL query and slice
      // AFTER the strict in-memory filter. Otherwise the first N books (by sort)
      // might not match the genre and the user would get fewer than `limit`
      // results — or zero — even when plenty of matches exist further down.
      // (The SQL `genres.contains` pre-filter narrows the pool but isn't exact,
      //  so we still need `parseGenres(...).includes(genre)`.)
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

      const filtered = genre
        ? books.filter((b) => parseGenres(b.genres).includes(genre))
        : books

      const paginatedList = genre
        ? filtered.slice(offset, offset + limit + 1)
        : filtered

      const hasMore = paginatedList.length > limit
      const items = hasMore ? paginatedList.slice(0, limit) : paginatedList
      const nextCursor = hasMore ? String(offset + limit) : null

      const list = items.map(toListItem)

      if (paginated === 1 || cursor !== undefined) {
        return {
          items: list,
          nextCursor,
          hasMore,
        }
      }
      return list
    }, TTL.BOOKS_LIST)

    // An empty catalog (fresh install before `bun run db:seed`) yields `[]`,
    // which is a valid 200 response — the library UI renders an empty state.
    return NextResponse.json(result, {
      headers: { 'Cache-Control': BOOKS_CACHE_CONTROL },
    })
  } catch (err) {
    console.error('[/api/books] GET failed:', err)
    return NextResponse.json(
      { error: 'بارگذاری فهرست کتاب‌ها ناموفق بود. لطفاً دوباره تلاش کنید.' },
      { status: 500 },
    )
  }
}
