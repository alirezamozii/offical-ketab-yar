'use client'

/**
 * GameHud — shared heads-up display for the vocabulary mini-games.
 *
 * Renders:
 *  • Hearts row (lives remaining)
 *  • XP + streak + combo multiplier
 *  • Progress dots (one per question)
 *  • Per-question countdown timer (with low-time warning + tick sound
 *    trigger via onTickLow)
 *
 * Combo multiplier: every 3 correct answers in a row bumps the
 * multiplier (1× → 1.5× → 2× → 2.5× …). Displayed as a gold pill that
 * animates on increment.
 */

import { motion, useReducedMotion } from 'framer-motion'
import { Clock, Flame, Heart, Zap } from 'lucide-react'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { fmtTime } from '@/components/vocabulary/game-utils'

export interface GameHudProps {
  lives: number
  totalXP: number
  streak: number
  qIndex: number
  totalQuestions: number
  timeLeft: number
  maxHearts?: number
  /** Show the clock icon next to the timer (match game only). */
  showClock?: boolean
  /** Current combo multiplier (e.g. 1, 1.5, 2). 0 hides the pill. */
  multiplier?: number
  /** Called when timeLeft hits 3, 2, 1 — for the tick sound effect. */
  onTickLow?: (secondsLeft: number) => void
  /** Per-question time budget (for the timer bar). */
  maxTime?: number
}

export function GameHud({
  lives,
  totalXP,
  streak,
  qIndex,
  totalQuestions,
  timeLeft,
  maxHearts = 3,
  showClock = false,
  multiplier = 0,
  onTickLow,
  maxTime,
}: GameHudProps) {
  const reduceMotion = useReducedMotion()
  const lowTime = timeLeft <= 3

  // Fire the tick callback once per low second. We use the value itself as
  // a dependency so the effect re-runs only when timeLeft changes.
  useEffect(() => {
    if (onTickLow && timeLeft >= 1 && timeLeft <= 3) {
      onTickLow(timeLeft)
    }
  }, [timeLeft, onTickLow])

  // Time-bar fill fraction (0..1).
  const timeFrac =
    maxTime && maxTime > 0 ? Math.max(0, Math.min(1, timeLeft / maxTime)) : null

  return (
    <>
      {/* Hearts + XP + streak + combo */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: maxHearts }).map((_, i) => (
            <Heart
              key={i}
              className={cn(
                'h-5 w-5 transition-colors',
                i < lives
                  ? 'fill-red-500 text-red-500'
                  : 'text-muted-foreground/30',
              )}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1 font-bold text-gold-600 dark:text-gold-400">
            <Zap className="h-4 w-4" />
            {totalXP} XP
          </span>
          {streak >= 2 && (
            <motion.span
              key={`streak-${streak}`}
              initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-bold text-orange-600 dark:text-orange-400"
            >
              <Flame className="h-3 w-3" />
              {streak}
            </motion.span>
          )}
          {multiplier > 1 && (
            <motion.span
              key={`mult-${multiplier}`}
              initial={reduceMotion ? false : { scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="flex items-center gap-1 rounded-full bg-gold-500/20 px-2 py-0.5 text-xs font-extrabold text-gold-700 dark:text-gold-300"
              aria-label={`ضریب امتیاز ${multiplier}`}
            >
              ×{multiplier}
            </motion.span>
          )}
        </div>
      </div>

      {/* Progress dots */}
      <div className="mb-5 flex justify-center gap-1.5">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-[transform,opacity,colors,border-color,background-color]',
              i === qIndex
                ? 'w-6 bg-gold-500'
                : i < qIndex
                  ? 'w-1.5 bg-gold-400'
                  : 'w-1.5 bg-muted',
            )}
          />
        ))}
      </div>

      {/* Timer + question counter + optional time-bar */}
      <div className="mb-4 flex flex-col items-center gap-2 text-sm">
        <div className="flex items-center justify-center gap-2">
          {showClock && (
            <Clock
              className={cn(
                'h-4 w-4 transition-colors',
                lowTime ? 'text-red-500' : 'text-muted-foreground',
              )}
            />
          )}
          <motion.span
            key={lowTime ? `low-${timeLeft}` : `ok-${timeLeft}`}
            initial={reduceMotion && lowTime ? false : false}
            animate={
              lowTime && !reduceMotion
                ? { scale: [1, 1.15, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.4 }}
            className={cn(
              'font-bold tabular-nums',
              lowTime ? 'text-red-500' : '',
            )}
          >
            {fmtTime(timeLeft)}
          </motion.span>
          <span className="text-muted-foreground">
            · سوال {qIndex + 1} از {totalQuestions}
          </span>
        </div>
        {timeFrac !== null && (
          <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-1000 ease-linear',
                lowTime ? 'bg-red-500' : 'bg-gold-500',
              )}
              style={{ width: `${timeFrac * 100}%` }}
            />
          </div>
        )}
      </div>
    </>
  )
}
