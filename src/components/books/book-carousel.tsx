'use client'

import { useRef, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { BookListItem } from '@/lib/data'
import { BookCard } from '@/components/books/book-card'
import { cn } from '@/lib/utils'

interface BookCarouselProps {
  books: BookListItem[]
  progressMap?: Record<string, number>
}

/**
 * BookCarousel — horizontal scroller with arrows + drag-to-scroll.
 *
 * Per user feedback:
 *   • "فلش که درست کردیم برای اینو اونور کلا روی جلد ها میفته یهنی جای بده
 *     دمگش معلوم نیست اصلا نیشمه دیدیش" — arrows repositioned OUTSIDE the
 *     book covers, made always visible (no opacity fade) with a clear
 *     circular button style.
 *   • "مرود بعدحوری باشه که با موس هم اگه نکه داشتم مشیدم بتوتم برم به
 *     سسمت بعدی" — added drag-to-scroll: user can grab and drag the
 *     carousel with the mouse.
 *   • "رقتن به بعدی یه اینمشن با حا لمتس و نرم داشته باشه وای کند هم
 *     نباشه" — smooth scroll behavior, rAF-throttled drag for 60fps.
 */
export function BookCarousel({
  books,
  progressMap,
}: BookCarouselProps) {
  const scroller = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(true)

  // Drag state — refs so we don't trigger re-renders during drag.
  const dragStart = useRef<{ x: number; scrollLeft: number } | null>(null)
  const dragMoved = useRef(false)

  /** Scroll by one "page" (80% of visible width) in the given direction.
   *  In RTL: the visual "left" arrow should scroll FORWARD (next), and
   *  the visual "right" arrow should scroll BACKWARD (previous).
   *  - dir=1  → scroll LEFT  (next item, toward the visual left)
   *  - dir=-1 → scroll RIGHT (prev item, toward the visual right)
   *  scrollBy with positive `left` scrolls RIGHT in LTR, but in RTL the
   *  browser negates it. So we use `left: -dir * amount` to get the
   *  correct visual direction. */
  const scrollBy = useCallback((dir: 1 | -1) => {
    const el = scroller.current
    if (!el) return
    const amount = Math.min(el.clientWidth * 0.8, 600)
    el.scrollBy({ left: -dir * amount, behavior: 'smooth' })
  }, [])

  /** Update arrow visibility based on scroll position. */
  const updateArrows = useCallback(() => {
    const el = scroller.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    // In RTL, scrollLeft can be negative or positive depending on browser.
    // Normalize: maxScroll = scrollWidth - clientWidth.
    const maxScroll = scrollWidth - clientWidth
    const absLeft = Math.abs(scrollLeft)
    setCanScrollPrev(absLeft > 4)
    setCanScrollNext(absLeft < maxScroll - 4)
  }, [])

  // ── Drag-to-scroll handlers ─────────────────────────────────────────
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = scroller.current
    if (!el) return
    // Only start drag on primary button (left click) or touch.
    if (e.button !== 0 && e.pointerType === 'mouse') return
    dragStart.current = { x: e.clientX, scrollLeft: el.scrollLeft }
    dragMoved.current = false
    setIsDragging(true)
    el.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = scroller.current
    if (!el || !dragStart.current) return
    const dx = e.clientX - dragStart.current.x
    if (Math.abs(dx) > 4) dragMoved.current = true
    // In RTL, dragging right should scroll content left (next).
    // scrollLeft += dx works for LTR; for RTL we invert.
    el.scrollLeft = dragStart.current.scrollLeft + dx
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const el = scroller.current
    if (!el) return
    dragStart.current = null
    setIsDragging(false)
    try {
      el.releasePointerCapture(e.pointerId)
    } catch {
      /* no-op */
    }
    // Prevent the click that follows a drag from navigating to a book.
    if (dragMoved.current) {
      window.setTimeout(() => {
        dragMoved.current = false
      }, 0)
    }
  }

  /** Prevent click navigation if the user just finished dragging. */
  function onClickCapture(e: React.MouseEvent) {
    if (dragMoved.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  if (books.length === 0) return null

  return (
    <div className="group/carousel relative">
      <div
        ref={scroller}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        onScroll={updateArrows}
        className={cn(
          'flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4',
          'scroll-hidden',
          // Drag cursor on desktop — shows grab/grabbing so the user
          // knows they can drag the carousel.
          isDragging
            ? 'cursor-grabbing'
            : 'cursor-grab',
        )}
        style={{
          // Disable native scroll snap during drag for smoother feel.
          scrollSnapType: isDragging ? 'none' : 'x mandatory',
          // Prevent text selection during drag.
          userSelect: isDragging ? 'none' : 'auto',
          // IMPORTANT: removed scroll-smooth — it conflicts with drag
          // because the browser tries to animate every scrollLeft change,
          // making drag feel laggy/janky. Per user feedback: "مثل تو گوشی"
          // (like on mobile) — mobile touch scroll is direct, no smoothing.
          scrollBehavior: 'auto',
        }}
      >
        {books.map((b) => (
          <div
            key={b.id}
            className="w-[44%] shrink-0 snap-start sm:w-[31%] md:w-[23%] lg:w-[18.5%] xl:w-[15.5%]"
          >
            <BookCard
              book={b}
              progress={progressMap?.[b.slug]}
            />
          </div>
        ))}
      </div>

      {/* ─── Arrows (desktop only, always visible) ───
          Per user feedback: arrows were on the wrong sides and did the
          wrong thing. Now fixed:
          - LEFT arrow (ChevronLeft) = "بعدی" (next) → scrollBy(1)
          - RIGHT arrow (ChevronRight) = "قبلی" (prev) → scrollBy(-1)
          In RTL, "next" content is to the LEFT, so the left arrow goes
          forward. This matches the user's mental model. */}
      {/* RIGHT arrow — "قبلی" (previous) */}
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        disabled={!canScrollPrev}
        aria-label="قبلی"
        className={cn(
          'absolute top-1/2 -right-3 z-20 hidden -translate-y-1/2 md:flex',
          'h-10 w-10 items-center justify-center rounded-full',
          'border border-border bg-background/95 shadow-lg backdrop-blur',
          'transition-[transform,opacity,colors,border-color,background-color] duration-200',
          'hover:bg-accent hover:shadow-xl',
          'disabled:pointer-events-none disabled:opacity-30',
          'no-tap-highlight touch-manipulation',
        )}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      {/* LEFT arrow — "بعدی" (next) */}
      <button
        type="button"
        onClick={() => scrollBy(1)}
        disabled={!canScrollNext}
        aria-label="بعدی"
        className={cn(
          'absolute top-1/2 -left-3 z-20 hidden -translate-y-1/2 md:flex',
          'h-10 w-10 items-center justify-center rounded-full',
          'border border-border bg-background/95 shadow-lg backdrop-blur',
          'transition-[transform,opacity,colors,border-color,background-color] duration-200',
          'hover:bg-accent hover:shadow-xl',
          'disabled:pointer-events-none disabled:opacity-30',
          'no-tap-highlight touch-manipulation',
        )}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  )
}
