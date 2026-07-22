'use client'

/**
 * TTSProvider + useTTSContext — share a single useTTS() playback instance
 * across multiple UIs in the same tree (e.g. the reader toolbar button and
 * the floating bottom audio-player-bar). Lives in its own .tsx file because
 * the Provider contains JSX; the underlying `useTTS` hook stays in
 * `./use-tts.ts` as pure TypeScript.
 *
 * Vocabulary dialog/cards do NOT use this provider — they call `useTTS()`
 * directly so their playback is independent of the reader's.
 */

import { createContext, useContext, type ReactNode } from 'react'
import { useTTS, type UseTTSReturn } from './use-tts'

const TTSContext = createContext<UseTTSReturn | null>(null)

export function TTSProvider({
  children,
}: {
  children: ReactNode
}) {
  const tts = useTTS()
  return <TTSContext.Provider value={tts}>{children}</TTSContext.Provider>
}

export function useTTSContext(): UseTTSReturn {
  const ctx = useContext(TTSContext)
  if (!ctx) {
    throw new Error('useTTSContext must be used within a <TTSProvider>')
  }
  return ctx
}

/**
 * `useTTSOrStandalone` — convenience wrapper that returns the shared
 * context if available, otherwise creates a fresh standalone useTTS()
 * instance. Useful for components that should hook into the reader's
 * playback when rendered inside the reader but otherwise play their
 * own audio (e.g. a vocab-pronunciation button used both in the
 * standalone /vocabulary page and inside a reader popover).
 *
 * NOTE: hooks rules forbid conditional hook calls, so we always call
 * `useTTS()` internally and pick the context value when present.
 */
export function useTTSOrStandalone(): UseTTSReturn {
  const ctx = useContext(TTSContext)
  const standalone = useTTS()
  return ctx ?? standalone
}
