'use client'

import { BookCard } from '@/components/books/book-card'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { Flame, TrendingUp } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import type { BookListItem } from '@/lib/data'

/**
 * TopTrending — moved here from the (now-deleted) Discovery page.
 *
 * Renders a ranked list of the top 10 most-read books with:
 *   • Pastel color palette per the user's feedback (soft, not garish)
 *   • Persian-numeral rank badges with a Flame accent on the top 3
 *   • A proper "trending" icon (TrendingUp) — not the old irrelevant one
 *   • Dynamic data — books come from the server, sorted by viewCount
 *
 * Lives at the top of the Library page so users see what's popular
 * before browsing the full catalog.
 */
export function TopTrending({ books }: { books: BookListItem[] }) {
  const reduceMotion = useReducedMotion()
  const { formatNumber } = usePersianLocale()

  if (!books || books.length === 0) return null

  // Pastel palette — soft, warm. Each rank gets a slightly different
  // pastel accent for visual variety without leaving the brand feel.
  const PASTEL = [
    'from-rose-200/60 to-rose-300/40 text-rose-700 dark:text-rose-300',
    'from-amber-200/60 to-amber-300/40 text-amber-700 dark:text-amber-300',
    'from-orange-200/60 to-orange-300/40 text-orange-700 dark:text-orange-300',
    'from-yellow-200/60 to-yellow-300/40 text-yellow-700 dark:text-yellow-300',
    'from-lime-200/60 to-lime-300/40 text-lime-700 dark:text-lime-300',
    'from-emerald-200/60 to-emerald-300/40 text-emerald-700 dark:text-emerald-300',
    'from-teal-200/60 to-teal-300/40 text-teal-700 dark:text-teal-300',
    'from-cyan-200/60 to-cyan-300/40 text-cyan-700 dark:text-cyan-300',
    // Sky/violet pastels replaced with gold/beige per color-discipline audit.
    'from-gold-200/60 to-gold-300/40 text-gold-700 dark:text-gold-300',
    'from-gold-300/60 to-gold-400/40 text-gold-800 dark:text-gold-400',
  ]

  return (
    <section
      aria-labelledby="top-trending-title"
      className="mb-8 space-y-4"
    >
      {/* Header — proper trending icon (TrendingUp) per user feedback */}
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

      {/* Horizontal scroll carousel with rank badges */}
      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="flex gap-4 snap-x snap-mandatory">
          {books.slice(0, 10).map((b, i) => {
            const rank = i + 1
            const isHot = rank <= 3
            const pastel = PASTEL[i % PASTEL.length]
            return (
              <motion.div
                key={b.id}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="relative w-[44%] shrink-0 snap-start sm:w-[31%] md:w-[23%] lg:w-[18.5%] xl:w-[15.5%]"
              >
                {/* Rank badge — pastel background with Persian numeral */}
                <div
                  className={`absolute -start-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${pastel} text-base font-extrabold shadow-md ring-2 ring-background`}
                  aria-label={`رتبه ${formatNumber(rank)}`}
                >
                  {formatNumber(rank)}
                </div>
                {/* Hot badge for top 3 */}
                {isHot && (
                  <div className="absolute -end-1 top-2 z-20 flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                    <Flame className="h-3 w-3" />
                    داغ
                  </div>
                )}
                <BookCard book={b} />
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
