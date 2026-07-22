import { db } from '../lib/db'
import { slugify } from '../lib/utils'

/**
 * Syncs an Author document from Payload CMS to Prisma's Author table.
 */
export async function syncAuthorToPrisma(doc: any, operation: 'create' | 'update') {
  try {
    const photoUrl = doc.photo && typeof doc.photo === 'object' ? doc.photo.url || '' : ''
    const photoBlurhash = doc.photo && typeof doc.photo === 'object' ? doc.photo.blurhash || '' : ''

    const data = {
      slug: doc.slug,
      name: doc.name,
      nameFa: doc.nameFa || '',
      bio: doc.bio || '',
      bioFa: doc.bioFa || '',
      photoUrl,
      photoBlurhash,
      birthYear: doc.birthYear || null,
      deathYear: doc.deathYear || null,
      nationality: doc.nationality || '',
      nationalityFa: doc.nationalityFa || '',
      flagEmoji: doc.flagEmoji || '',
      era: doc.era || '',
      eraFa: doc.eraFa || '',
      notableWorks: JSON.stringify(doc.notableWorks || []),
      featured: !!doc.featured,
    }

    await db.author.upsert({
      where: { id: String(doc.id) },
      update: data,
      create: {
        id: String(doc.id),
        ...data,
      },
    })
    console.log(`[Sync] Author ${doc.slug} synced to Prisma successfully (${operation}).`)
  } catch (err) {
    console.error(`[Sync Error] Failed to sync Author ${doc.slug} to Prisma:`, err)
  }
}

/**
 * Deletes an Author in Prisma when deleted in Payload.
 */
export async function deleteAuthorFromPrisma(id: string | number) {
  try {
    await db.author.delete({
      where: { id: String(id) },
    })
    console.log(`[Sync] Author ID ${id} deleted from Prisma.`)
  } catch (err) {
    console.error(`[Sync Error] Failed to delete Author ID ${id} from Prisma:`, err)
  }
}

/**
 * Syncs a Book document from Payload CMS to Prisma's Book table (including Chapters and BookPages).
 */
