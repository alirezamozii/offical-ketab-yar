'use client'

import { useReader } from '@/components/reader/reader-context'
import { ParagraphBlock } from '@/components/reader/reader-page-view'
import { toPersianDigits } from '@/lib/reader/types'
import { motion, useReducedMotion } from 'framer-motion'
import { Bookmark, Sparkles } from 'lucide-react'

/**
 * The main scrollable content area of the reader: a continuous column of
 * bilingual paragraphs tracked by an IntersectionObserver (wired in the
 * state hook). Also handles click-to-toggle-controls and click-to-exit
 * focus mode. Renders the end-of-book marker at the bottom.
 *
 * Per-paragraph margin decoration is rendered here:
 *  • Paragraph numbers (toggleable via `prefs.showParagraphNumbers`)
 *  • A bookmark button (saves/restores paragraph position via the
 *    `bookmarks` storage key).
 *
 * The scroll container ref + paragraph refs are owned by the state hook
 * (via context) so the IntersectionObserver and scroll-progress logic
 * can access them.
 *
 * Accessibility:
 * - `role="article"` is set on the inner content column so screen readers
 *   treat the reading text as a self-contained composition that can be
 *   navigated with the article navigation commands.
 * - `aria-label` carries the book title (and current page number once
 *   we know it) so users have orientation when focus lands in the column.
 * - Per-paragraph bookmark buttons are real `<button type="button">`
 *   elements, so they're keyboard-accessible by default. Their accessible
 *   name reflects the action ("نشان‌گذاری چپتر N" vs "حذف نشان چپتر N")
 *   and `aria-pressed` exposes the toggle state.
 * - The end-of-book "بازگشت به ابتدا" button is also `type="button"` and
 *   has an accessible label.
 */
