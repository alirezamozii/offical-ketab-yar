import { cache } from 'react'
import { db, safeQuery } from '@/lib/db'

// Re-export the canonical reader types so callers can import them from a
// single module (`@/lib/data`). The definitions live in `@/lib/reader/types`
export type {
  ReaderPage,
  ReaderBook,
  BilingualItem,
} from '@/lib/reader/types'

export type PaginatedResult<T> = {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

import type {
  ReaderBook,
} from '@/lib/reader/types'

/**
 * Lightweight author profile — derived entirely from the books collection and author data.
 */
export type AuthorSummary = {
  /** Original English author name (from the Author collection). */
  name: string
  /** URL-safe slug — stored on the Author row. */
  slug: string
  /** Number of books in the catalog by this author. */
  bookCount: number
  /** All books by this author (lightweight `BookListItem` shape). */
  books: BookListItem[]
  /** Sum of every book's `pageCount` — useful for the directory stats. */
  totalPages: number
  /** Distinct genres covered by this author's books (sorted, unique). */
  genres: string[]
  /** Mean of `rating` across this author's books (0 if no rated books). */
  averageRating: number
  /** Earliest and latest `publishedYear` among this author's books. */
  yearsActive: { min: number; max: number }
}

export type BookListItem = {
  id: string
  slug: string
  title: string
  author: string
  authorId?: string
  authorSlug?: string
  authorNameFa?: string
  description: string
  coverFrom: string
  coverTo: string
  coverAccent: string
  coverImage?: string | null
  coverImageUrl?: string
  coverBlurhash?: string
  genres: string[]
  level: string
  rating: number
  reviewCount: number
  viewCount: number
  pageCount: number
  isPremium: boolean
  isPublished?: boolean
  publishedYear: number
  allowDownload?: boolean
  chapterCount?: number
}

export type BookDetail = BookListItem & {
  reviews: ReviewItem[]
  chapters?: Array<{
    id: string
    title: string
    titleFa: string
    slug: string
    order: number
    startPage: number
  }>
}

export type ReviewItem = {
  id: string
  userName: string
  userAvatar: string
  rating: number
  comment: string
  createdAt: string
}

/** Parse JSON genres field from Prisma (stored as JSON string "[\"Fiction\"]") */
function parseGenres(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return [] }
  }
  return []
}

/** Convert a Prisma Book record (with optional Author relation) to BookListItem */
function toListItem(b: any): BookListItem {
  const author = b.author && typeof b.author === 'object' ? b.author : null
  return {
    id: b.id,
    slug: b.slug,
    title: b.title,
    author: author?.name ?? '',
    authorId: author?.id ?? b.authorId,
    authorSlug: author?.slug,
    authorNameFa: author?.nameFa,
    description: b.description || '',
    coverFrom: b.coverFrom || '#b8956a',
    coverTo: b.coverTo || '#6d523a',
    coverAccent: b.coverAccent || '#f4d35e',
    coverImage: b.coverImage ?? null,
    coverImageUrl: b.coverImageUrl ?? '',
    coverBlurhash: b.coverBlurhash ?? '',
    genres: parseGenres(b.genres),
    level: b.level,
    rating: b.rating ?? 0,
    reviewCount: b.reviewCount ?? 0,
    viewCount: b.viewCount ?? 0,
    pageCount: b.pageCount ?? 0,
    isPremium: !!b.isPremium,
    isPublished: b.isPublished ?? true,
    publishedYear: b.publishedYear ?? 1900,
    allowDownload: b.allowDownload ?? true,
  }
}

// Optimized select object for book lists — excludes long-form markdown fields (e.g. author.biography, bioFa)
const bookSelect = {
  id: true,
  slug: true,
  title: true,
  authorId: true,
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
  author: {
    select: {
      id: true,
      name: true,
      nameFa: true,
      slug: true,
    },
  },
} as const

