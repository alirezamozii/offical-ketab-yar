'use client'

/**
 * use-reader-chat — owns the AI chat panel visibility state.
 *
 * The god-hook kept `showChat`/`setShowChat` next to 30 unrelated pieces
 * of state. Splitting it out means components that only care about the
 * chat panel (e.g. a future chat-only header button) can subscribe to
 * just this slice via `useReaderChat()` (the slice context in
 * `reader-context.tsx`) without re-rendering on scroll or selection
 * changes.
 *
 * The actual chat-message state + the fetch to `/api/ai/chat` still live
 * inside `ai-chat-panel.tsx` (out of scope for this refactor — that file
 * is owned by another agent). This hook is the visibility-state owner.
 */

import { useCallback, useState } from 'react'

export function useReaderChat() {
  const [showChat, setShowChat] = useState(false)

  const closeChat = useCallback(() => {
    setShowChat(false)
  }, [])

  return {
    showChat,
    setShowChat,
    closeChat,
  }
}
