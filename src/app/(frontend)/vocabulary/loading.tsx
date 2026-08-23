import { Skeleton } from '@/components/ui/skeleton'

/**
 * Vocabulary loading skeleton — mirrors `vocabulary/page.tsx` +
 * `VocabularyClient`: page header (title + paragraph), add-word + search
 * input row, stats card, tabs + action-buttons row, then a 2-column grid of
 * word cards.
 */
export default function VocabularyLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <header className="mb-8 space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-3/4 max-w-2xl" />
      </header>

      <span className="sr-only">در حال بارگذاری واژگان…</span>

      <div className="space-y-6">
        {/* Add-word + search row */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-64 rounded-md" />
        </div>

        {/* Stats card */}
        <Skeleton className="h-28 w-full rounded-2xl" />

        {/* Tabs + action buttons */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Skeleton className="h-10 w-full max-w-md rounded-xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-md" />
            ))}
          </div>
        </div>

        {/* Word cards grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
