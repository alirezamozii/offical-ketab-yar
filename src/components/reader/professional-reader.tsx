'use client'

import { ReaderBottomBar } from '@/components/reader/reader-bottom-bar'
import { ReaderContent } from '@/components/reader/reader-content'
import { ReaderOverlays } from '@/components/reader/reader-overlays'
import { ReaderProvider } from '@/components/reader/reader-context'
import { ShortcutsHintTooltip } from '@/components/reader/shortcuts-hint-tooltip'
import { ReaderToolbar } from '@/components/reader/reader-toolbar'
import { AudioPlayerBar } from '@/components/reader/audio-player-bar'
import { TTSProvider } from '@/hooks/use-tts'
import { useReaderState } from '@/hooks/reader/use-reader-state'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { isBookFullyCached, prefetchBook } from '@/lib/book-prefetcher'
import {
  EMPTY_READER_COPY,
  toPersianDigits,
  type ReaderBook,
} from '@/lib/reader/types'
import { BookCompletionCelebration } from '@/components/reader/book-completion-celebration'

interface ReaderProps {
  book: ReaderBook
}

/**
 * Professional bilingual reader — thin orchestrator.
 *
 * All state + logic lives in `useReaderState` (a ~600-line hook). This
 * component calls that hook, handles the empty-book early return, then
 * composes four sub-components (`ReaderToolbar`, `ReaderContent`,
 * `ReaderBottomBar`, `ReaderOverlays`) inside a `ReaderProvider` so they
 * can access the shared state via context. The top progress bar,
 * transient position chip, focus-mode exit hint, and first-visit
 * shortcuts tooltip are rendered here because they're part of the chrome
 * layout rather than a self-contained sub-component.
 */
export function ProfessionalReader({ book }: ReaderProps) {
  const state = useReaderState(book)

  // Prefetch book pages client-side in the background for offline reading (YouTube-style buffer)
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined
    if (book.slug && book.pageCount && !isBookFullyCached(book.slug)) {
      timer = setTimeout(() => {
        prefetchBook(book.slug, book.title, book.pageCount as number)
      }, 2000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [book.slug, book.title, book.pageCount])

  // ---- Empty state: book has no content ----
  if (!book.pages.length) {
    const { themeStyle } = state
    return (
      <div
        className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center overflow-hidden p-6"
        style={{ background: themeStyle.bg, color: themeStyle.text }}
      >
        <div
          className="flex max-w-md flex-col items-center gap-5 rounded-3xl border-2 px-8 py-10 text-center shadow-xl"
          style={{
            borderColor: themeStyle.border,
            background: themeStyle.bg,
          }}
          role="alertdialog"
          aria-labelledby="empty-reader-title"
          aria-describedby="empty-reader-desc"
        >
          <div
            aria-hidden="true"
            className="flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: themeStyle.accent + '22', color: themeStyle.accent }}
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
    )
  }

  const {
    themeStyle,
    scrollPercent,
    showPositionChip,
    chromeVisible,
    currentParagraph,
    totalPages,
    displayPercent,
    isFocusMode,
    showFocusHint,
    remainingMinutes,
    sessionMinutes,
    isLastPage,
    prefs,
  } = state

  return (
    <ReaderProvider value={state}>
      <TTSProvider>
        <div
          // The reader is a self-contained immersive widget with custom
          // keyboard shortcuts (arrows = page, Esc = exit focus, etc.).
          // `role="application"` tells screen readers to pass keystrokes
          // through instead of intercepting them, so the reader's own keymap
          // can take over. The `aria-label` includes the book title so users
          // know what they're reading.
          role="application"
          aria-label={`خواننده کتاب: ${book.title}${book.author ? ` از ${book.author}` : ''}`}
          aria-keyshortcuts="ArrowRight ArrowLeft PageUp PageDown Escape"
          className="fixed inset-0 z-[9999] flex h-screen w-screen flex-col overflow-hidden isolate"
          style={{ background: themeStyle.bg, color: themeStyle.text }}
        >
        {/* ---- Top progress bar (scroll-based, smoother) ----
            Decorative; the position chip below carries the same info
            in a screen-reader-accessible form. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-50 h-1"
        >
          <div
            className="h-full origin-right will-change-transform"
            style={{
              transform: `scaleX(${Math.max(0.001, scrollPercent / 100)})`,
              background: themeStyle.accent,
              transition: 'transform 60ms linear',
            }}
          />
        </div>

        {/* ---- Transient reading-position chip ----
            `role="status"` + `aria-live="polite"` so the position is
            announced to screen reader users without interrupting other
            speech. The chip appears for ~1.5s on scroll, so AT users get
            the same "you are on paragraph X of Y" cue as sighted users. */}
        <AnimatePresence>
          {showPositionChip && chromeVisible && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-none absolute left-1/2 top-20 z-40 -translate-x-1/2"
              role="status"
              aria-live="polite"
            >
              <div
                className="rounded-full border px-3 py-1 text-xs font-bold shadow-md backdrop-blur-md"
                style={{
                  borderColor: themeStyle.border,
                  background: themeStyle.bg + 'cc',
                  color: themeStyle.text,
                }}
              >
                چپتر {toPersianDigits(currentParagraph + 1)} از{' '}
                {toPersianDigits(totalPages)} · {toPersianDigits(displayPercent)}٪
                {remainingMinutes > 0 && (
                  <span className="opacity-70">
                    {' '}
                    · {toPersianDigits(remainingMinutes)} دقیقه باقی‌مانده
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- Top toolbar ---- */}
        <ReaderToolbar />

        {/* ---- Continuous reading column ---- */}
        <ReaderContent />

        {/* ---- Focus-mode exit hint ---- */}
        <AnimatePresence>
          {isFocusMode && showFocusHint && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2 }}
              role="status"
              aria-live="polite"
              className="pointer-events-none absolute bottom-6 left-1/2 z-40 -translate-x-1/2"
            >
              <div
                className="rounded-full border px-4 py-2 text-xs font-medium shadow-lg backdrop-blur-md"
                style={{
                  borderColor: themeStyle.border,
                  background: themeStyle.bg + 'cc',
                  color: themeStyle.muted,
                }}
              >
                برای خروج کلیک کنید · <kbd className="font-bold">Esc</kbd>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- Last-page celebration chip ----
            Live region so the "end of book" celebration is announced
            to AT users too. */}
        <AnimatePresence>
          {isLastPage && chromeVisible && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-none absolute left-1/2 top-20 z-30 -translate-x-1/2"
              role="status"
              aria-live="polite"
            >
              <div
                className="rounded-full border px-3 py-1 text-xs font-bold shadow-md backdrop-blur-md"
                style={{
                  borderColor: themeStyle.accent,
                  background: themeStyle.accent + '22',
                  color: themeStyle.accent,
                }}
              >
                <span aria-hidden="true" role="img">🎉</span>{' '}
                پایان کتاب · {toPersianDigits(sessionMinutes)} دقیقه مطالعه
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- Bottom controls ---- */}
        <ReaderBottomBar />

        {/* ---- Floating TTS player bar (above the bottom controls) ---- */}
        <AudioPlayerBar />

        {/* ---- Overlays (text menu, dictionary, panels, help) ---- */}
        <ReaderOverlays />

        {/* ---- First-visit shortcuts hint tooltip ---- */}
        <ShortcutsHintTooltip theme={prefs.theme} />

        {/* ---- Book completion celebration (fires on ky:book-completed) ---- */}
        <BookCompletionCelebration />
        </div>
      </TTSProvider>
    </ReaderProvider>
  )
}

