'use client'

/**
 * useScrollDirection — tracks scroll direction + binary visibility states
 * for smart-hide UI patterns (header shrink, bottom-nav hide-on-scroll-down).
 *
 * PERFORMANCE FIX (per user feedback "لگ میزنه و دیر کار میکنه"):
 *   The previous version called `setState` on EVERY scroll tick with a new
 *   object (even when nothing changed), causing constant re-renders across
 *   3 layout components. Now we only call `setState` when one of the
 *   tracked values ACTUALLY CHANGES — `scrolled`, `direction`, or `hidden`.
 *   This eliminates ~99% of the re-renders during scrolling.
 *
 *   Smooth progress values (for progress bars/rings) are NO LONGER in
 *   React state — use the singleton `useScrollProgress` hook for those,
 *   which updates the DOM directly without any re-renders.
 *
 * Returns:
 *   - `scrolled`  true once the user scrolls past `threshold` px (default 8)
 *   - `direction` 'up' | 'down' | 'idle'
 *   - `hidden`    true when scrolling DOWN past `hideThreshold`
 *
 * SSR-safe: returns defaults on first render.
 */
import { useEffect, useRef, useState } from 'react'

export type ScrollDirection = 'up' | 'down' | 'idle'

export interface ScrollState {
  scrolled: boolean
  direction: ScrollDirection
  hidden: boolean
}

const DEFAULT_STATE: ScrollState = {
  scrolled: false,
  direction: 'idle',
  hidden: false,
}

export function useScrollDirection(
  threshold = 8,
  hideThreshold = 120,
): ScrollState {
  const [state, setState] = useState<ScrollState>(DEFAULT_STATE)
  // Track the last values in refs so we can diff and only setState
  // when something actually changes. This is the key optimization.
  const lastValues = useRef<ScrollState>(DEFAULT_STATE)
  // Track raw scroll position for direction calc — kept in ref, not state.
  const lastY = useRef(0)
  const lastDir = useRef<ScrollDirection>('idle')

  useEffect(() => {
    let ticking = false

    const update = () => {
      ticking = false
      const y = window.scrollY

      const delta = y - lastY.current
      let dir: ScrollDirection = lastDir.current
      // Deadband — ignore tiny movements so the UI doesn't flap on touch jitter.
      if (Math.abs(delta) < 6) {
        dir = lastDir.current === 'idle' ? 'idle' : lastDir.current
      } else {
        dir = delta > 0 ? 'down' : 'up'
      }

      const scrolled = y > threshold
      const hidden = y > hideThreshold && dir === 'down'

      // Only setState if something actually changed — this is what
      // eliminates the per-scroll re-renders.
      const prev = lastValues.current
      if (
        prev.scrolled !== scrolled ||
        prev.direction !== dir ||
        prev.hidden !== hidden
      ) {
        const next = { scrolled, direction: dir, hidden }
        lastValues.current = next
        setState(next)
      }

      lastY.current = y
      lastDir.current = dir
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }

    update() // initial state
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [threshold, hideThreshold])

  return state
}
