'use client'

/**
 * src/components/dashboard/streak-protection-widget.tsx
 * ---------------------------------------------------------------
 * Dashboard widget that surfaces the user's "streak protection"
 * status — a complementary view to the main StreakWidget.
 *
 * While StreakWidget shows the *count* (current streak, longest
 * streak, weekly dots), this widget shows the *risk state*:
 *
 *   • safe      — user has read today (green check)
 *   • at-risk   — user hasn't read today AND it's after 18:00
 *                  (amber warning, flame flickers)
 *   • broken    — user's streak was already broken (didn't read
 *                  yesterday and today's streak count is 0)
 *
 * Plus a live "time remaining in the day" countdown so the user
 * knows how long they have to save the streak. Includes a
 * "شروع مطالعه" CTA that jumps to the resume card / library.
 *
 * All animations gate on `useReducedMotion()`. The flame flickers
 * only when at-risk (drawing attention without being noisy when
 * the user is safe). All text is Persian.
 * ---------------------------------------------------------------
 */

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { useReadingStreak } from '@/hooks/reader/use-reading-streak'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { cn } from '@/lib/utils'

type StreakStatus = 'safe' | 'at-risk' | 'broken'

/** After this local hour (24h), an unread-today streak is considered "at-risk". */
const AT_RISK_HOUR = 18

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Compute the streak-protection status from the streak hook's data
 * and the current local time.
 *
 *   • safe    — today is in `activeDays`
 *   • at-risk — today NOT in `activeDays` AND current hour >= 18
 *   • broken  — yesterday NOT in `activeDays` AND currentStreak === 0
 *               (i.e. the streak has already ended)
 *
 * A user who hasn't read today but it's still early in the day is
 * not "at-risk" yet — the warning only kicks in after 6 PM to avoid
 * nagging.
 */
function computeStatus(
  activeDays: string[],
  currentStreak: number,
  now: Date,
): StreakStatus {
  const today = todayKey(now)
  if (activeDays.includes(today)) return 'safe'

  // Today not active. If it's still early, no warning yet.
  if (now.getHours() < AT_RISK_HOUR) {
    // But if the streak was already broken (yesterday not active
    // either), surface the broken state.
    const yesterday = todayKey(new Date(now.getTime() - DAY_MS))
    if (!activeDays.includes(yesterday) && currentStreak === 0) {
      return 'broken'
    }
    return 'safe' // early-day, not yet at risk
  }

  // After 6 PM and today not active. If the user has any streak
  // to lose (currentStreak > 0), it's at risk. If the streak is
  // already 0, it's broken.
  const yesterday = todayKey(new Date(now.getTime() - DAY_MS))
  if (currentStreak === 0 && !activeDays.includes(yesterday)) {
    return 'broken'
  }
  return 'at-risk'
}

function todayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Ms remaining until local midnight tonight. */
function msUntilMidnight(now: Date): number {
  const next = new Date(now)
  next.setHours(24, 0, 0, 0)
  return Math.max(0, next.getTime() - now.getTime())
}

/** Format a duration in ms as a Persian "HH:MM:SS" countdown string. */
function formatCountdown(ms: number, toPersianDigits: (s: string | number) => string): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return toPersianDigits(`${hh}:${mm}:${ss}`)
}

interface StatusMeta {
  status: StreakStatus
  /** Large headline shown at the top of the card. */
  title: string
  /** Short explanatory subtitle. */
  subtitle: string
  /** Icon node. */
  icon: React.ReactNode
  /** Tailwind classes for the status pill background + text. */
  pillClass: string
  /** Tailwind classes for the card's accent ring. */
  ringClass: string
  /** Whether the flame should flicker (only when at-risk). */
  flicker: boolean
}

function buildStatusMeta(
  status: StreakStatus,
  reduceMotion: boolean,
  streak: number,
  toPersianDigits: (s: string | number) => string,
): StatusMeta {
  const faStreak = toPersianDigits(streak)
  switch (status) {
    case 'safe':
      return {
        status,
        title: 'امروز مطالعه کردید',
        subtitle:
          streak > 0
            ? `زنجیره ${faStreak} روزه‌ات را امروز حفظ کردی — آفرین!`
            : 'عالی! امروز یک قدم برداشتی.',
        icon: <CheckCircle2 className="h-6 w-6" aria-hidden="true" />,
        pillClass:
          'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-400',
        ringClass: 'from-emerald-500/10 to-transparent border-emerald-500/20',
        flicker: false,
      }
    case 'at-risk':
      return {
        status,
        title: 'زنجیره در خطر!',
        subtitle:
          streak > 0
            ? `زنجیره ${faStreak} روزه‌ات را تا پایان امروز حفظ کن.`
            : 'امروز هنوز نخوانده‌ای — حتی یک صفحه هم کافی است.',
        icon: <AlertTriangle className="h-6 w-6" aria-hidden="true" />,
        pillClass:
          'bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-400',
        ringClass: 'from-amber-500/15 to-transparent border-amber-500/30',
        flicker: !reduceMotion,
      }
    case 'broken':
      return {
        status,
        title: 'زنجیره شکسته',
        subtitle:
          'زنجیره روزانه‌ات قطع شد — امروز دوباره شروع کن و بسازش!',
        icon: <XCircle className="h-6 w-6" aria-hidden="true" />,
        pillClass:
          'bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/30 dark:text-rose-400',
        ringClass: 'from-rose-500/10 to-transparent border-rose-500/25',
        flicker: false,
      }
  }
}

