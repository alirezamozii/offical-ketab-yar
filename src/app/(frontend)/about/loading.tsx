import { Skeleton } from '@/components/ui/skeleton'

/**
 * About-page loading skeleton — mirrors `about/page.tsx`: centered header
 * (gradient icon tile + title + paragraph), a 2-column grid of 4 feature
 * cards, then a centered CTA button.
 */
export default function AboutLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="space-y-8">
        {/* sr-only announcement */}
        <span className="sr-only">در حال بارگذاری درباره کتاب‌یار…</span>

        {/* Centered header */}
        <header className="space-y-3 text-center">
          <Skeleton className="mx-auto h-14 w-14 rounded-2xl" />
          <Skeleton className="mx-auto h-9 w-48" />
          <Skeleton className="mx-auto h-4 w-full max-w-xl" />
          <Skeleton className="mx-auto h-4 w-3/4 max-w-xl" />
        </header>

        {/* Feature cards grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
            >
              <Skeleton className="mb-3 h-7 w-7 rounded-md" />
              <Skeleton className="mb-1.5 h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-1.5 h-4 w-5/6" />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <Skeleton className="h-12 w-40 rounded-md" />
        </div>
      </div>
    </div>
  )
}
