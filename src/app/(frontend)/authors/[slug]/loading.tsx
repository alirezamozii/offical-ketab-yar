import { Skeleton } from '@/components/ui/skeleton'

export default function AuthorDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Breadcrumb skeleton */}
      <div className="mb-6 flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Author Hero Skeleton */}
      <header className="relative overflow-hidden rounded-3xl border border-gold-400/20 bg-card p-6 sm:p-10 shadow-xl space-y-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Skeleton className="h-32 w-32 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-48 sm:w-64" />
              <Skeleton className="h-7 w-28" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        </div>

        <Skeleton className="h-16 w-full max-w-3xl rounded-xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />

        <div className="flex justify-between border-t border-border/40 pt-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </header>

      {/* Books Section Skeleton */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-full rounded-2xl" />
          ))}
        </div>
      </section>

      {/* Related Authors Section Skeleton */}
      <section className="mt-12 border-t border-border/60 pt-8">
        <Skeleton className="mb-4 h-6 w-52" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </section>
    </div>
  )
}