export async function syncBookToPrisma(doc: any, operation: 'create' | 'update') {
  try {
    const authorId = typeof doc.author === 'object' && doc.author ? String(doc.author.id) : String(doc.author)
    const coverImageDoc = doc.coverImage && typeof doc.coverImage === 'object' ? doc.coverImage : null

    // Ensure the Author row exists in Prisma first. If not, fetch it from Payload and sync it.
    // In typical flows, the author is created before the book, but this is a defensive check.
    const authorExists = await db.author.findUnique({ where: { id: authorId } })
    if (!authorExists) {
      console.warn(`[Sync Warning] Author ID ${authorId} not found in Prisma when syncing Book ${doc.slug}.`)
    }

    const data = {
      slug: doc.slug,
      title: doc.title,
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
      rating: doc.rating || 0,
      reviewCount: doc.reviewCount || 0,
      viewCount: doc.viewCount || 0,
      pageCount: doc.pageCount || 0,
      isPremium: !!doc.isPremium,
      isPublished: doc.isPublished !== false,
      publishedYear: doc.publishedYear || 1900,
      allowDownload: doc.allowDownload !== false,
    }

    await db.$transaction(async (tx) => {
      // 1. Upsert the book itself
      await tx.book.upsert({
        where: { id: String(doc.id) },
        update: data,
        create: {
          id: String(doc.id),
          ...data,
        },
      })

      // 2. Sync Chapters (delete all and recreate)
      await tx.chapter.deleteMany({ where: { bookId: String(doc.id) } })
      if (Array.isArray(doc.chapters) && doc.chapters.length > 0) {
        await tx.chapter.createMany({
          data: doc.chapters.map((c: any) => ({
            bookId: String(doc.id),
            title: c.title,
            titleFa: c.titleFa || '',
            slug: c.slug || slugify(c.title),
            order: c.order || 0,
            startPage: c.startPage || 1,
          })),
        })
      }

      // 3. Sync Pages (delete all and recreate)
      await tx.bookPage.deleteMany({ where: { bookId: String(doc.id) } })
      if (Array.isArray(doc.pages) && doc.pages.length > 0) {
        await tx.bookPage.createMany({
          data: doc.pages.map((p: any) => ({
            bookId: String(doc.id),
            pageNumber: p.pageNumber,
            english: p.english,
            farsi: p.farsi || '',
            type: p.type || 'text',
            meta: typeof p.meta === 'string' ? p.meta : JSON.stringify(p.meta || {}),
          })),
        })
      }
    })

    console.log(`[Sync] Book ${doc.slug} synced to Prisma successfully (${operation}).`)
  } catch (err) {
    console.error(`[Sync Error] Failed to sync Book ${doc.slug} to Prisma:`, err)
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

/**
 * Syncs a BlogPost document from Payload CMS to Prisma's BlogPost table.
 */
export async function syncBlogPostToPrisma(doc: any, operation: 'create' | 'update') {
  try {
    const authorDoc = doc.author && typeof doc.author === 'object' ? doc.author : null
    let prismaAuthorId = ''

    if (authorDoc?.email) {
      const userRow = await db.user.findUnique({
        where: { email: authorDoc.email },
        select: { id: true },
      })
      if (userRow) prismaAuthorId = userRow.id
    }

    if (!prismaAuthorId) {
      // Find default owner/admin user to associate in Prisma
      const defaultUser = await db.user.findFirst({
        where: { role: 'OWNER' },
        select: { id: true },
      })
      prismaAuthorId = defaultUser?.id || ''
    }

    if (!prismaAuthorId) {
      // Fallback to any user
      const anyUser = await db.user.findFirst({ select: { id: true } })
      prismaAuthorId = anyUser?.id || ''
    }

    if (!prismaAuthorId) {
      console.error(`[Sync Error] No user available in Prisma to assign as author of BlogPost ${doc.slug}.`)
      return
    }

    const coverDoc = doc.cover && typeof doc.cover === 'object' ? doc.cover : null
    
    // In Payload, content is richText. Let's serialize it as markdown string if possible, or plain string.
    // The richText doc has Lexical structure.
    let textContent = ''
    if (doc.content && typeof doc.content === 'object' && doc.content.root) {
      // Lexical editor serialize placeholder or plain text extract
      textContent = JSON.stringify(doc.content)
    } else {
      textContent = String(doc.content || '')
    }

    const data = {
      slug: doc.slug,
      title: doc.title,
      excerpt: doc.excerpt || '',
      content: textContent,
      coverUrl: coverDoc?.url || '',
      coverBlurhash: coverDoc?.blurhash || '',
      tags: JSON.stringify(doc.tags || []),
      authorId: prismaAuthorId,
      published: doc._status === 'published',
      publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null,
      viewCount: doc.viewCount || 0,
    }

    await db.blogPost.upsert({
      where: { id: String(doc.id) },
      update: data,
      create: {
        id: String(doc.id),
        ...data,
      },
    })
    console.log(`[Sync] BlogPost ${doc.slug} synced to Prisma successfully (${operation}).`)
  } catch (err) {
    console.error(`[Sync Error] Failed to sync BlogPost ${doc.slug} to Prisma:`, err)
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
    const data = {
      slug: doc.slug,
      text: doc.text,
      textFa: doc.textFa || '',
      bookSlug: doc.bookSlug || '',
      bookTitle: doc.bookTitle || '',
      bookAuthor: doc.bookAuthor || '',
      pageNumber: doc.pageNumber || 1,
      themes: JSON.stringify(doc.themes || []),
      length: doc.length || 'متوسط',
      displayOrder: doc.displayOrder || 0,
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
    console.log(`[Sync] Quote ${doc.slug} synced to Prisma successfully (${operation}).`)
  } catch (err) {
    console.error(`[Sync Error] Failed to sync Quote ${doc.slug} to Prisma:`, err)
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
