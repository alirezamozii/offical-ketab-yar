'use client'

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { BookCover } from '@/components/books/book-cover'
import { AddToCollectionButton } from '@/components/books/add-to-collection-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Clock, Quote, Star } from 'lucide-react'
import Link from 'next/link'
import type { BookListItem } from '@/lib/data'

interface DesktopHoverPreviewProps {
  book: BookListItem
  progress?: number
  snippet: string
  snippetLoaded: boolean
  onHoverStart: () => void
  children: React.ReactNode
}

export function DesktopHoverPreview({
  book,
  progress,
  snippet,
  snippetLoaded,
  onHoverStart,
  children,
}: DesktopHoverPreviewProps) {
  const inProgress = progress !== undefined && progress > 0 && progress < 100
  const finished = progress !== undefined && progress >= 100
  const minutes = Math.max(1, Math.round((book.pageCount * 3) / 60))

  return (
    <HoverCard openDelay={300} closeDelay={150}>
      <HoverCardTrigger asChild>
        <div className="block h-full" onMouseEnter={onHoverStart}>
          {children}
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        align="center"
        side="top"
        sideOffset={10}
        className="w-[400px] max-w-[92vw] border-2 border-gold-500/40 bg-popover/95 p-0 shadow-book backdrop-blur-md"
      >
        <div className="space-y-4 p-4">
          {/* Header: cover + title + author */}
          <div className="flex gap-4">
            <Link
              href={`/books/${book.slug}`}
              className="group/cover relative block aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-lg shadow-md-warm ring-1 ring-border transition-transform duration-300 ease-out-expo hover:-translate-y-0.5"
              aria-label={`مشاهده جزئیات ${book.title}`}
            >
              <BookCover
                from={book.coverFrom}
                to={book.coverTo}
                accent={book.coverAccent}
                size="sm"
                imageUrl={book.coverImageUrl || book.coverImage || undefined}
                blurhash={book.coverBlurhash || undefined}
              />
            </Link>
            <div className="min-w-0 flex-1 space-y-1.5">
              <Link
                href={`/books/${book.slug}`}
                className="block font-bold text-base leading-snug line-clamp-2 transition-colors hover:text-gold-600 dark:hover:text-gold-400"
              >
                {book.title}
              </Link>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {book.author}
              </p>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-gold-500/10 px-1.5 py-0.5 text-xs font-bold text-gold-700 dark:text-gold-300">
                  <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
                  {book.rating.toFixed(1)}
                </span>
                <span className="rounded-md border border-border/80 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {book.level}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {minutes} دقیقه
                </span>
              </div>

              {inProgress && (
                <div className="pt-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>پیشرفت</span>
                    <span className="font-bold text-gold-600 dark:text-gold-400">
                      {progress}%
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-gradient-to-r from-gold-500 to-gold-600"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
              {finished && (
                <Badge
                  variant="outline"
                  className="mt-1 border-emerald-500/50 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-300"
                >
                  مطالعه شده
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          {book.description && (
            <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
              {book.description}
            </p>
          )}

          {/* First-page English snippet */}
          <div className="rounded-lg border border-border/60 bg-muted/40 p-2.5">
            <div className="mb-1 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <Quote className="h-3 w-3 text-gold-600 dark:text-gold-400" />
                بخشی از فصل اول
              </span>
            </div>
            {snippetLoaded && snippet ? (
              <p
                dir="ltr"
                className="font-serif text-xs leading-relaxed text-foreground/90 line-clamp-3 italic"
              >
                &ldquo;{snippet}&rdquo;
              </p>
            ) : snippetLoaded && !snippet ? (
              <p className="text-[11px] text-muted-foreground italic">
                متن پیش‌نمایش در دسترس نیست.
              </p>
            ) : (
              <div className="space-y-1.5 py-1">
                <div className="h-2.5 w-full rounded bg-muted animate-pulse" />
                <div className="h-2.5 w-4/5 rounded bg-muted animate-pulse" />
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 pt-1 border-t border-border/40">
            <Button
              asChild
              size="sm"
              className="flex-1 h-8 rounded-lg bg-gradient-to-r from-gold-500 to-gold-700 text-xs font-bold text-white shadow-sm shadow-gold-600/30 hover:shadow-md hover:shadow-gold-600/40"
            >
              <Link href={`/books/read/${book.slug}`}>
                <BookOpen className="h-3.5 w-3.5 me-1" />
                {inProgress ? 'ادامه مطالعه' : 'شروع مطالعه'}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs"
            >
              <Link href={`/books/${book.slug}`}>جزئیات</Link>
            </Button>
            <AddToCollectionButton bookSlug={book.slug} />
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
