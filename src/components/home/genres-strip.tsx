import { GenreCard } from '@/components/library/genre-card'
import { SectionHeader } from '@/components/layout/section-header'
import { LazyReveal } from '@/components/home/lazy-reveal'
import { db, safeQuery } from '@/lib/db'
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

async function getTopGenres() {
  const books = await safeQuery(
    () =>
      db.book.findMany({
        select: { genres: true, viewCount: true },
      }),
    [],
    250,
  )
  const map = new Map<string, { count: number; views: number }>()
  for (const b of books) {
    for (const g of parseGenres(b.genres)) {
      const cur = map.get(g) || { count: 0, views: 0 }
      cur.count += 1
      cur.views += b.viewCount
      map.set(g, cur)
    }
  }
  return Array.from(map.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
}

export async function GenresStrip() {
  let genres: { name: string; count: number; views: number }[] = []
  try {
    genres = await getTopGenres()
  } catch {
    console.warn('[GenresStrip] DB offline or query skipped.')
    return null
  }

  if (genres.length === 0) return null

  return (
    <LazyReveal>
      <section className="mx-auto max-w-7xl px-3.5 py-6 sm:px-6 sm:py-12">
        <SectionHeader
          icon={Compass}
          title="بر اساس موضوع"
          subtitle="کتابی متناسب با سلیقه‌تان پیدا کنید"
          action={
            <Link
              href="/library/genres"
              prefetch={false}
              className="group/more inline-flex items-center gap-0.5 text-xs font-semibold text-gold-700 hover:text-gold-800 dark:text-gold-400 dark:hover:text-gold-300 sm:text-sm"
              aria-label="همه ژانرها — مرور کامل موضوعات"
            >
              <span>همه ژانرها</span>
              <ChevronLeft className="h-3.5 w-3.5 transition-transform duration-300 ease-out-expo group-hover/more:-translate-x-1 sm:h-4 sm:w-4" />
            </Link>
          }
        />
        <div className="scroll-x-mobile flex snap-x snap-mandatory gap-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:snap-none sm:overflow-visible lg:grid-cols-4">
          {genres.map((g, i) => (
            <div
              key={g.name}
              className="group/genre w-[58%] shrink-0 snap-start motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out-expo motion-safe:hover:scale-[1.03] motion-safe:hover:saturate-150 sm:w-auto sm:shrink sm:hover:scale-105"
            >
              <GenreCard genre={g} index={i} />
            </div>
          ))}
        </div>
        <div
          aria-hidden="true"
          className="mt-3 flex items-center justify-center gap-2 text-[11px] text-muted-foreground sm:hidden"
        >
          <span className="inline-block h-1 w-6 rounded-full bg-gold-400/50" />
          برای دیدن ژانرهای بیشتر بکشید
          <ChevronLeft className="h-3 w-3" />
        </div>
      </section>
    </LazyReveal>
  )
}
