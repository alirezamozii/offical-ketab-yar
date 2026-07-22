import { BookCover } from '@/components/books/book-cover'
import { Button } from '@/components/ui/button'
import { getBooks, type BookListItem } from '@/lib/data'
import { toPersianDigits } from '@/lib/typography'
import { BookOpen, CalendarDays, Clock, Sparkles, Star } from 'lucide-react'
import Link from 'next/link'

/**
 * BookOfTheDay — a curated daily book recommendation on the home page.
 *
 * Picks a book deterministically based on the current date (so every visitor
 * sees the same "book of the day" — creates a shared experience). Rotates
 * daily through the published catalog.
 *
 * Design: a premium gold-accented card with the book cover on the right
 * (RTL), the title/author/description on the left, and a prominent
 * "شروع مطالعه" CTA. Includes a "کتاب روز" badge with a calendar icon.
 */

function readingTimeEstimate(pageCount: number): string {
  const minutes = Math.max(1, Math.round(pageCount * 3))
  if (minutes < 60) return `حدود ${toPersianDigits(minutes)} دقیقه`
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  if (rem === 0) return `حدود ${toPersianDigits(hours)} ساعت`
  return `حدود ${toPersianDigits(hours)} ساعت و ${toPersianDigits(rem)} دقیقه`
}

/** Deterministic daily index based on the YYYY-MM-DD date string. */
function dailyIndex(total: number): number {
  if (total === 0) return 0
  const now = new Date()
  const dateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
  // Simple deterministic hash → stable per day, varies across days.
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % total
}

export async function BookOfTheDay() {
  const books = await getBooks()
  if (books.length === 0) return null

  const book: BookListItem = books[dailyIndex(books.length)]

  return (
    <section className="relative overflow-hidden border-y border-gold-500/20 bg-gradient-to-br from-gold-50/80 via-card to-gold-100/40 dark:from-gold-900/10 dark:via-card dark:to-gold-800/5">
      {/* Ambient gold glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 left-1/4 h-64 w-64 rounded-full bg-gold-500/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 right-1/4 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Section header */}
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-700 text-white shadow-md shadow-gold-600/30">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h2 className="flex items-center gap-1.5 text-lg font-extrabold text-foreground sm:text-xl">
              کتاب روز
              <Sparkles className="h-4 w-4 text-gold-500" />
            </h2>
            <p className="text-xs text-muted-foreground">
              پیشنهاد ویژه کتاب‌یار برای امروز
            </p>
          </div>
        </div>

        {/* Book card */}
        <div className="grid gap-6 rounded-2xl border border-gold-500/20 bg-card/80 p-5 backdrop-blur-sm sm:grid-cols-[140px_1fr] sm:p-6 lg:grid-cols-[180px_1fr]">
          {/* Cover (RTL: right side) */}
          <div className="mx-auto w-full max-w-[180px]">
            <div className="aspect-[2/3] overflow-hidden rounded-xl shadow-xl shadow-gold-500/20 ring-1 ring-border transition-transform duration-500 ease-out-expo hover:-translate-y-1 hover:rotate-1">
              <BookCover
                title={book.title}
                author={book.author}
                from={book.coverFrom}
                to={book.coverTo}
                accent={book.coverAccent}
                size="md"
              />
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2.5 py-0.5 text-xs font-semibold text-gold-800 dark:text-gold-300">
                  سطح {book.level}
                </span>
                {book.genres.slice(0, 2).map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-border/60 bg-background/50 px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {g}
                  </span>
                ))}
              </div>

              <div>
                <h3
                  className="text-xl font-extrabold leading-tight tracking-tight text-foreground sm:text-2xl"
                  dir="ltr"
                >
                  {book.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {book.author}
                </p>
              </div>

              {/* Quick stats */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
                  {book.rating.toFixed(1)}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {toPersianDigits(book.pageCount)} صفحه
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {readingTimeEstimate(book.pageCount)}
                </span>
              </div>

              {/* Description */}
              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {book.description}
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="glow" size="sm" className="gap-1.5">
                <Link href={`/books/read/${book.slug}`}>
                  <BookOpen className="h-4 w-4" />
                  شروع مطالعه
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/books/${book.slug}`}>جزئیات بیشتر</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
