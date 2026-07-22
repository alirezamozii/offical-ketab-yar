'use client'

import { BookCover } from '@/components/books/book-cover'
import { FavoriteButton } from '@/components/books/favorite-button'
import { TrendingBadge } from '@/components/books/trending-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { motion, useReducedMotion } from 'framer-motion'
import { BookOpen, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { memo } from 'react'

interface BookCardProps {
  book: import('@/lib/data').BookListItem
  progress?: number
  href?: string
  cached?: boolean
}

/**
 * BookCard — ULTRA CLEAN version per user feedback.
 *
 * The cover is the star. No badges, no numbers, no clutter on the image.
 * Below the cover: just the title + author. That's it.
 *
 * Accessibility / valid HTML: the card uses the "stretched link" pattern.
 * The `<article>` is the positioned wrapper; an absolutely-positioned
 * `<Link>` overlay (inset-0) makes the entire card clickable, while the
 * `<FavoriteButton>` is raised above it (z-20) so its clicks don't trigger
 * navigation. This avoids nesting `<button>` inside `<a>`, which the HTML
 * spec disallows (interactive content inside `<a>`).
 *
 * Wrapped in `React.memo` because BookCard is rendered in lists of 20+
 * (book grid, search results, recommendations, favorites). Without memo,
 * every parent state change (filter, search query, page, scroll-driven
 * state) re-renders the entire list even though each card's props are
 * unchanged. Props are all primitives / a stable `book` object reference
 * (loaded once from the API), so the default shallow comparison is enough
 * — no custom comparator needed. `memo` does NOT break internal state
 * (framer-motion's `useReducedMotion`) — memo only short-circuits re-
 * renders when props are unchanged, not when internal hooks fire.
 */
export const BookCard = memo(function BookCard({ book, progress, href, cached }: BookCardProps) {
  const reduceMotion = useReducedMotion()


  const inProgress = progress !== undefined && progress > 0 && progress < 100

  return (
    <motion.article
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group relative block h-full"
    >
      <div className="relative h-full overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-[transform,opacity,colors,border-color,background-color] duration-300 ease-out-expo group-hover:border-gold-400/40 hover:shadow-md">
        {/* ─── COVER ─── */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <div className="absolute inset-0 transition-transform duration-700 ease-out-expo group-hover:scale-105">
            <BookCover
              from={book.coverFrom}
              to={book.coverTo}
              accent={book.coverAccent}
              imageUrl={book.coverImageUrl || book.coverImage || undefined}
              blurhash={book.coverBlurhash || undefined}
            />
          </div>

          {/* Offline-ready badge */}
          {cached && (
            <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-gold-500/95 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm z-20">
              <CheckCircle2 className="h-2.5 w-2.5" aria-hidden="true" />
              آفلاین
            </span>
          )}

          {/* Subtle spine edge */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-1.5 bg-gradient-to-l from-black/55 to-transparent"
            aria-hidden="true"
          />

          {/* Reading-progress overlay */}
          {progress !== undefined && progress > 0 && (
            <div
              className="pointer-events-none absolute inset-0 bg-gold-500/10"
              style={{
                clipPath: `inset(0 0 ${100 - Math.min(progress, 100)}% 0)`,
              }}
              aria-hidden="true"
            />
          )}

          {/* Reflection sweep on hover — BL → TR */}
          <div className="hover-only-fine pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 translate-x-[-100%] translate-y-[100%] opacity-0 blur-2xl transition-[transform,opacity,colors,border-color,background-color] duration-[1100ms] ease-out-expo group-hover:translate-x-[100%] group-hover:translate-y-[-100%] group-hover:opacity-100"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.5) 48%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 52%, transparent 70%)',
                backgroundSize: '300% 300%',
              }}
            />
          </div>

          {/* Favorite — raised above the stretched link so its clicks
              don't trigger navigation. ONLY on hover, top-start. */}
          <div className="hover-only-fine absolute start-2 top-2 z-20 opacity-0 transition-opacity duration-300 ease-out-expo group-hover:opacity-100 focus-within:opacity-100">
            <FavoriteButton
              book={{
                slug: book.slug,
                title: book.title,
                author: book.author,
                coverFrom: book.coverFrom,
                coverTo: book.coverTo,
                coverAccent: book.coverAccent,
              }}
              size="sm"
            />
          </div>

          {/* Trending badge — top-end corner, always visible for popular books.
              Only shows for books with viewCount >= 1000 (محبوب tier or higher). */}
          {book.viewCount >= 1000 && (
            <div className="absolute end-2 top-2 z-20">
              <TrendingBadge viewCount={book.viewCount} />
            </div>
          )}

          {/* Read CTA — mobile always visible, desktop slides up on hover.
              pointer-events-none so it doesn't intercept the stretched-link
              click — it's purely decorative. */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-1.5 transition-transform duration-300 ease-out-expo sm:translate-y-full sm:p-2 sm:group-hover:translate-y-0"
            aria-hidden="true"
          >
            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 py-1.5 text-[11px] font-semibold text-white shadow-lg sm:text-xs">
              <BookOpen className="h-3.5 w-3.5" />
              {inProgress ? 'ادامه' : 'مطالعه'}
            </div>
          </div>

          {/* Progress bar — slim gold ribbon (pointer-events-none; the
              stretched-link below catches clicks). */}
          {progress !== undefined && progress > 0 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-1 bg-black/40">
              <div
                className="h-full bg-gradient-to-r from-gold-400 to-gold-500 transition-[width] duration-500 ease-out-expo"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* ─── META — minimal: just title + author ─── */}
        <div className="space-y-0.5 p-2.5 sm:p-3">
          <h3
            className="line-clamp-1 text-xs font-bold leading-snug transition-colors duration-300 group-hover:text-primary sm:text-sm"
            dir="ltr"
            lang="en"
          >
            {book.title}
          </h3>
          <p
            className="line-clamp-1 text-[10px] text-muted-foreground sm:text-[11px]"
            dir="ltr"
            lang="en"
          >
            {book.author}
          </p>
        </div>
      </div>

      {/* Stretched-link overlay — makes the whole card clickable without
          nesting a <button> inside an <a>. Sits above the visual content
          (z-10) but below the FavoriteButton (z-20) so favorite clicks
          don't navigate. */}
      <Link
        href={href || `/books/${book.slug}`}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-label={`مشاهده ${book.title}${book.author ? ` — ${book.author}` : ''}`}
      >
        <span className="sr-only">مشاهده کتاب</span>
      </Link>
    </motion.article>
  )
})

/**
 * BookCardSkeleton — loading state.
 */
export function BookCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm" aria-hidden="true">
      <Skeleton className="aspect-[2/3] w-full rounded-none" />
      <div className="space-y-1.5 p-2.5 sm:p-3">
        <Skeleton className="h-3 w-3/4 rounded" />
        <Skeleton className="h-2.5 w-1/2 rounded" />
      </div>
    </div>
  )
}
