import { Skeleton } from '@/components/ui/skeleton'
import { LibrarySkeleton } from '@/components/library/library-skeleton'

export default function LibraryLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Hero header skeleton */}
      <header className="relative mb-8 space-y-3 overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-6 sm:p-8">
        <div className="space-y-3">
          <Skeleton className="h-6 w-40 rounded-full" />
          <Skeleton className="h-9 w-48 sm:w-64" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
      </header>

      {/* Top Trending Skeleton */}
      <section className="mb-10 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-full rounded-2xl" />
          ))}
        </div>
      </section>

      {/* Filter bar skeleton */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-10 w-full max-w-md rounded-xl sm:w-72" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Book Grid Skeleton */}
      <LibrarySkeleton count={10} view="grid" />
    </div>
  )
}
