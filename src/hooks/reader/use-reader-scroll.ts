'use client'

/**
 * use-reader-scroll — owns the continuous-scroll reading-position model.
 *
 * Responsibilities (split out of the god-hook `use-reader-state.ts`):
 *   • The IntersectionObserver that tracks the paragraph currently at the
 *     reading line (~30% from the top of the viewport, below the toolbar).
 *   • The rAF-throttled `handleScroll` that updates `scrollPercent` and
 *     forces the last paragraph to be "current" when the user reaches the
 *     bottom edge (so completion XP + progress hit 100%).
 *   • The debounced scroll-position save into the shared `ky_progress`
 *     localStorage map (via `mergeLocalProgress`).
 *   • The mobile detection (`window.innerWidth < 768`).
 *   • The transient "بخش X از Y" position chip.
 *   • Smooth-scroll-to-paragraph helper used by the keyboard shortcuts and
 *     the bottom-bar slider.
 *   • Restore on first mount: reads the saved `currentPage` from
 *     `ky_progress` and scrolls to it. Owns `restoredRef` and
 *     `lastAwardedParagraphRef` (consumed by `use-reader-xp.ts`) so XP
 *     isn't double-awarded for the resume paragraph.
 *
 * Refs are owned here and shared with the other sub-hooks via the return
 * value — `restoredRef`, `lastAwardedParagraphRef`, `completionAwardedRef`
 * are read by `use-reader-xp.ts`; `restoreHighlightsRef` is owned by
 * `use-reader-highlights.ts` and passed in here so the scroll handler can
 * schedule a debounced re-restoration of the wrapping spans after each
 * scroll tick.
 */

import {
  getLocalProgress,
  mergeLocalProgress,
} from '@/hooks/reader/use-local-progress'
import { getStorageKey } from '@/lib/storage-keys'
import {
  estimateReadingMinutes,
  type ReaderBook,
} from '@/lib/reader/types'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from 'react'

interface UseReaderScrollOptions {
  book: ReaderBook
  /** Total pages — equals `book.pages.length`. Passed in to avoid recomputation. */
  totalPages: number
}

interface UseReaderScrollReturn {
  scrollRef: RefObject<HTMLDivElement | null>
  paragraphRefs: MutableRefObject<(HTMLDivElement | null)[]>
  /** Ref the highlights hook keeps in sync with its latest `restoreHighlights`
   *  fn — the scroll handler reads this on a 350ms debounce so wrapping
   *  spans survive re-renders / future paragraph virtualization. Owned here,
   *  written by `use-reader-highlights.ts`. */
  restoreHighlightsRef: MutableRefObject<() => void>
  currentParagraph: number
  setCurrentParagraph: React.Dispatch<React.SetStateAction<number>>
  scrollPercent: number
  showPositionChip: boolean
  isMobile: boolean
  scrollToParagraph: (idx: number, behavior?: ScrollBehavior) => void
  handleScroll: () => void
  pageDown: () => void
  pageUp: () => void
  displayPercent: number
  remainingParagraphs: number
  remainingMinutes: number
  isLastPage: boolean
  /** Set to true once the saved scroll position has been restored (avoids XP-on-resume). */
  restoredRef: MutableRefObject<boolean>
  /** Highest paragraph index we've already awarded XP for. */
  lastAwardedParagraphRef: MutableRefObject<number>
  /** Whether the completion bonus has already been awarded for this book. */
  completionAwardedRef: MutableRefObject<boolean>
}

