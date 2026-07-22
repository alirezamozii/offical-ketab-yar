import { Skeleton } from '@/components/ui/skeleton'

/**
 * /settings branded loading skeleton — mirrors the sidebar + content
 * layout so the page feels like it's "filling in" rather than spinning.
 * Uses gold/amber accents on dark card surfaces to stay on-brand.
 */
export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <span className="sr-only">در حال بارگذاری تنظیمات…</span>

      {/* Header */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="space-y-2 rounded-2xl border border-border/60 bg-card/60 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </aside>

        {/* Mobile tabs */}
        <div className="lg:hidden">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* Content */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="space-y-3 rounded-2xl border border-border/60 bg-card/60 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
