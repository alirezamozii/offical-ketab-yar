import { ArrowLeft, BookOpen, Quote as QuoteIcon, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { BookCover } from '@/components/books/book-cover'
import type { CuratedQuote } from '@/lib/quotes'

interface QuoteOfTheDayProps {
  quote: CuratedQuote | null
}

export function QuoteOfTheDay({ quote }: QuoteOfTheDayProps) {
  if (!quote) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div
        className="relative overflow-hidden rounded-3xl border border-gold-500/30 bg-gradient-to-br from-gold-500/10 via-card to-card p-6 shadow-sm sm:p-10 transition-all duration-300 hover:shadow-xl hover:border-gold-500/50"
      >
        {/* Decorative gold ambient glow — GPU radial gradient */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 10% 10%, rgba(212,175,55,0.10) 0%, transparent 50%), radial-gradient(circle at 90% 90%, rgba(138,104,71,0.08) 0%, transparent 50%)',
          }}
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
            کوت روز
          </span>
          <Link
            href="/quotes?tab=curated"
            prefetch={false}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-gold-700 dark:hover:text-gold-400"
          >
            همه کوت‌ها ←
          </Link>
        </div>

        <div className="relative grid gap-6 sm:grid-cols-[auto_1fr] sm:gap-8">
          {/* Book cover thumbnail */}
          <div className="hidden sm:block">
            <Link
              href={`/books/read/${quote.bookSlug}`}
              prefetch={false}
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
          </div>

          {/* Quote content */}
          <div className="min-w-0 space-y-4">
            {/* English quote */}
            <blockquote
              dir="ltr"
              className="text-lg font-medium leading-relaxed text-foreground/90 sm:text-xl lg:text-2xl"
            >
              &ldquo;{quote.text}&rdquo;
            </blockquote>

            {/* Persian translation */}
            {quote.textFa && (
              <p
                dir="rtl"
                className="border-r-2 border-gold-500/40 pr-4 text-sm leading-relaxed text-muted-foreground sm:text-base"
              >
                {quote.textFa}
              </p>
            )}

            {/* Attribution + CTA */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
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
                prefetch={false}
                className="inline-flex items-center gap-1 text-sm font-semibold text-gold-700 transition-[transform,opacity,colors,border-color,background-color] hover:gap-2 dark:text-gold-400"
              >
                خواندن کتاب
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
