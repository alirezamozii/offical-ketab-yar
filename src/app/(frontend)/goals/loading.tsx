import { Skeleton } from '@/components/ui/skeleton'

/**
 * /goals loading skeleton — mirrors the page layout:
 *   • Header with title + circular ring
 *   • 3 goal setup cards
 *   • Velocity chart card
 *   • Streak calendar card
 *   • Time distribution + milestones row
 *   • Weekly summary card
 */
export default function GoalsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <span className="sr-only">در حال بارگذاری اهداف و آمار مطالعه…</span>

      {/* Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-20 w-20 rounded-full" />
      </header>

      {/* Goal setup cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-2xl border border-border/60 bg-card p-5"
          >
            <div className="flex items-start justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <div className="flex justify-center">
              <Skeleton className="h-32 w-32 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>

      {/* Velocity chart */}
      <div className="mb-6 space-y-3 rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>

      {/* Streak calendar */}
      <div className="mb-6 space-y-3 rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>

      {/* Time distribution + milestones */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Weekly summary */}
      <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
