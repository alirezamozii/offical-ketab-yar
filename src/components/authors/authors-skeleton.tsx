import { Skeleton } from '@/components/ui/skeleton'

export function AuthorsDirectorySkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-8" aria-hidden="true">
      <span className="sr-only">در حال بارگذاری فهرست نویسندگان…</span>

      {/* Header Skeleton */}
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-6 sm:p-8">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative space-y-3">
          <Skeleton className="h-8 w-44 rounded-full" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-full max-w-3xl" />
          <Skeleton className="h-4 w-5/6 max-w-2xl" />
        </div>
      </header>

      {/* Filter row Skeleton */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-64 rounded-md" />
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        <Skeleton className="ms-auto h-9 w-40 rounded-md" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <AuthorCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

function AuthorCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-24" />
          <div className="flex gap-1.5 pt-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
        <Skeleton className="h-8 w-36 rounded-md" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
}

export default AuthorsDirectorySkeleton
