import { Skeleton } from '@/components/ui/skeleton'

/**
 * Dashboard loading skeleton — mirrors the layout of `dashboard/page.tsx` +
 * `DashboardClient`: header (title + paragraph + 2 buttons), XP bar, daily
 * challenges card, resume card, 2-col stat grid, "ادامه مطالعه" 4-cover grid,
 * recommendations, activity feed, achievements, reading heatmap.
 */
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </header>

      <div className="space-y-8">
        {/* sr-only announcement for assistive tech */}
        <span className="sr-only">در حال بارگذاری داشبورد…</span>

        {/* XP bar */}
        <Skeleton className="h-28 w-full rounded-2xl" />

        {/* Daily challenges */}
        <Skeleton className="h-40 w-full rounded-2xl" />

        {/* Resume card */}
        <Skeleton className="h-32 w-full rounded-2xl" />

        {/* Streak + Daily goal — 2-col grid on lg+ */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>

        {/* Continue-reading grid (4 book covers) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] w-full rounded-2xl" />
            ))}
          </div>
        </section>

        {/* Recommendations */}
        <Skeleton className="h-48 w-full rounded-2xl" />

        {/* Activity feed */}
        <section className="space-y-4">
          <Skeleton className="h-7 w-32" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </section>

        {/* Achievements */}
        <Skeleton className="h-56 w-full rounded-2xl" />

        {/* Reading heatmap */}
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </div>
  )
}
