'use client'

import { BookCover } from '@/components/books/book-cover'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { motion, useReducedMotion } from 'framer-motion'
import { BookOpen, ChevronLeft, Clock, FileText, Play } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { BookListItem } from '@/lib/data'
import { getLocalProgress, type ProgressEntry } from '@/hooks/reader/use-local-progress'
import { usePersianLocale } from '@/hooks/use-persian-locale'

export function ResumeCard() {
  const [book, setBook] = useState<BookListItem | null>(null)
  const [progress, setProgress] = useState<ProgressEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const reduceMotion = useReducedMotion()
  const { toPersianDigits } = usePersianLocale()

  useEffect(() => {
    const map = getLocalProgress()
    // find the most-recently-read book that isn't finished
    const entries = Object.entries(map)
      .filter(([, p]) => p.percent > 0 && p.percent < 100)
      .sort(([, a], [, b]) => b.ts - a.ts)
    if (entries.length === 0) {
      setLoading(false)
      return
    }
    const [slug, p] = entries[0]
    setProgress(p)
    fetch(`/api/books?slugs=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: BookListItem[]) => {
        if (data.length > 0) setBook(data[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <Skeleton className="h-40 w-full rounded-3xl" />
  }

  if (!book || !progress) {
    return null
  }

  const remainingPages = Math.max(0, progress.totalPages - progress.currentPage)
  const remainingMinutes = Math.max(1, Math.round(remainingPages * 1.5))
  const circ = 2 * Math.PI * 28 // ~176 — matches the r=28 circle
  const dashOffset = circ * (1 - progress.percent / 100)

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      transition={{ type: 'spring', stiffness: 250, damping: 22 }}
      className="group relative overflow-hidden rounded-3xl border-2 border-gold-400/40 bg-gradient-to-br from-gold-500/10 via-card to-gold-700/5 p-5 shadow-sm transition-shadow hover:shadow-lg hover:shadow-gold-500/10 sm:p-6"
      aria-label="ادامه مطالعه کتاب در حال خواندن"
    >
      {/* ambient gold halos */}
      <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-gold-500/15 blur-3xl transition-opacity duration-500 group-hover:bg-gold-500/25" />
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-gold-700/10 blur-3xl" />
      {/* gilded top hairline */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold-500/60 to-transparent"
        aria-hidden
      />

      <div className="relative flex items-center gap-5">
        {/* Cover */}
        <motion.div
          whileHover={reduceMotion ? undefined : { rotate: -2, scale: 1.03 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className="h-28 w-20 shrink-0 overflow-hidden rounded-lg shadow-lg sm:h-32 sm:w-24"
        >
          <BookCover
            title={book.title}
            author={book.author}
            from={book.coverFrom}
            to={book.coverTo}
            accent={book.coverAccent}
            size="sm"
          />
        </motion.div>

        {/* Info + CTA */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Play className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
            <span className="text-xs font-bold uppercase tracking-wide text-gold-700 dark:text-gold-400">
              ادامه مطالعه
            </span>
          </div>
          <h2 className="truncate text-lg font-extrabold sm:text-xl" dir="ltr">
            {book.title}
          </h2>
          <p className="truncate text-sm text-muted-foreground">{book.author}</p>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                صفحه {toPersianDigits(progress.currentPage + 1)} از{' '}
                {toPersianDigits(progress.totalPages)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {toPersianDigits(remainingPages)} صفحه باقی‌مانده · ~
                {toPersianDigits(remainingMinutes)} دقیقه
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                {/* shimmer streak (disabled under reduced motion) */}
                {!reduceMotion && (
                  <motion.div
                    className="absolute inset-y-0 -left-1/3 w-1/3 bg-white/30 blur-sm"
                    initial={{ x: '-100%' }}
                    animate={{ x: '400%' }}
                    transition={{
                      duration: 2.2,
                      ease: 'easeInOut',
                      repeat: Infinity,
                      repeatDelay: 0.6,
                    }}
                    aria-hidden
                  />
                )}
              </motion.div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="glow" size="sm" className="gap-2">
              <Link
                href={`/books/read/${book.slug}`}
                aria-label={`ادامه مطالعه ${book.title} از صفحه ${progress.currentPage + 1}`}
              >
                <BookOpen className="h-4 w-4" />
                ادامه از صفحه {toPersianDigits(progress.currentPage + 1)}
                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/books/${book.slug}`}>جزئیات</Link>
            </Button>
          </div>
        </div>

        {/* Percentage ring with gold gradient (desktop) */}
        <div className="hidden shrink-0 items-center justify-center sm:flex">
          <div className="relative h-16 w-16">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64" aria-hidden>
              <defs>
                <linearGradient id="resumeRing" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="hsl(38 75% 60%)" />
                  <stop offset="100%" stopColor="hsl(28 70% 45%)" />
                </linearGradient>
              </defs>
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                strokeWidth="5"
                className="stroke-muted"
              />
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                stroke="url(#resumeRing)"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  filter: 'drop-shadow(0 0 4px hsl(38 70% 55% / 0.4))',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-extrabold text-gold-600 dark:text-gold-400">
                {toPersianDigits(progress.percent)}٪
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
