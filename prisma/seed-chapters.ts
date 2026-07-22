/**
 * prisma/seed-chapters.ts
 * ---------------------------------------------------------------
 * Scans all books for BookPage rows with `type=heading` and creates
 * Chapter rows for each, so the book detail page's Table of Contents
 * has data to render.
 *
 * The heading page's `english` field typically contains "Chapter N — Title"
 * or just "Chapter N". This script parses the chapter number + title
 * and derives a Persian title (empty by default — admins can edit).
 *
 * Idempotent: uses upsert by (bookId, slug). Safe to re-run.
 *
 * Owner: CRON-REVIEW-202607171339
 * ---------------------------------------------------------------
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

/** Parse "Chapter 1 — Down the Rabbit-Hole" → { num: 1, title: "Down the Rabbit-Hole" } */
function parseHeading(text: string): { num: number | null; title: string } {
  // Match "Chapter N" (case-insensitive) followed by optional separator + title
  // The separator can be an em-dash, en-dash, hyphen, colon, or period.
  const m = text.match(/^chapter\s+(\d+)\s*[\u2014\u2013\-:.\s]?\s*(.*)$/i)
  if (m) {
    const num = parseInt(m[1], 10)
    const title = m[2].trim() || `Chapter ${num}`
    return { num: isNaN(num) ? null : num, title }
  }
  // Fallback: just use the full text as the title
  return { num: null, title: text.trim() }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `chapter-${Date.now()}`
}

async function main() {
  console.log('📚 Seeding chapters from heading pages...')

  const books = await db.book.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      pages: {
        where: { type: 'heading' },
        orderBy: { pageNumber: 'asc' },
        select: { pageNumber: true, english: true },
      },
    },
  })

  let totalCreated = 0
  let totalUpdated = 0
  let booksWithChapters = 0

  for (const book of books) {
    if (book.pages.length === 0) continue
    booksWithChapters++

    for (let i = 0; i < book.pages.length; i++) {
      const page = book.pages[i]
      const { num, title } = parseHeading(page.english)
      const order = num ?? i + 1
      const slug = slugify(title)

      const existing = await db.chapter.findUnique({
        where: { bookId_slug: { bookId: book.id, slug } },
        select: { id: true },
      })

      await db.chapter.upsert({
        where: { bookId_slug: { bookId: book.id, slug } },
        update: {
          title,
          order,
          startPage: page.pageNumber,
        },
        create: {
          bookId: book.id,
          title,
          titleFa: '', // admins can add Persian titles via the CMS
          slug,
          order,
          startPage: page.pageNumber,
        },
      })

      if (existing) totalUpdated++
      else totalCreated++
    }

    console.log(`  ✓ ${book.title}: ${book.pages.length} chapters`)
  }

  console.log('')
  console.log(`✅ Done. ${booksWithChapters} books, ${totalCreated} created, ${totalUpdated} updated.`)
  console.log(`   Total chapters in DB: ${await db.chapter.count()}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
