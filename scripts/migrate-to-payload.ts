/**
 * scripts/migrate-to-payload.ts
 * ---------------------------------------------------------------
 * Migrates content data from Prisma (SQLite/Postgres) to Payload CMS.
 *
 * Reads: Book, Author, BlogPost, Quote from Prisma
 * Writes: to Payload's collections via the Local API
 *
 * Idempotent: safe to re-run (Payload upserts by slug).
 *
 * Owner: Phase 2 R-PL.3
 * ---------------------------------------------------------------
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateAuthors(payload: Awaited<ReturnType<typeof getPayload>>) {
  console.log('📖 Migrating authors...')
  const authors = await prisma.author.findMany()
  let count = 0
  for (const a of authors) {
    try {
      const existing = await payload.find({
        collection: 'authors',
        where: { slug: { equals: a.slug } },
        limit: 1,
      })
      const data = {
        name: a.name,
        nameFa: a.nameFa,
        slug: a.slug,
        bio: a.bio,
        bioFa: a.bioFa,
        birthYear: a.birthYear || undefined,
        deathYear: a.deathYear || undefined,
        nationality: a.nationality,
        nationalityFa: a.nationalityFa,
        era: a.era || undefined,
        eraFa: a.eraFa,
        notableWorks: JSON.parse(a.notableWorks || '[]'),
        featured: a.featured,
      }
      if (existing.docs.length > 0) {
        await payload.update({ collection: 'authors', id: existing.docs[0].id, data })
      } else {
        await payload.create({ collection: 'authors', data })
        count++
      }
    } catch (err) {
      console.warn(`  ⚠ Author ${a.slug}:`, err instanceof Error ? err.message : 'error')
    }
  }
  console.log(`  ✓ ${count} new authors`)
}

async function migrateBooks(payload: Awaited<ReturnType<typeof getPayload>>) {
  console.log('📚 Migrating books...')
  const books = await prisma.book.findMany({
    include: { author: true, chapters: { orderBy: { order: 'asc' } }, pages: { orderBy: { pageNumber: 'asc' } } },
  })
  let count = 0
  for (const b of books) {
    try {
      const existing = await payload.find({
        collection: 'books',
        where: { slug: { equals: b.slug } },
        limit: 1,
      })
      const authorDoc = await payload.find({
        collection: 'authors',
        where: { slug: { equals: b.author.slug } },
        limit: 1,
      })
      if (authorDoc.docs.length === 0) {
        console.warn(`  ⚠ Book ${b.slug}: author ${b.author.slug} not found in Payload`)
        continue
      }
      const data = {
        title: b.title,
        slug: b.slug,
        author: authorDoc.docs[0].id,
        description: b.description,
        level: b.level,
        genres: JSON.parse(b.genres || '[]'),
        pageCount: b.pageCount,
        publishedYear: b.publishedYear,
        coverFrom: b.coverFrom,
        coverTo: b.coverTo,
        coverAccent: b.coverAccent,
        isPublished: b.isPublished,
        isPremium: b.isPremium,
        allowDownload: b.allowDownload,
        viewCount: b.viewCount,
        rating: b.rating,
        reviewCount: b.reviewCount,
        chapters: b.chapters.map((c) => ({
          title: c.title,
          titleFa: c.titleFa,
          slug: c.slug,
          order: c.order,
          startPage: c.startPage,
        })),
        pages: b.pages.map((p) => ({
          pageNumber: p.pageNumber,
          english: p.english,
          farsi: p.farsi,
          type: p.type,
          meta: p.meta,
        })),
      }
      if (existing.docs.length > 0) {
        await payload.update({ collection: 'books', id: existing.docs[0].id, data })
      } else {
        await payload.create({ collection: 'books', data })
        count++
      }
    } catch (err) {
      console.warn(`  ⚠ Book ${b.slug}:`, err instanceof Error ? err.message : 'error')
    }
  }
  console.log(`  ✓ ${count} new books`)
}

async function migrateBlogPosts(payload: Awaited<ReturnType<typeof getPayload>>) {
  console.log('📝 Migrating blog posts...')
  const posts = await prisma.blogPost.findMany()
  let count = 0
  for (const p of posts) {
    try {
      const existing = await payload.find({
        collection: 'blogPosts',
        where: { slug: { equals: p.slug } },
        limit: 1,
      })
      const data = {
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: { root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text: p.content }], direction: 'ltr' }], direction: 'ltr' } },
        tags: JSON.parse(p.tags || '[]'),
        publishedAt: p.publishedAt?.toISOString() || new Date().toISOString(),
        viewCount: p.viewCount,
        _status: p.published ? 'published' : 'draft',
      }
      if (existing.docs.length > 0) {
        await payload.update({ collection: 'blogPosts', id: existing.docs[0].id, data })
      } else {
        await payload.create({ collection: 'blogPosts', data })
        count++
      }
    } catch (err) {
      console.warn(`  ⚠ Post ${p.slug}:`, err instanceof Error ? err.message : 'error')
    }
  }
  console.log(`  ✓ ${count} new blog posts`)
}

async function migrateQuotes(payload: Awaited<ReturnType<typeof getPayload>>) {
  console.log('💬 Migrating quotes...')
  const quotes = await prisma.quote.findMany()
  let count = 0
  for (const q of quotes) {
    try {
      const existing = await payload.find({
        collection: 'quotes',
        where: { slug: { equals: q.slug } },
        limit: 1,
      })
      const data = {
        slug: q.slug,
        text: q.text,
        textFa: q.textFa,
        bookSlug: q.bookSlug,
        bookTitle: q.bookTitle,
        bookAuthor: q.bookAuthor,
        pageNumber: q.pageNumber,
        themes: JSON.parse(q.themes || '[]'),
        length: q.length,
        displayOrder: q.displayOrder,
        isActive: q.isActive,
      }
      if (existing.docs.length > 0) {
        await payload.update({ collection: 'quotes', id: existing.docs[0].id, data })
      } else {
        await payload.create({ collection: 'quotes', data })
        count++
      }
    } catch (err) {
      console.warn(`  ⚠ Quote ${q.slug}:`, err instanceof Error ? err.message : 'error')
    }
  }
  console.log(`  ✓ ${count} new quotes`)
}

async function main() {
  console.log('🚀 Migrating Prisma → Payload...\n')
  const payload = await getPayload({ config })

  await migrateAuthors(payload)
  await migrateBooks(payload)
  await migrateBlogPosts(payload)
  await migrateQuotes(payload)

  console.log('\n✅ Migration complete.')
  await payload.destroy()
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