export function StreakProtectionWidget() {
  const { data } = useReadingStreak()
  const reduceMotion = useReducedMotion()
  const { toPersianDigits } = usePersianLocale()

  // Tick once per second so the countdown stays live. We don't need
  // sub-second precision; an interval is the cheapest option.
  const [now, setNow] = React.useState<Date>(() => new Date())
  React.useEffect(() => {
    if (reduceMotion) return // no countdown animation when reduced motion
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [reduceMotion])

  const status = computeStatus(data.activeDays, data.currentStreak, now)
  // useReducedMotion() returns `boolean | null` (null on first render
  // before the media query resolves). Coerce to a plain boolean so the
  // status-meta builder can branch on it cleanly.
  const reduceMotionBool = reduceMotion === true
  const meta = buildStatusMeta(
    status,
    reduceMotionBool,
    data.currentStreak,
    toPersianDigits,
  )
  const remaining = msUntilMidnight(now)
  const remainingLabel = formatCountdown(remaining, toPersianDigits)

  // Flame scale mirrors StreakWidget so the two cards feel like a pair.
  const flameScale =
    data.currentStreak <= 0
      ? 0.85
      : data.currentStreak <= 2
        ? 0.95
        : data.currentStreak <= 6
          ? 1.05
          : data.currentStreak <= 13
            ? 1.15
            : 1.25

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-sm sm:p-6',
        meta.ringClass,
      )}
      aria-label="محافظت از زنجیره مطالعه"
      aria-live="polite"
    >
      {/* Ambient halo */}
      <div
        className={cn(
          'pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full blur-3xl',
          status === 'safe'
            ? 'bg-emerald-500/10'
            : status === 'at-risk'
              ? 'bg-amber-500/15'
              : 'bg-rose-500/10',
        )}
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: status pill + headline + subtitle */}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
                meta.pillClass,
              )}
            >
              {meta.icon}
              <span>
                {status === 'safe'
                  ? 'امن'
                  : status === 'at-risk'
                    ? 'در خطر'
                    : 'شکسته'}
              </span>
            </span>
            <span className="text-xs text-muted-foreground">
              محافظت از زنجیره
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-extrabold leading-snug text-foreground">
              {meta.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {meta.subtitle}
            </p>
          </div>

          {/* Countdown — only relevant when at-risk or broken (safe users
              don't need to know how long until midnight). */}
          {status !== 'safe' && (
            <div className="flex items-center gap-2 rounded-xl bg-card/60 px-3 py-2 ring-1 ring-border/50">
              <Clock
                className={cn(
                  'h-4 w-4',
                  status === 'at-risk' ? 'text-amber-500' : 'text-rose-500',
                )}
                aria-hidden="true"
              />
              <span className="text-xs text-muted-foreground">
                زمان باقی‌مانده تا پایان امروز:
              </span>
              <span
                className={cn(
                  'font-mono text-sm font-bold tabular-nums',
                  status === 'at-risk'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400',
                )}
                dir="ltr"
                aria-label={`زمان باقی‌مانده ${remainingLabel}`}
              >
                {remainingLabel}
              </span>
            </div>
          )}
        </div>

        {/* Right: animated flame */}
        <motion.div
          animate={
            meta.flicker
              ? {
                  scale: [flameScale, flameScale * 1.12, flameScale * 0.96, flameScale],
                  rotate: [0, -3, 4, 0],
                }
              : { scale: flameScale }
          }
          transition={
            meta.flicker
              ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.4 }
          }
          className={cn(
            'flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-lg',
            status === 'safe'
              ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-emerald-500/30'
              : status === 'at-risk'
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/40'
                : 'bg-gradient-to-br from-rose-400 to-red-500 text-white shadow-rose-500/30',
          )}
          aria-hidden
        >
          <Flame
            className="h-8 w-8"
            style={{
              filter:
                status === 'at-risk'
                  ? 'drop-shadow(0 0 8px rgba(251, 146, 60, 0.7))'
                  : status === 'safe'
                    ? 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))'
                    : 'drop-shadow(0 0 6px rgba(244, 63, 94, 0.5))',
            }}
          />
        </motion.div>
      </div>

      {/* CTA — only when not safe. Safe users don't need a CTA. */}
      {status !== 'safe' && (
        <div className="relative mt-4 flex items-center gap-2">
          <Button
            asChild
            size="sm"
            className={cn(
              'gap-1.5',
              status === 'at-risk'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-amber-950 hover:from-amber-600 hover:to-orange-600'
                : 'bg-gradient-to-r from-rose-500 to-red-500 text-rose-950 hover:from-rose-600 hover:to-red-600',
            )}
            aria-label="شروع مطالعه — ادامه کتاب در حال خواندن"
          >
            <Link href="/library">
              <BookOpen className="h-4 w-4" />
              شروع مطالعه
            </Link>
          </Button>
          <span className="text-xs text-muted-foreground">
            حتی چند صفحه هم زنجیره را حفظ می‌کند.
          </span>
        </div>
      )}
    </motion.section>
  )
}
