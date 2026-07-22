'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * All actions the reader can trigger via the keyboard.
 * The reader component owns the actual logic; this hook just dispatches.
 */
export interface ReaderShortcutHandlers {
  /** Scroll to the next paragraph (forward in reading direction). */
  nextParagraph: () => void
  /** Scroll to the previous paragraph. */
  prevParagraph: () => void
  /** Scroll down by roughly one viewport. */
  pageDown: () => void
  /** Scroll up by roughly one viewport. */
  pageUp: () => void
  /** Jump to the first paragraph. */
  jumpToStart: () => void
  /** Jump to the last paragraph. */
  jumpToEnd: () => void
  /** Toggle immersive focus mode. */
  toggleFocusMode: () => void
  /** Toggle the settings panel. */
  toggleSettings: () => void
  /** Toggle the highlights panel. */
  toggleHighlights: () => void
  /** Toggle the chapters panel. */
  toggleChapters: () => void
  /** Toggle subtitles / translation. */
  toggleSubtitles: () => void
  /** Toggle primary language EN ↔ FA. */
  toggleLanguage: () => void
  /** Toggle the AI chat panel. */
  toggleChat: () => void
  /** Cycle through the available themes (light → sepia → dark → high-contrast). */
  cycleTheme: () => void
  /** Increase the reading font size by one step. */
  increaseFontSize: () => void
  /** Decrease the reading font size by one step. */
  decreaseFontSize: () => void
  /** Close any open panel (and exit focus mode). */
  closeAll: () => void
}

function isEditableTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false
  const tag = t.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (t.isContentEditable) return true
  if (t.closest('[data-reader-input="true"]')) return true
  return false
}

/**
 * Wires up the reader's keyboard shortcuts on `window`. Safe to call from
 * the reader component — handlers are read from a ref so the listener never
 * goes stale between renders. Returns the help-overlay visibility state plus
 * a toggle, so the reader can render a `?` button that opens the overlay.
 */
export function useReaderKeyboardShortcuts(handlers: ReaderShortcutHandlers) {
  const [showHelp, setShowHelp] = useState(false)

  const handlersRef = useRef(handlers)
  const showHelpRef = useRef(showHelp)

  useEffect(() => {
    handlersRef.current = handlers
  })
  useEffect(() => {
    showHelpRef.current = showHelp
  }, [showHelp])

  const toggleHelp = useCallback(() => {
    setShowHelp((v) => !v)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Never intercept the browser's own shortcuts (Ctrl/Cmd/Alt/Option).
      if (e.ctrlKey || e.metaKey || e.altKey) return

      // Don't hijack typing in inputs / textareas / contenteditable.
      if (isEditableTarget(e.target)) return

      // `?` requires Shift on most layouts — accept `?` directly.
      if (e.key === '?') {
        e.preventDefault()
        toggleHelp()
        return
      }

      const h = handlersRef.current

      switch (e.key) {
        case 'ArrowLeft':
          // RTL: ← moves forward to the next paragraph.
          e.preventDefault()
          h.nextParagraph()
          break
        case 'ArrowRight':
          e.preventDefault()
          h.prevParagraph()
          break
        case 'j':
        case 'J':
          // Vim-style "next" — same direction as ArrowLeft (forward).
          e.preventDefault()
          h.nextParagraph()
          break
        case 'k':
        case 'K':
          // Vim-style "previous" — same direction as ArrowRight (back).
          e.preventDefault()
          h.prevParagraph()
          break
        case ' ':
          e.preventDefault()
          if (e.shiftKey) h.pageUp()
          else h.pageDown()
          break
        case 'PageDown':
          e.preventDefault()
          h.pageDown()
          break
        case 'PageUp':
          e.preventDefault()
          h.pageUp()
          break
        case 'Home':
          e.preventDefault()
          h.jumpToStart()
          break
        case 'End':
          e.preventDefault()
          h.jumpToEnd()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          h.toggleFocusMode()
          break
        case 's':
        case 'S':
          e.preventDefault()
          h.toggleSettings()
          break
        case 'h':
        case 'H':
          e.preventDefault()
          h.toggleHighlights()
          break
        case 'c':
        case 'C':
          e.preventDefault()
          h.toggleChapters()
          break
        case 't':
        case 'T':
          // Shift+T cycles themes; plain T toggles subtitles (legacy).
          if (e.shiftKey) {
            e.preventDefault()
            h.cycleTheme()
          } else {
            e.preventDefault()
            h.toggleSubtitles()
          }
          break
        case 'l':
        case 'L':
          e.preventDefault()
          h.toggleLanguage()
          break
        case 'a':
        case 'A':
          e.preventDefault()
          h.toggleChat()
          break
        case '+':
        case '=':
          // `=` is the unshifted `+` on most layouts.
          e.preventDefault()
          h.increaseFontSize()
          break
        case '-':
        case '_':
          e.preventDefault()
          h.decreaseFontSize()
          break
        case 'Escape':
          if (showHelpRef.current) {
            setShowHelp(false)
            return
          }
          h.closeAll()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleHelp])

  return { showHelp, setShowHelp, toggleHelp }
}
