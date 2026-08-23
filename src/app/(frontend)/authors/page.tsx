import Script from 'next/script'
import { AuthorsPageClient, type AuthorWithBio } from '@/components/authors/authors-page-client'
import { AuthorsDirectorySkeleton } from '@/components/authors/authors-skeleton'
import { getAuthors, getBooksCount } from '@/lib/data'
import { buildAuthorBio } from '@/lib/cms'
import { safeJsonLd } from '@/lib/json-ld'
import { SITE } from '@/lib/site'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'فهرست نویسندگان برجسته جهان — زندگی‌نامه و بیوگرافی',
  description:
    'فهرست جامع و بیوگرافی کامل نویسندگان بزرگ ادبیات جهان در کتاب‌یار: لوئیس کارول، چارلز دیکنز، جین آستن، مارک تواین، اسکار وایلد و بیشتر. کاوش زندگی‌نامه دوزبانه، عکس، ملیت، دوران ادبی و دانلود کتاب‌ها.',
  keywords: [
    'نویسندگان برجسته',
    'زندگی‌نامه نویسنده',
    'بیوگرافی نویسندگان',
    'فهرست نویسندگان جهان',
    'لوئیس کارول',
    'چارلز دیکنز',
    'جین آستن',
    'مارک تواین',
    'اسکار وایلد',
    'آرتور کانن دویل',
    'آگاتا کریستی',
    'نویسندگان انگلیسی',
    'authors directory',
    'authors biography',
    'victorian novelist',
  ],
  alternates: { canonical: `${SITE.url}/authors` },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: `${SITE.url}/authors`,
    title: 'فهرست و بیوگرافی نویسندگان بزرگ جهان — کتاب‌یار',
    description:
      'کاوش در زندگی و آثار نویسندگان بزرگ جهان همراه با بیوگرافی دوزبانه، ملیت، دوران ادبی و کتاب‌های آن‌ها.',
    siteName: 'کتاب‌یار',
    images: [
      {
        url: '/api/og?title=Authors&subtitle=Authors%20directory',
        width: 1200,
        height: 630,
        alt: 'فهرست نویسندگان کتاب‌یار',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'فهرست و بیوگرافی نویسندگان بزرگ جهان — کتاب‌یار',
    description:
      'کاوش در زندگی و آثار نویسندگان بزرگ جهان همراه با بیوگرافی دوزبانه و کتاب‌ها.',
    images: ['/api/og?title=Authors&subtitle=Authors%20directory'],
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

async function AuthorsContent() {
  const [authors, totalBooks] = await Promise.all([getAuthors(), getBooksCount()])

  const authorsWithBios: AuthorWithBio[] = authors.map((a) => ({
    ...a,
    bio: buildAuthorBio(a),
  }))

  const totalPages = authors.reduce((sum, a) => sum + a.totalPages, 0)

  // JSON-LD CollectionPage & BreadcrumbList for maximum SEO
  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE.url}/authors#webpage`,
    url: `${SITE.url}/authors`,
    name: 'فهرست نویسندگان کتاب‌یار',
    description: 'بیوگرافی، زندگی‌نامه و آثار نویسندگان بزرگ ادبیات جهان.',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: authors.length,
      itemListElement: authors.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE.url}/authors/${a.slug}`,
        name: a.name,
      })),
    },
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'خانه',
        item: SITE.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'نویسندگان',
        item: `${SITE.url}/authors`,
      },
    ],
  }

  return (
    <>
      <Script
        id="authors-collection-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(collectionLd) }}
      />
      <Script
        id="authors-breadcrumb-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />
      <AuthorsPageClient
        authors={authorsWithBios}
        totalBooks={totalBooks}
        totalPages={totalPages}
      />
    </>
  )
}

export default function AuthorsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Suspense fallback={<AuthorsDirectorySkeleton count={6} />}>
        <AuthorsContent />
      </Suspense>
    </div>
  )
}

