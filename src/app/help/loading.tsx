import { Skeleton } from '@/components/ui/skeleton'

/**
 * Help-page loading skeleton — mirrors `help/page.tsx`: centered header
 * (icon tile + title + paragraph), then an Accordion list of 6 FAQ items,
 * then a centered "تماس با پشتیبانی" button.
 */
export default function HelpLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {/* sr-only announcement */}
      <span className="sr-only">در حال بارگذاری سوالات متداول…</span>

      {/* Header */}
      <header className="mb-8 space-y-3 text-center">
        <Skeleton className="mx-auto h-14 w-14 rounded-2xl" />
        <Skeleton className="mx-auto h-9 w-44" />
        <Skeleton className="mx-auto h-4 w-72 max-w-full" />
      </header>

      {/* FAQ accordion items */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card px-4 shadow-sm"
          >
            <div className="flex items-center justify-between py-4">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Support CTA */}
      <div className="mt-10 flex justify-center">
        <Skeleton className="h-10 w-48 rounded-md" />
      </div>
    </div>
  )
}
