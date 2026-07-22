'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { useScrollDirection } from '@/hooks/use-scroll-direction'
import { useScrollProgress } from '@/hooks/use-scroll-progress'
import { useIsMobile } from '@/hooks/use-mobile'

/**
 * BackToTop — fixed FAB that appears after the user scrolls > 500px.
 * Smooth-scrolls to top on click. Respects reduced motion.
 *
 * Performance fix (per user feedback "لگ میزنه و دیر کار میکنه"):
 *   The circular progress ring now uses the singleton `useScrollProgress`
 *   hook which updates the SVG `strokeDashoffset` DIRECTLY via a ref —
 *   no React state changes, no re-renders on scroll. This is the same
 *   singleton system that drives the header progress bar, so both stay
 *   perfectly in sync at 60fps with only ONE window scroll listener.
 *
 *   `useScrollDirection` is still used for the `hidden` state (smart-hide
 *   on scroll-down) because that's a binary state that only changes on
 *   direction flips, not on every scroll tick.
 */
const RADIUS = 18
const CIRC = 2 * Math.PI * RADIUS

export function BackToTop() {
  const [visible, setVisible] = useState(false)
  const prefersReduced = useReducedMotion()
  const isMobile = useIsMobile()
  const { hidden: navHidden } = useScrollDirection(8, 120)
  // Ref to the progress arc circle — updated directly by the singleton
  // scroll hook, bypassing React state entirely.
  const arcRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    setVisible(window.scrollY > 500)
    const onScroll = () => setVisible(window.scrollY > 500)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Subscribe to the singleton scroll progress system. This writes
  // `strokeDashoffset` directly to the SVG circle element — zero re-renders.
  useScrollProgress((progress) => {
    const el = arcRef.current
    if (!el) return
    const p = Math.min(1, Math.max(0, progress))
    el.setAttribute('stroke-dashoffset', String(CIRC * (1 - p)))
  })

  const handleClick = () => {
    if (prefersReduced) {
      window.scrollTo(0, 0)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const show = visible && !(isMobile && navHidden)

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          onClick={handleClick}
          aria-label="بازگشت به بالا"
          initial={
            prefersReduced
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.6, y: 8 }
          }
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={
            prefersReduced
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.6, y: 8 }
          }
          transition={
            prefersReduced
              ? { duration: 0.12 }
              : { type: 'spring', stiffness: 500, damping: 30 }
          }
          whileTap={prefersReduced ? undefined : { scale: 0.9 }}
          className="
            fixed end-4 z-30
            flex h-11 w-11 items-center justify-center
            rounded-full border border-border/70 bg-background/90 backdrop-blur
            text-foreground shadow-lg shadow-primary/10
            transition-colors hover:border-primary hover:text-primary
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
            no-tap-highlight touch-manipulation tap-target
            bottom-24 md:bottom-6
          "
        >
          {/* ─── Circular progress ring (SVG) ───
              Plain SVG circles. The progress arc's `stroke-dashoffset` is
              updated DIRECTLY by the singleton useScrollProgress hook via
              the ref above — no React state, no re-renders, smooth 60fps. */}
          <svg
            className="absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 44 44"
            fill="none"
            aria-hidden
          >
            {/* Track */}
            <circle
              cx="22"
              cy="22"
              r={RADIUS}
              stroke="hsl(var(--border))"
              strokeWidth="2"
              opacity="0.5"
            />
            {/* Progress arc — ref-driven, updates on every scroll tick */}
            <circle
              ref={arcRef}
              cx="22"
              cy="22"
              r={RADIUS}
              stroke="hsl(var(--primary))"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC}
            />
          </svg>
          <ArrowUp className="relative h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
