'use client'

import { Button } from '@/components/ui/button'
import { BookOpen, CheckCircle2, ChevronLeft, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getLocalProgress, clearLocalProgress } from '@/hooks/reader/use-local-progress'
import { toPersianDigits } from '@/lib/typography'
import { cn } from '@/lib/utils'

type ReadingState = 'fresh' | 'in-progress' | 'completed'

interface BookDetailActionsProps {
  slug: string
  totalPages?: number
  /**
   * `default` — full-size CTA used in the hero (desktop + mobile).
   * `compact` — slimmer CTA used inside the sticky mobile reading bar.
   */
  variant?: 'default' | 'compact'
  className?: string
}

function deriveState(percent: number): ReadingState {
  if (percent >= 100) return 'completed'
  if (percent > 0) return 'in-progress'
  return 'fresh'
}

export function BookDetailActions({
  slug,
  totalPages = 0,
  variant = 'default',
  className,
}: BookDetailActionsProps) {
  const [percent, setPercent] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const map = getLocalProgress()
    if (map[slug]) {
      setPercent(map[slug].percent || 0)
      setCurrentPage(map[slug].currentPage || 0)
    }
    setHydrated(true)
  }, [slug])

  const handleResetProgress = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      clearLocalProgress(slug)
      setPercent(0)
      setCurrentPage(0)
    } catch {
      /* ignore */
    }
  }

  const state = hydrated ? deriveState(percent) : 'fresh'
  const href = `/books/read/${slug}`

  if (variant === 'compact') {
    // Sticky bar — small, single-line, no subtext
    const label =
      state === 'completed'
        ? 'خواندن دوباره'
        : state === 'in-progress'
          ? `ادامه · ${toPersianDigits(percent)}٪`
          : 'شروع مطالعه'
    return (
      <Button
        asChild
        size="sm"
        variant={state === 'completed' ? 'outline' : 'glow'}
        className={cn('flex-1', className)}
      >
        <Link href={href}>
          {state === 'completed' ? (
            <RotateCcw className="h-4 w-4" />
          ) : (
            <BookOpen className="h-4 w-4" />
          )}
          {label}
        </Link>
      </Button>
    )
  }

  // When book is in-progress or completed, render the integrated rich progress card
  if (state === 'in-progress' || state === 'completed') {
    const isCompleted = state === 'completed'
    const radius = 26
    const circumference = 2 * Math.PI * radius
    const strokeOffset = circumference - (percent / 100) * circumference

    return (
      <div className={cn('relative overflow-hidden rounded-2xl border border-gold-500/30 bg-gradient-to-br from-gold-500/10 via-card to-card p-4 sm:p-5 shadow-sm', className)}>
        {/* Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gold-500/10 blur-2xl"
        />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Circular Progress Ring */}
            <div className="relative h-16 w-16 shrink-0">
              <svg
                className="h-full w-full -rotate-90"
                viewBox="0 0 64 64"
                aria-hidden="true"
              >
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-border/60"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  fill="none"
                  stroke="url(#progressGradientDetail)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  className="transition-[stroke-dashoffset] duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="progressGradientDetail" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f4d35e" />
                    <stop offset="100%" stopColor="#b8956a" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isCompleted ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" aria-hidden="true" />
                ) : (
                  <>
                    <span className="text-sm font-extrabold tabular-nums text-gold-700 dark:text-gold-400">
                      {toPersianDigits(percent)}
                    </span>
                    <span className="text-[9px] font-medium text-muted-foreground">٪</span>
                  </>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="min-w-0">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <BookOpen className="h-4 w-4 text-gold-600 dark:text-gold-400 shrink-0" />
                {isCompleted ? 'کتاب به پایان رسید!' : 'در حال خواندن این کتاب'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isCompleted
                  ? 'این کتاب را با موفقیت تمام کرده‌اید.'
                  : totalPages > 0
                    ? `صفحه ${toPersianDigits(currentPage + 1)} از ${toPersianDigits(totalPages)}`
                    : `${toPersianDigits(percent)}٪ پیشرفت`}
              </p>
            </div>
          </div>

          {/* Actions: Continue + Reset */}
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto">
            <Button asChild size="default" variant="glow" className="flex-1 sm:flex-initial gap-1.5 shadow-md">
              <Link href={href}>
                {isCompleted ? (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    خواندن دوباره
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4" />
                    ادامه مطالعه
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </>
                )}
              </Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleResetProgress}
              className="gap-1 text-xs text-muted-foreground hover:text-foreground h-9 px-2.5"
              title="شروع از اول و پاکسازی درصد پیشرفت"
              aria-label="شروع از اول"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              شروع از اول
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Fresh: single prominent CTA
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row', className)}>
      <Button asChild size="xl" variant="glow" className="flex-1">
        <Link href={href}>
          <BookOpen className="h-5 w-5" />
          شروع مطالعه
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}
