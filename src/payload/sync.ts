import { db } from '../lib/db'
import { slugify } from '../lib/utils'

/**
 * Syncs an Author document from Payload CMS to Prisma's Author table.
 */
export function mapAuthorPayloadToPrisma(doc: any) {
  const photoUrl = doc.photo && typeof doc.photo === 'object' ? doc.photo.url || '' : ''
  const photoBlurhash = doc.photo && typeof doc.photo === 'object' ? doc.photo.blurhash || '' : ''

  return {
    slug: doc.slug?.trim() || String(doc.id || `author-${Date.now()}`),
    name: doc.name?.trim() || 'نویسنده بدون نام',
    nameFa: doc.nameFa || '',
    bio: doc.bio || '',
    bioFa: doc.bioFa || '',
    photoUrl,
    photoBlurhash,
    birthYear: doc.birthYear ? Number(doc.birthYear) : null,
    deathYear: doc.deathYear ? Number(doc.deathYear) : null,
    nationality: doc.nationality || '',
    nationalityFa: doc.nationalityFa || '',
    flagEmoji: doc.flagEmoji || '',
    era: doc.era || '',
    eraFa: doc.eraFa || '',
    notableWorks: JSON.stringify(doc.notableWorks || []),
    biography: doc.biography || '',
    biographyFa: doc.biographyFa || '',
    tags: JSON.stringify(doc.tags || []),
    website: doc.website || '',
    wikipedia: doc.wikipedia || '',
    featured: !!doc.featured,
  }
}

/**
 * Syncs an Author document from Payload CMS to Prisma's Author table.
 */
export async function syncAuthorToPrisma(doc: any, operation: 'create' | 'update') {
  try {
    if (!doc.name && !doc.slug) {
      console.log(`[Sync] Author ID ${doc.id} is empty; skipping Prisma sync until named.`)
      return
    }

    const data = mapAuthorPayloadToPrisma(doc)
    const existing = await db.author.findFirst({
      where: {
        OR: [{ slug: data.slug }, { name: data.name }],
      },
    })

    if (existing) {
      await db.author.update({
        where: { id: existing.id },
        data,
      })
    } else {
      await db.author.create({
        data,
      })
    }
    console.log(`[Sync] Author ${data.slug} synced to Prisma successfully (${operation}).`)
  } catch (err) {
    console.error(`[Sync Error] Failed to sync Author ${doc.slug || doc.id} to Prisma:`, err)
  }
}

/**
 * Deletes an Author in Prisma when deleted in Payload.
 */
export async function deleteAuthorFromPrisma(id: string | number) {
  try {
    const existing = await db.author.findFirst({
      where: { OR: [{ id: String(id) }, { slug: String(id) }] },
    })
    if (existing) {
      await db.author.delete({ where: { id: existing.id } })
      console.log(`[Sync] Author ${existing.slug} deleted from Prisma.`)
    }
  } catch (err) {
    console.error(`[Sync Error] Failed to delete Author ID ${id} from Prisma:`, err)
  }
}

export function mapBookPayloadToPrisma(doc: any, authorId: string) {
  const coverImageDoc = doc.coverImage && typeof doc.coverImage === 'object' ? doc.coverImage : null
  return {
    slug: doc.slug?.trim() || String(doc.id || `book-${Date.now()}`),
    title: doc.title?.trim() || 'کتاب بدون عنوان',
    authorId,
    description: doc.description || '',
    coverFrom: doc.coverFrom || '#b8956a',
    coverTo: doc.coverTo || '#6d523a',
    coverAccent: doc.coverAccent || '#f4d35e',
    coverImageUrl: coverImageDoc?.url || '',
    coverBlurhash: coverImageDoc?.blurhash || '',
    genres: JSON.stringify(doc.genres || []),
    level: doc.level || 'B1',
    language: doc.language || 'en',
    rating: Number(doc.rating) || 0,
    reviewCount: Number(doc.reviewCount) || 0,
    viewCount: Number(doc.viewCount) || 0,
    pageCount: Number(doc.pageCount) || (Array.isArray(doc.pages) ? doc.pages.length : 0),
    isPremium: !!doc.isPremium,
    isPublished: doc.isPublished !== false,
    publishedYear: doc.publishedYear ? Number(doc.publishedYear) : 1900,
    allowDownload: doc.allowDownload !== false,
  }
}

/**
 * Syncs a Book document from Payload CMS to Prisma's Book table (including Chapters and BookPages).
 */
