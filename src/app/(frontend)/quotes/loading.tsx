import { QuotesSkeleton } from '@/components/quotes/quotes-skeleton'

/**
 * /quotes loading.tsx — branded skeleton mirroring the gallery layout.
 * Renders the gold-accented shell so the page feels like it's "filling in".
 */
export default function QuotesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <QuotesSkeleton />
    </div>
  )
}
