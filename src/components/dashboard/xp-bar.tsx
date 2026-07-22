'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { dateKey, toPersianNumber } from '@/lib/gamification'
import { onXPUpdate } from '@/lib/xp-events'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { STORAGE_KEYS, getStorageKey } from '@/lib/storage-keys'

interface XPStats {
  totalXP: number
  level: number
  levelTitle: string
  progressPercentage: number
  xpForNextLevel: number
  pagesRead: number
  booksCompleted: number
  streakDays: number
}

const XP_TODAY_KEY = STORAGE_KEYS.xpToday

interface XPTodayRecord {
  date: string
  baseline: number // totalXP at the start of the day
  gained: number // XP gained since baseline (sum of POST gains)
}

function loadXpToday(): XPTodayRecord | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(XP_TODAY_KEY)
    if (!raw) return null
    const v = JSON.parse(raw)
    if (!v || typeof v !== 'object') return null
    return v as XPTodayRecord
  } catch {
    return null
  }
}

function saveXpToday(rec: XPTodayRecord) {
  try {
    localStorage.setItem(XP_TODAY_KEY, JSON.stringify(rec))
    // also persist the baseline separately so we can re-sync after a refresh
    localStorage.setItem(getStorageKey('xpBaseline', rec.date), String(rec.baseline))
  } catch {}
}

/** Initialize today's XP record from a freshly-fetched total. */
function initXpToday(currentTotalXP: number): XPTodayRecord {
  const today = dateKey(new Date())
  const existing = loadXpToday()
  if (existing && existing.date === today) return existing
  // Day changed or first load today: seed baseline from current total.
  const baseline = currentTotalXP
  const rec: XPTodayRecord = { date: today, baseline, gained: 0 }
  saveXpToday(rec)
  return rec
}

export function XPBar() {
  const [stats, setStats] = useState<XPStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [xpToday, setXpToday] = useState<number>(0)
  const [pulseKey, setPulseKey] = useState(0)
  const lastTotalRef = useRef<number | null>(null)

  useEffect(() => {
    let alive = true

    // Initial GET to fetch stats and establish today's baseline.
    fetch('/api/xp', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: XPStats | null) => {
        if (!alive || !data) return
        setStats(data)
        const rec = initXpToday(data.totalXP)
        setXpToday(rec.gained)
        lastTotalRef.current = data.totalXP
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false)
      })

    // Subscribe to XP-update events dispatched by `postXP()` (see
    // `src/lib/xp-events.ts`). Replaces the previous window.fetch
    // monkey-patch — sibling-unmount ordering no longer affects
    // detection of POST /api/xp gains.
    const unsubscribe = onXPUpdate(({ response }) => {
      const gainedXp = Number(response.gained?.totalXP) || 0
      if (gainedXp <= 0) return
      const today = dateKey(new Date())
      const existing = loadXpToday()
      const baseline =
        existing && existing.date === today
          ? existing.baseline
          : Number(response.totalXP ?? 0) - gainedXp
      const nextRec: XPTodayRecord = {
        date: today,
        baseline,
        gained: (existing && existing.date === today
          ? existing.gained
          : 0) + gainedXp,
      }
      saveXpToday(nextRec)
      setXpToday(nextRec.gained)
      setPulseKey((k) => k + 1)

      // Refresh stats so the bar reflects the new total + level.
      fetch('/api/xp', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((newStats: XPStats | null) => {
          if (alive && newStats) {
            setStats(newStats)
            lastTotalRef.current = newStats.totalXP
          }
        })
        .catch(() => {})
    })

    return () => {
      alive = false
      unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-sm sm:p-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <Skeleton className="h-12 w-12 rounded-full sm:h-14 sm:w-14" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-2.5 w-full rounded-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const isMax = stats.progressPercentage >= 100
  const xpToNext = Math.max(0, stats.xpForNextLevel - stats.totalXP)
  const hasGainedToday = xpToday > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-gold-500/40 bg-gradient-to-br from-gold-500/10 via-card to-card p-3 shadow-sm sm:p-5"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Level badge */}
        <motion.div
          key={`lvl-${stats.level}-${pulseKey}`}
          initial={hasGainedToday ? { scale: 1 } : false}
          animate={
            hasGainedToday
              ? { scale: [1, 1.12, 1], boxShadow: ['0 0 0 0 rgba(184,149,106,0.0)', '0 0 0 8px rgba(184,149,106,0.35)', '0 0 0 0 rgba(184,149,106,0.0)'] }
              : {}
          }
          transition={{ duration: 0.7 }}
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-lg shadow-gold-500/30 sm:h-14 sm:w-14"
        >
          <span className="text-base font-extrabold tabular-nums sm:text-lg">
            {toPersianNumber(stats.level)}
          </span>
          <span className="absolute -bottom-1.5 rounded-full bg-background px-1.5 py-0.5 text-[9px] font-bold text-gold-700 dark:text-gold-400">
            LVL
          </span>
        </motion.div>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold">{stats.levelTitle}</span>
              <span className="flex items-center gap-1 rounded-full bg-gold-500/15 px-2 py-0.5 text-xs font-bold text-gold-700 dark:text-gold-400">
                <Zap className="h-3 w-3" />
                {toPersianNumber(stats.totalXP)} XP
              </span>
              {/* Today's XP pill */}
              {hasGainedToday && (
                <motion.span
                  key={`today-${xpToday}-${pulseKey}`}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: [0.6, 1.1, 1], opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400"
                  aria-label={`امروز ${xpToday} ایکس‌پی گرفتی`}
                >
                  <motion.span
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    +
                  </motion.span>
                  {toPersianNumber(xpToday)} XP امروز
                </motion.span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {isMax
                ? 'به حداکثر سطح رسیدی! 🎉'
                : `تا سطح بعد: ${toPersianNumber(xpToNext)} XP`}
            </span>
          </div>

          <div
            className="relative h-2.5 w-full overflow-hidden rounded-full bg-gold-500/15"
            role="progressbar"
            aria-valuenow={stats.progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              key={`bar-${pulseKey}`}
              className="h-full rounded-full bg-gradient-to-l from-gold-400 via-gold-500 to-gold-700"
              initial={{ width: 0 }}
              animate={{ width: `${stats.progressPercentage}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              {/* Sheen pulse on gain */}
              {hasGainedToday && (
                <motion.div
                  className="absolute inset-0 bg-white/40"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 0.9, ease: 'easeInOut' }}
                />
              )}
            </motion.div>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>صفحه خوانده‌شده: {toPersianNumber(stats.pagesRead)}</span>
            <span>کتاب تمام‌شده: {toPersianNumber(stats.booksCompleted)}</span>
            <span
              className={cn(
                'inline-flex items-center gap-1 font-medium',
                stats.streakDays > 0 && 'text-orange-500',
              )}
            >
              🔥 {toPersianNumber(stats.streakDays)} روز استمرار
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
