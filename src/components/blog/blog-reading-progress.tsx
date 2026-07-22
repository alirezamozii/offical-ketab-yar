'use client'

/**
 * src/components/blog/blog-reading-progress.tsx
 * ---------------------------------------------------------------
 * A thin gold progress bar fixed to the top of the viewport that
 * fills as the reader scrolls through a blog post. Gives a visual
 * sense of "how much is left" and encourages completion.
 *
 * Uses a single scroll listener + rAF throttle (no re-renders —
 * mutates a ref'd element's width directly, matching the singleton
 * scroll-progress pattern used elsewhere in the app).
 *
 * Owner: CRON-REVIEW-202607171254
 * ---------------------------------------------------------------
 */

import { useEffect, useRef } from 'react'

export function BlogReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ticking = false

    function update() {
      ticking = false
      const el = barRef.current
      if (!el) return
      const scrollTop = window.scrollY
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0
      el.style.width = `${pct}%`
      el.style.opacity = pct > 1 ? '1' : '0'
    }

    function onScroll() {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    update() // initial

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] h-1 bg-transparent"
      aria-hidden="true"
    >
      <div
        ref={barRef}
        className="h-full bg-gradient-to-l from-gold-500 via-gold-400 to-gold-600 shadow-[0_0_8px_rgba(184,149,106,0.5)] transition-[width,opacity] duration-75 ease-out"
        style={{ width: '0%', opacity: 0 }}
      />
    </div>
  )
}
