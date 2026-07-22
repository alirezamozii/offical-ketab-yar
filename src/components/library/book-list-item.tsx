'use client'

import { BookCover } from '@/components/books/book-cover'
import { FavoriteButton } from '@/components/books/favorite-button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Calendar, Star } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { BookListItem } from '@/lib/data'

/**
 * List-view row variant of a book. Shows the cover at a small size alongside
 * the title, author, level, year, genres, and a 2-line description preview.
 * Owned by the library domain so the shared BookCard stays untouched.
 */
export function BookListItemRow({
  book,
  progress,
  index = 0,
}: {
  book: BookListItem
  progress?: number
  index?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
    >
      <Link
        href={`/books/${book.slug}`}
        className="group flex gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm transition-[transform,opacity,colors,border-color,background-color] hover:border-primary/50 hover:shadow-md sm:gap-4 sm:p-4"
      >
        {/* Cover */}
        <div className="relative w-20 shrink-0 overflow-hidden rounded-lg shadow-sm sm:w-24">
          <div className="aspect-[2/3]">
            <BookCover
              title={book.title}
              author={book.author}
              from={book.coverFrom}
              to={book.coverTo}
              accent={book.coverAccent}
              size="sm"
            />
          </div>
          {progress !== undefined && progress > 0 && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/40">
              <div
                className="h-full bg-gradient-to-r from-gold-400 to-gold-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-0.5">
              <h3
                className="line-clamp-1 font-bold leading-snug transition-colors group-hover:text-primary"
                dir="ltr"
              >
                {book.title}
              </h3>
              <p className="text-xs text-muted-foreground">{book.author}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary"
              >
                {book.level}
              </Badge>
              {book.rating > 0 && (
                <span className="hidden items-center gap-1 rounded-full bg-gold-500/15 px-2 py-0.5 text-[11px] font-semibold text-gold-800 dark:text-gold-300 sm:inline-flex">
                  <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
                  {book.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          <p className="hidden line-clamp-2 text-xs text-muted-foreground sm:block">
            {book.description}
          </p>

          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
            {book.genres.slice(0, 3).map((g) => (
              <Badge
                key={g}
                variant="secondary"
                className="bg-muted text-muted-foreground"
              >
                {g}
              </Badge>
            ))}
            <span className="ms-auto flex items-center gap-2 text-[11px] text-muted-foreground">
              {book.publishedYear > 0 && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {book.publishedYear.toLocaleString('fa-IR')}
                </span>
              )}
              {/* Per user feedback: removed view count + eye icon */}
            </span>
          </div>
        </div>

        {/* Action */}
        <div className="hidden shrink-0 flex-col items-end justify-between gap-2 sm:flex">
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
          <span
            className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md"
          >
            <BookOpen className="h-3.5 w-3.5" />
            {progress !== undefined && progress > 0 && progress < 100
              ? 'ادامه'
              : 'مطالعه'}
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

