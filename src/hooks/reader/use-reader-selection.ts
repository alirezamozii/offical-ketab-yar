'use client'

/**
 * use-reader-selection — owns the text-selection menu state + handlers.
 *
 * Responsibilities (split out of the god-hook):
 *   • `handleTextSelection` — reads `window.getSelection()`, computes the
 *     clamped popup position (above/below the selection, never overflow),
 *     stashes the DOM `Range` so a highlight can later wrap it.
 *   • `handleShowDictionary` — passes the cleaned selected word to the
 *     dictionary popup (via the `onShowDictionary` callback — owned by
 *     `use-reader-dictionary.ts`).
 *   • `handleAddToVocab` — POSTs to `/api/vocabulary`. **Has an
 *     AbortController**: the controller is kept in a ref and re-aborted
 *     if a new request supersedes the in-flight one, and aborted on
 *     unmount. Prevents React "setState on unmounted component" warnings
 *     + races.
 *   • `handleCopy` — copies to clipboard.
 *   • `handleShare` — Web Share API with clipboard fallback.
 *   • `currentParagraphPlainText` — extracts the current page's plain
 *     text (used as `bookContext` for AI chat + the share snippet).
 *
 * Toasts are NOT fired from here. Success/error events are emitted via
 * the `emit` callback (owned by `use-reader-events.ts`) and surfaced by
 * `use-reader-notifications.ts`. This keeps the hook testable without
 * mocking sonner.
 *
 * NOTE: the AI-chat-via-selection flow (`setShowChat(true) +
 * setShowTextMenu(false)`) is wired inside `reader-overlays.tsx` (the
 * consuming component) — that's why this hook doesn't expose an
 * `onAiChat` callback. The hook only owns its own state.
 */

import type { ReaderEmit } from '@/hooks/reader/use-reader-events'
import type { ReaderBook, ReaderLanguage } from '@/lib/reader/types'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseReaderSelectionOptions {
  book: ReaderBook
  currentParagraph: number
  currentLanguage: ReaderLanguage
  /** Open the dictionary popup with a cleaned word. */
  onShowDictionary: (word: string) => void
  emit: ReaderEmit
}

export function useReaderSelection({
  book,
  currentParagraph,
  currentLanguage,
  onShowDictionary,
  emit,
}: UseReaderSelectionOptions) {
  const [selectedText, setSelectedText] = useState('')
  const [showTextMenu, setShowTextMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [selectedRange, setSelectedRange] = useState<Range | null>(null)

  // AbortController for the in-flight /api/vocabulary POST. Aborted on
  // unmount and when a new request supersedes it.
  const vocabAbortRef = useRef<AbortController | null>(null)
  useEffect(() => {
    return () => {
      vocabAbortRef.current?.abort()
    }
  }, [])

  // ---- Text selection ----
  const handleTextSelection = useCallback(() => {
    const sel = window.getSelection()
    const text = sel?.toString().trim()
    if (text && text.length > 0 && sel && sel.rangeCount > 0) {
      setSelectedText(text)
      const range = sel.getRangeAt(0)
      setSelectedRange(range.cloneRange())
      const rect = range.getBoundingClientRect()
      const MENU_H = 56
      const MENU_HALF = 180
      const vw = window.innerWidth
      const vh = window.innerHeight
      // Clamp X so the menu (≈360px wide) never overflows horizontally.
      let x = rect.left + rect.width / 2
      x = Math.max(MENU_HALF + 8, Math.min(vw - MENU_HALF - 8, x))
      // Prefer above the selection; fall back to below if hidden by toolbar.
      let y = rect.top - MENU_H - 8
      if (y < 72) y = rect.bottom + 8
      // If still off the bottom (tiny viewport), pin above with a small gap.
      if (y + MENU_H > vh - 8) y = Math.max(72, rect.top - MENU_H - 8)
      setMenuPosition({ x, y })
      setShowTextMenu(true)
    } else {
      setShowTextMenu(false)
      setSelectedRange(null)
    }
  }, [])

  // ---- Dictionary ----
  const handleShowDictionary = useCallback(() => {
    if (selectedText.trim()) {
      onShowDictionary(selectedText)
      setShowTextMenu(false)
    }
  }, [selectedText, onShowDictionary])

  // ---- Add to vocabulary (with AbortController) ----
  const handleAddToVocab = useCallback(() => {
    const word = selectedText.trim()
    if (!word) return
    // Abort any in-flight request before starting a new one.
    vocabAbortRef.current?.abort()
    const ctrl = new AbortController()
    vocabAbortRef.current = ctrl
    fetch('/api/vocabulary', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ word, bookSlug: book.slug }),
      signal: ctrl.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('vocab request failed')
        emit({ type: 'vocab-added' })
      })
      .catch((err) => {
        // AbortError is expected on unmount / supersession — don't toast.
        if (err instanceof DOMException && err.name === 'AbortError') return
        emit({ type: 'vocab-error' })
      })
    setShowTextMenu(false)
  }, [selectedText, book.slug, emit])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(selectedText)
    emit({ type: 'copied' })
    setShowTextMenu(false)
  }, [selectedText, emit])

  const currentParagraphPlainText = useCallback(() => {
    const page = book.pages[currentParagraph]
    if (!page) return ''
    return page.items
      .map((i) => (currentLanguage === 'english' ? i.english : i.farsi))
      .join('\n\n')
  }, [book.pages, currentParagraph, currentLanguage])

  // ---- Share current page / quote ----
  const handleShare = useCallback(async () => {
    const url =
      typeof window !== 'undefined' ? window.location.href : ''
    const snippet = currentParagraphPlainText().slice(0, 280)
    const shareText = `«${snippet}»\n— ${book.title}${
      book.author ? ` · ${book.author}` : ''
    }`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: book.title, text: shareText, url })
        return
      } catch {
        // user dismissed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${url}`)
      emit({ type: 'share-success' })
    } catch {
      emit({ type: 'share-error' })
    }
  }, [book.title, book.author, currentParagraphPlainText, emit])

  const closeTextMenu = useCallback(() => setShowTextMenu(false), [])

  return {
    selectedText,
    selectedRange,
    showTextMenu,
    setShowTextMenu,
    closeTextMenu,
    menuPosition,
    handleTextSelection,
    handleShowDictionary,
    handleAddToVocab,
    handleCopy,
    handleShare,
    currentParagraphPlainText,
  }
}
