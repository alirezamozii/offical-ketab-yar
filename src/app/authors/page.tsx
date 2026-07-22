import { AuthorsPageClient, type AuthorWithBio } from '@/components/authors/authors-page-client'
import { AuthorsDirectorySkeleton } from '@/components/authors/authors-skeleton'
import { getAuthors, getBooksCount } from '@/lib/data'
import { buildAuthorBio } from '@/lib/cms'
import { SITE } from '@/lib/site'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'نویسندگان',
  description:
    'فهرست نویسندگان کلاسیک کتاب‌یار: زندگی‌نامه، ملیت، دوران ادبی و کتاب‌های هر نویسنده در کتابخانهٔ دوزبانه. کاوش کنید در زندگی و آثار نویسندگان بزرگ ادبیات جهان.',
  keywords: [
    'نویسندگان کلاسیک',
    'زندگی‌نامه نویسنده',
    'فهرست نویسندگان',
    'لوئیس کارول',
    'چارلز دیکنز',
    'جین آستن',
    'مارک تواین',
    'اسکار وایلد',
    'authors directory',
    'classic authors biography',
    'victorian novelist',
  ],
  alternates: { canonical: `${SITE.url}/authors` },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: `${SITE.url}/authors`,
    title: 'فهرست نویسندگان کتاب‌یار — زندگی و آثار نویسندگان کلاسیک',
    description:
      'کاوش کنید در زندگی و آثار نویسندگان کلاسیک کتاب‌یار — زندگی‌نامه، ملیت، دوران ادبی و کتاب‌های هر نویسنده.',
    siteName: 'کتاب‌یار',
    images: [
      {
        url: '/api/og?title=Authors&subtitle=Classic%20authors%20directory',
        width: 1200,
        height: 630,
        alt: 'فهرست نویسندگان کتاب‌یار',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'فهرست نویسندگان کتاب‌یار',
    description:
      'کاوش در زندگی و آثار نویسندگان کلاسیک کتاب‌یار.',
    images: ['/api/og?title=Authors&subtitle=Classic%20authors%20directory'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default async function AuthorsPage() {
  // Fetch the catalog + book count in parallel; both are small, fast queries.
  const [authors, totalBooks] = await Promise.all([getAuthors(), getBooksCount()])

  // Merge curated bios into each author record. Authors without a curated
  // bio get `bio: null` — the client renders them with a graceful fallback
  // (name + books only, no biography card). The bio fields are read from
  // the Author DB row (CMS-managed via /admin/authors) — `getAuthors()`
  // in `src/lib/data/index.ts` attaches them via `Object.assign`, and
  // `buildAuthorBio()` extracts a typed `AuthorBio` (or `null`) from those.
  const authorsWithBios: AuthorWithBio[] = authors.map((a) => ({
    ...a,
    bio: buildAuthorBio(a),
  }))

  // Total pages across every author (sum of every book's pageCount).
  const totalPages = authors.reduce((sum, a) => sum + a.totalPages, 0)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Suspense fallback={<AuthorsDirectorySkeleton count={6} />}>
        <AuthorsPageClient
          authors={authorsWithBios}
          totalBooks={totalBooks}
          totalPages={totalPages}
        />
      </Suspense>
    </div>
  )
}
