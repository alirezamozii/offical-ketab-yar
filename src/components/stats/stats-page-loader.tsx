'use client'

/**
 * Thin client-side loader that code-splits `StatsPageClient` via
 * `next/dynamic`. This file exists ONLY because Next.js 16 forbids
 * `ssr: false` inside Server Components — the parent `/stats/page.tsx`
 * is a server component (it exports `metadata`), so the `dynamic` call
 * has to live in a 'use client' boundary.
 *
 * Why code-split: `stats-page-client.tsx` imports recharts (~500KB)
 * for the Year-in-Review charts. Wrapping it with `ssr: false` keeps
 * recharts out of the initial JS bundle for users who never visit
 * /stats; the chart chunk is fetched on demand when they do.
 *
 * The skeleton mirrors the page shell's centered max-width layout so
 * there's no visible layout shift while the chunk loads.
 */
import dynamic from 'next/dynamic'

const StatsPageClient = dynamic(
  () => import('./stats-page-client').then((m) => m.StatsPageClient),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-7xl animate-pulse space-y-6 px-4 py-8 sm:px-6">
        <div className="h-10 w-1/3 rounded-xl bg-muted" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-muted" />
      </div>
    ),
  },
)

export function StatsPageLoader() {
  return <StatsPageClient />
}
