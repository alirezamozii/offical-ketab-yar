import { Skeleton } from '@/components/ui/skeleton'

export default function ReaderLoading() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Reader Top Toolbar Skeleton */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-card px-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32 sm:w-48" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </header>

      {/* Reader Dual Content Skeleton */}
      <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Chapter title skeleton */}
          <div className="space-y-2 text-center">
            <Skeleton className="mx-auto h-8 w-64" />
            <Skeleton className="mx-auto h-4 w-40" />
          </div>

          {/* Bilingual paragraph blocks */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid gap-4 rounded-2xl border border-border/40 bg-card/40 p-5 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <div className="space-y-2" dir="rtl">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Reader Bottom Navigation Bar Skeleton */}
      <footer className="flex h-16 shrink-0 items-center justify-between border-t border-border/60 bg-card px-4 sm:px-8">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
        <Skeleton className="h-10 w-24 rounded-xl" />
      </footer>
    </div>
  )
}
