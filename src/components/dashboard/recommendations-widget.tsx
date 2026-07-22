'use client'

import { BookCard } from '@/components/books/book-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BookOpen,
  Clock,
  HelpCircle,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { toast } from 'sonner'
import type { BookListItem } from '@/lib/data'
import { usePersianLocale } from '@/hooks/use-persian-locale'

interface RecResponse {
  books: BookListItem[]
  reason: 'genre' | 'top-rated'
  topGenre?: string
}

const DISMISS_KEY = 'ky_rec_dismissed'

function loadDismissed(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? new Set(arr.filter((s): s is string => typeof s === 'string')) : new Set()
  } catch {
    return new Set()
  }
}

function saveDismissed(set: Set<string>) {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify([...set]))
  } catch {}
}

function readingTimeEstimate(pages: number): string {
  // ~1.5 min/page for an EN-learner with bilingual support.
  const mins = Math.max(1, Math.round(pages * 1.5))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} دقیقه`
  if (m === 0) return `${h} ساعت`
  return `${h} ساعت و ${m} دقیقه`
}

function reasonText(rec: RecResponse, book: BookListItem): string {
  if (rec.reason === 'genre' && rec.topGenre) {
    // Does this book match the top genre? If yes, mention it specifically.
    if (book.genres.includes(rec.topGenre)) {
      return `چون به ژانر «${rec.topGenre}» علاقه نشان داده‌اید.`
    }
    return `بر اساس سلیقه شما در ژانر «${rec.topGenre}».`
  }
  if (book.rating >= 4.5) return 'یکی از بالاترین‌امتیازترین کتاب‌های کتاب‌یار.'
  return 'محبوب‌ترین کتاب‌ها — شروعی عالی برای شما.'
}

export function RecommendationsWidget() {
  const [data, setData] = useState<RecResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed())
  const reduceMotion = useReducedMotion()
  const { toPersianDigits } = usePersianLocale()

  useEffect(() => {
    fetch('/api/recommendations?limit=6')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const visibleBooks = useMemo(() => {
    if (!data) return []
    return data.books.filter((b) => !dismissed.has(b.slug))
  }, [data, dismissed])

  function handleDismiss(slug: string, title: string) {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(slug)
      saveDismissed(next)
      return next
    })
    toast.success(`«${title}» از پیشنهادها حذف شد`, {
      description: 'می‌توانید آن را در کتابخانه پیدا کنید.',
    })
  }

  const subtitle =
    data?.reason === 'genre' && data.topGenre
      ? `بر اساس علاقه شما به ژانر «${data.topGenre}»`
      : 'محبوب‌ترین کتاب‌ها — شروعی عالی'

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="h-5 w-5 text-gold-600 dark:text-gold-400" />
            پیشنهاد برای شما
          </h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5" aria-hidden />
            {subtitle}
            <span className="text-[10px]">— برای دیدن دلیل، روی کتاب نگه دارید.</span>
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link href="/library">کتابخانه</Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-full rounded-2xl" />
          ))}
        </div>
      ) : !data || visibleBooks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {dismissed.size > 0 && data && data.books.length > 0
            ? 'همه پیشنهادها را دیدید! بعداً کتاب‌های جدیدی اضافه می‌شود.'
            : 'همه کتاب‌ها را خوانده‌اید! کتاب‌های جدید به‌زودی اضافه می‌شوند.'}
        </div>
      ) : (
        <div className="stagger-in grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {visibleBooks.map((b) => (
            <HoverCard key={b.id} openDelay={250} closeDelay={150}>
              <HoverCardTrigger asChild>
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={reduceMotion ? undefined : { y: -4 }}
                  className="relative"
                >
                  <BookCard book={b} />
                  {/* "چرا؟" hint badge */}
                  <span
                    className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-gold-700 shadow-sm backdrop-blur dark:text-gold-400"
                    aria-hidden
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </span>
                </motion.div>
              </HoverCardTrigger>
              <HoverCardContent
                align="center"
                side="top"
                className="w-72 p-4"
              >
                <div className="space-y-3">
                  {/* title + author */}
                  <div>
                    <h3 className="truncate text-sm font-extrabold" dir="ltr">
                      {b.title}
                    </h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {b.author}
                    </p>
                  </div>

                  {/* meta chips */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <Badge
                      variant="outline"
                      className="gap-1 border-gold-400/40 bg-gold-500/10 px-1.5 py-0 text-[10px] font-bold text-gold-700 dark:text-gold-400"
                    >
                      <Star className="h-2.5 w-2.5 fill-current" />
                      {toPersianDigits(b.rating.toFixed(1))}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="gap-1 px-1.5 py-0 text-[10px]"
                    >
                      <BookOpen className="h-2.5 w-2.5" />
                      {toPersianDigits(b.pageCount)} صفحه
                    </Badge>
                    <Badge
                      variant="outline"
                      className="gap-1 px-1.5 py-0 text-[10px]"
                    >
                      <Clock className="h-2.5 w-2.5" />
                      {readingTimeEstimate(b.pageCount)}
                    </Badge>
                  </div>

                  {/* genres */}
                  {b.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {b.genres.slice(0, 3).map((g) => (
                        <span
                          key={g}
                          className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* reason */}
                  <div className="rounded-lg border border-gold-400/30 bg-gold-500/5 p-2.5">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold text-gold-700 dark:text-gold-400">
                      <Sparkles className="h-3 w-3" />
                      چرا این کتاب؟
                    </p>
                    <p className="mt-1 text-[11px] leading-snug text-foreground/80">
                      {data ? reasonText(data, b) : ''}
                    </p>
                  </div>

                  {/* actions */}
                  <div className="flex items-center gap-2">
                    <Button asChild variant="glow" size="sm" className="h-8 flex-1 gap-1.5 text-xs">
                      <Link href={`/books/read/${b.slug}`}>
                        <BookOpen className="h-3.5 w-3.5" />
                        شروع مطالعه
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 px-2 text-xs"
                      onClick={() => handleDismiss(b.slug, b.title)}
                      aria-label={`حذف ${b.title} از پیشنهادها`}
                    >
                      <X className="h-3.5 w-3.5" />
                      نه متشکرم
                    </Button>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
      )}
    </section>
  )
}
