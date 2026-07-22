'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface AutoScrollOptions {
  /** seconds between auto-scroll advances */
  intervalSeconds: number
  /**
   * Called on each tick. Should advance the scroll position (e.g. scroll
   * down by one viewport). Return `false` to signal "no more to read" which
   * stops the auto-scroll; return `true` to keep going.
   */
  onTick: () => boolean
}

/**
 * Auto-scroll mode for continuous reading. On each interval it calls `onTick`,
 * which is expected to smoothly scroll the reading column down by roughly one
 * viewport. When `onTick` returns `false` (e.g. already at the bottom) the
 * auto-scroll stops automatically. Pauses when the tab is hidden.
 */
export function useAutoScroll({ intervalSeconds, onTick }: AutoScrollOptions) {
  const [active, setActive] = useState(false)
  const [remaining, setRemaining] = useState(intervalSeconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onTickRef = useRef(onTick)
  const intervalRef2 = useRef(intervalSeconds)

  useEffect(() => {
    onTickRef.current = onTick
  }, [onTick])
  useEffect(() => {
    intervalRef2.current = intervalSeconds
    if (active) setRemaining(intervalSeconds)
  }, [intervalSeconds, active])

  const stop = useCallback(() => {
    setActive(false)
    setRemaining(intervalRef2.current)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    setActive(true)
    setRemaining(intervalRef2.current)
  }, [])

  const toggle = useCallback(() => {
    if (active) stop()
    else start()
  }, [active, start, stop])

  useEffect(() => {
    if (!active) return

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') stop()
    }
    document.addEventListener('visibilitychange', onVisibility)

    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          const keepGoing = onTickRef.current()
          if (!keepGoing) {
            // schedule stop outside the state updater
            queueMicrotask(stop)
            return 0
          }
          return intervalRef2.current
        }
        return r - 1
      })
    }, 1000)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [active, stop])

  return { active, remaining, start, stop, toggle }
}
