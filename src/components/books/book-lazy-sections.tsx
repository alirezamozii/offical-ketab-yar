'use client'

import dynamic from 'next/dynamic'
import type { BookListItem } from '@/lib/data'
import { Skeleton } from '@/components/ui/skeleton'
import { QueryProvider } from '@/components/providers/query-provider'

const ReviewsSectionLazy = dynamic(
  () => import('@/components/books/reviews-list').then((mod) => mod.ReviewsSection),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 py-4" aria-busy="true">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    ),
  }
)

const ReviewFormWrapperLazy = dynamic(
  () => import('@/components/books/review-form-wrapper').then((mod) => mod.ReviewFormWrapper),
  {
    ssr: false,
    loading: () => <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />,
  }
)

const BookCarouselLazy = dynamic(
  () => import('@/components/books/book-carousel').then((mod) => mod.BookCarousel),
  {
    ssr: false,
    loading: () => (
      <div className="flex gap-4 overflow-hidden py-2" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[2/3] w-36 shrink-0 rounded-xl" />
        ))}
      </div>
    ),
  }
)

export function LazyReviewsSection({ reviews }: { reviews: any[] }) {
  return (
    <QueryProvider>
      <ReviewsSectionLazy reviews={reviews} />
    </QueryProvider>
  )
}

export function LazyReviewFormWrapper({ bookSlug }: { bookSlug: string }) {
  return <ReviewFormWrapperLazy bookSlug={bookSlug} />
}

export function LazyBookCarousel({ books }: { books: BookListItem[] }) {
  return <BookCarouselLazy books={books} />
}