export function ReaderContent() {
  const {
    book,
    prefs,
    themeStyle,
    scrollRef,
    paragraphRefs,
    handleScroll,
    handleTextSelection,
    scrollToParagraph,
    isFocusMode,
    setIsFocusMode,
    setShowControls,
    marginStyle,
    snapClass,
    fontFamilyCss,
    isParagraphBookmarked,
    toggleBookmark,
  } = useReader()

  const reduceMotion = useReducedMotion()

  // Keyboard handler for the click-to-toggle-controls area. We still want
  // keyboard users to be able to toggle chrome with Enter / Space — but
  // only when the focus is on the container itself (not on a button or
  // link inside it, which would intercept the keypress). This mirrors the
  // mouse `onClick` behavior for parity.
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Skip if focus is on an interactive element inside the container.
    const target = e.target as HTMLElement
    if (target.closest('button, a, input, textarea, select, [contenteditable="true"]')) {
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (isFocusMode) {
        setIsFocusMode(false)
        setShowControls(true)
      } else {
        setShowControls((v) => !v)
      }
    }
    // Escape exits focus mode (same as clicking empty area).
    if (e.key === 'Escape' && isFocusMode) {
      e.preventDefault()
      setIsFocusMode(false)
      setShowControls(true)
    }
  }

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      onClick={(e) => {
        // In focus mode: any click on empty area exits focus mode.
        if (isFocusMode) {
          const sel = window.getSelection()?.toString()
          if (!sel) {
            setIsFocusMode(false)
            setShowControls(true)
            e.stopPropagation()
          }
          return
        }
        // Otherwise: toggle controls only when clicking empty area
        // (not during a text selection).
        const sel = window.getSelection()?.toString()
        if (!sel) {
          setShowControls((v) => !v)
          e.stopPropagation()
        }
      }}
      onKeyDown={onKeyDown}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={
          snapClass +
          ' h-full w-full overflow-y-auto scroll-smooth scroll-brand px-3 pb-40 pt-20 sm:px-4'
        }
        style={{
          WebkitOverflowScrolling: 'touch',
          fontFamily: fontFamilyCss,
        }}
      >
        <div
          className="mx-auto"
          role="article"
          aria-label={`متن کتاب ${book.title}${book.author ? ` از ${book.author}` : ''}`}
          style={{
            // Subtle drop shadow on the reading-text container — adds
            // a faint "page floating over the desk" depth cue without
            // harming readability. Very low alpha so it stays premium
            // rather than gloppy.
            filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.04))',
          }}
        >
          {book.pages.map((page, i) => {
            const bookmarked = isParagraphBookmarked(i)
            const showNumbers = prefs.showParagraphNumbers
            return (
              <motion.div
                key={i}
                data-paragraph-index={i}
                ref={(el) => {
                  paragraphRefs.current[i] = el
                }}
                // Smooth paragraph entrance — fade + slight slide when
                // the paragraph first scrolls into view. `once: true` so
                // it only animates the first time (no janky re-trigger).
                // Skipped entirely under reduced-motion (initial=false).
                initial={
                  reduceMotion ? false : { opacity: 0, y: 8 }
                }
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10% 0px' }}
                transition={{
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group relative scroll-mt-24"
                style={{
                  paddingBottom: marginStyle.paragraphGap,
                  scrollSnapAlign:
                    prefs.readingRhythm === 'snap' ? 'start' : undefined,
                }}
              >
                {/* ---- Decorative gold accent bar on the left edge of
                    the paragraph — fades in on hover. Sits behind the
                    text via -z-10 so it never interferes with selection. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-2 left-0 -z-10 w-0.5 origin-top scale-y-0 rounded-full opacity-0 transition-[transform,opacity,colors,border-color,background-color] duration-300 ease-out-expo group-hover:scale-y-100 group-hover:opacity-100"
                  style={{ background: themeStyle.accent }}
                />

                {/* ---- Paragraph number in the margin (toggleable) ----
                    Decorative; the bookmark button (below) is the
                    screen-reader-accessible per-paragraph affordance. */}
                {showNumbers && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -start-6 top-1 hidden select-none text-[10px] font-bold tabular-nums opacity-40 sm:block"
                    style={{ color: themeStyle.muted }}
                  >
                    {toPersianDigits(i + 1)}
                  </span>
                )}

                {/* ---- Per-paragraph bookmark button (revealed on hover) ----
                    Real button so it's keyboard-accessible. The visible
                    focus state is handled by the global `:focus-visible`
                    rule + the `focus-visible:opacity-100` class below so
                    keyboard users can see the button even without mouse
                    hover. */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleBookmark(i)
                  }}
                  aria-label={
                    bookmarked
                      ? `حذف نشان چپتر ${toPersianDigits(i + 1)}`
                      : `نشان‌گذاری چپتر ${toPersianDigits(i + 1)}`
                  }
                  aria-pressed={bookmarked}
                  className="absolute -end-2 top-1 z-10 flex size-7 translate-y-0.5 items-center justify-center rounded-full opacity-0 transition-opacity duration-150 hover:bg-black/5 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:bg-white/10"
                  style={
                    bookmarked
                      ? {
                          opacity: 1,
                          color: themeStyle.accent,
                          background: themeStyle.accent + '22',
                        }
                      : { color: themeStyle.muted }
                  }
                  title={bookmarked ? 'حذف نشان' : 'نشان‌گذاری'}
                >
                  <Bookmark
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                    fill={bookmarked ? 'currentColor' : 'none'}
                  />
                </button>

                {page.items.map((item, j) => (
                  <ParagraphBlock
                    key={j}
                    item={item}
                    prefs={prefs}
                    accent={themeStyle.accent}
                    isFirstChild={j === 0}
                    onMouseUp={(e) => {
                      e.stopPropagation()
                      setTimeout(handleTextSelection, 10)
                    }}
                  />
                ))}
              </motion.div>
            )
          })}

          {/* End-of-book marker. The "بازگشت به ابتدا" button is a
              real button so it works with Enter/Space. */}
          <div
            className="mb-8 mt-12 flex flex-col items-center gap-3 text-center opacity-70"
            role="status"
            aria-label="پایان کتاب"
            style={reduceMotion ? undefined : { transition: 'opacity 0.2s' }}
          >
            <Sparkles
              aria-hidden="true"
              className="h-7 w-7"
              style={{ color: themeStyle.accent }}
            />
            <p className="text-sm font-medium">پایان کتاب</p>
            <button
              type="button"
              onClick={() => scrollToParagraph(0)}
              aria-label="بازگشت به ابتدای کتاب"
              className="rounded-full border px-4 py-1.5 text-xs transition-opacity hover:opacity-80"
              style={{
                borderColor: themeStyle.border,
                background: themeStyle.accent + '12',
              }}
            >
              بازگشت به ابتدا
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
