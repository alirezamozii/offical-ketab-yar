'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { BookListItem } from '@/lib/data'
import { Skeleton } from '@/components/ui/skeleton'

const ReviewsSectionLazy = dynamic(
  () => import('@/components/books/reviews-section-client').then((mod) => mod.ReviewsSectionClient),
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

function NearViewport({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (ready) return
    const anchor = anchorRef.current
    if (!anchor || !('IntersectionObserver' in window)) {
      setReady(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setReady(true)
        observer.disconnect()
      },
      { rootMargin: '800px 0px' },
    )
    observer.observe(anchor)
    return () => observer.disconnect()
  }, [ready])

  return <div ref={anchorRef}>{ready ? children : fallback}</div>
}

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
    <NearViewport
      fallback={
        <div className="space-y-4 py-4" aria-hidden="true">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      }
    >
      <ReviewsSectionLazy reviews={reviews} />
    </NearViewport>
  )
}

export function LazyReviewFormWrapper({ bookSlug }: { bookSlug: string }) {
  return (
    <NearViewport fallback={<div className="h-9 w-24 rounded-lg bg-muted" aria-hidden="true" />}>
      <ReviewFormWrapperLazy bookSlug={bookSlug} />
    </NearViewport>
  )
}

export function LazyBookCarousel({ books }: { books: BookListItem[] }) {
  return (
    <NearViewport
      fallback={
        <div className="flex gap-4 overflow-hidden py-2" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-36 shrink-0 rounded-xl" />
          ))}
        </div>
      }
    >
      <BookCarouselLazy books={books} />
    </NearViewport>
  )
}
