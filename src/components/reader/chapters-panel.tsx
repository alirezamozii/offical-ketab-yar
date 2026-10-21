'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { BookOpen, Bookmark, BookmarkCheck, Check, List, X } from 'lucide-react';
import type { ReaderBook, ReaderBookmark, ReaderTheme } from '@/lib/reader/types';
import { THEME_STYLES, toPersianDigits } from '@/lib/reader/types';
import { chapterSegments } from '@/components/reader/chapter-utils';
import { cn } from '@/lib/utils';

interface ChaptersPanelProps {
  book: ReaderBook;
  currentPage: number;
  /** Per-book paragraph bookmarks (so the list can badge bookmarked pages). */
  bookmarks?: ReaderBookmark[];
  theme: ReaderTheme;
  /** Controlled open state — when false the sheet is hidden. */
  open: boolean;
  onClose: () => void;
  onJumpToPage: (page: number) => void;
  /** Optional: toggle the bookmark on a paragraph from inside the panel. */
  onToggleBookmark?: (page: number) => void;
}

function pageLabel(book: ReaderBook, pageIndex: number): string {
  const heading = book.pages[pageIndex]?.items.find((i) => i.type === 'heading');
  if (heading) return heading.english;
  // first ~6 words of the first text item
  const first = book.pages[pageIndex]?.items.find((i) => i.type === 'text');
  if (first) {
    const words = first.english.split(/\s+/).slice(0, 8).join(' ');
    return `${words}…`;
  }
  return `Page ${book.pages[pageIndex]?.pageNumber ?? pageIndex + 1}`;
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
  const s = THEME_STYLES[theme];
  const bookmarkedPages = new Set(bookmarks.map((b) => b.page));

  /** One row per printed page — used both in the flat list and inside chapters. */
  const renderPageRow = (i: number) => {
    const page = book.pages[i];
    if (!page) return null;
    const active = i === currentPage;
    const label = pageLabel(book, i);
    const isHeading = page.items.some((it) => it.type === 'heading');
    const isBookmarked = bookmarkedPages.has(i);
    return (
      <div
        key={i}
        className={cn(
          'group flex items-center gap-2 rounded-xl border px-2 py-2 text-start text-sm transition-[transform,opacity,colors,border-color,background-color]',
          active ? 'shadow-sm' : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5',
        )}
        style={active ? { borderColor: s.accent, background: s.accent + '14' } : undefined}
      >
        <button
          onClick={() => onJumpToPage(i)}
          className="flex min-w-0 flex-1 items-center gap-3 py-0.5 text-start"
          aria-current={active ? 'page' : undefined}
          aria-label={`صفحه ${toPersianDigits(page.pageNumber)}: ${label}`}
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
            style={{
              background: active ? s.accent : s.accent + '1a',
              color: active ? '#fff' : s.accent,
            }}
          >
            {active ? <Check className="h-3.5 w-3.5" /> : toPersianDigits(page.pageNumber)}
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={cn('block truncate', isHeading ? 'font-bold' : 'font-medium')}
              dir="ltr"
              lang="en"
              style={{ color: isHeading ? s.accent : s.text }}
            >
              {label}
            </span>
            <span className="text-[11px]" style={{ color: s.muted }}>
              صفحه {toPersianDigits(page.pageNumber)}
              {isBookmarked && ' · نشان‌شده'}
            </span>
          </span>
          {isHeading && (
            <BookOpen className="h-3.5 w-3.5 shrink-0 opacity-50" style={{ color: s.accent }} />
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
                ? `حذف نشان صفحه ${toPersianDigits(page.pageNumber)}`
                : `نشان‌گذاری صفحه ${toPersianDigits(page.pageNumber)}`
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
    );
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
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
        <SheetTitle className="sr-only">فهرست صفحه‌ها</SheetTitle>
        <SheetDescription className="sr-only">
          فهرست همهٔ صفحه‌های این کتاب — برای پرش به صفحه دلخواه روی آن کلیک کنید.
        </SheetDescription>

        {/* Header — visible title + close button */}
        <div
          className="flex shrink-0 items-center justify-between border-b px-5 py-4"
          style={{ borderColor: s.border }}
        >
          <div className="flex items-center gap-2">
            <List className="h-5 w-5" style={{ color: s.accent }} />
            <h2 className="text-lg font-bold" aria-hidden>
              فهرست صفحه‌ها
            </h2>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-bold"
              style={{ background: s.accent + '22', color: s.accent }}
            >
              {toPersianDigits(book.pages.length)}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="بستن">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Chapter list — grouped under chapter headers when the book
            defines chapters; otherwise the flat per-page list. */}
        <div
          className="flex-1 space-y-1.5 overflow-y-auto scroll-warm px-3 py-3 pb-safe"
          style={{ maxHeight: 'calc(100dvh - 8rem)' }}
        >
          {(() => {
            const chapters = chapterSegments(book);
            if (!chapters.length) return book.pages.map((_, i) => renderPageRow(i));
            // Group page indexes into chapter segments: [start, nextStart)
            return chapters.map((ch, ci) => {
              const end = ci + 1 < chapters.length ? chapters[ci + 1].pageIndex : book.pages.length;
              const chapterActive = currentPage >= ch.pageIndex && currentPage < end;
              return (
                <div key={ch.id} className="space-y-1.5">
                  {/* Chapter header — EN + FA titles, jump to chapter start */}
                  <button
                    onClick={() => onJumpToPage(ch.pageIndex)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2.5 text-start transition-colors',
                      chapterActive
                        ? 'shadow-sm'
                        : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5',
                    )}
                    style={
                      chapterActive
                        ? { borderColor: s.accent, background: s.accent + '14' }
                        : { background: s.accent + '0d' }
                    }
                    aria-current={chapterActive ? 'true' : undefined}
                    aria-label={`فصل ${toPersianDigits(ci + 1)}: ${ch.title}`}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                      style={{
                        background: chapterActive ? s.accent : s.accent + '1a',
                        color: chapterActive ? '#fff' : s.accent,
                      }}
                    >
                      {toPersianDigits(ci + 1)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-sm font-bold"
                        dir="ltr"
                        lang="en"
                        style={{ color: chapterActive ? s.accent : s.text }}
                      >
                        {ch.title}
                      </span>
                      {ch.titleFa && (
                        <span
                          className="block truncate text-[11px] font-medium"
                          dir="rtl"
                          lang="fa"
                          style={{ color: s.muted }}
                        >
                          {ch.titleFa}
                        </span>
                      )}
                    </span>
                    <span
                      className="shrink-0 text-[10px] font-bold opacity-60 tabular-nums"
                      dir="rtl"
                    >
                      ص{toPersianDigits(ch.startPage)}
                    </span>
                  </button>

                  {/* Pages inside this chapter */}
                  {book.pages
                    .slice(ch.pageIndex, end)
                    .map((_, k) => renderPageRow(ch.pageIndex + k))}
                </div>
              );
            });
          })()}
        </div>

        <div
          className="border-t px-5 py-3 text-center text-xs opacity-60"
          style={{ borderColor: s.border }}
        >
          {toPersianDigits(book.pages.length)} صفحه —{' '}
          {toPersianDigits(Math.round(((currentPage + 1) / book.pages.length) * 100))}٪ مطالعه شده
        </div>
      </SheetContent>
    </Sheet>
  );
}
