'use client'

import { useEffect } from 'react'

/**
 * useOptimizedScroll — Zero-State CSS Variable Scroll Engine.
 *
 * Attaches exactly ONE passive listener to window that writes `--scroll-progress`
 * (a 0 to 1 decimal string) directly to `document.documentElement.style`.
 *
 * Visual elements (top progress bar, back-to-top FAB ring/button) read
 * `var(--scroll-progress)` in CSS, running 100% on GPU hardware with
 * ZERO React `useState` calls and ZERO re-renders on scroll.
 */
export function useOptimizedScroll() {
  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const winScroll = window.scrollY
          const height = Math.max(
            1,
            document.documentElement.scrollHeight - window.innerHeight,
          )
          const scrolled = Math.min(1, Math.max(0, winScroll / height))

          document.documentElement.style.setProperty(
            '--scroll-progress',
            scrolled.toFixed(4),
          )

          ticking = false
        })
        ticking = true
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])
}
