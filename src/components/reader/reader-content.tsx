'use client'

import { useReader } from '@/components/reader/reader-context'
import { ParagraphBlock } from '@/components/reader/reader-page-view'

import { Sparkles } from 'lucide-react'

/**
 * The main scrollable content area of the reader: a continuous column of
 * bilingual paragraphs tracked by an IntersectionObserver (wired in the
 * state hook). Also handles click-to-toggle-controls and click-to-exit
 * focus mode. Renders the end-of-book marker at the bottom.
 *
 * Per-paragraph margin decoration is rendered here:
 *  • Paragraph numbers (toggleable via `prefs.showParagraphNumbers`)
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
    columnMaxWidth,
    snapClass,
    fontFamilyCss,
  } = useReader()

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
          className="mx-auto transition-[max-width,padding] duration-200"
          role="article"
          aria-label={`متن کتاب ${book.title}${book.author ? ` از ${book.author}` : ''}`}
          style={{
            maxWidth: columnMaxWidth || '48rem',
            paddingLeft: marginStyle?.paddingX || '1.5rem',
            paddingRight: marginStyle?.paddingX || '1.5rem',
            // Subtle drop shadow on the reading-text container
            filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.04))',
          }}
        >
          {book.pages.map((page, i) => (
            <div
              key={i}
              data-paragraph-index={i}
              ref={(el) => {
                paragraphRefs.current[i] = el
              }}
              className="group relative scroll-mt-24 transition-opacity duration-300 cull-paragraph"
              style={{
                paddingBottom: marginStyle.paragraphGap,
                scrollSnapAlign:
                  prefs.readingRhythm === 'snap' ? 'start' : undefined,
              }}
            >

                {page.items.map((item, j) => (
                  <ParagraphBlock
                    key={j}
                    item={item}
                    prefs={prefs}
                    accent={themeStyle.accent}
                    onMouseUp={(e) => {
                      e.stopPropagation()
                      setTimeout(handleTextSelection, 20)
                    }}
                    onTouchEnd={() => {
                      setTimeout(handleTextSelection, 60)
                    }}
                  />
                ))}
              </div>
            ))}

          {/* End-of-book marker. The "بازگشت به ابتدا" button is a
              real button so it works with Enter/Space. */}
          <div
            className="mb-8 mt-12 flex flex-col items-center gap-3 text-center opacity-70 motion-safe:transition-opacity motion-safe:duration-200"
            role="status"
            aria-label="پایان کتاب"
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
