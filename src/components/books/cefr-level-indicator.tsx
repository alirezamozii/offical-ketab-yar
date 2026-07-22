'use client'

/**
 * src/components/books/cefr-level-indicator.tsx
 * ---------------------------------------------------------------
 * Visual CEFR (Common European Framework of Reference) level bar.
 * Renders all 6 levels (A1 → C2) as a horizontal pill row with the
 * book's level highlighted. Color-coded from green (beginner) to
 * deep gold (advanced) to match the Ketab-Yar gold/bronze palette
 * (NO indigo/blue per design rules).
 *
 * Persian level descriptors:
 *   A1 = مبتدی مطلق   (complete beginner)
 *   A2 = مبتدی         (beginner)
 *   B1 = متوسط         (intermediate)
 *   B2 = متوسط پیشرفته (upper-intermediate)
 *   C1 = پیشرفته        (advanced)
 *   C2 = مسلط           (mastery)
 *
 * Owner: CRON-REVIEW-202607171225
 * ---------------------------------------------------------------
 */

import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
type Level = (typeof LEVELS)[number]

const LEVEL_LABELS_FA: Record<Level, string> = {
  A1: 'مبتدی مطلق',
  A2: 'مبتدی',
  B1: 'متوسط',
  B2: 'متوسط پیشرفته',
  C1: 'پیشرفته',
  C2: 'مسلط',
}

/**
 * Per-level tint. Uses the gold/bronze family — lightest for A1,
 * deepest for C2. All values are Tailwind classes so they survive
 * purge. Kept within the warm-earth palette (no blue/indigo).
 */
const LEVEL_TINTS: Record<Level, string> = {
  A1: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40 dark:text-emerald-400',
  A2: 'bg-teal-500/15 text-teal-700 border-teal-500/40 dark:text-teal-400',
  B1: 'bg-gold-500/20 text-gold-700 border-gold-500/50 dark:text-gold-400',
  B2: 'bg-amber-600/20 text-amber-700 border-amber-600/50 dark:text-amber-400',
  C1: 'bg-orange-700/20 text-orange-800 border-orange-700/50 dark:text-orange-400',
  C2: 'bg-red-800/20 text-red-800 border-red-800/50 dark:text-red-400',
}

/** Inactive level chip — muted, just a reference point. */
const INACTIVE_TINT =
  'bg-muted/50 text-muted-foreground border-border/60'

interface CefrLevelIndicatorProps {
  /** CEFR level string, e.g. "B1". Falls back to B1 if unknown. */
  level: string
  /** Compact mode: just the highlighted chip + Persian label. */
  compact?: boolean
  className?: string
}

function normalizeLevel(raw: string): Level {
  const upper = raw.trim().toUpperCase()
  return (LEVELS as readonly string[]).includes(upper) ? (upper as Level) : 'B1'
}

export function CefrLevelIndicator({
  level,
  compact = false,
  className,
}: CefrLevelIndicatorProps) {
  const reduceMotion = useReducedMotion()
  const current = normalizeLevel(level)
  const currentIndex = LEVELS.indexOf(current)
  const label = LEVEL_LABELS_FA[current]

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold',
          LEVEL_TINTS[current],
          className,
        )}
      >
        <span className="tabular-nums">{current}</span>
        <span className="font-medium opacity-80">·</span>
        <span className="font-medium">{label}</span>
      </span>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Level chips row */}
      <div className="flex items-center gap-1.5" role="img" aria-label={`سطح زبان: ${current} — ${label}`}>
        {LEVELS.map((lvl, i) => {
          const isCurrent = lvl === current
          const isPassed = i < currentIndex
          return (
            <span
              key={lvl}
              aria-hidden={!isCurrent}
              className={cn(
                'flex h-7 flex-1 items-center justify-center rounded-lg border text-[10px] font-bold tabular-nums transition-[transform,opacity,colors,border-color,background-color] sm:text-xs',
                isCurrent
                  ? cn('scale-110 shadow-sm', LEVEL_TINTS[lvl])
                  : isPassed
                    ? 'bg-muted/40 text-muted-foreground/70 border-border/50'
                    : INACTIVE_TINT,
              )}
              style={
                isCurrent && !reduceMotion
                  ? { transitionDelay: '0.05s' }
                  : undefined
              }
            >
              {lvl}
            </span>
          )
        })}
      </div>
      {/* Persian descriptor */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">سطح زبان</span>
        <span className="text-xs font-semibold text-foreground">
          {current} · {label}
        </span>
      </div>
    </div>
  )
}