export const getBooks = cache(async function getBooks(): Promise<BookListItem[]> {
  return safeQuery(
    () =>
      db.book.findMany({
        where: { isPublished: true },
        select: bookSelect,
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    [],
    250,
  ).then((books) => books.map(toListItem))
})

export const getRecentlyAddedBooks = cache(async function getRecentlyAddedBooks(limit = 12): Promise<BookListItem[]> {
  return safeQuery(
    () =>
      db.book.findMany({
        where: { isPublished: true },
        select: bookSelect,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    [],
    250,
  ).then((books) => books.map(toListItem))
})

export const getHighestRatedBooks = cache(async function getHighestRatedBooks(limit = 12): Promise<BookListItem[]> {
  return safeQuery(
    () =>
      db.book.findMany({
        where: { isPublished: true },
        select: bookSelect,
        orderBy: { rating: 'desc' },
        take: limit,
      }),
    [],
    250,
  ).then((books) => books.map(toListItem))
})

export const getMostReadBooks = cache(async function getMostReadBooks(limit = 12): Promise<BookListItem[]> {
  return safeQuery(
    () =>
      db.book.findMany({
        where: { isPublished: true },
        select: bookSelect,
        orderBy: { viewCount: 'desc' },
        take: limit,
      }),
    [],
    250,
  ).then((books) => books.map(toListItem))
})

/**
 * Deterministic "Book of the Day" — picks a different book each day based on
 * the current date, favoring higher-rated books. Stable for the whole day.
 */
export async function getBookOfTheDay(): Promise<BookListItem | null> {
  const books = await getHighestRatedBooks(10)
  if (books.length === 0) return null
  const now = new Date()
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  )
  const idx = dayOfYear % books.length
  return books[idx]
}

export async function getBookBySlug(slug: string): Promise<BookDetail | null> {
  const book = await safeQuery(
    () =>
      db.book.findUnique({
        where: { slug },
        include: {
          author: true,
          chapters: { orderBy: { order: 'asc' } },
          reviews: { orderBy: { createdAt: 'desc' }, take: 20 },
        },
      }),
    null,
    250,
  )
  if (!book) return null

  return {
    ...toListItem(book),
    chapters: (book.chapters || []).map((c) => ({
      id: c.id,
      title: c.title,
      titleFa: c.titleFa || '',
      slug: c.slug,
      order: c.order ?? 0,
      startPage: c.startPage ?? 1,
    })),
    reviews: (book.reviews || []).map((r) => ({
      id: r.id,
      userName: r.userName,
      userAvatar: r.userAvatar,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    })),
  }
}

export async function getReaderBook(
  slug: string,
  from?: number,
  to?: number,
): Promise<ReaderBook | null> {
  const book = await safeQuery(
    () =>
      db.book.findUnique({
        where: { slug },
        include: {
          author: true,
          chapters: { orderBy: { order: 'asc' } },
          pages: {
            where:
              from !== undefined && to !== undefined
                ? { pageNumber: { gte: from, lte: to } }
                : undefined,
            orderBy: { pageNumber: 'asc' },
          },
        },
      }),
    null,
    250,
  )
  if (!book) return null

  return {
    slug: book.slug,
    title: book.title,
    author: book.author?.name ?? '',
    authorNameFa: book.author?.nameFa ?? '',
    authorSlug: book.author?.slug ?? '',
    level: book.level,
    coverImageUrl: book.coverImageUrl ?? '',
    coverBlurhash: book.coverBlurhash ?? '',
    pageCount: book.pageCount,
    chapters: (book.chapters || []).map((c) => ({
      id: c.id,
      title: c.title,
      titleFa: c.titleFa || '',
      slug: c.slug,
      order: c.order ?? 0,
      startPage: c.startPage ?? 1,
    })),
    pages: (book.pages || []).map((p) => ({
      pageNumber: p.pageNumber,
      items: [
        {
          english: p.english,
          farsi: p.farsi || '',
          type: (p.type === 'heading' ? 'heading' : 'text') as 'text' | 'heading',
        },
      ],
    })),
  }
}

export async function getRelatedBooks(
  slug: string,
  genres: string[],
  limit = 4,
): Promise<BookListItem[]> {
  try {
    const all = await getBooks()
    const others = all.filter((b) => b.slug !== slug)
    if (!genres || genres.length === 0) return others.slice(0, limit)
    const scored = others
      .map((b) => ({
        b,
        score: b.genres.filter((g) => genres.includes(g)).length,
      }))
      .sort((a, z) => z.score - a.score)
      .slice(0, limit)
    return scored.map((s) => s.b)
  } catch {
    return []
  }
}

export async function getAllGenres(): Promise<string[]> {
  try {
    const books = await getBooks()
    const set = new Set<string>()
    for (const b of books) {
      for (const g of b.genres) set.add(g)
    }
    return Array.from(set).sort()
  } catch {
    return []
  }
}

export async function incrementViewCount(slug: string): Promise<void> {
  try {
    await safeQuery(
      () =>
        db.book.update({
          where: { slug },
          data: { viewCount: { increment: 1 } },
        }),
      null,
      250,
    )
  } catch {
    // silent
  }
}

export async function getBookById(id: string): Promise<BookListItem | null> {
  try {
    const book = await db.book.findUnique({
      where: { id },
      select: bookSelect,
    })
    if (!book) return null
    return toListItem(book)
  } catch {
    return null
  }
}

export async function getBooksByGenre(
  genre: string,
  limit = 12,
  cursor?: string,
): Promise<PaginatedResult<BookListItem>> {
  if (!genre) return { items: [], nextCursor: null, hasMore: false }
  try {
    const offset = cursor ? Number(cursor) : 0

    // Fetch candidate pool (bounded to 200 to protect RAM)
    const allBooks = await db.book.findMany({
      where: { isPublished: true },
      select: bookSelect,
      orderBy: { rating: 'desc' },
      take: 200,
    })

    const filtered = allBooks.filter((b) =>
      parseGenres(b.genres).includes(genre),
    )

    const paginated = filtered.slice(offset, offset + limit + 1)
    const hasMore = paginated.length > limit
    const items = hasMore ? paginated.slice(0, limit) : paginated
    const nextCursor = hasMore ? String(offset + limit) : null

    return {
      items: items.map(toListItem),
      nextCursor,
      hasMore,
    }
  } catch (err) {
    console.error('[getBooksByGenre] DB error:', err)
    return { items: [], nextCursor: null, hasMore: false }
  }
}

export interface CatalogStats {
  booksCount: number
  pagesCount: number
  totalReads: number
  totalMinutes: number
}

export const getCatalogStats = cache(async function getCatalogStats(): Promise<CatalogStats> {
  const aggregate = await safeQuery(
    () =>
      db.book.aggregate({
        where: { isPublished: true },
        _count: { id: true },
        _sum: { pageCount: true, viewCount: true },
      }),
    null,
    250,
  )
  const booksCount = aggregate?._count.id ?? 0
  const pagesCount = aggregate?._sum.pageCount || 0
  const totalReads = aggregate?._sum.viewCount || 0
  const totalMinutes = Math.round((totalReads * 12) / 60)
  return { booksCount, pagesCount, totalReads, totalMinutes }
})

export async function getBooksCount(): Promise<number> {
  const count = await safeQuery(
    () => db.book.count({ where: { isPublished: true } }),
    0,
    250,
  )
  return count
}

export async function searchBooks(
  query: string,
  limit = 20,
  cursor?: string,
): Promise<PaginatedResult<BookListItem>> {
  const q = query.trim()
  if (!q) return { items: [], nextCursor: null, hasMore: false }

  const ql = q.toLowerCase()

  const books = await db.book.findMany({
    where: {
      isPublished: true,
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { author: { name: { contains: q, mode: 'insensitive' } } },
        { author: { nameFa: { contains: q, mode: 'insensitive' } } },
      ],
    },
    select: bookSelect,
    take: 100,
  })

  const rank = (b: any): number => {
    let score = 0
    if (b.title.toLowerCase().includes(ql)) score += 3
    if (b.author?.name?.toLowerCase().includes(ql)) score += 2
    if (b.author?.nameFa?.includes(q)) score += 2
    if (b.description?.toLowerCase().includes(ql)) score += 1
    return score
  }

  const sorted = books.sort((a, z) => {
    const ra = rank(a)
    const rz = rank(z)
    if (rz !== ra) return rz - ra
    return (z.rating ?? 0) - (a.rating ?? 0)
  })

  const offset = cursor ? Number(cursor) : 0
  const paginated = sorted.slice(offset, offset + limit + 1)
  const hasMore = paginated.length > limit
  const items = hasMore ? paginated.slice(0, limit) : paginated
  const nextCursor = hasMore ? String(offset + limit) : null

  return {
    items: items.map(toListItem),
    nextCursor,
    hasMore,
  }
}

export async function getRandomBook(): Promise<BookListItem | null> {
  const count = await db.book.count({ where: { isPublished: true } })
  if (count === 0) return null
  const skip = Math.floor(Math.random() * count)
  const books = await db.book.findMany({
    where: { isPublished: true },
    select: bookSelect,
    skip,
    take: 1,
  })
  return books.length > 0 ? toListItem(books[0]) : null
}

export async function getAuthors(): Promise<AuthorSummary[]> {
  const authors = await safeQuery(
    () =>
      db.author.findMany({
        orderBy: [{ featured: 'desc' }, { name: 'asc' }],
        take: 100,
        include: {
          books: {
            where: { isPublished: true },
            select: bookSelect,
            orderBy: { createdAt: 'desc' },
            take: 100,
          },
        },
      }),
    [],
    250,
  )

  return authors.map((a) => {
    const items = a.books.map(toListItem)
    const genres = Array.from(new Set(items.flatMap((b) => b.genres))).sort()
    const totalPages = items.reduce((sum, b) => sum + b.pageCount, 0)
    const rated = items.filter((b) => b.rating > 0)
    const averageRating =
      rated.length > 0
        ? rated.reduce((s, b) => s + b.rating, 0) / rated.length
        : 0
    const years = items.map((b) => b.publishedYear).filter((y) => y > 0)
    const yearsActive =
      years.length > 0
        ? { min: Math.min(...years), max: Math.max(...years) }
        : { min: 0, max: 0 }

    const summary: AuthorSummary = {
      name: a.name,
      slug: a.slug,
      bookCount: items.length,
      books: items,
      totalPages,
      genres,
      averageRating: Math.round(averageRating * 10) / 10,
      yearsActive,
    }

    return Object.assign(summary, {
      bio: a.bio || '',
      bioFa: a.bioFa || '',
      nameFa: a.nameFa || '',
      photoUrl: a.photoUrl || '',
      photoBlurhash: a.photoBlurhash || '',
      birthYear: a.birthYear || null,
      deathYear: a.deathYear || null,
      nationality: a.nationality || '',
      nationalityFa: a.nationalityFa || '',
      flagEmoji: a.flagEmoji || '',
      era: a.era || '',
    })
  })
}
