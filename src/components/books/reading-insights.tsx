'use client'

/**
 * src/components/books/reading-insights.tsx
 * ---------------------------------------------------------------
 * A compact stats strip shown on the book detail page that gives
 * readers quick context before they start:
 *   - Total views (popularity)
 *   - Estimated reading time (already computed in the page)
 *   - CEFR difficulty level (visual chip)
 *   - Pages count
 *   - Reviews count
 *
 * Each stat has an icon, a Persian label, and a value. The strip
 * uses a subtle gold-tinted card with hover lift on each stat.
 *
 * Owner: CRON-REVIEW-202607171310
 * ---------------------------------------------------------------
 */

import { motion, useReducedMotion } from 'framer-motion'
import { BookOpen, Clock, Eye, FileText, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReadingInsightsProps {
  viewCount: number
  pageCount: number
  readingTimeMinutes: number
  reviewCount: number
  averageRating: number
}

interface StatItem {
  icon: typeof BookOpen
  label: string
  value: string
  sub?: string
  /** Tailwind gradient for the icon badge — warm-earth palette only. */
  iconBg: string
}

function toPersian(n: number): string {
  return n.toLocaleString('fa-IR')
}

function formatReadingTime(minutes: number): string {
  if (minutes < 60) return `${toPersian(minutes)} دقیقه`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${toPersian(hours)} ساعت`
  return `${toPersian(hours)} ساعت و ${toPersian(mins)} دقیقه`
}

function formatViewCount(views: number): string {
  if (views >= 1_000_000) return `${toPersian(Math.floor(views / 100_000) / 10)}M`
  if (views >= 10_000) return `${toPersian(Math.floor(views / 1000))}K`
  return toPersian(views)
}

export function ReadingInsights({
  viewCount,
  pageCount,
  readingTimeMinutes,
  reviewCount,
  averageRating,
}: ReadingInsightsProps) {
  const reduceMotion = useReducedMotion()

  const stats: StatItem[] = [
    {
      icon: Eye,
      label: 'بازدید',
      value: formatViewCount(viewCount),
      sub: viewCount >= 1000 ? 'خواننده' : undefined,
      iconBg: 'from-amber-500/20 to-gold-700/10 text-amber-700 dark:text-amber-400',
    },
    {
      icon: Clock,
      label: 'زمان مطالعه',
      value: formatReadingTime(readingTimeMinutes),
      sub: 'تقریبی',
      iconBg: 'from-teal-500/20 to-gold-700/10 text-teal-700 dark:text-teal-400',
    },
    {
      icon: FileText,
      label: 'تعداد صفحات',
      value: `${toPersian(pageCount)} صفحه`,
      iconBg: 'from-gold-500/20 to-gold-700/10 text-gold-700 dark:text-gold-400',
    },
    {
      icon: Star,
      label: 'امتیاز',
      value: averageRating > 0 ? toPersian(Number(averageRating.toFixed(1))) : '—',
      sub: reviewCount > 0 ? `${toPersian(reviewCount)} نظر` : 'بدون نظر',
      iconBg: 'from-amber-400/20 to-orange-600/10 text-amber-700 dark:text-amber-400',
    },
  ]

  return (
    <section aria-label="آمار کتاب">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{
                duration: 0.4,
                delay: i * 0.07,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={reduceMotion ? undefined : { y: -2 }}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-3 transition-colors hover:border-gold-500/40 hover:bg-gold-500/5 sm:p-4"
            >
              {/* Top hairline accent */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold-500/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
              />

              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br sm:h-10 sm:w-10',
                    stat.iconBg,
                  )}
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-extrabold leading-tight tabular-nums text-foreground sm:text-lg">
                    {stat.value}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground sm:text-xs">
                    {stat.label}
                    {stat.sub && (
                      <span className="opacity-60"> · {stat.sub}</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Reading difficulty hint */}
      <motion.p
        initial={reduceMotion ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <BookOpen className="h-3.5 w-3.5 shrink-0 text-gold-600 dark:text-gold-400" aria-hidden="true" />
        <span>
          {readingTimeMinutes > 180
            ? 'این کتاب طولانی است — پیشنهاد می‌شود در چند جلسه بخوانید.'
            : readingTimeMinutes > 60
              ? 'زمان مطالعه متوسط — در یک یا دو جلسه قابل completion.'
              : 'کتاب کوتاه — در یک نشست قابل خواندن.'}
        </span>
      </motion.p>
    </section>
  )
}
