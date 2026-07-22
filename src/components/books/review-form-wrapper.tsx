'use client'

import { ReviewForm, type SubmittedReview } from '@/components/books/review-form'
import { useRouter } from 'next/navigation'
import { STORAGE_KEYS } from '@/lib/storage-keys'

const NEW_REVIEW_KEY = STORAGE_KEYS.newReview

/**
 * ReviewFormWrapper — bridges the client-only ReviewForm with the server
 * book detail page. After a successful submit:
 *   1. Stashes the new review id in sessionStorage so the freshly-revalidated
 *      ReviewsSection can highlight it with a "جدید" badge + scroll to it.
 *   2. Calls router.refresh() to re-fetch the server reviews data so the new
 *      review appears immediately at the top of the list.
 */
export function ReviewFormWrapper({ bookSlug }: { bookSlug: string }) {
  const router = useRouter()

  function handleSubmitted(review: SubmittedReview) {
    try {
      sessionStorage.setItem(NEW_REVIEW_KEY, review.id)
    } catch {
      /* ignore — sessionStorage may be unavailable */
    }
    router.refresh()
  }

  return <ReviewForm bookSlug={bookSlug} onSubmitted={handleSubmitted} />
}
