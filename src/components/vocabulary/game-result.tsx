'use client'

/**
 * GameResult — shared end-of-game / end-of-session screen.
 * Renders an animated trophy, a title + subtitle, a row of stat tiles,
 * an optional "learned words" celebration line, the combo multiplier
 * achieved, and play-again + back buttons. Used by the match / listen /
 * spell / matching / sentence games (4-5 stat tiles, gold XP highlight)
 * and the practice client (3 stat tiles, emerald highlight, rounded-2xl
 * trophy).
 */

import { Button } from '@/components/ui/button'
import { motion, useReducedMotion } from 'framer-motion'
import { RotateCw, Trophy } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type ResultStatHighlight = 'gold' | 'emerald' | undefined

export interface GameResultStat {
  label: string
  value: string
  highlight?: ResultStatHighlight
}

export interface GameResultProps {
  title: string
  subtitle: string
  stats: GameResultStat[]
  /** Celebration line rendered below the stats. Pass undefined to hide. */
  learnedContent?: ReactNode
  /** Best combo multiplier achieved during the game (e.g. 2.5). */
  bestMultiplier?: number
  onPlayAgain: () => void
  playAgainLabel: string
  backHref?: string
  backLabel?: string
  /** Trophy container shape. Defaults to rounded-3xl (games). */
  trophyClassName?: string
  /** Outer wrapper classes. Defaults to the games' max-w-2xl container. */
  containerClassName?: string
  /**
   * Wrap title + subtitle in a <div> with a tight mt-1 on the subtitle
   * (practice's layout) instead of leaving them as flex siblings with
   * the parent's gap-5 (games' layout).
   */
  wrapTitleSubtitle?: boolean
}

export function GameResult({
  title,
  subtitle,
  stats,
  learnedContent,
  bestMultiplier,
  onPlayAgain,
  playAgainLabel,
  backHref = '/vocabulary',
  backLabel = 'بازگشت به واژگان',
  trophyClassName = 'rounded-3xl',
  containerClassName = 'mx-auto max-w-2xl px-4 py-12 sm:px-6',
  wrapTitleSubtitle = false,
}: GameResultProps) {
  const reduceMotion = useReducedMotion()
  const cols = stats.length === 3 ? 'grid-cols-3' : 'grid-cols-4'
  return (
    <div className={containerClassName}>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-5 rounded-3xl border border-border/60 bg-card p-10 text-center shadow-xl"
      >
        <motion.span
          initial={reduceMotion ? false : { scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className={cn(
            'flex h-20 w-20 items-center justify-center bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-lg shadow-gold-500/40',
            trophyClassName,
          )}
        >
          <Trophy className="h-10 w-10" />
        </motion.span>
        {wrapTitleSubtitle ? (
          <div>
            <h1 className="text-3xl font-extrabold">{title}</h1>
            <p className="mt-1 text-muted-foreground">{subtitle}</p>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </>
        )}
        <div className={cn('grid w-full max-w-md gap-3', cols)}>
          {stats.map((s, i) => (
            <ResultStat key={i} {...s} />
          ))}
        </div>
        {bestMultiplier != null && bestMultiplier > 1 && (
          <div className="flex items-center gap-2 rounded-full bg-gold-500/15 px-4 py-1.5 text-sm font-bold text-gold-700 dark:text-gold-300">
            <Trophy className="h-4 w-4" />
            بهترین ضریب: ×{bestMultiplier}
          </div>
        )}
        {learnedContent && (
          <p className="flex items-center justify-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {learnedContent}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={onPlayAgain} variant="glow">
            <RotateCw className="h-4 w-4" />
            {playAgainLabel}
          </Button>
          <Button asChild variant="outline">
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

function ResultStat({ label, value, highlight }: GameResultStat) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 text-center">
      <div
        className={cn(
          'text-2xl font-extrabold',
          highlight === 'gold' && 'text-gold-600 dark:text-gold-400',
          highlight === 'emerald' &&
            'text-emerald-600 dark:text-emerald-400',
          !highlight && 'text-gold-600 dark:text-gold-400',
        )}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
