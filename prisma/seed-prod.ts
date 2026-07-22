/**
 * prisma/seed-prod.ts — production-safe book catalog seed.
 *
 * DIFFERENCES FROM prisma/seed.ts (the dev seed):
 *   • DOES NOT delete existing rows — safe to run on a live production DB.
 *     Uses upserts / createMany-skipDuplicates so re-running is idempotent.
 *   • DOES NOT seed reviews. The dev seed ships a handful of canned reviews
 *     (e.g. "Great read!") attributed to fake users — those are noise on a
 *     real production site. Real users will leave real reviews.
 *   • DOES NOT seed mock leaderboard users. Those were already removed
 *     from prisma/seed.ts (see the MOCK_USERS comment there).
 *
 * Run via:
 *   bun run db:seed:prod                              # local
 *   docker compose run --rm app bun run db:seed:prod  # against the live DB
 *
 * Exit codes: 0 on success (including "already seeded"), 1 on error.
 */

import { PrismaClient } from '@prisma/client'
import { SEED_BOOKS } from './seed-data'

const prisma = new PrismaClient()

function slugifyAuthor(name: string): string {
  return name
    .normalize('NFKD')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  console.log('🌱 [seed-prod] Seeding book catalog (idempotent)...')

  let authorsCreated = 0
  let authorsSkipped = 0
  let booksCreated = 0
  let booksSkipped = 0
  let pagesCreated = 0

  // 1. Authors — upsert by slug (idempotent).
  const authorNames = Array.from(new Set(SEED_BOOKS.map((b) => b.author)))
  for (const name of authorNames) {
    const slug = slugifyAuthor(name)
    const before = await prisma.author.count({ where: { slug } })
    await prisma.author.upsert({
      where: { slug },
      update: {}, // don't overwrite admin-edited bios in prod
      create: {
        slug,
        name,
        nameFa: '',
        bio: '',
        bioFa: '',
        photoUrl: '',
        photoBlurhash: '',
        nationality: '',
        nationalityFa: '',
        flagEmoji: '',
        era: '',
        eraFa: '',
        notableWorks: '[]',
        featured: false,
      },
    })
    if (before === 0) authorsCreated++
    else authorsSkipped++
  }
  console.log(`  ✓ authors: ${authorsCreated} new, ${authorsSkipped} existing`)

  // 2. Books + pages — upsert by slug. Skip page creation if the book
  //    already exists (preserves any admin edits to pages).
  for (const b of SEED_BOOKS) {
    const authorSlug = slugifyAuthor(b.author)
    const author = await prisma.author.findUnique({ where: { slug: authorSlug } })
    if (!author) {
      console.warn(`  ! author not found for "${b.title}" — skipping`)
      continue
    }
    const before = await prisma.book.count({ where: { slug: b.slug } })
    await prisma.book.upsert({
      where: { slug: b.slug },
      update: {}, // don't overwrite admin edits
      create: {
        slug: b.slug,
        title: b.title,
        author: { connect: { slug: author.slug } },
        description: b.description,
        coverFrom: b.coverFrom,
        coverTo: b.coverTo,
        coverAccent: b.coverAccent,
        genres: JSON.stringify(b.genres),
        level: b.level,
        rating: b.rating,
        reviewCount: b.reviewCount,
        viewCount: b.viewCount,
        pageCount: b.pages.length,
        isPremium: b.isPremium,
        publishedYear: b.publishedYear,
        pages: {
          create: b.pages.map((p, i) => ({
            pageNumber: i,
            english: p.english,
            farsi: p.farsi,
            type: p.type ?? 'text',
          })),
        },
      },
    })
    if (before === 0) {
      booksCreated++
      pagesCreated += b.pages.length
      console.log(`  ✓ ${b.title} (${b.pages.length} pages)`)
    } else {
      booksSkipped++
      console.log(`  • ${b.title} — already exists, skipping`)
    }
  }

  const totalBooks = await prisma.book.count()
  const totalPages = await prisma.bookPage.count()
  console.log(
    `✅ Done. Created ${booksCreated} books (${pagesCreated} pages), skipped ${booksSkipped}. ` +
      `Catalog now has ${totalBooks} books / ${totalPages} pages total.`,
  )
}

main()
  .catch((e) => {
    console.error('[seed-prod] FAILED:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
