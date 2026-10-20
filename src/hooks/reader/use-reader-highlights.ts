'use client'

/**
 * use-reader-highlights — owns highlight + bookmark state and the DOM
 * wrapping-span lifecycle.
 *
 * Responsibilities (split out of the god-hook):
 *   • Load + persist highlights + bookmarks per-book to localStorage.
 *   • `addHighlight(color)` — wraps the user's selection in a
 *     `.reader-highlight` span using `Range.surroundContents`.
 *   • `removeHighlight(id)` — unwraps the span (keeps the text).
 *   • `setHighlightNote(id, note)` — attaches a free-form note.
 *   • `clearAllHighlights()` — wipes both state + DOM spans.
 *   • `restoreHighlights()` — idempotent: removes all live spans, then
 *     re-wraps each highlight's text inside its paragraph element. Used
 *     after re-renders that wipe the wrapping spans and on a 350ms
 *     debounce from the scroll handler.
 *   • Bookmark CRUD (`toggleBookmark`, `isParagraphBookmarked`,
 *     `removeBookmark`).
 *
 * Exposes `restoreHighlightsRef` — a ref to the latest `restoreHighlights`
 * function — so `use-reader-scroll.ts`'s scroll handler can call it on a
 * debounce without re-subscribing the listener every time highlights change.
 *
 * Toasts (the original "هایلایت ذخیره شد" / "نشان‌گذاری شد" calls) are
 * emitted via `emit` (owned by `use-reader-events.ts`) and surfaced by
 * `use-reader-notifications.ts`.
 */

import type { ReaderEmit } from '@/hooks/reader/use-reader-events'
import { getStorageKey } from '@/lib/storage-keys'
import {
  HIGHLIGHT_COLORS,
  type Highlight,
  type ReaderBook,
  type ReaderBookmark,
  type ReaderLanguage,
} from '@/lib/reader/types'
import {
  useCallback,
  useEffect,
  useState,
  type MutableRefObject,
  type RefObject,
} from 'react'

interface UseReaderHighlightsOptions {
  book: ReaderBook
  totalPages: number
  currentParagraph: number
  currentLanguage: ReaderLanguage
  prefsShowSubtitles: boolean
  /** Ref to the scroll container (created by the orchestrator, shared with
   *  `use-reader-scroll.ts`). Used for DOM-level highlight wrapping. */
  scrollRef: RefObject<HTMLDivElement | null>
  /** Ref the highlights hook keeps in sync with its latest
   *  `restoreHighlights` fn — read by the scroll handler in
   *  `use-reader-scroll.ts` on a 350ms debounce. Created by the orchestrator. */
  restoreHighlightsRef: MutableRefObject<() => void>
  selectedText: string
  selectedRange: Range | null
  emit: ReaderEmit
}

