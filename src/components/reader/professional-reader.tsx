'use client';

import { BookCompletionCelebration } from '@/components/reader/book-completion-celebration';
import { ReaderBottomBar } from '@/components/reader/reader-bottom-bar';
import { ReaderContent } from '@/components/reader/reader-content';
import { ReaderOverlays } from '@/components/reader/reader-overlays';
import { ReaderProvider } from '@/components/reader/reader-context';
import { ReaderToolbar } from '@/components/reader/reader-toolbar';
import { useReaderState } from '@/hooks/reader/use-reader-state';
import { TTSProvider } from '@/hooks/tts-provider';
import { isBookFullyCached, prefetchBook } from '@/lib/book-prefetcher';
import { EMPTY_READER_COPY, toPersianDigits, type ReaderBook } from '@/lib/reader/types';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

interface ReaderProps {
  book: ReaderBook;
}

export function ProfessionalReader({ book }: ReaderProps) {
  const state = useReaderState(book);

  // Keep offline prefetching out of the critical rendering window and avoid
  // spending bandwidth on constrained connections.
  useEffect(() => {
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    if (
      !navigator.onLine ||
      connection?.saveData ||
      ['slow-2g', '2g'].includes(connection?.effectiveType ?? '')
    ) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (book.slug && book.pageCount && !isBookFullyCached(book.slug)) {
      timer = setTimeout(() => {
        void prefetchBook(book.slug, book.title, book.pageCount as number).catch(() => {
          // Background downloads can retry when the reader is opened again.
        });
      }, 8000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [book.slug, book.title, book.pageCount]);

  if (!book.pages.length) {
    const { themeStyle } = state;
    return (
      <div
        className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center overflow-hidden p-6"
        style={{ background: themeStyle.bg, color: themeStyle.text }}
      >
        <div
          data-fullscreen-route="reader"
          className="flex max-w-md flex-col items-center gap-5 rounded-3xl border-2 px-8 py-10 text-center shadow-xl"
          style={{ borderColor: themeStyle.border, background: themeStyle.bg }}
          role="alertdialog"
          aria-labelledby="empty-reader-title"
          aria-describedby="empty-reader-desc"
        >
          <div
            aria-hidden="true"
            className="flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: `${themeStyle.accent}22`, color: themeStyle.accent }}
          >
            <Sparkles className="h-9 w-9" />
          </div>
          <div className="space-y-2">
            <h2 id="empty-reader-title" className="text-xl font-bold">
              {EMPTY_READER_COPY.title}
            </h2>
            <p
              id="empty-reader-desc"
              className="text-sm leading-relaxed"
              style={{ color: themeStyle.muted }}
            >
              {EMPTY_READER_COPY.subtitle}
            </p>
          </div>
          <a
            href={`/books/${book.slug}`}
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-105"
            style={{ background: themeStyle.accent }}
          >
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
            {EMPTY_READER_COPY.cta}
          </a>
        </div>
      </div>
    );
  }

  const {
    themeStyle,
    scrollPercent,
    chromeVisible,
    isFocusMode,
    showFocusHint,
    sessionMinutes,
    isLastPage,
  } = state;

  return (
    <ReaderProvider value={state}>
      <TTSProvider>
        <div
          data-fullscreen-route="reader"
          role="application"
          aria-label={`خواننده کتاب: ${book.title}${book.author ? ` از ${book.author}` : ''}`}
          aria-keyshortcuts="ArrowRight ArrowLeft PageUp PageDown Escape"
          className="fixed inset-0 z-[9999] isolate flex h-screen w-screen flex-col overflow-hidden"
          style={{ background: themeStyle.bg, color: themeStyle.text }}
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-50 h-1">
            <div
              suppressHydrationWarning
              className="h-full origin-right will-change-transform"
              style={{
                transform: `scaleX(${Math.max(0.001, scrollPercent / 100)})`,
                background: themeStyle.accent,
                transition: 'transform 60ms linear',
              }}
            />
          </div>

          <ReaderToolbar />
          <ReaderContent />

          {isFocusMode && showFocusHint && (
            <div
              role="status"
              aria-live="polite"
              className="pointer-events-none absolute bottom-6 left-1/2 z-40 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              <div
                className="rounded-full border px-4 py-2 text-xs font-medium shadow-lg backdrop-blur-md"
                style={{
                  borderColor: themeStyle.border,
                  background: `${themeStyle.bg}cc`,
                  color: themeStyle.muted,
                }}
              >
                برای خروج کلیک کنید · <kbd className="font-bold">Esc</kbd>
              </div>
            </div>
          )}

          {isLastPage && chromeVisible && (
            <div
              className="pointer-events-none absolute left-1/2 top-20 z-30 -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-200"
              role="status"
              aria-live="polite"
            >
              <div
                className="rounded-full border px-3 py-1 text-xs font-bold shadow-md backdrop-blur-md"
                style={{
                  borderColor: themeStyle.accent,
                  background: `${themeStyle.accent}22`,
                  color: themeStyle.accent,
                }}
              >
                <span aria-hidden="true" role="img">
                  🎉
                </span>{' '}
                پایان کتاب · {toPersianDigits(sessionMinutes)} دقیقه مطالعه
              </div>
            </div>
          )}

          <ReaderBottomBar />
          <ReaderOverlays />
          <BookCompletionCelebration />
        </div>
      </TTSProvider>
    </ReaderProvider>
  );
}
