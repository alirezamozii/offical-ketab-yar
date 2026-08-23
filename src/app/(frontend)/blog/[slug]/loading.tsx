import { Skeleton } from '@/components/ui/skeleton'

export default function BlogPostLoading() {
  return (
    <article className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      {/* Breadcrumb skeleton */}
      <div className="mb-6 flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Back button */}
      <Skeleton className="mb-6 h-8 w-28 rounded-md" />

      {/* Article Header Skeleton */}
      <header className="space-y-5 pb-8">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-9 w-full max-w-xl" />
        <Skeleton className="h-5 w-3/4" />

        {/* Cover image skeleton */}
        <Skeleton className="aspect-video w-full rounded-2xl" />

        {/* Byline skeleton */}
        <div className="flex items-center justify-between border-y border-border/60 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </header>

      {/* Article Prose Body Skeleton */}
      <div className="space-y-4 pt-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-6 w-1/3 mt-6 mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-24 w-full rounded-xl mt-4" />
      </div>

      {/* Related posts skeleton */}
      <div className="mt-12 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </article>
  )
}
