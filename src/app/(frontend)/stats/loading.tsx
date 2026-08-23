import { Skeleton } from '@/components/ui/skeleton'

/**
 * /stats loading skeleton — mirrors the Year-in-Review layout:
 *   • Hero scene with large count-up number + gradient
 *   • Top genres chart card
 *   • Streak + reading-rhythm row
 *   • Book journey horizontal scroll
 *   • Vocab growth + achievements row
 *   • Personality badge + share card
 */
export default function StatsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <span className="sr-only">در حال بارگذاری آمار مطالعه…</span>

      {/* Hero */}
      <div className="mb-6 overflow-hidden rounded-3xl border border-border/60 bg-card p-8 sm:p-12">
        <Skeleton className="mb-3 h-5 w-32" />
        <Skeleton className="mb-6 h-12 w-72 max-w-full" />
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Top genres */}
      <div className="mb-6 space-y-3 rounded-2xl border border-border/60 bg-card p-5">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Streak + Reading rhythm */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
          <Skeleton className="h-5 w-32" />
          <div className="flex justify-center">
            <Skeleton className="h-28 w-28 rounded-full" />
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </div>

      {/* Book journey */}
      <div className="mb-6 space-y-3 rounded-2xl border border-border/60 bg-card p-5">
        <Skeleton className="h-5 w-44" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-28 shrink-0 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Vocab growth + achievements */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Personality + share */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