export async function syncBookToPrisma(doc: any, operation: 'create' | 'update') {
  try {
    if (!doc.title && !doc.slug) {
      console.log(`[Sync] Book ID ${doc.id} is empty; skipping Prisma sync until populated.`)
      return
    }

    const authorPayloadId = typeof doc.author === 'object' && doc.author ? String(doc.author.id) : String(doc.author || '')
    const authorPayloadSlug = typeof doc.author === 'object' && doc.author ? doc.author.slug : ''
    const authorPayloadName = typeof doc.author === 'object' && doc.author ? doc.author.name : ''

    let prismaAuthor = await db.author.findFirst({
      where: {
        OR: [
          ...(authorPayloadId ? [{ id: authorPayloadId }] : []),
          ...(authorPayloadSlug ? [{ slug: authorPayloadSlug }] : []),
          ...(authorPayloadName ? [{ name: authorPayloadName }] : []),
        ],
      },
    })

    if (!prismaAuthor) {
      prismaAuthor = await db.author.findFirst()
      if (!prismaAuthor) {
        prismaAuthor = await db.author.create({
          data: {
            slug: 'editorial-team',
            name: 'Editorial Team',
            nameFa: 'تیم تحریریه',
          },
        })
      }
    }

    const data = mapBookPayloadToPrisma(doc, prismaAuthor.id)

    const existingBook = await db.book.findFirst({
      where: {
        OR: [{ slug: data.slug }, { title: data.title }],
      },
    })

    let targetBookId: string
    if (existingBook) {
      const updated = await db.book.update({
        where: { id: existingBook.id },
        data,
      })
      targetBookId = updated.id
    } else {
      const created = await db.book.create({
        data,
      })
      targetBookId = created.id
    }

    // Sync Chapters
    await db.chapter.deleteMany({ where: { bookId: targetBookId } })
    if (Array.isArray(doc.chapters) && doc.chapters.length > 0) {
      await db.chapter.createMany({
        data: doc.chapters.map((c: any) => ({
          bookId: targetBookId,
          title: c.title,
          titleFa: c.titleFa || '',
          slug: c.slug || slugify(c.title),
          order: c.order || 0,
          startPage: c.startPage || 1,
        })),
      })
    }

    // Sync Pages
    await db.bookPage.deleteMany({ where: { bookId: targetBookId } })
    if (Array.isArray(doc.pages) && doc.pages.length > 0) {
      await db.bookPage.createMany({
        data: doc.pages.map((p: any) => ({
          bookId: targetBookId,
          pageNumber: p.pageNumber,
          english: p.english,
          farsi: p.farsi || '',
          type: p.type || 'text',
          meta: typeof p.meta === 'string' ? p.meta : JSON.stringify(p.meta || {}),
        })),
      })
    }

    console.log(`[Sync] Book ${data.slug} synced to Prisma successfully (${operation}).`)
  } catch (err) {
    console.error(`[Sync Error] Failed to sync Book ${doc.slug || doc.id} to Prisma:`, err)
  }
}

/**
 * Deletes a Book in Prisma when deleted in Payload.
 */
export async function deleteBookFromPrisma(id: string | number) {
  try {
    await db.book.delete({
      where: { id: String(id) },
    })
    console.log(`[Sync] Book ID ${id} deleted from Prisma.`)
  } catch (err) {
    console.error(`[Sync Error] Failed to delete Book ID ${id} from Prisma:`, err)
  }
}

export async function resolveBlogAuthorId(doc: any): Promise<string> {
  const authorDoc = doc.author && typeof doc.author === 'object' ? doc.author : null

  if (authorDoc?.email) {
    const userRow = await db.user.findUnique({
      where: { email: authorDoc.email },
      select: { id: true },
    })
    if (userRow) return userRow.id
  } else if (typeof doc.author === 'string' && doc.author) {
    const userById = await db.user.findUnique({
      where: { id: doc.author },
      select: { id: true },
    })
    if (userById) return userById.id
  }

  const defaultUser = await db.user.findFirst({
    where: { role: { in: ['OWNER', 'ADMIN'] } },
    select: { id: true },
  })
  if (defaultUser) return defaultUser.id

  const anyUser = await db.user.findFirst({ select: { id: true } })
  if (anyUser) return anyUser.id

  const editorial = await db.user.create({
    data: {
      email: 'editorial@bookzi.ir',
      name: 'Bookzi Editorial',
      role: 'ADMIN',
    },
    select: { id: true },
  })
  return editorial.id
}

