import { PrismaClient } from '@prisma/client'
import { SEED_BOOKS, SEED_REVIEWS } from './seed-data'

const prisma = new PrismaClient()

/**
 * Convert an arbitrary author name into a URL-safe lowercase-hyphen slug.
 * Mirrors the `slugifyAuthor` helper in `src/lib/data/index.ts` so the seed
 * authors get the same slugs the runtime code would derive.
 */
function slugifyAuthor(name: string): string {
  return name
    .normalize('NFKD')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Leaderboard competitors are NO LONGER mocked.
 *
 * The previous MOCK_USERS array seeded 15 fake users (آرش رضایی @ 945,200 XP, etc.)
 * into UserStats with isMock=true. This made the leaderboard look lively but was
 * fundamentally dishonest — a real user could never beat «آرش» and the board was
 * a lie. Audit 10 (Product Completeness) flagged this as a BLOCKER.
 *
 * The leaderboard now shows REAL users only. New users land on an empty board
 * with a «شما اولین نفر هستید!» (You're the first!) empty state. As real users
 * read, the board fills organically.
 *
 * The array is kept (commented) for reference only.
 */
// const MOCK_USERS = [ ... removed — see git history ... ]


async function main() {
  console.log('🌱 Seeding Ketab-Yar database...')

  // Clean slate — delete in dependency order to avoid cascade friction.
  await prisma.userStats.deleteMany()
  await prisma.readingProgress.deleteMany()
  await prisma.vocabulary.deleteMany()
  await prisma.review.deleteMany()
  await prisma.bookPage.deleteMany()
  await prisma.chapter.deleteMany()
  await prisma.book.deleteMany()
  await prisma.author.deleteMany()

  // 1. Collect every unique author name from the seed data and create an
  //    Author row for each. We don't have rich bios / eras here — those can
  //    be filled in later via the CMS. The key thing is that each Book row
  //    has a valid `authorId` to point to.
  const authorNames = Array.from(new Set(SEED_BOOKS.map((b) => b.author)))
  const authorBySlug = new Map<string, { id: string; slug: string; name: string }>()
  for (const name of authorNames) {
    const slug = slugifyAuthor(name)
    const created = await prisma.author.create({
      data: {
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
    authorBySlug.set(slug, { id: created.id, slug, name })
  }
  console.log(`  ✓ ${authorBySlug.size} authors`)

  // 2. Create each book with `author: { connect: { slug } }`.
  for (const b of SEED_BOOKS) {
    const authorSlug = slugifyAuthor(b.author)
    const author = authorBySlug.get(authorSlug)
    if (!author) {
      throw new Error(`Seed author not found for "${b.author}"`)
    }
    const created = await prisma.book.create({
      data: {
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
    console.log(`  ✓ ${created.title} (${b.pages.length} pages)`)
  }

  for (const r of SEED_REVIEWS) {
    const book = await prisma.book.findUnique({ where: { slug: r.bookSlug } })
    if (!book) continue
    await prisma.review.create({
      data: {
        bookId: book.id,
        userName: r.userName,
        userAvatar: r.userAvatar,
        rating: r.rating,
        comment: r.comment,
      },
    })
  }

  const count = await prisma.book.count()
  const pages = await prisma.bookPage.count()
  const reviews = await prisma.review.count()
  console.log(`✅ Done. ${count} books, ${pages} pages, ${reviews} reviews.`)

  // NOTE: Mock leaderboard competitors are no longer seeded (see MOCK_USERS
  // comment above). The leaderboard now reflects real readers only.
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
