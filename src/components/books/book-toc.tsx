'use client'

/**
 * src/components/books/book-toc.tsx
 * ---------------------------------------------------------------
 * Table of Contents section for the book detail page. Shows the
 * chapter structure (title, Persian title, start page) so readers
 * can preview the book's organization before starting.
 *
 * Each chapter is a link that opens the reader at that chapter's
 * start page (/books/read/[slug]?chapter=[chapterSlug]).
 *
 * Design:
 *  - Numbered chapter list with gold accent
 *  - Persian title (if available) below the English title
 *  - Start page number on the end side
 *  - Hover lift + border gold accent
 *  - Staggered entrance reveal
 *
 * Owner: CRON-REVIEW-202607171339
 * ---------------------------------------------------------------
 */

import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronLeft, ChevronUp, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toPersianDigits } from '@/lib/typography'

export interface ChapterEntry {
  id: string
  title: string
  titleFa: string
  slug: string
  order: number
  startPage: number
}

interface BookTocProps {
  bookSlug: string
  chapters: ChapterEntry[]
  initialVisible?: number
  step?: number
}

const DEFAULT_INITIAL = 4
const DEFAULT_STEP = 5

export function BookToc({
  bookSlug,
  chapters,
  initialVisible = DEFAULT_INITIAL,
  step = DEFAULT_STEP,
}: BookTocProps) {
  const [visibleCount, setVisibleCount] = useState(initialVisible)

  if (!chapters || chapters.length === 0) return null

  const total = chapters.length
  const hasMore = visibleCount < total
  const visibleChapters = chapters.slice(0, visibleCount)
  const remainingCount = total - visibleCount

  const handleShowMore = () => {
    setVisibleCount((prev) => Math.min(prev + step, total))
  }

  const handleCollapse = () => {
    setVisibleCount(initialVisible)
  }

  return (
    <section className="mt-10" aria-label="فهرست فصل‌ها">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-gold-600 dark:text-gold-400" aria-hidden="true" />
          <h2 className="text-xl font-bold">فهرست فصل‌ها</h2>
          <span className="rounded-full bg-gold-500/15 px-2.5 py-0.5 text-xs font-bold text-gold-700 dark:text-gold-400">
            {toPersianDigits(total)} فصل
          </span>
        </div>

        {total > initialVisible && (
          <span className="text-xs text-muted-foreground">
            نمایش {toPersianDigits(Math.min(visibleCount, total))} از {toPersianDigits(total)}
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/50 shadow-xs">
        <ol className="divide-y divide-border/40">
          {visibleChapters.map((chapter, i) => (
            <li key={chapter.id}>
              <Link
                href={`/books/read/${bookSlug}?chapter=${encodeURIComponent(chapter.slug)}`}
                className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-gold-500/5 sm:px-5 sm:py-4"
              >
                {/* Chapter number badge */}
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-bold tabular-nums transition-colors',
                    'border-gold-500/30 bg-gold-500/10 text-gold-700 dark:text-gold-400',
                    'group-hover:border-gold-500 group-hover:bg-gold-500 group-hover:text-white',
                  )}
                  aria-hidden="true"
                >
                  {toPersianDigits(i + 1)}
                </span>

                {/* Chapter titles */}
                <div className="min-w-0 flex-1">
                  <h3
                    className="truncate text-sm font-bold leading-snug text-foreground sm:text-base"
                    dir="ltr"
                  >
                    {chapter.title}
                  </h3>
                  {chapter.titleFa && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
                      {chapter.titleFa}
                    </p>
                  )}
                </div>

                {/* Start page + chevron */}
                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    صفحه {toPersianDigits(chapter.startPage)}
                  </span>
                  <ChevronLeft
                    className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-1 group-hover:text-gold-600 dark:group-hover:text-gold-400"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ol>

        {/* Expand / Collapse Footer Bar */}
        {total > initialVisible && (
          <div className="flex items-center justify-center border-t border-border/40 bg-muted/20 p-3">
            {hasMore ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShowMore}
                className="flex items-center gap-2 rounded-xl text-xs font-bold text-gold-700 hover:bg-gold-500/10 hover:text-gold-800 dark:text-gold-400 dark:hover:text-gold-300"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span>
                  نمایش {toPersianDigits(Math.min(step, remainingCount))} فصل دیگر ({toPersianDigits(remainingCount)} باقیمانده)
                </span>
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCollapse}
                className="flex items-center gap-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <ChevronUp className="h-3.5 w-3.5" />
                <span>بستن و نمایش کمتر</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
