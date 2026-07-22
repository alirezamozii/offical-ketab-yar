'use client'

/**
 * Decoupled event bus for the reader sub-hooks.
 *
 * Audit 03 (§2.2 "toast.* inside business logic") flagged that the
 * god-hook called `toast.success`/`toast.error` directly from inside
 * its callbacks. That couples the business logic to a specific UI
 * library (sonner) and makes the hook untestable without mocking the
 * toast global.
 *
 * This module defines a small typed event protocol + a tiny `useReaderEventBus`
 * hook. Sub-hooks emit semantic events ("highlight-added", "vocab-added",
 * "share-error" …) via the `emit` callback the orchestrator passes in.
 * `use-reader-notifications.ts` subscribes to the last emitted event and
 * fires the appropriate `sonner` toast. The business logic stays pure; the
 * UI library lives in exactly one place.
 *
 * The bus carries an opaque `nonce` so consecutive events of the same
 * shape still trigger the subscriber's `useEffect` dependency.
 */

import { useCallback, useRef, useState } from 'react'

export type ReaderEvent =
  | { type: 'highlight-added' }
  | { type: 'vocab-added' }
  | { type: 'vocab-error' }
  | { type: 'copied' }
  | { type: 'bookmark-added' }
  | { type: 'bookmark-removed' }
  | { type: 'share-success' }
  | { type: 'share-error' }

export type ReaderEmit = (event: ReaderEvent) => void

export interface ReaderBusEntry {
  event: ReaderEvent
  /** Strictly-increasing nonce so identical consecutive events still register. */
  nonce: number
}

/**
 * Minimal event-bus hook. Returns the most recent emitted event (with a
 * nonce) plus a stable `emit` callback suitable for passing into other
 * hooks without busting their `useCallback` memoization.
 */
export function useReaderEventBus(): {
  lastEntry: ReaderBusEntry | null
  emit: ReaderEmit
} {
  const counterRef = useRef(0)
  const [lastEntry, setLastEntry] = useState<ReaderBusEntry | null>(null)

  const emit = useCallback((event: ReaderEvent) => {
    counterRef.current += 1
    setLastEntry({ event, nonce: counterRef.current })
  }, [])

  return { lastEntry, emit }
}
