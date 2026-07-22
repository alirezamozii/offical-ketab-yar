import { db } from '@/lib/db'
import { getPayloadClient } from '@/lib/payload'

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

function toListItem(b: any): BookListItem {
  const author = b.author && typeof b.author === 'object' ? b.author : null
  const coverImageDoc = b.coverImage && typeof b.coverImage === 'object' ? b.coverImage : null
  return {
    id: b.id,
    slug: b.slug,
    title: b.title,
    author: author?.name ?? '',
    authorId: author?.id,
    authorSlug: author?.slug,
    authorNameFa: author?.nameFa,
    description: b.description || '',
    coverFrom: b.coverFrom || '#b8956a',
    coverTo: b.coverTo || '#6d523a',
    coverAccent: b.coverAccent || '#f4d35e',
    coverImage: coverImageDoc?.url ?? null,
    coverImageUrl: coverImageDoc?.url ?? '',
    coverBlurhash: coverImageDoc?.blurhash ?? '',
    genres: Array.isArray(b.genres) ? b.genres : [],
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

export async function getBooks(): Promise<BookListItem[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'books',
    where: {
      isPublished: {
        equals: true,
      },
    },
    sort: '-createdAt',
    limit: 100,
  })
  return result.docs.map(toListItem)
}

export async function getRecentlyAddedBooks(limit = 12): Promise<BookListItem[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'books',
    where: {
      isPublished: {
        equals: true,
      },
    },
    sort: '-createdAt',
    limit,
  })
  return result.docs.map(toListItem)
}

export async function getHighestRatedBooks(limit = 12): Promise<BookListItem[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'books',
    where: {
      isPublished: {
        equals: true,
      },
    },
    sort: '-rating',
    limit,
  })
  return result.docs.map(toListItem)
}

