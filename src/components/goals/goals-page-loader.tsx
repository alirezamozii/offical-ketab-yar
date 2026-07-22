'use client'

/**
 * Thin client-side loader that code-splits `GoalsPageClient` via
 * `next/dynamic`. This file exists ONLY because Next.js 16 forbids
 * `ssr: false` inside Server Components — the parent `/goals/page.tsx`
 * is a server component (it exports `metadata`), so the `dynamic` call
 * has to live in a 'use client' boundary.
 *
 * Why code-split: `goals-page-client.tsx` imports recharts (~500KB)
 * for the goal-tracking charts. Wrapping it with `ssr: false` keeps
 * recharts out of the initial JS bundle for users who never visit
 * /goals; the chart chunk is fetched on demand when they do.
 *
 * The skeleton mirrors the page shell's centered max-width layout so
 * there's no visible layout shift while the chunk loads.
 */
import dynamic from 'next/dynamic'

const GoalsPageClient = dynamic(
  () => import('./goals-page-client').then((m) => m.GoalsPageClient),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-7xl animate-pulse space-y-6 px-4 py-8 sm:px-6">
        <div className="h-10 w-1/3 rounded-xl bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-muted" />
      </div>
    ),
  },
)

export function GoalsPageLoader() {
  return <GoalsPageClient />
}
