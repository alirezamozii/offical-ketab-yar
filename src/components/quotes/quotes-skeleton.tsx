import { Skeleton } from '@/components/ui/skeleton'

/**
 * QuotesSkeleton — branded loading state mirroring the gallery layout:
 *   • Quote-of-the-day hero (large gold card)
 *   • Filter bar (theme chips + length + sort)
 *   • Masonry grid of quote cards
 *
 * Uses the gold/amber palette so the loading state reads as "page is
 * filling in" rather than a generic spinner.
 */
export function QuotesSkeleton() {
  return (
    <div className="space-y-10">
      <span className="sr-only">در حال بارگذاری گالری نقل‌قول‌ها…</span>

      {/* Hero skeleton — quote of the day */}
      <div className="relative overflow-hidden rounded-3xl border border-gold-400/25 bg-card/60 p-6 sm:p-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold-500/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative space-y-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-7 w-12 rounded-md" />
          <div className="space-y-3 pt-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-11/12" />
            <Skeleton className="h-5 w-9/12" />
          </div>
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-3 pt-3">
            <Skeleton className="h-10 w-36 rounded-md" />
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-9 w-72 rounded-lg" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 11 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </div>

      {/* Masonry grid skeleton — varying heights for visual rhythm */}
      <div className="[column-fill:_balance] columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="mb-4 w-full rounded-2xl"
            style={{ height: 180 + (i % 4) * 60 }}
          />
        ))}
      </div>
    </div>
  )
}
