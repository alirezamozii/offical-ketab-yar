/**
 * scripts/sync-all-to-payload.ts
 * ---------------------------------------------------------------
 * Populates and synchronizes all existing Prisma content
 * (Authors, Books, Chapters, Pages, Blog Posts, Quotes)
 * directly into Payload CMS so they are visible and editable in Admin.
 * ---------------------------------------------------------------
 */

import { getPayloadClient } from '../src/lib/payload'
import { db } from '../src/lib/db'
import { slugify } from '../src/lib/utils'

async function syncAll() {
  console.log('🔄 Starting full sync from Prisma into Payload CMS...')

  const payload = await getPayloadClient()

  // 1. SYNC AUTHORS
  console.log('📚 Syncing Authors...')
  const authors = await db.author.findMany()
  const authorPayloadIdMap = new Map<string, string | number>()

  for (const author of authors) {
    const authorSlug = author.slug || slugify(author.name)
    const existing = await payload.find({
      collection: 'authors',
      where: {
        or: [{ slug: { equals: authorSlug } }, { name: { equals: author.name } }],
      },
      limit: 1,
    })

    const authorData = {
      name: author.name,
      nameFa: author.nameFa || author.name,
      slug: authorSlug,
      bio: author.bio || '',
      bioFa: author.bioFa || '',
      birthYear: author.birthYear || undefined,
      deathYear: author.deathYear || undefined,
      nationality: author.nationality || '',
      nationalityFa: author.nationalityFa || '',
      era: (['Augustan', 'Romantic', 'Victorian', 'Edwardian', 'Modern', 'Postmodern'].includes(author.era || '') ? author.era : 'Modern') as any,
      eraFa: author.eraFa || '',
    }

    let payloadAuthorId: string | number
    if (existing.docs.length > 0) {
      payloadAuthorId = existing.docs[0].id
      await payload.update({
        collection: 'authors',
        id: payloadAuthorId,
        data: authorData,
      })
      console.log(`  ✓ Updated Author: ${author.name} (ID: ${payloadAuthorId})`)
    } else {
      const created = await payload.create({
        collection: 'authors',
        data: authorData,
      })
      payloadAuthorId = created.id
      console.log(`  ✓ Created Author: ${author.name} (ID: ${payloadAuthorId})`)
    }

    authorPayloadIdMap.set(author.id, payloadAuthorId)
    authorPayloadIdMap.set(authorSlug, payloadAuthorId)
  }

  // 2. SYNC BOOKS, CHAPTERS & PAGES
  console.log('📖 Syncing Books, Chapters, and Pages...')
  const books = await db.book.findMany({
    include: {
      authorRel: true,
      chapters: { orderBy: { order: 'asc' } },
      pages: { orderBy: { pageNumber: 'asc' } },
    },
  })

  for (const book of books) {
    const bookSlug = book.slug || slugify(book.title)
    const authorId =
      authorPayloadIdMap.get(book.authorId) ||
      authorPayloadIdMap.get(book.authorRel?.slug || '') ||
      Array.from(authorPayloadIdMap.values())[0]

    let parsedGenres: string[] = ['Classic']
    try {
      if (typeof book.genres === 'string') {
        const parsed = JSON.parse(book.genres)
        if (Array.isArray(parsed)) parsedGenres = parsed
      }
    } catch {
      // fallback
    }

    const chapters = book.chapters.map((c) => ({
      title: c.title,
      titleFa: c.titleFa || '',
      slug: c.slug || slugify(c.title),
      order: c.order || 0,
      startPage: c.startPage || 1,
    }))

    const pages = book.pages.map((p) => ({
      pageNumber: p.pageNumber,
      english: p.english,
      farsi: p.farsi || '',
      type: (['text', 'heading', 'image', 'quote'].includes(p.type || '') ? p.type : 'text') as any,
    }))

    const bookData: any = {
      title: book.title,
      slug: bookSlug,
      author: authorId,
      description: book.description || '',
      level: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(book.level) ? book.level : 'B1',
      genres: parsedGenres,
      pageCount: book.pageCount || pages.length,
      publishedYear: book.publishedYear || 1950,
      coverFrom: book.coverFrom || '#3b2d1f',
      coverTo: book.coverTo || '#1a140e',
      coverAccent: book.coverAccent || '#f4d35e',
      isPublished: book.isPublished !== false,
      allowDownload: book.allowDownload !== false,
      chapters,
      pages,
    }

    const existing = await payload.find({
      collection: 'books',
      where: {
        or: [{ slug: { equals: bookSlug } }, { title: { equals: book.title } }],
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'books',
        id: existing.docs[0].id,
        data: bookData,
      })
      console.log(`  ✓ Updated Book: ${book.title} (${pages.length} pages, ID: ${existing.docs[0].id})`)
    } else {
      const created = await payload.create({
        collection: 'books',
        data: bookData,
      })
      console.log(`  ✓ Created Book: ${book.title} (${pages.length} pages, ID: ${created.id})`)
    }
  }

  // 3. SYNC BLOG POSTS
  console.log('✍️ Syncing Blog Posts...')
  const posts = await db.blogPost.findMany()
  for (const post of posts) {
    const postSlug = post.slug || slugify(post.title)
    let parsedTags: string[] = ['آموزش زبان']
    try {
      if (typeof post.tags === 'string') {
        const parsed = JSON.parse(post.tags)
        if (Array.isArray(parsed)) parsedTags = parsed
      }
    } catch {
      // fallback
    }

    const postData: any = {
      title: post.title,
      slug: postSlug,
      excerpt: post.excerpt || '',
      tags: parsedTags,
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : new Date().toISOString(),
      _status: post.published ? 'published' : 'draft',
    }

    const existing = await payload.find({
      collection: 'blogPosts',
      where: { slug: { equals: postSlug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'blogPosts',
        id: existing.docs[0].id,
        data: postData,
      })
      console.log(`  ✓ Updated Blog Post: ${post.title}`)
    } else {
      await payload.create({
        collection: 'blogPosts',
        data: postData,
      })
      console.log(`  ✓ Created Blog Post: ${post.title}`)
    }
  }

  // 4. SYNC QUOTES
  console.log('💬 Syncing Quotes...')
  const quotes = await db.quote.findMany()
  for (const quote of quotes) {
    const quoteSlug = quote.slug || slugify(quote.text.slice(0, 30))
    let parsedThemes: string[] = ['حکمت']
    try {
      if (typeof quote.themes === 'string') {
        const parsed = JSON.parse(quote.themes)
        if (Array.isArray(parsed)) parsedThemes = parsed
      }
    } catch {
      // fallback
    }

    const quoteData: any = {
      slug: quoteSlug,
      text: quote.text,
      textFa: quote.textFa || '',
      bookSlug: quote.bookSlug || '',
      bookTitle: quote.bookTitle || '',
      bookAuthor: quote.bookAuthor || '',
      pageNumber: quote.pageNumber || 1,
      themes: parsedThemes,
      length: (['کوتاه', 'متوسط', 'بلند'].includes(quote.length || '') ? quote.length : 'متوسط') as any,
      isActive: quote.isActive !== false,
    }

    const existing = await payload.find({
      collection: 'quotes',
      where: { slug: { equals: quoteSlug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'quotes',
        id: existing.docs[0].id,
        data: quoteData,
      })
    } else {
      await payload.create({
        collection: 'quotes',
        data: quoteData,
      })
    }
  }

  console.log('🎉 Full Sync completed successfully!')
  process.exit(0)
}

syncAll().catch((err) => {
  console.error('❌ Sync failed:', err)
  process.exit(1)
})
