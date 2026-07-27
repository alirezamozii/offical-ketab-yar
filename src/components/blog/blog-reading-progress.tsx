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

import { useRef } from 'react'
import { useScrollProgressScaleX } from '@/hooks/use-scroll-progress'

export function BlogReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null)
  useScrollProgressScaleX(barRef, 'right')

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] h-1 bg-transparent"
      aria-hidden="true"
    >
      <div
        ref={barRef}
        className="h-full w-full origin-right bg-gradient-to-l from-gold-500 via-gold-400 to-gold-600 shadow-[0_0_8px_rgba(184,149,106,0.5)] gpu-layer"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  )
}
