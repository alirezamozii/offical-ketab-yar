import { createClient } from '@libsql/client'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const sqlite = createClient({ url: 'file:db/payload.db' })

async function sync() {
  console.log('🔄 Starting sync from SQLite (Payload) to PostgreSQL (Prisma)...')

  // 1. Authors
  const authorsRes = await sqlite.execute('SELECT * FROM authors')
  console.log(`Found ${authorsRes.rows.length} author(s) in SQLite.`)

  const authorMap = new Map() // sqlite author id -> prisma author id

  for (const row of authorsRes.rows) {
    const slug = String(row.slug || 'author-' + row.id)
    const name = String(row.name || 'Unknown Author')
    const nameFa = String(row.name_fa || '')
    const bio = String(row.bio || '')
    const bioFa = String(row.bio_fa || '')
    const birthYear = row.birth_year ? Number(row.birth_year) : null
    const deathYear = row.death_year ? Number(row.death_year) : null
    const nationality = String(row.nationality || '')
    const nationalityFa = String(row.nationality_fa || '')
    const era = String(row.era || 'Modern')
    const eraFa = String(row.era_fa || '')

    const author = await prisma.author.upsert({
      where: { slug },
      update: {
        name,
        nameFa,
        bio,
        bioFa,
        birthYear,
        deathYear,
        nationality,
        nationalityFa,
        era,
        eraFa,
      },
      create: {
        slug,
        name,
        nameFa,
        bio,
        bioFa,
        birthYear,
        deathYear,
        nationality,
        nationalityFa,
        era,
        eraFa,
      },
    })

    authorMap.set(row.id, author.id)
    console.log(`✅ Synced Author: ${name} (${author.id})`)
  }

  // 2. Books
  const booksRes = await sqlite.execute('SELECT * FROM books')
  console.log(`Found ${booksRes.rows.length} book(s) in SQLite.`)

  for (const row of booksRes.rows) {
    const slug = String(row.slug)
    const title = String(row.title)
    const authorId = authorMap.get(row.author_id) || (await prisma.author.findFirst())?.id
    if (!authorId) {
      console.error(`❌ No author found for book ${title}`)
      continue
    }

    const description = String(row.description || '')
    const level = String(row.level || 'B2')
    const pageCount = Number(row.page_count) || 1
    const publishedYear = Number(row.published_year) || 1937
    const coverFrom = String(row.cover_from || '#3b2f1e')
    const coverTo = String(row.cover_to || '#1a120b')
    const coverAccent = String(row.cover_accent || '#c9a227')
    const isPublished = Boolean(row.is_published)

    const book = await prisma.book.upsert({
      where: { slug },
      update: {
        title,
        authorId,
        description,
        level,
        pageCount,
        publishedYear,
        coverFrom,
        coverTo,
        coverAccent,
        isPublished,
      },
      create: {
        slug,
        title,
        authorId,
        description,
        level,
        pageCount,
        publishedYear,
        coverFrom,
        coverTo,
        coverAccent,
        isPublished,
      },
    })
    console.log(`✅ Synced Book: ${title} (${book.id})`)

    // 3. Chapters
    const chaptersRes = await sqlite.execute({
      sql: 'SELECT * FROM books_chapters WHERE _parent_id = ? ORDER BY `order` ASC',
      args: [row.id],
    })
    console.log(`Found ${chaptersRes.rows.length} chapter(s) for book ${title}.`)

    await prisma.chapter.deleteMany({ where: { bookId: book.id } })

    for (const c of chaptersRes.rows) {
      await prisma.chapter.create({
        data: {
          bookId: book.id,
          title: String(c.title),
          titleFa: String(c.title_fa || ''),
          slug: String(c.slug || 'chapter-' + c.order),
          order: Number(c.order) || 1,
          startPage: Number(c.start_page) || 1,
        },
      })
    }
    console.log(`✅ Synced ${chaptersRes.rows.length} chapters.`)

    // 4. Pages
    const pagesRes = await sqlite.execute({
      sql: 'SELECT * FROM books_pages WHERE _parent_id = ? ORDER BY page_number ASC',
      args: [row.id],
    })
    console.log(`Found ${pagesRes.rows.length} page(s) for book ${title}.`)

    await prisma.bookPage.deleteMany({ where: { bookId: book.id } })

    // Insert in batches of 20 to avoid large query limits
    const batchSize = 20
    for (let i = 0; i < pagesRes.rows.length; i += batchSize) {
      const batch = pagesRes.rows.slice(i, i + batchSize)
      await prisma.bookPage.createMany({
        data: batch.map((p) => ({
          bookId: book.id,
          pageNumber: Number(p.page_number),
          english: String(p.english || ''),
          farsi: String(p.farsi || ''),
          type: String(p.type || 'text'),
          meta: String(p.meta || ''),
        })),
      })
    }
    console.log(`✅ Synced ${pagesRes.rows.length} pages into Prisma!`)
  }

  console.log('🎉 Sync completed successfully!')
  await prisma.$disconnect()
}

sync().catch((err) => {
  console.error('Sync failed:', err)
  process.exit(1)
})
