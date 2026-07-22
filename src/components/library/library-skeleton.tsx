import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * Card-shaped shimmer skeleton that mirrors the real BookCard layout
 * (cover → title → author → chips). Used by the library page suspense
 * fallback and by the client-side filter-loading state.
 */
export function LibrarySkeleton({
  count = 8,
  view = 'grid',
}: {
  count?: number
  view?: 'grid' | 'list'
}) {
  if (view === 'list') {
    return (
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: count }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    )
  }
  return (
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <GridCardSkeleton key={i} />
      ))}
    </div>
  )
}

function GridCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-border/70 bg-card shadow-sm">
      <Skeleton className="aspect-[2/3] w-full rounded-none" />
      <div className="space-y-2.5 border-t-2 border-border/50 p-4">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
        <div className="flex gap-1.5 pt-0.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
    </div>
  )
}

function ListRowSkeleton() {
  return (
    <div className="flex gap-4 rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
      <Skeleton className="aspect-[2/3] w-20 shrink-0 rounded-lg sm:w-24" />
      <div className="flex-1 space-y-2.5 py-1">
        <Skeleton className="h-4 w-1/2 rounded" />
        <Skeleton className="h-3 w-1/3 rounded" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-10 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="hidden h-3 w-2/3 rounded sm:block" />
      </div>
      <div className="hidden shrink-0 self-center sm:block">
        <Skeleton className={cn('h-9 w-28 rounded-md')} />
      </div>
    </div>
  )
}
