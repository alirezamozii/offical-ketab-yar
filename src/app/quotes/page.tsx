import type { Metadata } from 'next'
import { Suspense } from 'react'
import nextDynamic from 'next/dynamic'
import { getActiveQuotes, getQuoteOfTheDayFromDB } from '@/lib/cms'
import type { CuratedQuote } from '@/lib/quotes'
import type { BookListItem } from '@/lib/data'
import { getBooks } from '@/lib/data'
import { SITE } from '@/lib/site'
import { QuotesSkeleton } from '@/components/quotes/quotes-skeleton'

export const dynamic = 'force-dynamic'

const QuotesPageClient = nextDynamic(
  () => import('@/components/quotes/quotes-page-client').then((m) => m.QuotesPageClient),
  {
    loading: () => <QuotesSkeleton />,
  }
)

export const metadata: Metadata = {
  title: 'نقل‌قول‌ها | کتاب‌یار',
  description:
    'گالری نقل‌قول‌های برگزیده از کتاب‌های کلاسیک و هایلایت‌های شما. نقل‌قول روز، فیلتر بر اساس موضوع، اشتراک‌گذاری و ذخیره‌سازی.',
  keywords: [
    'نقل‌قول',
    'هایلایت',
    'نقل‌قول روز',
    'کتاب‌یار',
    'اشتراک‌گذاری نقل‌قول',
    'quotes',
    'highlights',
  ],
  alternates: { canonical: `${SITE.url}/quotes` },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: `${SITE.url}/quotes`,
    title: 'نقل‌قول‌ها | کتاب‌یار',
    description:
      'گالری نقل‌قول‌های برگزیده از کتاب‌های کلاسیک به‌همراه هایلایت‌های شما.',
    siteName: 'کتاب‌یار',
    images: [
      {
        url: '/api/og?title=Quotes&subtitle=Curated%20highlights%20gallery',
        width: 1200,
        height: 630,
        alt: 'نقل‌قول‌ها | کتاب‌یار',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'نقل‌قول‌ها | کتاب‌یار',
    description: 'گالری نقل‌قول‌های برگزیده و هایلایت‌های شما.',
    images: ['/api/og?title=Quotes&subtitle=Curated%20highlights%20gallery'],
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

/**
 * /quotes — server-component shell.
 *
 * Fetches the curated quote collection + a lookup of book covers server-side
 * (both now DB-backed — see `src/lib/cms.ts`), then hands both (plus the
 * deterministic quote of the day) to the client component. The client
 * component reads the user's highlights + saved-quote ids from localStorage
 * (no DB access needed for those, since they live in the browser per the
 * existing reader storage contract).
 *
 * Admin edits made through `/admin/quotes` show up here on the next render
 * (no deploy needed) — the Quote table is the single source of truth.
 */
export default async function QuotesPage() {
  // Fetch every book in one query so the gallery can render cover
  // thumbnails on the curated cards AND resolve book titles for the
  // user's highlights (which may live under any book slug, not just the
  // ones the curated collection references).
  const [allBooks, quotes, quoteOfTheDay] = await Promise.all([
    getBooks(),
    getActiveQuotes(),
    getQuoteOfTheDayFromDB(),
  ])
  const bookLookup: Record<string, BookListItem> = {}
  for (const b of allBooks) bookLookup[b.slug] = b

  // We pass the curated list directly — it's a small array, so serialising
  // it into the client bundle is cheaper than fetching it again from
  // /api/quotes on mount.
  const curatedQuotes: CuratedQuote[] = quotes
  // The client component expects a non-null quote-of-the-day. The seed
  // script always populates 47 quotes, so `quotes[0]` is a safe fallback.
  const quoteOfDay: CuratedQuote =
    quoteOfTheDay ?? quotes[0] ?? {
      id: 'empty',
      text: '',
      textFa: '',
      bookSlug: '',
      bookTitle: '',
      bookAuthor: '',
      pageNumber: 1,
      theme: [],
      length: 'کوتاه',
    }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Suspense fallback={<QuotesSkeleton />}>
        <QuotesPageClient
          initialQuotes={curatedQuotes}
          initialBookLookup={bookLookup}
          initialQuoteOfTheDay={quoteOfDay}
        />
      </Suspense>
    </div>
  )
}
