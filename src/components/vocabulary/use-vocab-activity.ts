'use client'

/**
 * Vocab practice activity tracker — records how many vocab reviews the
 * user completes per day. Used by:
 *
 *  • VocabStatsCard — "هدف روزانه" (daily goal) progress bar +
 *    "کلمات یاد گرفته شده این هفته" streak indicator.
 *  • useVocabGame / PracticeClient — call `recordVocabReview()` after
 *    each answered question to feed the tracker.
 *
 * Stored as `Record<ISO-date, count>` under `ky_vocab_activity`.
 */

import { useCallback, useEffect, useState } from 'react'
import { STORAGE_KEYS } from '@/lib/storage-keys'

const KEY = STORAGE_KEYS.vocabActivity
const EVENT = 'ky_vocab_activity:change'
const DAY = 24 * 60 * 60 * 1000

export interface VocabActivityData {
  /** ISO date (YYYY-MM-DD) → number of reviews completed that day. */
  days: Record<string, number>
  /** Daily review goal (default 10 reviews/day). */
  dailyGoal: number
}

const DEFAULT_DAILY_GOAL = 10
const DEFAULT: VocabActivityData = { days: {}, dailyGoal: DEFAULT_DAILY_GOAL }

function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function read(): VocabActivityData {
  if (typeof window === 'undefined') return DEFAULT
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT
    const v = JSON.parse(raw)
    return {
      days: v?.days && typeof v.days === 'object' ? v.days : {},
      dailyGoal:
        typeof v?.dailyGoal === 'number' && v.dailyGoal > 0
          ? v.dailyGoal
          : DEFAULT_DAILY_GOAL,
    }
  } catch {
    return DEFAULT
  }
}

function write(d: VocabActivityData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d))
    window.dispatchEvent(new CustomEvent(EVENT))
  } catch {}
}

/** Imperative — call after each answered question (correct or wrong). */
export function recordVocabReview(count = 1) {
  if (typeof window === 'undefined') return
  const d = read()
  const t = todayKey()
  const next: VocabActivityData = {
    ...d,
    days: { ...d.days, [t]: (d.days[t] ?? 0) + count },
  }
  write(next)
}

function computeStreak(days: Record<string, number>): number {
  const set = new Set(Object.keys(days))
  if (set.size === 0) return 0
  let streak = 0
  const today = new Date()
  let cursor = today
  // If today not active yet, allow yesterday to keep the streak alive.
  if (!set.has(todayKey(today))) {
    cursor = new Date(today.getTime() - DAY)
  }
  while (set.has(todayKey(cursor))) {
    streak += 1
    cursor = new Date(cursor.getTime() - DAY)
  }
  return streak
}

export interface UseVocabActivityReturn {
  data: VocabActivityData
  /** Reviews completed today. */
  todayCount: number
  /** Whether today's daily-goal has been reached. */
  goalReached: boolean
  /** Progress toward today's daily goal (0-100). */
  goalProgress: number
  /** Current consecutive-day practice streak. */
  streak: number
  /** Total reviews over the last 7 days (including today). */
  weekTotal: number
  /** Last 7 days as a list (oldest → newest) for chart sparklines. */
  weekSeries: { date: string; count: number; isToday: boolean }[]
  /** Set the daily review goal. */
  setGoal: (n: number) => void
  /** Force a re-read from storage (used after `recordVocabReview`). */
  refresh: () => void
}

export function useVocabActivity(): UseVocabActivityReturn {
  const [data, setData] = useState<VocabActivityData>(DEFAULT)

  useEffect(() => {
    setData(read())
    const handler = () => setData(read())
    window.addEventListener(EVENT, handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener(EVENT, handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  const today = todayKey()
  const todayCount = data.days[today] ?? 0
  const goalReached = todayCount >= data.dailyGoal
  const goalProgress = Math.min(
    100,
    Math.round((todayCount / data.dailyGoal) * 100),
  )
  const streak = computeStreak(data.days)

  const weekSeries: { date: string; count: number; isToday: boolean }[] = []
  let weekTotal = 0
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY)
    const k = todayKey(d)
    const c = data.days[k] ?? 0
    weekTotal += c
    weekSeries.push({ date: k, count: c, isToday: k === today })
  }

  const setGoal = useCallback((n: number) => {
    setData((prev) => {
      const next: VocabActivityData = {
        ...prev,
        dailyGoal: Math.max(1, Math.min(200, Math.floor(n))),
      }
      write(next)
      return next
    })
  }, [])

  const refresh = useCallback(() => setData(read()), [])

  return {
    data,
    todayCount,
    goalReached,
    goalProgress,
    streak,
    weekTotal,
    weekSeries,
    setGoal,
    refresh,
  }
}
