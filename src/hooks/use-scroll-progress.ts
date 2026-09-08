'use client'

import { useEffect, useRef } from 'react'

/**
 * useScrollProgress — SINGLETON scroll progress manager.
 *
 * Problem this solves:
 *   Multiple components (header progress bar, back-to-top ring, bottom-nav)
 *   each called `useScrollDirection` independently, which attached 3
 *   separate scroll listeners and triggered 3 separate React state
 *   updates on every scroll tick → laggy, janky progress bars.
 *
 * Solution:
 *   This hook attaches exactly ONE scroll listener to `window` (lazily,
 *   on first subscriber) and broadcasts progress to all subscribers via
 *   direct callbacks — NOT React state. Each subscriber updates its own
 *   DOM directly via refs, so there are ZERO re-renders on scroll.
 *
 * The callback receives `(progress, scrollY)` where:
 *   - progress: 0..1 (clamped, = scrollY / maxScroll)
 *   - scrollY: raw window.scrollY in px
 *
 * Usage:
 *   const barRef = useRef<HTMLDivElement>(null)
 *   useScrollProgress(useCallback((progress) => {
 *     if (barRef.current) {
 *       barRef.current.style.transform = `scaleX(${progress})`
 *     }
 *   }, []))
 *
 * Performance:
 *   - 1 listener total (not N per component)
 *   - rAF-throttled → 60fps max
 *   - passive listener → non-blocking
 *   - no React state → no re-renders
 */

type ScrollCallback = (progress: number, scrollY: number) => void

// ── Module-level singleton state ─────────────────────────────────────────
// Lives outside React so all subscribers share ONE listener.
let currentScrollY = 0
let currentProgress = 0
const subscribers = new Set<ScrollCallback>()
let rafId: number | null = null
let listenerAttached = false

function recompute() {
  rafId = null
  if (typeof window === 'undefined') return

  currentScrollY = window.scrollY
  const scrollHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body?.scrollHeight || 0,
  )
  const clientHeight = window.innerHeight || document.documentElement.clientHeight || 0
  const maxScroll = Math.max(0, scrollHeight - clientHeight)

  currentProgress =
    maxScroll > 0
      ? Math.min(1, Math.max(0, currentScrollY / maxScroll))
      : 0

  // Broadcast to all subscribers. Direct callback, no React state.
  for (const cb of subscribers) {
    cb(currentProgress, currentScrollY)
  }
}

function onScroll() {
  if (rafId !== null) return // already scheduled
  rafId = requestAnimationFrame(recompute)
}

function onResize() {
  if (rafId === null) {
    rafId = requestAnimationFrame(recompute)
  }
}

function ensureListener() {
  if (listenerAttached || typeof window === 'undefined') return
  listenerAttached = true
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize, { passive: true })
  document.addEventListener('visibilitychange', onResize, { passive: true })
  if (typeof window !== 'undefined' && window.scrollY > 0) {
    requestAnimationFrame(recompute)
  }
}

function maybeRemoveListener() {
  if (subscribers.size > 0 || !listenerAttached || typeof window === 'undefined') return
  listenerAttached = false
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onResize)
  document.removeEventListener('visibilitychange', onResize)
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

/**
 * Subscribe to scroll progress updates. The callback is called on every
 * scroll tick (rAF-throttled) with the latest `(progress, scrollY)`.
 *
 * IMPORTANT: the callback should be stable (wrap in `useCallback` with
 * empty deps, or pass a ref-based updater) so we don't re-subscribe on
 * every render.
 */
export function useScrollProgress(callback: ScrollCallback) {
  const cbRef = useRef<ScrollCallback>(callback)

  useEffect(() => {
    cbRef.current = callback
  })

  useEffect(() => {
    ensureListener()
    const sub: ScrollCallback = (p, y) => cbRef.current(p, y)
    subscribers.add(sub)
    // Initial emit without forcing synchronous reflow
    sub(currentProgress, currentScrollY)
    if (typeof window !== 'undefined' && window.scrollY > 0) {
      requestAnimationFrame(recompute)
    }
    return () => {
      subscribers.delete(sub)
      maybeRemoveListener()
    }
  }, [])
}

/**
 * Convenience helper: subscribe and write `scaleX(progress)` to a ref'd
 * element's `transform`. Used by linear progress bars (e.g. the header
 * top bar).
 */
export function useScrollProgressScaleX(
  ref: React.RefObject<HTMLElement | null>,
  origin: 'left' | 'right' | 'center' = 'right',
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.transformOrigin = origin
    ensureListener()
    const sub: ScrollCallback = (p) => {
      el.style.transform = `scaleX(${p})`
    }
    subscribers.add(sub)
    sub(currentProgress, currentScrollY)
    if (typeof window !== 'undefined' && window.scrollY > 0) {
      requestAnimationFrame(recompute)
    }
    return () => {
      subscribers.delete(sub)
      maybeRemoveListener()
    }
  }, [ref, origin])
}
