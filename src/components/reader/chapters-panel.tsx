'use client'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { BookOpen, Bookmark, BookmarkCheck, Check, List, X } from 'lucide-react'
import type { ReaderBook, ReaderBookmark, ReaderTheme } from '@/lib/reader/types'
import { THEME_STYLES, toPersianDigits } from '@/lib/reader/types'
import { cn } from '@/lib/utils'

interface ChaptersPanelProps {
  book: ReaderBook
  currentPage: number
  /** Per-book paragraph bookmarks (so the list can badge bookmarked pages). */
  bookmarks?: ReaderBookmark[]
  theme: ReaderTheme
  /** Controlled open state — when false the sheet is hidden. */
  open: boolean
  onClose: () => void
  onJumpToPage: (page: number) => void
  /** Optional: toggle the bookmark on a paragraph from inside the panel. */
  onToggleBookmark?: (page: number) => void
}

function pageLabel(book: ReaderBook, pageIndex: number): string {
  const heading = book.pages[pageIndex]?.items.find((i) => i.type === 'heading')
  if (heading) return heading.english
  // first ~6 words of the first text item
  const first = book.pages[pageIndex]?.items.find((i) => i.type === 'text')
  if (first) {
    const words = first.english.split(/\s+/).slice(0, 8).join(' ')
    return `${words}…`
  }
  return `Page ${pageIndex + 1}`
}

export function ChaptersPanel({
  book,
  currentPage,
  bookmarks = [],
  theme,
  open,
  onClose,
  onJumpToPage,
  onToggleBookmark,
}: ChaptersPanelProps) {
  const s = THEME_STYLES[theme]
  const bookmarkedPages = new Set(bookmarks.map((b) => b.page))

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 border-e-2 p-0 sm:max-w-md"
        style={{ background: s.bg, color: s.text, borderColor: s.border }}
      >
        {/* Visually-hidden accessible name + description for screen readers.
            Radix Dialog (which Sheet is built on) requires a Title; the
            Description is optional but recommended. Both are hidden from
            sighted users. */}
        <SheetTitle className="sr-only">فهرست چپترها</SheetTitle>
        <SheetDescription className="sr-only">
          فهرست همهٔ چپترهای این کتاب — برای پرش به چپتر دلخواه روی آن کلیک کنید.
        </SheetDescription>

        {/* Header — visible title + close button */}
        <div
          className="flex shrink-0 items-center justify-between border-b px-5 py-4"
          style={{ borderColor: s.border }}
        >
          <div className="flex items-center gap-2">
            <List className="h-5 w-5" style={{ color: s.accent }} />
            <h2 className="text-lg font-bold" aria-hidden>
              فهرست چپترها
            </h2>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-bold"
              style={{ background: s.accent + '22', color: s.accent }}
            >
              {toPersianDigits(book.pages.length)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Chapter list */}
        <div
          className="flex-1 space-y-1.5 overflow-y-auto scroll-warm px-3 py-3 pb-safe"
          style={{ maxHeight: 'calc(100dvh - 8rem)' }}
        >
          {book.pages.map((page, i) => {
            const active = i === currentPage
            const label = pageLabel(book, i)
            const isHeading = page.items.some((it) => it.type === 'heading')
            const isBookmarked = bookmarkedPages.has(i)
            return (
              <div
                key={i}
                className={cn(
                  'group flex items-center gap-2 rounded-xl border px-2 py-2 text-start text-sm transition-[transform,opacity,colors,border-color,background-color]',
                  active ? 'shadow-sm' : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5',
                )}
                style={
                  active
                    ? { borderColor: s.accent, background: s.accent + '14' }
                    : undefined
                }
              >
                <button
                  onClick={() => onJumpToPage(i)}
                  className="flex min-w-0 flex-1 items-center gap-3 py-0.5 text-start"
                  aria-current={active ? 'page' : undefined}
                  aria-label={`چپتر ${toPersianDigits(i + 1)}: ${label}`}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                    style={{
                      background: active ? s.accent : s.accent + '1a',
                      color: active ? '#fff' : s.accent,
                    }}
                  >
                    {active ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      toPersianDigits(i + 1)
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block truncate',
                        isHeading ? 'font-bold' : 'font-medium opacity-85',
                      )}
                      dir="ltr"
                      lang="en"
                    >
                      {label}
                    </span>
                    <span className="text-[11px] opacity-60">
                      چپتر {toPersianDigits(i + 1)}
                      {isBookmarked && ' · نشان‌شده'}
                    </span>
                  </span>
                  {isHeading && (
                    <BookOpen
                      className="h-3.5 w-3.5 shrink-0 opacity-50"
                      style={{ color: s.accent }}
                    />
                  )}
                </button>
                {onToggleBookmark && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 shrink-0"
                    onClick={() => onToggleBookmark(i)}
                    aria-label={
                      isBookmarked
                        ? `حذف نشان چپتر ${toPersianDigits(i + 1)}`
                        : `نشان‌گذاری چپتر ${toPersianDigits(i + 1)}`
                    }
                    aria-pressed={isBookmarked}
                    style={isBookmarked ? { color: s.accent } : undefined}
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="h-3.5 w-3.5" fill="currentColor" />
                    ) : (
                      <Bookmark className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        <div
          className="border-t px-5 py-3 text-center text-xs opacity-60"
          style={{ borderColor: s.border }}
        >
          {toPersianDigits(book.pages.length)} چپتر — {' '}
          {toPersianDigits(Math.round(((currentPage + 1) / book.pages.length) * 100))}٪
          مطالعه شده
        </div>
      </SheetContent>
    </Sheet>
  )
}
