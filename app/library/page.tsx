import { BookGrid } from '@/components/books/book-grid'
import { LibraryHeader } from '@/components/library/library-header'
import { Skeleton } from '@/components/ui/skeleton'
import { getAllGenres } from '@/lib/sanity/queries'
import type { Metadata } from 'next'
import { Suspense } from 'react'

// Inline skeleton component
function BookGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[2/3] w-full rounded-lg" shimmer />
          <Skeleton className="h-4 w-full" shimmer />
          <Skeleton className="h-3 w-2/3" shimmer />
        </div>
      ))}
    </div>
  )
}

// Force dynamic rendering (contains client components)
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'کتابخانه کتاب‌های انگلیسی | بیش از 1000 کتاب رایگان | کتاب‌یار',
  description: 'مرور بیش از 1000 کتاب انگلیسی با ترجمه فارسی. دسته‌بندی بر اساس ژانر، نویسنده، و سطح دشواری. ثبت‌نام رایگان برای شروع.',
  keywords: [
    'کتابخانه',
    'کتاب انگلیسی',
    'کتاب رایگان',
    'دانلود کتاب',
    'کتاب دوزبانه',
    'library',
    'English books',
    'free books',
    'bilingual books',
  ],
  alternates: {
    canonical: 'https://ketabyar.ir/library',
  },
  openGraph: {
    title: 'کتابخانه کتاب‌یار - بیش از 1000 کتاب انگلیسی رایگان',
    description: 'مرور و خواندن بیش از 1000 کتاب انگلیسی با ترجمه فارسی',
    url: 'https://ketabyar.ir/library',
    type: 'website',
    images: ['/og-library.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'کتابخانه کتاب‌یار - 1000+ کتاب رایگان',
    description: 'مرور و خواندن کتاب‌های انگلیسی با ترجمه فارسی',
    images: ['/og-library.png'],
  },
}

export default async function LibraryPage() {
  // Fetch genres from Sanity
  const sanityGenres = await getAllGenres()

  // Transform to expected format
  const categories = sanityGenres.map((genre: any) => ({
    id: genre._id,
    name: genre.nameFa || genre.name,
    slug: genre.name.toLowerCase().replace(/\s+/g, '-'),
    _id: genre._id,
  }))
  // JSON-LD CollectionPage Schema for SEO (Agent 1)
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'کتابخانه کتاب‌یار',
    description: 'مجموعه بیش از 1000 کتاب انگلیسی با ترجمه فارسی',
    url: 'https://ketabyar.ir/library',
    publisher: {
      '@type': 'Organization',
      name: 'کتاب‌یار',
      logo: 'https://ketabyar.ir/logo.png',
    },
    mainEntity: {
      '@type': 'ItemList',
      name: 'کتاب‌های موجود',
      description: 'لیست کتاب‌های انگلیسی با ترجمه فارسی',
    },
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <div className="min-h-screen">
        <LibraryHeader categories={categories} />
        <div className="container mx-auto px-4 py-8">
          <Suspense fallback={<BookGridSkeleton />}>
            <BookGrid />
          </Suspense>
        </div>
      </div>
    </>
  )
}
