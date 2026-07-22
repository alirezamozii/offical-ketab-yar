'use client'

/**
 * GameIntro — shared landing screen for the vocabulary mini-games.
 *
 * Renders the game icon, title, description, a 3-tile stat row, an
 * optional warning banner (used by the listen game when speech
 * synthesis is unavailable), an optional difficulty selector
 * (easy/medium/hard), an optional sound toggle, and a start button.
 */

import { Button } from '@/components/ui/button'
import { Volume2, VolumeX, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { Difficulty } from '@/hooks/reader/use-vocab-game'

export type GameIntroStatColor = 'gold' | 'red' | 'emerald'

export interface GameIntroStat {
  value: string
  label: string
  color?: GameIntroStatColor
}

export interface GameIntroProps {
  icon: ReactNode
  title: string
  description: string
  stats: GameIntroStat[]
  onStart: () => void
  startLabel?: string
  /** Optional banner rendered between the description and the stat tiles. */
  warning?: ReactNode
  /** Difficulty selector — pass props to enable. */
  difficulty?: Difficulty
  onDifficultyChange?: (d: Difficulty) => void
  /** Sound toggle — pass props to enable. */
  soundEnabled?: boolean
  onToggleSound?: () => void
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'آسان',
  medium: 'متوسط',
  hard: 'سخت',
}

const DIFFICULTY_DESC: Record<Difficulty, string> = {
  easy: 'زمان بیشتر، واژگان رایج‌تر',
  medium: 'تعادل زمان و دشواری',
  hard: 'زمان کمتر، واژگان سخت‌تر',
}

export function GameIntro({
  icon,
  title,
  description,
  stats,
  onStart,
  startLabel = 'شروع بازی',
  warning,
  difficulty,
  onDifficultyChange,
  soundEnabled,
  onToggleSound,
}: GameIntroProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-gold-500/10 via-card to-gold-700/5 p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold-500/15 blur-3xl" />
        <div className="relative space-y-6 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-lg shadow-gold-500/40">
            {icon}
          </span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
            <p className="mt-2 text-muted-foreground">{description}</p>
          </div>
          {warning}

          {/* Difficulty selector */}
          {difficulty && onDifficultyChange && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                سطح دشواری
              </p>
              <div className="inline-flex rounded-xl border border-border bg-card p-1 shadow-sm">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => onDifficultyChange(d)}
                    aria-pressed={difficulty === d}
                    className={cn(
                      'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
                      difficulty === d
                        ? d === 'easy'
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : d === 'hard'
                            ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                            : 'bg-gold-500/20 text-gold-700 dark:text-gold-300'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {DIFFICULTY_LABEL[d]}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {DIFFICULTY_DESC[difficulty]}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 text-sm">
            {stats.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/60 bg-card p-3"
              >
                <div
                  className={cn(
                    'text-2xl font-extrabold',
                    s.color === 'red' && 'text-red-500',
                    s.color === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
                    (!s.color || s.color === 'gold') &&
                      'text-gold-600 dark:text-gold-400',
                  )}
                >
                  {s.value}
                </div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Sound toggle + Start button */}
          <div className="flex items-center justify-center gap-3">
            {onToggleSound && (
              <Button
                onClick={onToggleSound}
                variant="outline"
                size="icon"
                aria-label={soundEnabled ? 'قطع صدا' : 'روشن کردن صدا'}
                title={soundEnabled ? 'قطع صدا' : 'روشن کردن صدا'}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              onClick={onStart}
              size="xl"
              variant="glow"
              className="flex-1"
            >
              <Zap className="h-5 w-5" />
              {startLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
