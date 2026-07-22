'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { motion } from 'framer-motion'
import { CheckCircle2, ChevronLeft, Settings2, Target, Trophy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useReadingStreak } from '@/hooks/reader/use-reading-streak'
import { cn } from '@/lib/utils'

function formatTime(s: number): string {
  if (s < 60) return `${Math.round(s)} ث`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} دقیقه`
  const h = Math.floor(m / 60)
  return `${h} ساعت ${m % 60} دقیقه`
}

const GOAL_PRESETS = [
  { mins: 5, label: '۵ دقیقه' },
  { mins: 10, label: '۱۰ دقیقه' },
  { mins: 15, label: '۱۵ دقیقه' },
  { mins: 20, label: '۲۰ دقیقه' },
  { mins: 30, label: '۳۰ دقیقه' },
]

/**
 * Daily goal card — today's reading time vs the configured goal. Includes
 * a popover for changing the goal preset. Sits next to the StreakWidget
 * in the dashboard's stats row.
 */
export function DailyGoalCard() {
  const { data, goalProgress, goalReached, setGoal } = useReadingStreak()
  const [goalOpen, setGoalOpen] = useState(false)

  const currentGoalMins = Math.round(data.dailyGoalSeconds / 60)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="relative h-full overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">هدف امروز</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">
            {formatTime(data.todaySeconds)}
          </p>
          <p className="text-xs text-muted-foreground">
            از {formatTime(data.dailyGoalSeconds)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Popover open={goalOpen} onOpenChange={setGoalOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                aria-label="تنظیم هدف"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-2">
              <p className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
                هدف روزانه
              </p>
              <div className="space-y-0.5">
                {GOAL_PRESETS.map((g) => (
                  <button
                    key={g.mins}
                    onClick={() => {
                      setGoal(g.mins * 60)
                      setGoalOpen(false)
                      toast.success(`هدف به ${g.label} تنظیم شد`)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors',
                      currentGoalMins === g.mins
                        ? 'bg-primary/15 font-bold text-primary'
                        : 'hover:bg-accent',
                    )}
                  >
                    {g.label}
                    {currentGoalMins === g.mins && (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <span
            className="relative flex h-14 w-14 items-center justify-center"
            aria-hidden
          >
            {/* Circular progress ring (SVG) */}
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 56 56">
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                strokeWidth="3"
                className="stroke-muted/40"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(goalProgress / 100) * 150.8} 150.8`}
                className={cn(
                  'transition-[transform,opacity,colors,border-color,background-color] duration-700 ease-out',
                  goalReached
                    ? 'stroke-emerald-500'
                    : 'stroke-gold-500',
                )}
              />
            </svg>
            <span
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                goalReached
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-gold-500/15 text-gold-600 dark:text-gold-400',
              )}
            >
              {goalReached ? (
                <Trophy className="h-5 w-5" />
              ) : (
                <Target className="h-5 w-5" />
              )}
            </span>
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn(
              'h-full rounded-full',
              goalReached
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                : 'bg-gradient-to-r from-gold-400 to-gold-600',
            )}
            initial={{ width: 0 }}
            animate={{ width: `${goalProgress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <p className="mt-2 text-center text-xs font-medium text-muted-foreground">
          {goalReached ? '🎉 هدف امروز محقق شد!' : `${goalProgress}٪ — ادامه دهید`}
        </p>
      </div>

      {/* Link to the full /goals analytics page */}
      <Link
        href="/goals"
        className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-gold-500/5 px-3 py-1.5 text-xs font-semibold text-gold-700 transition-colors hover:bg-gold-500/10 dark:text-gold-400"
      >
        مشاهده همه اهداف
        <ChevronLeft className="h-3 w-3" />
      </Link>
    </motion.div>
  )
}
