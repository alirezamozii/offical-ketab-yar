'use client'

/**
 * src/components/books/reading-progress-card.tsx
 * ---------------------------------------------------------------
 * In-page reading progress card shown on the book detail page for
 * books the user has started reading (percent > 0). Shows:
 *   - Circular progress ring (SVG) with percent in the center
 *   - Current page / total pages
 *   - "ادامه مطالعه" (Continue reading) CTA
 *   - "شروع از اول" (Start over) secondary action
 *
 * Hidden for books the user hasn't started (percent === 0) — the
 * regular "شروع مطالعه" CTA in the hero handles that case.
 *
 * Owner: CRON-REVIEW-202607171346
 * ---------------------------------------------------------------
 */

import { motion, useReducedMotion } from 'framer-motion'
import { BookOpen, CheckCircle2, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getLocalProgress } from '@/hooks/reader/use-local-progress'
import { toPersianDigits } from '@/lib/typography'
import { Button } from '@/components/ui/button'

interface ReadingProgressCardProps {
  bookSlug: string
  totalPages: number
}

export function ReadingProgressCard({
  bookSlug,
  totalPages,
}: ReadingProgressCardProps) {
  const reduceMotion = useReducedMotion()
  const [percent, setPercent] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const map = getLocalProgress()
    const entry = map[bookSlug]
    if (entry) {
      setPercent(entry.percent)
      setCurrentPage(entry.currentPage || 0)
    }
    setMounted(true)
  }, [bookSlug])

  // Don't render until mounted (avoids hydration mismatch)
  if (!mounted) return null

  // Don't render for books not started
  if (percent === 0) return null

  const isCompleted = percent >= 100
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const strokeOffset = circumference - (percent / 100) * circumference

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-gold-500/30 bg-gradient-to-br from-gold-500/10 via-card to-card p-5 shadow-sm sm:p-6"
      aria-label="پیشرفت مطالعه"
    >
      {/* Decorative glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gold-500/10 blur-2xl"
      />

      <div className="relative flex items-center gap-5">
        {/* Circular progress ring */}
        <div className="relative h-20 w-20 shrink-0">
          <svg
            className="h-full w-full -rotate-90"
            viewBox="0 0 64 64"
            aria-hidden="true"
          >
            {/* Background ring */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              className="text-border/60"
            />
            {/* Progress ring */}
            <motion.circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={reduceMotion ? false : { strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: strokeOffset }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f4d35e" />
                <stop offset="100%" stopColor="#b8956a" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isCompleted ? (
              <CheckCircle2 className="h-7 w-7 text-emerald-500" aria-hidden="true" />
            ) : (
              <>
                <span className="text-lg font-extrabold tabular-nums text-gold-700 dark:text-gold-400">
                  {toPersianDigits(percent)}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground">٪</span>
              </>
            )}
          </div>
        </div>

        {/* Text + CTAs */}
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground sm:text-base">
              <BookOpen className="h-4 w-4 text-gold-600 dark:text-gold-400" aria-hidden="true" />
              {isCompleted ? 'کتاب را تمام کردید!' : 'در حال خواندن این کتاب'}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              {isCompleted
                ? 'تبریک! می‌توانید دوباره بخوانید یا کتاب دیگری انتخاب کنید.'
                : totalPages > 0
                  ? `صفحه ${toPersianDigits(currentPage)} از ${toPersianDigits(totalPages)}`
                  : `${toPersianDigits(percent)}٪ پیشرفت`}
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="glow" className="gap-1.5">
              <Link href={`/books/read/${bookSlug}`}>
                {isCompleted ? 'خواندن دوباره' : 'ادامه مطالعه'}
              </Link>
            </Button>
            {!isCompleted && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-xs"
                onClick={() => {
                  // Clear progress for this book
                  try {
                    const map = getLocalProgress()
                    delete map[bookSlug]
                    localStorage.setItem('ky_progress', JSON.stringify(map))
                    setPercent(0)
                    setCurrentPage(0)
                  } catch {
                    /* ignore */
                  }
                }}
                aria-label="شروع از اول"
              >
                <RotateCcw className="h-3 w-3" />
                شروع از اول
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  )
}
