import { Skeleton } from '@/components/ui/skeleton'

/**
 * /achievements loading skeleton — mirrors the gallery layout: header with
 * circular progress ring + KPI row, filter tabs row, responsive 4-column
 * card grid with pulsing placeholders.
 */
export default function AchievementsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <span className="sr-only">در حال بارگذاری گالری دستاوردها…</span>

      {/* Header — title + circular progress ring */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </header>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-9 w-48 rounded-lg" />
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-2xl border border-border/60 bg-card p-5"
          >
            <div className="flex items-start justify-between">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
