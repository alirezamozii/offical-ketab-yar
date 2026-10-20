import { BookCard } from '@/components/books/book-card'
import { TrendingUp } from 'lucide-react'
import type { BookListItem } from '@/lib/data'

/**
 * TopTrending — renders the top 10 most-read books.
 * Clean covers without badges or number overlays per user feedback.
 */
export function TopTrending({ books }: { books: BookListItem[] }) {
  if (!books || books.length === 0) return null

  return (
    <section
      aria-labelledby="top-trending-title"
      className=" mb-8 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400/30 to-gold-600/20 text-gold-700 dark:text-gold-300">
          <TrendingUp className="h-5 w-5" />
        </span>
        <div>
          <h2
            id="top-trending-title"
            className="text-xl font-bold tracking-tight sm:text-2xl"
          >
            محبوب‌ترین‌ها
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            ۱۰ کتابی که این هفته بیشتر خوانده شده‌اند
          </p>
        </div>
      </div>

      {/* Horizontal scroll carousel */}
      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="flex gap-4 snap-x snap-mandatory">
          {books.slice(0, 10).map((b) => (
            <div
              key={b.id}
              className=" relative w-[44%] shrink-0 snap-start sm:w-[31%] md:w-[23%] lg:w-[18.5%] xl:w-[15.5%]"
            >
              <BookCard book={b} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
