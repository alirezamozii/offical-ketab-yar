import { Prisma } from '@prisma/client'
import type { BookListItem } from '@/lib/data'

export function parseGenres(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return Array.from(
      new Set(
        raw
          .map((item) =>
            typeof item === 'string'
              ? item
              : (item as any)?.value || (item as any)?.text || (item as any)?.name || String(item),
          )
          .map((s) => String(s).trim())
          .filter(Boolean),
      ),
    )
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const v = JSON.parse(trimmed)
        if (Array.isArray(v)) {
          return Array.from(
            new Set(
              v
                .map((item) =>
                  typeof item === 'string'
                    ? item
                    : (item as any)?.value || (item as any)?.text || (item as any)?.name || String(item),
                )
                .map((s) => String(s).trim())
                .filter(Boolean),
            ),
          )
        }
      } catch {}
    }
    return Array.from(
      new Set(
        trimmed
          .split(/[,،\n]+/)
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    )
  }
  return []
}

export const BOOK_LIST_SELECT = {
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

export type BookListRow = Prisma.BookGetPayload<{ select: typeof BOOK_LIST_SELECT }>

export function toListItem(b: BookListRow): BookListItem {
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

export function buildBookWhereClause(opts: {
  q?: string
  level?: string
  genre?: string
}): Prisma.BookWhereInput {
  const where: Prisma.BookWhereInput = { isPublished: true }
  if (opts.q) {
    where.OR = [
      { title: { contains: opts.q } },
      { description: { contains: opts.q } },
      { author: { name: { contains: opts.q } } },
      { author: { nameFa: { contains: opts.q } } },
    ]
  }
  if (opts.level) where.level = opts.level
  if (opts.genre) where.genres = { contains: opts.genre }
  return where
}

export function buildBookOrderBy(
  sort: 'recent' | 'rating' | 'views' | 'title' | 'year'
): Prisma.BookOrderByWithRelationInput[] | Prisma.BookOrderByWithRelationInput {
  switch (sort) {
    case 'rating':
      return { rating: 'desc' }
    case 'views':
      return { viewCount: 'desc' }
    case 'title':
      return { title: 'asc' }
    case 'year':
      return [{ publishedYear: 'desc' as const }, { title: 'asc' as const }]
    case 'recent':
    default:
      return { createdAt: 'desc' }
  }
}

export function paginateBookResults(
  books: BookListRow[],
  genre: string | undefined,
  limit: number,
  cursor: string | undefined,
  paginated: number | undefined
) {
  const offset = cursor ? Number(cursor) : 0
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
    return { items: list, nextCursor, hasMore }
  }
  return list
}
