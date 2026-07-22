'use client'

import { BookCarousel } from '@/components/books/book-carousel'
import { SectionHeader } from '@/components/layout/section-header'
import { Button } from '@/components/ui/button'
import { BookCover } from '@/components/books/book-cover'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, BookOpen, BookmarkCheck, Clock, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { BookListItem } from '@/lib/data'
import { getLocalProgress } from '@/hooks/reader/use-local-progress'

export function ContinueReading() {
  const reduceMotion = useReducedMotion()
  const [books, setBooks] = useState<BookListItem[]>([])
  const [progressMap, setProgressMap] = useState<
    Record<string, { percent: number; currentPage: number; totalPages: number; ts: number }>
  >({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const map = getLocalProgress()
    const slugs = Object.keys(map).filter((s) => map[s].percent > 0)
    setProgressMap(map)
    if (slugs.length === 0) {
      setLoaded(true)
      return
    }
    fetch(`/api/books?slugs=${encodeURIComponent(slugs.join(','))}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: BookListItem[]) => {
        const order = Object.entries(map)
          .sort((a, b) => b[1].ts - a[1].ts)
          .map(([s]) => s)
        const sorted = order
          .map((s) => data.find((b) => b.slug === s))
          .filter(Boolean) as BookListItem[]
        setBooks(sorted)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  if (!loaded) return null
  if (books.length === 0) return null

  const featured = books[0]
  const featuredProgress = progressMap[featured.slug]
  const rest = books.slice(1)
  const restProgressMap = Object.fromEntries(
    rest.map((b) => [b.slug, progressMap[b.slug]?.percent ?? 0]),
  )

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      <SectionHeader
        icon={BookmarkCheck}
        title="ادامه مطالعه"
        subtitle="از جایی که رها کرده‌اید ادامه دهید"
      />

      {/* Prominent resume card for the most recently read book.
          This is the FIRST thing the user sees on the home page when
          they have reading history. */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="group relative mb-6 overflow-hidden rounded-3xl border border-gold-400/40 bg-gradient-to-l from-gold-500/15 via-card to-card p-5 shadow-sm sm:p-6"
      >
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-gold-500/15 blur-3xl transition-opacity duration-500 group-hover:bg-gold-500/25" />
        {/* Gilded top hairline */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          {/* Cover */}
          <div className="mx-auto h-40 w-28 shrink-0 overflow-hidden rounded-xl shadow-xl ring-1 ring-border sm:mx-0 sm:h-48 sm:w-32">
            <BookCover
              title={featured.title}
              author={featured.author}
              from={featured.coverFrom}
              to={featured.coverTo}
              accent={featured.coverAccent}
              size="sm"
            />
          </div>

          {/* Content — text-end (RTL friendly) so the author name sits
              on the right side under the title, matching the user's
              feedback about the wrong-side author name. */}
          <div className="flex-1 space-y-3 text-center sm:text-end">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/15 px-3 py-1 text-xs font-bold text-gold-700 dark:text-gold-400">
              <Clock className="h-3.5 w-3.5" />
              آخرین کتاب شما
            </div>
            <h3
              className="text-xl font-extrabold tracking-tight sm:text-2xl"
              dir="ltr"
            >
              {featured.title}
            </h3>
            {/* Author name — was previously misaligned on the left.
                Now sits directly under the title in the correct RTL
                flow (text-end on sm+). */}
            <p
              className="text-sm text-muted-foreground"
              dir="ltr"
            >
              {featured.author}
            </p>

            {/* Progress — fixed: smooth, non-janky fill.
                The previous version had a janky transition because
                `width: 0 → ${percent}%` ran on mount even when the
                element was already at the target. Now we render the
                bar at its target width from the start and animate a
                subtle shimmer streak over it for "active reading"
                feel without the lag. */}
            {featuredProgress && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>
                    صفحه {featuredProgress.currentPage.toLocaleString('fa-IR')} از{' '}
                    {featuredProgress.totalPages.toLocaleString('fa-IR')}
                  </span>
                  <span className="font-bold text-gold-700 dark:text-gold-400">
                    {featuredProgress.percent.toLocaleString('fa-IR')}٪
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="relative h-full rounded-full bg-gradient-to-l from-gold-500 to-gold-700 transition-[width] duration-700 ease-out-expo"
                    style={{ width: `${featuredProgress.percent}%` }}
                  >
                    {/* Shimmer streak — per user feedback: "لیت لنیمشن وقتی
                        میسریه به راستار چپ یگیررمیکنه لگ یمرنه باید رد شه
                        بره اون رفلکنش دوباره بیاد" — the shimmer should
                        pass through completely and loop, not get stuck.

                        Fix: use CSS animation (not framer-motion) with
                        a keyframe that goes from -100% to 300% in one
                        smooth pass. This is more reliable than framer-motion's
                        repeat which can stutter on re-render. */}
                    {!reduceMotion && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
                      >
                        <span
                          className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                          style={{
                            animation: 'shimmer-streak 2.2s ease-in-out 0.4s infinite',
                          }}
                        />
                      </span>
                    )}
                  </div>
                </div>
                {/* Shorter, simpler copy per user feedback:
                    old: "دفعه قبل ۴۰٪ خوانده‌اید — از جایی که رها کردید ادامه دهید."
                    new: "۴۰٪ پیش رفته‌اید — ادامه بده" */}
                <p className="text-[11px] text-muted-foreground">
                  {featuredProgress.percent.toLocaleString('fa-IR')}٪ پیش رفته‌اید — ادامه بده
                </p>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-2 pt-1 sm:justify-start">
              <Button
                asChild
                variant="glow"
                size="lg"
                className="group/cta"
              >
                <Link
                  href={`/books/read/${featured.slug}`}
                  aria-label={`ادامه مطالعه ${featured.title}`}
                >
                  <BookOpen className="h-4 w-4" />
                  ادامه مطالعه
                  <ArrowLeft className="h-4 w-4 transition-transform duration-300 ease-out-expo group-hover/cta:-translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/dashboard" aria-label="رفتن به داشبورد">
                  رفتن به داشبورد
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Remaining books — compact carousel */}
      {rest.length > 0 && (
        <BookCarousel books={rest} progressMap={restProgressMap} />
      )}
    </section>
  )
}

export function EmptyStateCTA() {
  const reduceMotion = useReducedMotion()
  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mx-auto max-w-7xl px-4 py-10 sm:px-6"
    >
      <div className="group/empty flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gold-300/60 bg-gold-500/5 p-8 text-center transition-colors hover:border-gold-400/80 hover:bg-gold-500/[0.08]">
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/15 text-gold-600">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-gold-500/30 blur-md transition-opacity duration-300 group-hover/empty:opacity-100"
          />
          <Sparkles className="relative h-6 w-6" />
        </span>
        <div className="space-y-1">
          <h3 className="text-lg font-bold">هنوز کتابی را شروع نکرده‌اید</h3>
          <p className="text-sm text-muted-foreground">
            اولین کتاب خود را انتخاب کنید و در کنار ترجمه فارسی بخوانید.
          </p>
        </div>
        <Button asChild variant="glow">
          <Link href="/library" aria-label="مرور کتابخانه">
            <BookOpen className="h-4 w-4" />
            مرور کتابخانه
          </Link>
        </Button>
      </div>
    </motion.section>
  )
}
