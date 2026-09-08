import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getActiveQuotes, getQuoteOfTheDayFromDB } from '@/lib/cms'
import type { CuratedQuote } from '@/lib/quotes'
import type { BookListItem } from '@/lib/data'
import { getBooks } from '@/lib/data'
import { SITE } from '@/lib/site'
import { QuotesPageClient } from '@/components/quotes/quotes-page-client'
import { QuotesSkeleton } from '@/components/quotes/quotes-skeleton'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'کوت‌ها | بوکزی',
  description:
    'گالری کوت‌های برگزیده از کتاب‌ها و هایلایت‌های شما در بوکزی؛ زیست‌بومِ کتاب‌های دوزبانه. کوت روز، طراحی استوری کارت، اشتراک‌گذاری و ذخیره‌سازی.',
  keywords: [
    'کوت',
    'کوت‌ها',
    'هایلایت',
    'کوت روز',
    'بوکزی',
    'Bookzi',
    'استودیو کوت',
    'اشتراک‌گذاری کوت',
    'quotes',
    'highlights',
  ],
  alternates: { canonical: `${SITE.url}/quotes` },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: `${SITE.url}/quotes`,
    title: 'کوت‌ها | بوکزی',
    description:
      'گالری کوت‌های برگزیده از کتاب‌ها به‌همراه هایلایت‌های شما در بوکزی.',
    siteName: 'بوکزی',
    images: [
      {
        url: '/api/og?title=Quotes&subtitle=Curated%20highlights%20gallery',
        width: 1200,
        height: 630,
        alt: 'کوت‌ها | بوکزی',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'کوت‌ها | بوکزی',
    description: 'گالری کوت‌های برگزیده و هایلایت‌های شما در بوکزی.',
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
async function QuotesContent() {
  const [allBooks, quotes, quoteOfTheDay] = await Promise.all([
    getBooks(),
    getActiveQuotes(),
    getQuoteOfTheDayFromDB(),
  ])
  const bookLookup: Record<string, BookListItem> = {}
  for (const b of allBooks) bookLookup[b.slug] = b

  const curatedQuotes: CuratedQuote[] = quotes
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
    <QuotesPageClient
      initialQuotes={curatedQuotes}
      initialBookLookup={bookLookup}
      initialQuoteOfTheDay={quoteOfDay}
    />
  )
}

export default function QuotesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-20 sm:pt-24 pb-16 sm:px-6">
      <Suspense fallback={<QuotesSkeleton />}>
        <QuotesContent />
      </Suspense>
    </div>
  )
}

