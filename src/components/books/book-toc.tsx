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

import { motion, useReducedMotion } from 'framer-motion'
import { BookOpen, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
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
}

export function BookToc({ bookSlug, chapters }: BookTocProps) {
  const reduceMotion = useReducedMotion()

  if (!chapters || chapters.length === 0) return null

  return (
    <section className="mt-10" aria-label="فهرست فصل‌ها">
      <div className="mb-5 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-gold-600 dark:text-gold-400" aria-hidden="true" />
        <h2 className="text-xl font-bold">فهرست فصل‌ها</h2>
        <span className="rounded-full bg-gold-500/15 px-2 py-0.5 text-sm text-gold-700 dark:text-gold-400">
          {toPersianDigits(chapters.length)}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/50">
        <ol className="divide-y divide-border/40">
          {chapters.map((chapter, i) => (
            <motion.li
              key={chapter.id}
              initial={reduceMotion ? false : { opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-10px' }}
              transition={{
                duration: 0.3,
                delay: i * 0.04,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Link
                href={`/books/read/${bookSlug}?chapter=${encodeURIComponent(chapter.slug)}`}
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gold-500/5 sm:px-5 sm:py-4"
              >
                {/* Chapter number badge */}
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-bold tabular-nums transition-colors',
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
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
