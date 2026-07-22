'use client'

/**
 * use-reader-panels — owns the panel-visibility state for the reader chrome.
 *
 * The god-hook kept 8 panel `useState`s in one bag. Toggling `showSettings`
 * re-rendered the toolbar (which doesn't read it), the content column
 * (which doesn't read it either), and the bottom bar — because they all
 * consumed the same single Context. Splitting the panel state into its own
 * hook (with its own slice of context in `reader-context.tsx`) isolates
 * the blast radius: only components that actually read `showSettings`
 * re-render.
 *
 * Owns: `showControls`, `showSettings`, `showHighlights`, `showChapters`,
 * `isFocusMode`, `showFocusHint`, plus the derived `chromeVisible` flag
 * and the `closeAllPanels` / `toggleFocusMode` helpers.
 *
 * Does NOT own `showChat` (lives in `use-reader-chat.ts`) or
 * `showDictionary` (lives in `use-reader-dictionary.ts`); the
 * `closeAllPanels` helper receives callbacks to close those too.
 */

import { useCallback, useEffect, useState } from 'react'

interface UseReaderPanelsOptions {
  /** Close the chat panel — owned by use-reader-chat.ts. */
  closeChat: () => void
  /** Close the dictionary popup — owned by use-reader-dictionary.ts. */
  closeDictionary: () => void
  /** Close the text-selection menu — owned by use-reader-selection.ts. */
  closeTextMenu: () => void
}

export function useReaderPanels({
  closeChat,
  closeDictionary,
  closeTextMenu,
}: UseReaderPanelsOptions) {
  const [showControls, setShowControls] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showHighlights, setShowHighlights] = useState(false)
  const [showChapters, setShowChapters] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [showFocusHint, setShowFocusHint] = useState(true)

  const closeAllPanels = useCallback(() => {
    setShowSettings(false)
    setShowHighlights(false)
    setShowChapters(false)
    setIsFocusMode(false)
    // Close panels owned by sibling hooks too — Esc should dismiss everything.
    closeTextMenu()
    closeDictionary()
    closeChat()
  }, [closeChat, closeDictionary, closeTextMenu])

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((v) => !v)
    // Hide chrome immediately when entering focus.
    setShowControls(false)
  }, [])

  // ---- Focus-mode hint auto-hide ----
  // Shows for ~3s after entering focus mode, then re-shows on any mouse move.
  useEffect(() => {
    if (!isFocusMode) {
      setShowFocusHint(true)
      return
    }
    setShowFocusHint(true)
    const id = window.setTimeout(() => setShowFocusHint(false), 3000)
    const onMove = () => setShowFocusHint(true)
    window.addEventListener('mousemove', onMove)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('mousemove', onMove)
    }
  }, [isFocusMode])

  // In focus mode, hide all chrome. We keep the top progress bar (very subtle)
  // and the exit hint. Otherwise show normal chrome when showControls.
  const chromeVisible = showControls && !isFocusMode

  return {
    showControls,
    setShowControls,
    showSettings,
    setShowSettings,
    showHighlights,
    setShowHighlights,
    showChapters,
    setShowChapters,
    isFocusMode,
    setIsFocusMode,
    showFocusHint,
    closeAllPanels,
    toggleFocusMode,
    chromeVisible,
  }
}
