'use client'

import { useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { useScrollProgress } from '@/hooks/use-scroll-progress'
import { cn } from '@/lib/utils'

/**
 * BackToTop — fixed FAB that appears after the user scrolls > 250px.
 * Smooth-scrolls to top on click. Respects reduced motion.
 *
 * The circular progress ring uses the singleton `useScrollProgress` hook
 * which updates the SVG `strokeDashoffset` directly via a ref — zero React
 * re-renders on scroll, staying in sync with the page scroll at 60fps.
 */
const RADIUS = 18
const CIRC = 2 * Math.PI * RADIUS

export function BackToTop() {
  const [visible, setVisible] = useState(false)
  const arcRef = useRef<SVGCircleElement>(null)
  const visibleRef = useRef(false)

  // Single subscription for both visibility check and progress arc update
  useScrollProgress((progress, scrollY) => {
    const isOver = scrollY > 250
    if (isOver !== visibleRef.current) {
      visibleRef.current = isOver
      setVisible(isOver)
    }

    const el = arcRef.current
    if (el) {
      const p = Math.min(1, Math.max(0, progress))
      el.style.strokeDashoffset = `${CIRC * (1 - p)}px`
    }
  })

  const handleClick = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo(0, 0)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="بازگشت به بالا"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={cn(
        'fixed end-4 z-30',
        'flex h-11 w-11 items-center justify-center',
        'rounded-full border border-border/70 bg-background/95 backdrop-blur-md',
        'text-foreground shadow-lg shadow-gold-500/10',
        'hover:border-gold-500/60 hover:text-gold-600 dark:hover:text-gold-400',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'no-tap-highlight touch-manipulation tap-target',
        'motion-safe:active:scale-90',
        'bottom-24 md:bottom-6',
        'transition-all duration-300 ease-out motion-reduce:transition-none',
        visible
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 scale-75 translate-y-2 pointer-events-none',
      )}
    >
      {/* Circular progress ring (SVG) */}
      <svg
        className="absolute inset-0 h-full w-full -rotate-90 pointer-events-none"
        viewBox="0 0 44 44"
        fill="none"
        aria-hidden="true"
      >
        {/* Track circle */}
        <circle
          cx="22"
          cy="22"
          r={RADIUS}
          className="stroke-border/40"
          strokeWidth="2.5"
        />
        {/* Progress arc — ref-driven, updates on every scroll tick */}
        <circle
          ref={arcRef}
          cx="22"
          cy="22"
          r={RADIUS}
          className="stroke-gold-500 dark:stroke-gold-400"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          style={{ strokeDashoffset: `${CIRC}px` }}
        />
      </svg>
      <ArrowUp className="relative h-5 w-5" />
    </button>
  )
}

