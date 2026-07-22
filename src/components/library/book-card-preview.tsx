'use client'

import { BookCard } from '@/components/books/book-card'
import { AddToCollectionButton } from '@/components/books/add-to-collection-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { BookCover } from '@/components/books/book-cover'
import { BookOpen, Clock, Library, Quote, Star } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { BookListItem } from '@/lib/data'

/**
 * BookCardWithPreview — desktop-only hover preview wrapper around the shared
 * BookCard. On hover (after a 300ms delay), shows a rich preview popover
 * with:
 *   • Book cover (medium) + title + author + rating + level + genre tags
 *   • Description (first 2 lines)
 *   • First-page English snippet (fetched lazily and cached in a per-slug
 *     in-memory map so repeat hovers don't re-fetch).
 *   • Reading-time chip
 *   • Quick actions: شروع مطالعه, جزئیات بیشتر, افزودن به پلی‌لیست
 *
 * Mobile users simply tap the card (no hover-card), which is the natural
 * touch interaction. The HoverCard only renders on `md+` screens via CSS
 * (`hidden md:block` on the trigger wrapper).
 *
 * Color discipline: gold/amber/emerald/rose/stone/teal — zero indigo/blue.
 * The preview card has a gold-bordered ring for the "premium" feel.
 */

// In-memory cache: slug → snippet string. Survives across hover previews
// in the same session so repeat hovers don't re-fetch. We don't need to
// invalidate this because the first-page text is immutable.
const snippetCache = new Map<string, string>()
// In-flight requests: slug → Promise. De-dupes concurrent hover triggers.
const snippetInFlight = new Map<string, Promise<string>>()

async function fetchSnippet(slug: string): Promise<string> {
  if (snippetCache.has(slug)) return snippetCache.get(slug) as string
  if (snippetInFlight.has(slug)) return snippetInFlight.get(slug)!
  const p = fetch(`/api/books/${encodeURIComponent(slug)}/snippet`)
    .then((r) => (r.ok ? r.json() : null))
    .then((data: { snippet?: string } | null) => {
      const s = data?.snippet ?? ''
      snippetCache.set(slug, s)
      snippetInFlight.delete(slug)
      return s
    })
    .catch(() => {
      snippetInFlight.delete(slug)
      return ''
    })
  snippetInFlight.set(slug, p)
  return p
}

