'use client'

/**
 * src/components/home/quote-of-the-day.tsx
 * ---------------------------------------------------------------
 * "Quote of the Day" card for the home page. Shows a deterministic
 * daily quote (same quote for all visitors on the same date) with:
 *   - The English quote text
 *   - Persian translation
 *   - Book title + author
 *   - A link to read the book
 *   - A link to the full quotes gallery
 *
 * The quote is passed as a prop from the server component (page.tsx
 * calls `getQuoteOfTheDayFromDB()` so it's SSR + cacheable).
 *
 * Design: gold-accented card with a large quotation mark watermark,
 * book cover thumbnail, and staggered text reveal. Respects
 * prefers-reduced-motion.
 *
 * Owner: CRON-REVIEW-202607171315
 * ---------------------------------------------------------------
 */

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, BookOpen, Quote as QuoteIcon, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { BookCover } from '@/components/books/book-cover'
import type { CuratedQuote } from '@/lib/quotes'

interface QuoteOfTheDayProps {
  quote: CuratedQuote | null
}

export function QuoteOfTheDay({ quote }: QuoteOfTheDayProps) {
  const reduceMotion = useReducedMotion()

  if (!quote) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-gold-500/30 bg-gradient-to-br from-gold-500/10 via-card to-card p-6 shadow-sm sm:p-10"
      >
        {/* Decorative gold orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-gold-700/10 blur-3xl"
        />

        {/* Large quotation mark watermark */}
        <QuoteIcon
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-2 h-24 w-24 text-gold-500/10 sm:h-32 sm:w-32"
          fill="currentColor"
        />

        {/* Section header */}
        <div className="relative mb-6 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-700 dark:text-gold-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            نقل‌قول روز
          </span>
          <Link
            href="/quotes"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-gold-700 dark:hover:text-gold-400"
          >
            همه نقل‌قول‌ها ←
          </Link>
        </div>

        <div className="relative grid gap-6 sm:grid-cols-[auto_1fr] sm:gap-8">
          {/* Book cover thumbnail */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden sm:block"
          >
            <Link
              href={`/books/read/${quote.bookSlug}`}
              aria-label={`خواندن ${quote.bookTitle}`}
              className="block w-28 transition-transform hover:scale-105 lg:w-32"
            >
              <BookCover
                title={quote.bookTitle}
                author={quote.bookAuthor}
                from="#b8956a"
                to="#6d523a"
                accent="#f4d35e"
                size="md"
              />
            </Link>
          </motion.div>

          {/* Quote content */}
          <div className="min-w-0 space-y-4">
            {/* English quote */}
            <motion.blockquote
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              dir="ltr"
              className="text-lg font-medium leading-relaxed text-foreground/90 sm:text-xl lg:text-2xl"
            >
              “{quote.text}”
            </motion.blockquote>

            {/* Persian translation */}
            {quote.textFa && (
              <motion.p
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.25 }}
                dir="rtl"
                className="border-r-2 border-gold-500/40 pr-4 text-sm leading-relaxed text-muted-foreground sm:text-base"
              >
                {quote.textFa}
              </motion.p>
            )}

            {/* Attribution + CTA */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="flex flex-wrap items-center justify-between gap-3 pt-2"
            >
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 shrink-0 text-gold-600 dark:text-gold-400" aria-hidden="true" />
                <span className="font-semibold text-foreground" dir="ltr">
                  {quote.bookTitle}
                </span>
                <span className="text-muted-foreground" aria-hidden="true">·</span>
                <span className="text-muted-foreground" dir="ltr">
                  {quote.bookAuthor}
                </span>
              </div>
              <Link
                href={`/books/read/${quote.bookSlug}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-gold-700 transition-[transform,opacity,colors,border-color,background-color] hover:gap-2 dark:text-gold-400"
              >
                خواندن کتاب
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