export function useReaderScroll({
  book,
  totalPages,
}: UseReaderScrollOptions): UseReaderScrollReturn {
  const [isMobile, setIsMobile] = useState(false)
  const [currentParagraph, setCurrentParagraph] = useState(0)
  const [scrollPercent, setScrollPercent] = useState(0)
  const [showPositionChip, setShowPositionChip] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const paragraphRefs = useRef<(HTMLDivElement | null)[]>([])
  // Ref the highlights hook keeps in sync with its latest restoreHighlights
  // fn — read by the scroll handler on a 350ms debounce.
  const restoreHighlightsRef = useRef<() => void>(() => {})
  const rafRef = useRef<number | null>(null)
  const restoredRef = useRef(false)
  const lastAwardedParagraphRef = useRef<number>(-1)
  const completionAwardedRef = useRef<boolean>(false)
  // Debounce timer for scroll-triggered highlight restoration.
  const hlRestoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ---- Smooth-scroll to a given paragraph ----
  const scrollToParagraph = useCallback(
    (idx: number, behavior: ScrollBehavior = 'smooth') => {
      const el = scrollRef.current
      const node = paragraphRefs.current[idx]
      if (!el || !node) return
      const elRect = el.getBoundingClientRect()
      const nodeRect = node.getBoundingClientRect()
      const delta = nodeRect.top - elRect.top
      // offset so the paragraph isn't hidden under the top toolbar (~64px) + breathing room
      el.scrollTo({ top: el.scrollTop + delta - 90, behavior })
    },
    [],
  )

  // ---- Load saved state + restore scroll ----
  // Reads the saved `currentPage` from the consolidated `ky_progress` map
  // (replacing the old `ky_rs_{slug}` schema). Sets the XP resume marker so
  // the paragraph the user was already on doesn't get re-counted.
  useEffect(() => {
    if (!book.slug) return
    let savedPage = 0
    try {
      const entry = getLocalProgress()[book.slug]
      if (
        entry &&
        typeof entry.currentPage === 'number' &&
        entry.currentPage >= 0 &&
        entry.currentPage < totalPages
      ) {
        savedPage = entry.currentPage
        lastAwardedParagraphRef.current = entry.currentPage
      }
      const cRaw = localStorage.getItem(getStorageKey('bookComplete', book.slug))
      if (cRaw === '1') completionAwardedRef.current = true
    } catch {}
    // restore scroll after layout settles
    const id = window.setTimeout(() => {
      restoredRef.current = true
      scrollToParagraph(savedPage, 'auto')
    }, 90)
    return () => window.clearTimeout(id)
  }, [book.slug, totalPages, scrollToParagraph])

  // ---- IntersectionObserver: track current paragraph ----
  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(
              entry.target.getAttribute('data-paragraph-index') || '0',
            )
            setCurrentParagraph(idx)
          }
        }
      },
      {
        root,
        // thin band at ~30% from the top of the viewport (below the toolbar)
        rootMargin: '-30% 0px -69% 0px',
        threshold: 0,
      },
    )
    paragraphRefs.current.forEach((n) => {
      if (n) observer.observe(n)
    })
    return () => observer.disconnect()
  }, [book.pages.length])

  // ---- Scroll handler: progress percent + bottom-edge override ----
  // rAF-throttled. Also schedules a debounced highlight re-restoration
  // (via the ref owned by `use-reader-highlights.ts`) so wrapping spans
  // survive re-renders / future virtualization.
  const handleScroll = useCallback(() => {
    if (rafRef.current != null) return
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null
      const el = scrollRef.current
      if (!el) return
      const max = el.scrollHeight - el.clientHeight
      const pct =
        max > 0
          ? Math.min(100, Math.max(0, (el.scrollTop / max) * 100))
          : 0
      setScrollPercent(pct)
      // Force the last paragraph to be "current" when we reach the bottom,
      // so the completion XP + progress hit 100%.
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 6) {
        setCurrentParagraph((prev) =>
          prev === totalPages - 1 ? prev : totalPages - 1,
        )
      }
      // Debounced highlight re-restoration — protects against re-renders that
      // wipe the wrapping spans and against future paragraph virtualization.
      if (hlRestoreTimerRef.current) clearTimeout(hlRestoreTimerRef.current)
      hlRestoreTimerRef.current = setTimeout(() => {
        restoreHighlightsRef.current()
      }, 350)
    })
  }, [totalPages, restoreHighlightsRef])

  // ---- Save scroll position (debounced) ----
  // Merges into the shared `ky_progress` map; the paragraph-change effect
  // in use-reader-xp.ts also writes to the same entry.
  useEffect(() => {
    if (!book.slug || !restoredRef.current) return
    const id = window.setTimeout(() => {
      mergeLocalProgress(book.slug, {
        currentPage: currentParagraph,
        totalPages,
        percent: Math.round(
          ((currentParagraph + 1) / Math.max(totalPages, 1)) * 100,
        ),
        scrollPercent,
        ts: Date.now(),
        lastReadAt: Date.now(),
      })
    }, 400)
    return () => window.clearTimeout(id)
  }, [currentParagraph, scrollPercent, book.slug, totalPages])

  // ---- Mobile detection ----
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ---- Transient reading-position chip on paragraph change ----
  useEffect(() => {
    if (!restoredRef.current) return
    setShowPositionChip(true)
    const id = window.setTimeout(() => setShowPositionChip(false), 1600)
    return () => window.clearTimeout(id)
  }, [currentParagraph])

  // ---- Helpers exposed to keyboard shortcuts ----
  const pageDown = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ top: el.clientHeight * 0.85, behavior: 'smooth' })
  }, [])
  const pageUp = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ top: -el.clientHeight * 0.85, behavior: 'smooth' })
  }, [])

  // ---- Derived presentation values ----
  const displayPercent = Math.round(scrollPercent)
  const remainingParagraphs = Math.max(0, totalPages - currentParagraph - 1)
  const remainingMinutes = estimateReadingMinutes(remainingParagraphs)
  const isLastPage = currentParagraph >= totalPages - 1

  return {
    scrollRef,
    paragraphRefs,
    restoreHighlightsRef,
    currentParagraph,
    setCurrentParagraph,
    scrollPercent,
    showPositionChip,
    isMobile,
    scrollToParagraph,
    handleScroll,
    pageDown,
    pageUp,
    displayPercent,
    remainingParagraphs,
    remainingMinutes,
    isLastPage,
    restoredRef,
    lastAwardedParagraphRef,
    completionAwardedRef,
  }
}