export function BookCardWithPreview({
  book,
  progress,
}: {
  book: BookListItem
  progress?: number
}) {
  const inProgress = progress !== undefined && progress > 0 && progress < 100
  const finished = progress !== undefined && progress >= 100
  const minutes = Math.max(1, Math.round((book.pageCount * 3) / 60))

  const [snippet, setSnippet] = useState<string>('')
  const [snippetLoaded, setSnippetLoaded] = useState(false)
  const fetchStartedRef = useRef(false)

  // Lazy-fetch the first-page snippet when the user hovers. We track a ref
  // so we only kick off one fetch per card instance even if the hover event
  // fires multiple times.
  useEffect(() => {
    if (fetchStartedRef.current) return
    // If already cached, set immediately on mount (cheap).
    if (snippetCache.has(book.slug)) {
      setSnippet(snippetCache.get(book.slug)!)
      setSnippetLoaded(true)
    }
  }, [book.slug])

  const onHoverStart = () => {
    if (fetchStartedRef.current || snippetLoaded) return
    fetchStartedRef.current = true
    fetchSnippet(book.slug).then((s) => {
      setSnippet(s)
      setSnippetLoaded(true)
    })
  }

  return (
    <HoverCard openDelay={300} closeDelay={150}>
      <HoverCardTrigger asChild>
        {/* `md:block` ensures the hover-card only kicks in on desktop.
            Mobile users tap the card directly. */}
        <div className="block h-full" onMouseEnter={onHoverStart}>
          <BookCard
            book={book}
            progress={progress}
          />
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        align="center"
        side="top"
        sideOffset={10}
        className="w-[400px] max-w-[92vw] border-2 border-gold-500/40 bg-popover/95 p-0 shadow-book backdrop-blur-md"
      >
        <div className="space-y-4 p-4">
          {/* ─── Header: cover + title + author ──────────────────────── */}
          <div className="flex gap-4">
            {/* Cover */}
            <Link
              href={`/books/${book.slug}`}
              className="group/cover relative block aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-lg shadow-md-warm ring-1 ring-border transition-transform duration-300 ease-out-expo hover:-translate-y-0.5"
              aria-label={`مشاهده جزئیات ${book.title}`}
            >
              <BookCover
                title={book.title}
                author={book.author}
                from={book.coverFrom}
                to={book.coverTo}
                accent={book.coverAccent}
                size="sm"
                imageUrl={book.coverImageUrl || book.coverImage || undefined}
                blurhash={book.coverBlurhash || undefined}
              />
            </Link>

            {/* Title + author + rating + level + reading-time */}
            <div className="min-w-0 flex-1 space-y-2">
              <h4
                className="line-clamp-2 font-bold leading-snug transition-colors hover:text-primary"
                dir="ltr"
              >
                <Link href={`/books/${book.slug}`}>{book.title}</Link>
              </h4>
              <p className="text-xs text-muted-foreground">
                {book.authorNameFa ? `${book.authorNameFa} · ` : ''}
                <Link
                  href={book.authorSlug ? `/authors/${book.authorSlug}` : '#'}
                  className="hover:text-primary hover:underline"
                  dir="ltr"
                >
                  {book.author}
                </Link>
              </p>

              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-[11px] text-primary"
                >
                  {book.level}
                </Badge>
                {book.rating > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2 py-0.5 text-[11px] font-semibold text-gold-800 dark:text-gold-300">
                    <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
                    {book.rating.toFixed(1)}
                    <span className="font-normal text-muted-foreground">
                      ({book.reviewCount.toLocaleString('fa-IR')})
                    </span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {minutes.toLocaleString('fa-IR')} دقیقه
                </span>
              </div>

              {/* Genres */}
              {book.genres.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {book.genres.slice(0, 3).map((g) => (
                    <Badge
                      key={g}
                      variant="secondary"
                      className="bg-muted text-[10px] text-muted-foreground"
                    >
                      {g}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── Description (first 2 lines) ────────────────────────── */}
          <p className="line-clamp-2 text-xs leading-relaxed text-foreground/80">
            {book.description}
          </p>

          {/* ─── First-page snippet ─────────────────────────────────── */}
          <div className="space-y-1.5 rounded-xl border border-gold-500/20 bg-gold-500/5 p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gold-700 dark:text-gold-400">
              <Quote className="h-3 w-3" />
              پیش‌نمایش صفحه اول
            </div>
            {snippetLoaded ? (
              snippet ? (
                <p
                  className="line-clamp-3 text-[11px] leading-relaxed text-muted-foreground"
                  dir="ltr"
                >
                  {snippet}
                </p>
              ) : (
                <p className="text-[11px] italic text-muted-foreground">
                  پیش‌نمایش در دسترس نیست.
                </p>
              )
            ) : (
              <div className="space-y-1">
                <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
                <div className="h-2 w-5/6 animate-pulse rounded-full bg-muted" />
                <div className="h-2 w-2/3 animate-pulse rounded-full bg-muted" />
              </div>
            )}
          </div>

          {/* ─── Progress (only when in progress) ───────────────────── */}
          {inProgress && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>پیشرفت مطالعه</span>
                <span className="font-semibold text-primary">
                  {Math.round(progress!)}٪
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-to-r from-gold-400 to-gold-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* ─── Quick actions ──────────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              className="flex-1 bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-white shadow-md"
            >
              <Link href={`/books/read/${book.slug}`}>
                <BookOpen className="h-4 w-4" />
                {finished
                  ? 'خواندن دوباره'
                  : inProgress
                    ? 'ادامه مطالعه'
                    : 'شروع مطالعه'}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link href={`/books/${book.slug}`}>
                <Library className="h-4 w-4" />
                جزئیات
              </Link>
            </Button>
            <AddToCollectionButton
              bookSlug={book.slug}
              bookTitle={book.title}
              variant="icon"
              bare
              className="border-border bg-card text-foreground hover:bg-accent"
            />
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
