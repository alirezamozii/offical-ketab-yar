import { GenreCard } from '@/components/library/genre-card'
import { SectionHeader } from '@/components/layout/section-header'
import { LazyReveal } from '@/components/home/lazy-reveal'
import { db } from '@/lib/db'
import Link from 'next/link'
import { ChevronLeft, Compass } from 'lucide-react'

function parseGenres(raw: string): string[] {
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.map(String) : []
  } catch {
    return []
  }
}

export async function GenresStrip() {
  const books = await db.book.findMany({
    select: { genres: true, viewCount: true },
  })
  const map = new Map<string, { count: number; views: number }>()
  for (const b of books) {
    for (const g of parseGenres(b.genres)) {
      const cur = map.get(g) || { count: 0, views: 0 }
      cur.count += 1
      cur.views += b.viewCount
      map.set(g, cur)
    }
  }
  const genres = Array.from(map.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  if (genres.length === 0) return null

  return (
    <LazyReveal>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <SectionHeader
          icon={Compass}
          title="بر اساس موضوع"
          subtitle="کتابی متناسب با سلیقه‌تان پیدا کنید"
          action={
            <Link
              href="/library/genres"
              className="group/more hidden items-center text-sm font-medium text-primary hover:underline sm:inline-flex"
              aria-label="همه ژانرها — مرور کامل موضوعات"
            >
              همه ژانرها
              <ChevronLeft className="h-4 w-4 transition-transform duration-300 ease-out-expo group-hover/more:-translate-x-1" />
            </Link>
          }
        />
        {/* Mobile: horizontally scrollable strip with snap.
            Desktop (sm+): responsive grid. */}
        <div className="scroll-x-mobile flex snap-x snap-mandatory gap-4 sm:grid sm:grid-cols-3 sm:snap-none sm:overflow-visible lg:grid-cols-4">
          {genres.map((g, i) => (
            <div
              key={g.name}
              className="group/genre w-[68%] shrink-0 snap-start motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out-expo motion-safe:hover:scale-[1.03] motion-safe:hover:saturate-150 sm:w-auto sm:shrink sm:hover:scale-105"
            >
              <GenreCard genre={g} index={i} />
            </div>
          ))}
        </div>
        {/* Mobile-only "swipe for more" hint — fades after the user
            has scrolled. Hidden on desktop where the grid is shown. */}
        <div
          aria-hidden="true"
          className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground sm:hidden"
        >
          <span className="inline-block h-1 w-8 rounded-full bg-gold-400/50" />
          برای دیدن ژانرهای بیشتر بکشید
          <ChevronLeft className="h-3.5 w-3.5" />
        </div>
      </section>
    </LazyReveal>
  )
}
