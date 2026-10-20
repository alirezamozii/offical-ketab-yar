'use client'

import { QueryProvider } from '@/components/providers/query-provider'
import { ReviewsSection } from '@/components/books/reviews-list'

export function ReviewsSectionClient({ reviews }: { reviews: any[] }) {
  return (
    <QueryProvider>
      <ReviewsSection reviews={reviews} />
    </QueryProvider>
  )
}
