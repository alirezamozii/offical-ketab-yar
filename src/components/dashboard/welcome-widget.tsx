'use client'

/**
 * src/components/dashboard/welcome-widget.tsx
 * ---------------------------------------------------------------
 * First-session welcome card shown on the /dashboard immediately after
 * the user completes the onboarding wizard. Displays a warm greeting
 * and a prominent CTA to start reading their first chosen book (if one
 * was picked during onboarding).
 *
 * Visibility rules (checked client-side):
 *   - Onboarding must be `completed` AND NOT `skipped`.
 *   - `completedAt` must be within the last 30 minutes (so it only shows
 *     for the "first session" right after onboarding — returning users
 *     on subsequent visits don't see it).
 *
 * If `firstBookSlug` is set, fetches the book metadata from /api/books
 * and renders a BookCover + "شروع مطالعه" CTA. Otherwise shows a generic
 * "browse the library" CTA.
 *
 * Owner: onboarding-flow-builder (CRON4-B).
 * ---------------------------------------------------------------
 */

import { BookCover } from '@/components/books/book-cover'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useOnboarding } from '@/lib/onboarding'
import type { BookListItem } from '@/lib/data'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, BookOpen, Sparkles, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const SHOW_WINDOW_MS = 30 * 60 * 1000 // 30 minutes
const DISMISS_KEY = 'ky_welcome_dismissed'

export function WelcomeWidget() {
  const { state } = useOnboarding()
  const reduceMotion = useReducedMotion()
  const { toPersianDigits } = usePersianLocale()
  const [book, setBook] = useState<BookListItem | null>(null)
  const [loadingBook, setLoadingBook] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Hydrate the "dismissed for this session" flag from sessionStorage so a
  // refresh within the same session doesn't re-trigger the widget.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') setDismissed(true)
    } catch {
      /* ignore */
    }
  }, [])

  // Should we show the widget at all?
  const completedAt = state.completedAt ? Date.parse(state.completedAt) : NaN
  const withinWindow =
    Number.isFinite(completedAt) && Date.now() - completedAt < SHOW_WINDOW_MS
  const shouldShow =
    !dismissed &&
    state.completed &&
    !state.skipped &&
    withinWindow

  // Fetch the chosen first book so we can render its cover + title.
  useEffect(() => {
    if (!shouldShow || !state.firstBookSlug) return
    let alive = true
    setLoadingBook(true)
    fetch(`/api/books?slugs=${encodeURIComponent(state.firstBookSlug)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: BookListItem[]) => {
        if (alive && data.length > 0) setBook(data[0])
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoadingBook(false)
      })
    return () => {
      alive = false
    }
  }, [shouldShow, state.firstBookSlug])

  if (!shouldShow) return null

  function handleDismiss() {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      aria-label="خوش‌آمدگویی اولین جلسه"
      className="relative overflow-hidden rounded-3xl border border-gold-500/30 bg-gradient-to-br from-gold-500/15 via-card to-card p-5 shadow-glow-gold sm:p-6"
    >
      {/* Ambient gold halos */}
      <div
        className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-gold-500/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-amber-700/15 blur-3xl"
        aria-hidden="true"
      />

      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="بستن کارت خوش‌آمدگویی"
        className="absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/60 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-background hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Icon / cover */}
        <div className="flex shrink-0 items-center justify-center">
          {loadingBook ? (
            <Skeleton className="h-28 w-20 rounded-lg" />
          ) : book ? (
            <div className="relative h-28 w-20 overflow-hidden rounded-lg shadow-lg">
              <BookCover
                title={book.title}
                author={book.author}
                from={book.coverFrom}
                to={book.coverTo}
                accent={book.coverAccent}
                size="sm"
              />
            </div>
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-lg shadow-gold-500/30">
              <Sparkles className="h-12 w-12" />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 space-y-2 text-center sm:text-right">
          <p className="flex items-center justify-center gap-2 text-xs font-medium text-gold-700 dark:text-gold-400 sm:justify-start">
            <Sparkles className="h-3.5 w-3.5" />
            به کتاب‌یار خوش آمدید!
          </p>
          <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
            <span className="text-gradient-gold">شروع یک سفر دلپذیر مطالعه</span>
          </h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground sm:mx-0">
            {book
              ? 'کتاب اول خود را شروع کنید و وارد دنیای دوزبانه کتاب‌یار شوید.'
              : 'کتابخانه را مرور کنید و اولین کتاب خود را انتخاب نمایید.'}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 sm:justify-start">
            {book ? (
              <Button asChild variant="glow" size="sm" className="gap-1.5">
                <Link href={`/books/${book.slug}`}>
                  <BookOpen className="h-4 w-4" />
                  شروع مطالعه «{book.title}»
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild variant="glow" size="sm" className="gap-1.5">
                <Link href="/library">
                  <BookOpen className="h-4 w-4" />
                  مرور کتابخانه
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link href="/library/genres">
                <Sparkles className="h-4 w-4" />
                کشف کتاب‌ها
              </Link>
            </Button>
            {book && (
              <span className="ml-1 text-[11px] text-muted-foreground">
                {toPersianDigits(book.pageCount)} صفحه · سطح {book.level}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  )
}
