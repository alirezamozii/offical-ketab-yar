import { Skeleton } from '@/components/ui/skeleton'

/**
 * Detail page loading skeleton — mirrors the layout of `page.tsx` so the
 * hydration transition is layout-stable: breadcrumb → hero (cover + meta) →
 * preview → reviews header + distribution + 4 cards → 4 related cards.
 */
export default function BookDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Breadcrumb */}
      <div className="mb-5 flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Hero */}
      <div className="grid gap-8 md:grid-cols-[280px_1fr] lg:gap-12">
        {/* Cover */}
        <div className="mx-auto w-full max-w-[280px]">
          <Skeleton className="aspect-[2/3] w-full rounded-2xl" />
        </div>

        {/* Meta */}
        <div className="space-y-5">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>

          {/* Title + author */}
          <div className="space-y-2">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </div>
            ))}
          </div>

          {/* Separator */}
          <Skeleton className="h-px w-full" />

          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* CTA */}
          <Skeleton className="h-14 w-full rounded-xl" />

          {/* Share */}
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>
      </div>

      {/* Preview section */}
      <div className="mt-10">
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>

      {/* Reviews */}
      <div className="mt-14">
        <div className="mb-5 flex items-center justify-between">
          <Skeleton className="h-7 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>

        {/* Distribution + sort */}
        <div className="mb-5 rounded-2xl border border-border/60 bg-card/60 p-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-6">
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-2 flex-1 rounded-full" />
                  <Skeleton className="h-4 w-10" />
                </div>
              ))}
            </div>
            <Skeleton className="h-8 w-44 rounded-md" />
          </div>
        </div>

        {/* Review cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Related */}
      <div className="mt-14">
        <Skeleton className="mb-5 h-7 w-40" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
