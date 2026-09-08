'use client'

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

// ── Module-level singleton scroll listener ───────────────────────────────
type Subscriber = (scrollY: number, dir: ScrollDirection) => void

const subscribers = new Set<Subscriber>()
let listenerAttached = false
let rafId: number | null = null
let lastY = 0
let lastDir: ScrollDirection = 'idle'

function onFrame() {
  rafId = null
  const y = window.scrollY
  const delta = y - lastY

  let dir: ScrollDirection = lastDir
  if (Math.abs(delta) >= 6) {
    dir = delta > 0 ? 'down' : 'up'
  }

  lastY = y
  lastDir = dir

  for (const sub of subscribers) {
    sub(y, dir)
  }
}

function handleScroll() {
  if (rafId !== null) return
  rafId = requestAnimationFrame(onFrame)
}

function ensureListener() {
  if (listenerAttached || typeof window === 'undefined') return
  listenerAttached = true
  lastY = 0
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll, { passive: true })
}

function maybeRemoveListener() {
  if (subscribers.size > 0 || !listenerAttached || typeof window === 'undefined') return
  listenerAttached = false
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

export function useScrollDirection(
  threshold = 35,
  hideThreshold = 120,
  expandThreshold = 5,
): ScrollState {
  const [state, setState] = useState<ScrollState>(DEFAULT_STATE)
  const lastValues = useRef<ScrollState>(DEFAULT_STATE)

  useEffect(() => {
    ensureListener()

    const sub: Subscriber = (y, dir) => {
      const currentlyScrolled = lastValues.current.scrolled
      const scrolled = currentlyScrolled ? y > expandThreshold : y > threshold
      const hidden = y > hideThreshold && dir === 'down'

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
    }

    subscribers.add(sub)
    // Run once after initial paint via requestAnimationFrame to avoid forced reflow during hydration
    if (typeof window !== 'undefined' && window.scrollY > 0) {
      requestAnimationFrame(() => {
        sub(window.scrollY, lastDir)
      })
    }

    return () => {
      subscribers.delete(sub)
      maybeRemoveListener()
    }
  }, [threshold, hideThreshold, expandThreshold])

  return state
}