export function extractBlogContent(doc: any): string {
  if (doc.content && typeof doc.content === 'object' && doc.content.root) {
    return JSON.stringify(doc.content)
  }
  return String(doc.content || '')
}

export function mapBlogPostPayloadToPrisma(doc: any, authorId: string, textContent: string) {
  const coverDoc = doc.cover && typeof doc.cover === 'object' ? doc.cover : null
  const slug = doc.slug?.trim() || String(doc.id || `post-${Date.now()}`)
  const title = doc.title?.trim() || 'پیش‌نویس بدون عنوان'

  return {
    slug,
    title,
    excerpt: doc.excerpt || '',
    content: textContent || '',
    coverUrl: coverDoc?.url || '',
    coverBlurhash: coverDoc?.blurhash || '',
    tags: JSON.stringify(Array.isArray(doc.tags) ? doc.tags : []),
    authorId,
    published: doc._status === 'published' || doc.published === true,
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null,
    viewCount: Number(doc.viewCount) || 0,
  }
}

/**
 * Syncs a BlogPost document from Payload CMS to Prisma's BlogPost table.
 */
export async function syncBlogPostToPrisma(doc: any, operation: 'create' | 'update') {
  try {
    if (!doc.title && !doc.slug) {
      console.log(`[Sync] BlogPost ID ${doc.id} has no title/slug yet; skipping Prisma sync until populated.`)
      return
    }

    const prismaAuthorId = await resolveBlogAuthorId(doc)
    if (!prismaAuthorId) {
      console.error(`[Sync Error] No user available in Prisma to assign as author of BlogPost ${doc.slug || doc.id}.`)
      return
    }

    const textContent = extractBlogContent(doc)
    const data = mapBlogPostPayloadToPrisma(doc, prismaAuthorId, textContent)

    await db.blogPost.upsert({
      where: { id: String(doc.id) },
      update: data,
      create: {
        id: String(doc.id),
        ...data,
      },
    })
    console.log(`[Sync] BlogPost ${data.slug} synced to Prisma successfully (${operation}).`)
  } catch (err) {
    console.error(`[Sync Error] Failed to sync BlogPost ${doc.slug || doc.id} to Prisma:`, err)
  }
}

/**
 * Deletes a BlogPost in Prisma when deleted in Payload.
 */
export async function deleteBlogPostFromPrisma(id: string | number) {
  try {
    await db.blogPost.delete({
      where: { id: String(id) },
    })
    console.log(`[Sync] BlogPost ID ${id} deleted from Prisma.`)
  } catch (err) {
    console.error(`[Sync Error] Failed to delete BlogPost ID ${id} from Prisma:`, err)
  }
}

/**
 * Syncs a Quote document from Payload CMS to Prisma's Quote table.
 */
export async function syncQuoteToPrisma(doc: any, operation: 'create' | 'update') {
  try {
    if (!doc.text && !doc.slug) {
      console.log(`[Sync] Quote ID ${doc.id} is empty; skipping Prisma sync until populated.`)
      return
    }

    const data = {
      slug: doc.slug?.trim() || String(doc.id || `quote-${Date.now()}`),
      text: doc.text?.trim() || '',
      textFa: doc.textFa || '',
      bookSlug: doc.bookSlug || '',
      bookTitle: doc.bookTitle || '',
      bookAuthor: doc.bookAuthor || '',
      pageNumber: Number(doc.pageNumber) || 1,
      themes: JSON.stringify(doc.themes || []),
      length: doc.length || 'متوسط',
      displayOrder: Number(doc.displayOrder) || 0,
      isActive: doc.isActive !== false,
    }

    await db.quote.upsert({
      where: { id: String(doc.id) },
      update: data,
      create: {
        id: String(doc.id),
        ...data,
      },
    })
    console.log(`[Sync] Quote ${data.slug} synced to Prisma successfully (${operation}).`)
  } catch (err) {
    console.error(`[Sync Error] Failed to sync Quote ${doc.slug || doc.id} to Prisma:`, err)
  }
}

/**
 * Deletes a Quote in Prisma when deleted in Payload.
 */
export async function deleteQuoteFromPrisma(id: string | number) {
  try {
    await db.quote.delete({
      where: { id: String(id) },
    })
    console.log(`[Sync] Quote ID ${id} deleted from Prisma.`)
  } catch (err) {
    console.error(`[Sync Error] Failed to delete Quote ID ${id} from Prisma:`, err)
  }
}
