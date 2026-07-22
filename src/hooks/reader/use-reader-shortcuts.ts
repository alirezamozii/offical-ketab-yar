'use client'

/**
 * use-reader-shortcuts — thin wrapper that composes the existing
 * `useReaderKeyboardShortcuts` hook with the reader's panel/scroll/theme
 * handlers.
 *
 * The god-hook assembled the `ReaderShortcutHandlers` object inline and
 * passed it to `useReaderKeyboardShortcuts`. Splitting this out keeps
 * the orchestrator readable and lets the shortcuts wiring be tested in
 * isolation.
 *
 * The handlers are passed in by the orchestrator (composed from the
 * scroll / panels / chat / prefs hooks). Returns the help-overlay state
 * for the `?` key.
 */

import {
  useReaderKeyboardShortcuts,
  type ReaderShortcutHandlers,
} from '@/hooks/reader/use-reader-keyboard-shortcuts'

export function useReaderShortcuts(handlers: ReaderShortcutHandlers) {
  return useReaderKeyboardShortcuts(handlers)
}

export type { ReaderShortcutHandlers }
