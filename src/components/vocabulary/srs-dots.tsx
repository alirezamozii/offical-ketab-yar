'use client'

import { boxColor, type SrsBox } from '@/hooks/reader/use-srs'
import { cn } from '@/lib/utils'
import { memo } from 'react'

/**
 * 7-dot indicator for a word's SRS box level (Leitner 7-box).
 * Dots 1..box are filled with the box color; the rest are dim.
 *
 * The 7 dots are split visually: 4 + 3, with a small gap between the
 * "learning" group (boxes 1-3) and the "familiar/mastered" group
 * (boxes 4-7), echoing the mastery-bucket grouping.
 *
 * Wrapped in `React.memo` because SrsDots is rendered once per word
 * in the vocabulary list (potentially 50+ rows). Each row re-renders
 * on parent state changes (selection, filter, TTS playback), but
 * SrsDots only depends on `box` (a number) — memo skips the re-render
 * when `box` hasn't changed.
 */
export const SrsDots = memo(function SrsDots({
  box,
  size = 'sm',
  className,
}: {
  box: SrsBox
  size?: 'sm' | 'md'
  className?: string
}) {
  const dot = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'
  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      role="img"
      aria-label={`سطح یادگیری ${box} از ۷`}
      title={`سطح ${box} از ۷`}
    >
      {[1, 2, 3].map((i) => {
        const filled = i <= box
        const col =
          filled && i === box
            ? boxColor(box)
            : filled
              ? boxColor(i as SrsBox)
              : 'bg-muted-foreground/20'
        return (
          <span
            key={i}
            className={cn('rounded-full transition-colors', dot, col)}
          />
        )
      })}
      <span className="mx-0.5 h-1 w-px bg-border/60" aria-hidden />
      {[4, 5, 6, 7].map((i) => {
        const filled = i <= box
        const col =
          filled && i === box
            ? boxColor(box)
            : filled
              ? boxColor(i as SrsBox)
              : 'bg-muted-foreground/20'
        return (
          <span
            key={i}
            className={cn('rounded-full transition-colors', dot, col)}
          />
        )
      })}
    </span>
  )
})
