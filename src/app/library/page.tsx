import { LibraryClient } from '@/components/library/library-client'
import { LibrarySkeleton } from '@/components/library/library-skeleton'
import { TopTrending } from '@/components/library/top-trending'
import { getBooks, getBooksCount, getMostReadBooks } from '@/lib/data'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SITE } from '@/lib/site'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'کتابخانه — مرور کتاب‌های انگلیسی دوزبانه',
  description:
    'کتابخانه کتاب‌یار: مرور کتاب‌های کلاسیک انگلیسی با ترجمه فارسی، قابل جستجو و فیلتر بر اساس ژانر و سطح. مطالعه رایگان دوزبانه با دیکشنری هوشمند و هوش مصنوعی.',
  keywords: [
    'کتابخانه کتاب انگلیسی',
    'مرور کتاب',
    'کتاب کلاسیک انگلیسی',
    'کتاب دوزبانه',
    'کتاب انگلیسی با ترجمه',
    'ژانر کتاب',
    'سطح زبان',
    'CEFR',
    'یادگیری انگلیسی',
    'bilingual English books',
  ],
  alternates: { canonical: `${SITE.url}/library` },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: `${SITE.url}/library`,
    title: 'کتابخانه کتاب‌یار — مرور کتاب‌های انگلیسی دوزبانه',
    description:
      'مرور کتاب‌های کلاسیک انگلیسی با ترجمه فارسی، قابل جستجو و فیلتر بر اساس ژانر و سطح.',
    siteName: 'کتاب‌یار',
    images: [
      {
        url: '/api/og?title=Library&subtitle=Bilingual%20English%20books',
        width: 1200,
        height: 630,
        alt: 'کتابخانه کتاب‌یار',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'کتابخانه کتاب‌یار — کتاب‌های انگلیسی دوزبانه',
    description:
      'مرور کتاب‌های کلاسیک انگلیسی با ترجمه فارسی، قابل جستجو و فیلتر بر اساس ژانر و سطح.',
    images: ['/api/og?title=Library&subtitle=Bilingual%20English%20books'],
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

export default async function LibraryPage() {
  const [initial, total, trending] = await Promise.all([
    getBooks(),
    getBooksCount(),
    getMostReadBooks(10),
  ])
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Hero header — gilded top hairline + gold-tinted ambient halo +
          a small "catalog size" pill so the user can see at a glance how
          big the library is before they start filtering. */}
      <header className="relative mb-8 space-y-3 overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-6 sm:p-8">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-amber-500/8 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-700 dark:text-gold-300">
            کتابخانه
            <span className="text-muted-foreground">·</span>
            <span className="tabular-nums">{total.toLocaleString('fa-IR')}</span>{' '}
            کتاب دوزبانه
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            کتابخانه
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            مجموعه‌ای از کتاب‌های کلاسیک انگلیسی همراه با ترجمه فارسی. کتابی را
            انتخاب کنید و در حالی که می‌خوانید، زبان یاد بگیرید.
          </p>
        </div>
      </header>

      {/* Top 10 Trending — moved here from the (now-deleted) Discovery page.
          Dynamic ranking based on real viewCount, pastel palette. */}
      <TopTrending books={trending} />

      <Suspense fallback={<LibrarySkeleton count={8} view="grid" />}>
        <LibraryClient initial={initial} />
      </Suspense>
    </div>
  )
}