export async function getMostReadBooks(limit = 12): Promise<BookListItem[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'books',
    where: {
      isPublished: {
        equals: true,
      },
    },
    sort: '-viewCount',
    limit,
  })
  return result.docs.map(toListItem)
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
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'books',
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
  })
  if (result.docs.length === 0) return null
  const book = result.docs[0]
  const base = toListItem(book)
  
  // Reviews are stored in Prisma linked by bookId
  const reviews = await db.review.findMany({
    where: { bookId: String(book.id) },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return {
    ...base,
    chapters: (book.chapters || []).map((c: any) => ({
      id: c.id || c.slug,
      title: c.title,
      titleFa: c.titleFa || '',
      slug: c.slug,
      order: c.order ?? 0,
      startPage: c.startPage ?? 1,
    })),
    reviews: reviews.map((r) => ({
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
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'books',
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
  })
  if (result.docs.length === 0) return null
  const book = result.docs[0]
  const author = book.author && typeof book.author === 'object' ? book.author : null
  const coverImageDoc = book.coverImage && typeof book.coverImage === 'object' ? book.coverImage : null

  let pages = book.pages || []
  if (from !== undefined && to !== undefined) {
    pages = pages.filter((p: any) => p.pageNumber >= from && p.pageNumber <= to)
  }

  return {
    slug: book.slug,
    title: book.title,
    author: author?.name ?? '',
    authorNameFa: author?.nameFa ?? '',
    authorSlug: author?.slug ?? '',
    level: book.level,
    coverImageUrl: coverImageDoc?.url ?? '',
    coverBlurhash: coverImageDoc?.blurhash ?? '',
    pageCount: book.pageCount,
    chapters: (book.chapters || []).map((c: any) => ({
      id: c.id || c.slug,
      title: c.title,
      titleFa: c.titleFa || '',
      slug: c.slug,
      order: c.order ?? 0,
      startPage: c.startPage ?? 1,
    })),
    pages: pages.map((p: any) => ({
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
  const payload = await getPayloadClient()
  
  if (!genres.length) {
    const result = await payload.find({
      collection: 'books',
      where: {
        and: [
          { slug: { not_equals: slug } },
          { isPublished: { equals: true } },
        ],
      },
      sort: '-rating',
      limit,
    })
    return result.docs.map(toListItem)
  }

  const result = await payload.find({
    collection: 'books',
    where: {
      and: [
        { slug: { not_equals: slug } },
        { isPublished: { equals: true } },
      ],
    },
    limit: 100, // Grab a candidate pool to score in memory
  })

  const scored = result.docs
    .map((b: any) => ({
      b,
      score: (b.genres || []).filter((g: string) => genres.includes(g)).length,
    }))
    .sort((a, z) => z.score - a.score)
    .slice(0, limit)

  return scored.map((s) => toListItem(s.b))
}

export async function getAllGenres(): Promise<string[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'books',
    limit: 100,
  })
  const set = new Set<string>()
  for (const b of result.docs) {
    const genres = (b as any).genres || []
    for (const g of genres) set.add(g)
  }
  return Array.from(set).sort()
}

export async function incrementViewCount(slug: string): Promise<void> {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'books',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    if (result.docs.length > 0) {
      const book = result.docs[0]
      await payload.update({
        collection: 'books',
        id: book.id,
        data: {
          viewCount: (book.viewCount || 0) + 1,
        },
      })
    }
  } catch (err) {
    console.error('[incrementViewCount] failed:', err)
  }
}

export async function getBookById(id: string): Promise<BookListItem | null> {
  const payload = await getPayloadClient()
  try {
    const book = await payload.findByID({
      collection: 'books',
      id,
    })
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
  const payload = await getPayloadClient()
  const offset = cursor ? Number(cursor) : 0
  
  const page = Math.floor(offset / limit) + 1
  
  const result = await payload.find({
    collection: 'books',
    where: {
      and: [
        { isPublished: { equals: true } },
        { genres: { contains: genre } },
      ],
    },
    sort: '-rating',
    limit: limit + 1,
    page,
  })

  const hasMore = result.docs.length > limit
  const items = hasMore ? result.docs.slice(0, limit) : result.docs
  const nextCursor = hasMore ? String(offset + limit) : null

  return {
    items: items.map(toListItem),
    nextCursor,
    hasMore,
  }
}

export async function getBooksCount(): Promise<number> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'books',
    limit: 1,
  })
  return result.totalDocs
}

export async function searchBooks(
  query: string,
  limit = 20,
  cursor?: string,
): Promise<PaginatedResult<BookListItem>> {
  const q = query.trim()
  if (!q) return { items: [], nextCursor: null, hasMore: false }
  
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'books',
    where: {
      and: [
        { isPublished: { equals: true } },
        {
          or: [
            { title: { like: q } },
            { description: { like: q } },
            { 'author.name': { like: q } },
            { 'author.nameFa': { like: q } },
          ],
        },
      ],
    },
    limit: 100,
  })
  
  const ql = q.toLowerCase()
  const rank = (b: any): number => {
    let score = 0
    const author = b.author && typeof b.author === 'object' ? b.author : {}
    if (b.title.toLowerCase().includes(ql)) score += 3
    if (author.name?.toLowerCase().includes(ql)) score += 2
    if (author.nameFa?.includes(q)) score += 2
    if (b.description?.toLowerCase().includes(ql)) score += 1
    return score
  }
  
  const sorted = result.docs.sort((a: any, z: any) => {
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
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'books',
    where: {
      isPublished: { equals: true },
    },
    limit: 100,
  })
  if (result.docs.length === 0) return null
  const idx = Math.floor(Math.random() * result.docs.length)
  return toListItem(result.docs[idx])
}

export async function getAuthors(): Promise<AuthorSummary[]> {
  const payload = await getPayloadClient()
  const authorsResult = await payload.find({
    collection: 'authors',
    limit: 100,
    sort: '-featured,name',
  })
  
  const authors = await Promise.all(authorsResult.docs.map(async (a: any) => {
    const booksResult = await payload.find({
      collection: 'books',
      where: {
        and: [
          { author: { equals: a.id } },
          { isPublished: { equals: true } },
        ],
      },
      sort: '-createdAt',
      limit: 100,
    })
    
    const items = booksResult.docs.map(toListItem)
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
      photoUrl: typeof a.photo === 'object' && a.photo ? a.photo.url : '',
      photoBlurhash: typeof a.photo === 'object' && a.photo ? a.photo.blurhash : '',
      birthYear: a.birthYear || null,
      deathYear: a.deathYear || null,
      nationality: a.nationality || '',
      nationalityFa: a.nationalityFa || '',
      flagEmoji: a.flagEmoji || '',
      era: a.era || '',
      eraFa: a.eraFa || '',
      notableWorks: Array.isArray(a.notableWorks) ? a.notableWorks : [],
      featured: !!a.featured,
    })
  }))

  return authors
}
