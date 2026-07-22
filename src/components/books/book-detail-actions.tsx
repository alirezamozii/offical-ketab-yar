'use client'

import { Button } from '@/components/ui/button'
import { BookOpen, Check, ChevronLeft, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getLocalProgress } from '@/hooks/reader/use-local-progress'
import { cn } from '@/lib/utils'

type ReadingState = 'fresh' | 'in-progress' | 'completed'

interface BookDetailActionsProps {
  slug: string
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
  variant = 'default',
  className,
}: BookDetailActionsProps) {
  const [percent, setPercent] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const map = getLocalProgress()
    if (map[slug]) {
      setPercent(map[slug].percent)
      setCurrentPage(map[slug].currentPage)
    }
    setHydrated(true)
  }, [slug])

  // First paint (SSR + initial hydration) renders the "fresh" copy so that the
  // server-rendered HTML and the first client render match — no hydration
  // warning. After mount, we swap to the actual state.
  const state = hydrated ? deriveState(percent) : 'fresh'
  const href = `/books/read/${slug}`

  if (variant === 'compact') {
    // Sticky bar — small, single-line, no subtext
    const label =
      state === 'completed'
        ? 'خواندن دوباره'
        : state === 'in-progress'
          ? `ادامه · ${percent}٪`
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

  // Default hero CTA — full-size with subtext and explicit iconography
  if (state === 'completed') {
    return (
      <div className={cn('flex flex-col gap-3 sm:flex-row', className)}>
        <Button asChild size="xl" variant="outline" className="flex-1">
          <Link href={href}>
            <RotateCcw className="h-5 w-5" />
            خواندن دوباره
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-2 self-center rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 sm:self-auto">
          <Check className="h-3.5 w-3.5" />
          این کتاب را تمام کرده‌اید
        </div>
      </div>
    )
  }

  if (state === 'in-progress') {
    return (
      <div className={cn('flex flex-col gap-3 sm:flex-row', className)}>
        <Button asChild size="xl" variant="glow" className="flex-1">
          <Link href={href}>
            <BookOpen className="h-5 w-5" />
            ادامه از صفحه {currentPage + 1}
            <span className="text-xs opacity-90">({percent}٪ خوانده‌اید)</span>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    )
  }

  // fresh
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

/**
 * Sticky reading bar — appears after the hero scrolls out of view.
 *
 * On mobile (sm:hidden): a bottom-anchored bar with title + author + a
 * single compact CTA. Designed for one-thumb reach.
 *
 * On desktop (hidden sm:flex): a top-anchored bar that slides down from
 * the top of the viewport, showing title + author (truncated) and a
 * compact CTA. The desktop variant is intentionally more spacious —
 * it lives at the top of the viewport rather than the bottom so it
 * doesn't fight with the footer or any back-to-top button.
 *
 * Both variants observe the same hero sentinel (#ky-hero-sentinel) and
 * share visibility state. The bar is hidden while the hero is on-screen
 * (no point duplicating the hero's CTA) and slides in once the user
 * starts scrolling into the page body.
 */
export function StickyReadingBar({
  slug,
  title,
  author,
}: {
  slug: string
  title: string
  author: string
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Attach an IntersectionObserver to a sentinel placed at the top of the
    // hero. When the sentinel scrolls out of view, show the sticky bar.
    const sentinel = document.getElementById('ky-hero-sentinel')
    if (!sentinel) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          // e.isIntersecting === false means hero top is above viewport
          setVisible(!e.isIntersecting)
        }
      },
      { rootMargin: '0px 0px -60% 0px', threshold: 0 },
    )
    io.observe(sentinel)
    return () => io.disconnect()
  }, [])

  return (
    <>
      {/* Mobile bottom bar */}
      <div
        role="region"
        aria-label="نوار مطالعه"
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md transition-transform duration-300 sm:hidden',
          'pb-safe',
          visible ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-sm font-semibold" dir="ltr">
              {title}
            </p>
            <p className="line-clamp-1 text-[11px] text-muted-foreground">
              {author}
            </p>
          </div>
          <BookDetailActions slug={slug} variant="compact" />
        </div>
      </div>

      {/* Desktop top bar — slides down from the very top of the viewport.
          Sits above site header z-index. Uses a max-w so it stays aligned
          with the page column on wide screens. */}
      <div
        role="region"
        aria-label="نوار مطالعه"
        className={cn(
          'fixed inset-x-0 top-0 z-40 hidden border-b border-border bg-card/95 backdrop-blur-md transition-transform duration-300 sm:block',
          'pt-safe',
          visible ? 'translate-y-0' : '-translate-y-full',
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-sm font-bold leading-tight" dir="ltr" title={title}>
              {title}
            </p>
            <p className="line-clamp-1 text-[11px] text-muted-foreground">
              {author}
            </p>
          </div>
          <BookDetailActions slug={slug} variant="compact" className="max-w-[260px]" />
        </div>
      </div>
    </>
  )
}
