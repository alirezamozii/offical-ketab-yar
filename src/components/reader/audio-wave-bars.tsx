'use client'

/**
 * AudioWaveBars — a small animated set of vertical bars used as a
 * "now playing" indicator inside the reader toolbar button and the
 * floating audio player bar.
 *
 * Honours `useReducedMotion()`: when the user prefers reduced motion,
 * the bars render as a static row instead of animating.
 *
 * Colors: gold/amber gradient (no indigo/blue) — see `bg-gradient-to-t`
 * from gold-400 to amber-500.
 */

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AudioWaveBarsProps {
  /** Number of bars to render. Default 4. */
  count?: number
  /** Play direction — `true` animates height; `false` renders static. */
  active?: boolean
  /** Tailwind class for the container. */
  className?: string
  /** Per-bar height range (px). */
  barClassName?: string
}

export function AudioWaveBars({
  count = 4,
  active = true,
  className,
  barClassName,
}: AudioWaveBarsProps) {
  const reduceMotion = useReducedMotion()
  const shouldAnimate = active && !reduceMotion

  // Deterministic per-bar delays so the loop feels organic but stable.
  const delays = [0, 0.15, 0.3, 0.45, 0.1, 0.25, 0.4, 0.05].slice(0, count)

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex h-4 items-end gap-[2px]',
        shouldAnimate && 'motion-safe:animate-pulse',
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => {
        const baseDelay = delays[i] ?? 0
        return (
          <motion.span
            key={i}
            className={cn(
              'inline-block w-[2.5px] rounded-full bg-gradient-to-t from-gold-500 to-amber-400',
              barClassName,
            )}
            initial={{ height: 4 }}
            animate={
              shouldAnimate
                ? {
                    height: [4, 14, 6, 12, 4],
                  }
                : { height: 6 }
            }
            transition={
              shouldAnimate
                ? {
                    duration: 0.9,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: baseDelay,
                  }
                : { duration: 0 }
            }
          />
        )
      })}
    </span>
  )
}
