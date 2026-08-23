import { Skeleton } from '@/components/ui/skeleton'

/**
 * Search loading skeleton — mirrors `search/page.tsx` +
 * `SearchClient`: page header (title + paragraph), language toggle, search
 * input, then 4 result cards. Each card has a cover thumbnail + book meta
 * row + snippet lines, matching the client's own in-page loading skeleton.
 */
export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <header className="mb-6 space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </header>

      <span className="sr-only">در حال بارگذاری جستجو…</span>

      {/* Search input + language toggle */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-11 flex-1 rounded-md" />
        <Skeleton className="h-11 w-40 rounded-md" />
      </div>

      {/* Result cards */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-border/60"
          >
            {/* Book meta row */}
            <div className="flex items-center gap-3 border-b border-border/50 bg-muted/30 p-3">
              <Skeleton className="h-16 w-12 shrink-0 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
            {/* Snippet lines */}
            <div className="space-y-2 p-4">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
