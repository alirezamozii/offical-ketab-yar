import { db } from '@/lib/db'

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

/** Parse JSON notableWorks field from Prisma */
function parseNotableWorks(raw: unknown): string[] {
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

// ---------------------------------------------------------------------------
// BOOK QUERIES — All use Prisma directly
// ---------------------------------------------------------------------------

export async function getBooks(): Promise<BookListItem[]> {
  try {
    const books = await db.book.findMany({
      where: { isPublished: true },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return books.map(toListItem)
  } catch (err) {
    console.error('[getBooks] DB error:', err)
    return []
  }
}

export async function getRecentlyAddedBooks(limit = 12): Promise<BookListItem[]> {
  try {
    const books = await db.book.findMany({
      where: { isPublished: true },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return books.map(toListItem)
  } catch (err) {
    console.error('[getRecentlyAddedBooks] DB error:', err)
    return []
  }
}

export async function getHighestRatedBooks(limit = 12): Promise<BookListItem[]> {
  try {
    const books = await db.book.findMany({
      where: { isPublished: true },
      include: { author: true },
      orderBy: { rating: 'desc' },
      take: limit,
    })
    return books.map(toListItem)
  } catch (err) {
    console.error('[getHighestRatedBooks] DB error:', err)
    return []
  }
}

export async function getMostReadBooks(limit = 12): Promise<BookListItem[]> {
  try {
    const books = await db.book.findMany({
      where: { isPublished: true },
      include: { author: true },
      orderBy: { viewCount: 'desc' },
      take: limit,
    })
    return books.map(toListItem)
  } catch (err) {
    console.error('[getMostReadBooks] DB error:', err)
    return []
  }
}

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
  try {
    const book = await db.book.findUnique({
      where: { slug },
      include: {
        author: true,
        chapters: { orderBy: { order: 'asc' } },
        reviews: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    })
    if (!book) return null
    const base = toListItem(book)

    return {
      ...base,
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
  } catch (err) {
    console.error('[getBookBySlug] DB error:', err)
    return null
  }
}

export async function getReaderBook(
  slug: string,
  from?: number,
  to?: number,
): Promise<ReaderBook | null> {
  try {
    const book = await db.book.findUnique({
      where: { slug },
      include: {
        author: true,
        chapters: { orderBy: { order: 'asc' } },
        pages: {
          where: from !== undefined && to !== undefined
            ? { pageNumber: { gte: from, lte: to } }
            : undefined,
          orderBy: { pageNumber: 'asc' },
        },
      },
    })
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
  } catch (err) {
    console.error('[getReaderBook] DB error:', err)
    return null
  }
}

export async function getRelatedBooks(
  slug: string,
  genres: string[],
  limit = 4,
): Promise<BookListItem[]> {
  try {
    if (!genres.length) {
      const books = await db.book.findMany({
        where: {
          slug: { not: slug },
          isPublished: true,
        },
        include: { author: true },
        orderBy: { rating: 'desc' },
        take: limit,
      })
      return books.map(toListItem)
    }

    // Grab a candidate pool and score in-memory by genre overlap
    const books = await db.book.findMany({
      where: {
        slug: { not: slug },
        isPublished: true,
      },
      include: { author: true },
      take: 100,
    })

    const scored = books
      .map((b) => ({
        b,
        score: parseGenres(b.genres).filter((g: string) => genres.includes(g)).length,
      }))
      .sort((a, z) => z.score - a.score)
      .slice(0, limit)

    return scored.map((s) => toListItem(s.b))
  } catch (err) {
    console.error('[getRelatedBooks] DB error:', err)
    return []
  }
}

export async function getAllGenres(): Promise<string[]> {
  try {
    const books = await db.book.findMany({
      select: { genres: true },
      take: 500,
    })
    const set = new Set<string>()
    for (const b of books) {
      for (const g of parseGenres(b.genres)) set.add(g)
    }
    return Array.from(set).sort()
  } catch (err) {
    console.error('[getAllGenres] DB error:', err)
    return []
  }
}

export async function incrementViewCount(slug: string): Promise<void> {
  try {
    await db.book.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    })
  } catch (err) {
    console.error('[incrementViewCount] failed:', err)
  }
}

export async function getBookById(id: string): Promise<BookListItem | null> {
  try {
    const book = await db.book.findUnique({
      where: { id },
      include: { author: true },
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

    // We can't use Prisma's `contains` on a JSON string field easily,
    // so we fetch all published books and filter in-memory.
    const allBooks = await db.book.findMany({
      where: { isPublished: true },
      include: { author: true },
      orderBy: { rating: 'desc' },
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

export async function getBooksCount(): Promise<number> {
  try {
    return await db.book.count({ where: { isPublished: true } })
  } catch (err) {
    console.error('[getBooksCount] DB error:', err)
    return 0
  }
}

export async function searchBooks(
  query: string,
  limit = 20,
  cursor?: string,
): Promise<PaginatedResult<BookListItem>> {
  const q = query.trim()
  if (!q) return { items: [], nextCursor: null, hasMore: false }

  try {
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
      include: { author: true },
      take: 100,
    })

    // Rank by relevance
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
  } catch (err) {
    console.error('[searchBooks] DB error:', err)
    return { items: [], nextCursor: null, hasMore: false }
  }
}

export async function getRandomBook(): Promise<BookListItem | null> {
  try {
    const count = await db.book.count({ where: { isPublished: true } })
    if (count === 0) return null
    const skip = Math.floor(Math.random() * count)
    const books = await db.book.findMany({
      where: { isPublished: true },
      include: { author: true },
      skip,
      take: 1,
    })
    if (books.length === 0) return null
    return toListItem(books[0])
  } catch (err) {
    console.error('[getRandomBook] DB error:', err)
    return null
  }
}

export async function getAuthors(): Promise<AuthorSummary[]> {
  try {
    const authors = await db.author.findMany({
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
      take: 100,
    })

    const results = await Promise.all(authors.map(async (a) => {
      const books = await db.book.findMany({
        where: {
          authorId: a.id,
          isPublished: true,
        },
        include: { author: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })

      const items = books.map(toListItem)
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
        eraFa: a.eraFa || '',
        notableWorks: parseNotableWorks(a.notableWorks),
        featured: !!a.featured,
      })
    }))

    return results
  } catch (err) {
    console.error('[getAuthors] DB error:', err)
    return []
  }
}