export function useReaderHighlights({
  book,
  totalPages,
  currentParagraph,
  currentLanguage,
  prefsShowSubtitles,
  scrollRef,
  restoreHighlightsRef,
  selectedText,
  selectedRange,
  emit,
}: UseReaderHighlightsOptions) {
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [bookmarks, setBookmarks] = useState<ReaderBookmark[]>([])
  const [editingHighlightId, setEditingHighlightId] = useState<string | null>(
    null,
  )

  // ---- Load saved highlights + bookmarks ----
  useEffect(() => {
    if (!book.slug) return
    try {
      const hRaw = localStorage.getItem(getStorageKey('highlights', book.slug))
      if (hRaw) {
        const parsed: Highlight[] = JSON.parse(hRaw)
        // Drop highlights whose paragraph index no longer exists (book content changed).
        const valid = parsed.filter(
          (h) => typeof h.page === 'number' && h.page >= 0 && h.page < totalPages,
        )
        setHighlights(valid)
      }
      const bmRaw = localStorage.getItem(getStorageKey('bookmarks', book.slug))
      if (bmRaw) {
        const parsed: ReaderBookmark[] = JSON.parse(bmRaw)
        const validBm = parsed.filter(
          (b) => typeof b.page === 'number' && b.page >= 0 && b.page < totalPages,
        )
        setBookmarks(validBm)
      }
    } catch {}
  }, [book.slug, totalPages])

  // ---- Persist highlights ----
  useEffect(() => {
    if (!book.slug) return
    try {
      localStorage.setItem(
        getStorageKey('highlights', book.slug),
        JSON.stringify(highlights),
      )
    } catch {}
  }, [highlights, book.slug])

  // ---- Persist bookmarks ----
  useEffect(() => {
    if (!book.slug) return
    try {
      localStorage.setItem(
        getStorageKey('bookmarks', book.slug),
        JSON.stringify(bookmarks),
      )
    } catch {}
  }, [bookmarks, book.slug])

  // ---- Restore highlights across the whole continuous column ----
  // ---- Restore highlights across the whole continuous column ----
  // Each highlight is scoped to its paragraph element (data-paragraph-index).
  // Idempotent: removes any existing highlight spans, then re-wraps each
  // highlight's text inside its paragraph.
  const restoreHighlights = useCallback(() => {
    const root = scrollRef.current
    if (!root) return
    // Remove any existing highlight spans (idempotent).
    root.querySelectorAll('[data-hl-id]').forEach((el) => {
      const parent = el.parentNode
      if (parent) {
        while (el.firstChild) parent.insertBefore(el.firstChild, el)
        parent.removeChild(el)
      }
    })
    // Reset mirrored sentence-pair highlights (other-language counterparts).
    root.querySelectorAll('[data-hl-pair-for]').forEach((el) => {
      const span = el as HTMLSpanElement
      span.removeAttribute('data-hl-pair-for')
      span.removeAttribute('style')
    })
    // Normalize paragraphs to merge text nodes after unwrapping
    root.querySelectorAll('[data-paragraph-index]').forEach((p) => p.normalize())

    if (highlights.length === 0) return
    highlights.forEach((hl) => {
      // Defensive: skip out-of-range highlights (book content may have changed).
      if (hl.page < 0 || hl.page >= totalPages) return
      const paraEl = root.querySelector(
        `[data-paragraph-index="${hl.page}"]`,
      )
      if (!paraEl) return
      const walker = document.createTreeWalker(paraEl, NodeFilter.SHOW_TEXT)
      const nodes: Text[] = []
      let n: Node | null
      while ((n = walker.nextNode())) nodes.push(n as Text)
      for (const tn of nodes) {
        const txt = tn.textContent || ''
        const idx = txt.indexOf(hl.text)
        if (idx !== -1) {
          try {
            const r = document.createRange()
            r.setStart(tn, idx)
            r.setEnd(tn, idx + hl.text.length)
            const span = document.createElement('span')
            span.className = 'reader-highlight'
            span.setAttribute('data-hl-id', hl.id)
            span.style.background = HIGHLIGHT_COLORS[hl.color]
            r.surroundContents(span)
          } catch {}
          break
        }
      }

      // Mirror the highlight onto the counterpart sentences in the other
      // language: every matched sentence pair gets the same color, so
      // selecting N English sentences also lights up their N Persian twins.
      if (hl.pairIds && hl.pairIds.length > 0) {
        for (const pid of hl.pairIds) {
          paraEl
            .querySelectorAll(`span[data-pair-id="${pid}"]`)
            .forEach((el) => {
              const span = el as HTMLSpanElement
              // Skip the side already covered by the wrapped text above.
              if (span.querySelector('[data-hl-id]') || span.closest('[data-hl-id]')) {
                return
              }
              span.setAttribute('data-hl-pair-for', hl.id)
              span.style.background = HIGHLIGHT_COLORS[hl.color]
              span.style.borderRadius = '0.25rem'
            })
        }
      }
    })
  }, [highlights, totalPages, scrollRef])

  // Keep the ref in sync so the scroll handler can call the latest version.
  useEffect(() => {
    restoreHighlightsRef.current = restoreHighlights
  }, [restoreHighlights, restoreHighlightsRef])

  // Re-restore on language/subtitle toggle (paragraph DOM may have changed).
  useEffect(() => {
    const t = setTimeout(restoreHighlights, 80)
    return () => clearTimeout(t)
  }, [restoreHighlights, currentLanguage, prefsShowSubtitles])

  // ---- Add a highlight wrapping the current selection ----
  // Captures the sentence-pair ids the selection intersects so the
  // counterpart sentences in the other language get mirrored too.
  const capturePairIds = useCallback((): string[] => {
    const root = scrollRef.current
    const range = selectedRange
    if (!root || !range) return []
    const paraEl = root.querySelector(
      `[data-paragraph-index="${currentParagraph}"]`,
    )
    if (!paraEl) return []
    const pairIds = new Set<string>()
    paraEl
      .querySelectorAll('span[data-pair-id]')
      .forEach((span) => {
        if (range.intersectsNode(span)) {
          pairIds.add(span.getAttribute('data-pair-id') || '')
        }
      })
    pairIds.delete('')
    return Array.from(pairIds)
  }, [scrollRef, selectedRange, currentParagraph])

  const addHighlight = useCallback(
    (color: Highlight['color']) => {
      if (!selectedText) return
      const trimmedText = selectedText.trim()
      if (!trimmedText) return

      const pairIds = capturePairIds()
      const id = `hl_${Date.now()}`
      setHighlights((prev) => {
        // Prevent stacking duplicate/overlapping highlights on the same page:
        // If the same or overlapping text is already highlighted, update its color!
        const existingIdx = prev.findIndex(
          (h) =>
            h.page === currentParagraph &&
            (h.text === trimmedText ||
              h.text.includes(trimmedText) ||
              trimmedText.includes(h.text)),
        )

        if (existingIdx !== -1) {
          const updated = [...prev]
          updated[existingIdx] = {
            ...updated[existingIdx],
            text: trimmedText,
            color,
            pairIds: pairIds.length > 0 ? pairIds : updated[existingIdx].pairIds,
            timestamp: Date.now(),
          }
          return updated
        }

        return [
          ...prev,
          {
            id,
            text: trimmedText,
            page: currentParagraph,
            color,
            pairIds: pairIds.length > 0 ? pairIds : undefined,
            timestamp: Date.now(),
          },
        ]
      })

      // Clear the browser selection
      window.getSelection()?.removeAllRanges()

      emit({ type: 'highlight-added' })
    },
    [selectedText, currentParagraph, emit, capturePairIds],
  )

  const removeHighlight = useCallback((id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id))
    const el = document.querySelector(`[data-hl-id="${id}"]`)
    if (el) {
      const parent = el.parentNode
      if (parent) {
        while (el.firstChild) parent.insertBefore(el.firstChild, el)
        parent.removeChild(el)
      }
    }
  }, [])

  /** Attach (or replace) a free-form note on an existing highlight. */
  const setHighlightNote = useCallback((id: string, note: string) => {
    setHighlights((prev) =>
      prev.map((h) => (h.id === id ? { ...h, note: note.trim() || undefined } : h)),
    )
  }, [])

  /** Wipe every highlight for this book. */
  const clearAllHighlights = useCallback(() => {
    setHighlights([])
    // Strip any live spans from the DOM.
    const root = scrollRef.current
    if (!root) return
    root.querySelectorAll('[data-hl-id]').forEach((el) => {
      const parent = el.parentNode
      if (parent) {
        while (el.firstChild) parent.insertBefore(el.firstChild, el)
        parent.removeChild(el)
      }
    })
  }, [scrollRef])

  // ---- Bookmarks (per-paragraph "نشان‌گذاری") ----
  const isParagraphBookmarked = useCallback(
    (page: number) => bookmarks.some((b) => b.page === page),
    [bookmarks],
  )

  const toggleBookmark = useCallback(
    (page: number) => {
      const existing = bookmarks.find((b) => b.page === page)
      if (existing) {
        setBookmarks((prev) => prev.filter((b) => b.page !== page))
        emit({ type: 'bookmark-removed' })
        return
      }
      const pageData = book.pages[page]
      const firstText = pageData?.items.find((i) => i.type === 'text')
      const label =
        firstText?.[currentLanguage]?.split(/\s+/).slice(0, 8).join(' ') ??
        `چپتر ${page + 1}`
      const bm: ReaderBookmark = {
        id: `bm_${Date.now()}`,
        page,
        label,
        timestamp: Date.now(),
      }
      setBookmarks((prev) => [...prev, bm])
      emit({ type: 'bookmark-added' })
    },
    [bookmarks, book.pages, currentLanguage, emit],
  )

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const pageHlCount = highlights.filter(
    (h) => h.page === currentParagraph,
  ).length

  return {
    highlights,
    pageHlCount,
    addHighlight,
    removeHighlight,
    setHighlightNote,
    clearAllHighlights,
    editingHighlightId,
    setEditingHighlightId,
    restoreHighlights,
    bookmarks,
    isParagraphBookmarked,
    toggleBookmark,
    removeBookmark,
  }
}
