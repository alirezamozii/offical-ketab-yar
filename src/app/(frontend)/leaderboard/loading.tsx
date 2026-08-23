import { Skeleton } from '@/components/ui/skeleton'

/**
 * Leaderboard loading skeleton — mirrors `leaderboard/page.tsx` +
 * `LeaderboardClient`: page header (title + paragraph), current-user rank
 * card, Card with a 5-tab TabsList and a vertical list of leaderboard rows
 * (the weekly tab also shows a 3-podium layout above the rest).
 */
export default function LeaderboardLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <header className="mb-8 space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </header>

      <span className="sr-only">در حال بارگذاری لیدربورد…</span>

      <div className="space-y-6">
        {/* Current-user rank card */}
        <Skeleton className="h-24 w-full rounded-2xl" />

        {/* Main leaderboard card */}
        <div className="rounded-2xl border border-border/60 bg-card">
          {/* Card header */}
          <div className="space-y-2 border-b border-border/60 p-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>

          {/* TabsList (5 periods) */}
          <div className="p-6 pb-0">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>

          {/* Podium (3 columns) — mirrors the weekly layout */}
          <div className="px-6 pt-6">
            <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
              <Skeleton className="h-28 w-full rounded-t-lg" />
              <Skeleton className="h-36 w-full rounded-t-lg" />
              <Skeleton className="h-20 w-full rounded-t-lg" />
            </div>
          </div>

          {/* Leaderboard rows */}
          <div className="space-y-2 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
