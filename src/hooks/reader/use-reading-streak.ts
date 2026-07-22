'use client'

import { useCallback, useEffect, useState } from 'react'
import { STORAGE_KEYS } from '@/lib/storage-keys'

const KEY = STORAGE_KEYS.streak

const DAY = 24 * 60 * 60 * 1000

export interface StreakData {
  /** ISO date strings (YYYY-MM-DD) of days with reading activity */
  activeDays: string[]
  currentStreak: number
  longestStreak: number
  totalReadingDays: number
  /** today's reading session start (ms) — for daily goal */
  todayStartedAt: number | null
  todaySeconds: number
  dailyGoalSeconds: number
}

const DEFAULT: StreakData = {
  activeDays: [],
  currentStreak: 0,
  longestStreak: 0,
  totalReadingDays: 0,
  todayStartedAt: null,
  todaySeconds: 0,
  dailyGoalSeconds: 10 * 60, // 10 minutes/day goal
}

function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dateKey(ts: number): string {
  return todayKey(new Date(ts))
}

function load(): StreakData {
  if (typeof window === 'undefined') return DEFAULT
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT
    const v = JSON.parse(raw)
    return { ...DEFAULT, ...v }
  } catch {
    return DEFAULT
  }
}

function save(d: StreakData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d))
  } catch {}
}

function computeStreaks(activeDays: string[]): { current: number; longest: number } {
  if (activeDays.length === 0) return { current: 0, longest: 0 }
  const set = new Set(activeDays)
  // longest: count consecutive days in the set
  let longest = 0
  let cur = 0
  const sorted = [...set].sort()
  let prev: string | null = null
  for (const d of sorted) {
    if (prev) {
      const diff = (new Date(d).getTime() - new Date(prev).getTime()) / DAY
      cur = diff === 1 ? cur + 1 : 1
    } else {
      cur = 1
    }
    longest = Math.max(longest, cur)
    prev = d
  }
  // current streak: count back from today
  const today = todayKey()
  let current = 0
  let cursor = new Date(today)
  // if today not active, allow yesterday to keep streak alive
  if (!set.has(today)) {
    cursor = new Date(cursor.getTime() - DAY)
  }
  while (set.has(todayKey(cursor))) {
    current += 1
    cursor = new Date(cursor.getTime() - DAY)
  }
  return { current, longest }
}

/** Record a reading session tick (call periodically while reading). */
export function recordReadingTick(secondsElapsed: number) {
  if (typeof window === 'undefined') return
  const d = load()
  const today = todayKey()
  const now = Date.now()
  const activeDays = d.activeDays.includes(today)
    ? d.activeDays
    : [...d.activeDays, today]
  const todaySeconds = d.todaySeconds + secondsElapsed
  const { current, longest } = computeStreaks(activeDays)
  const next: StreakData = {
    ...d,
    activeDays,
    currentStreak: current,
    longestStreak: Math.max(longest, d.longestStreak),
    totalReadingDays: activeDays.length,
    todayStartedAt: d.todayStartedAt ?? now,
    todaySeconds,
  }
  save(next)
}

/** Reset today's seconds at day rollover. */
export function useReadingStreak() {
  const [data, setData] = useState<StreakData>(DEFAULT)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setData(load())
    setLoaded(true)
    const id = setInterval(() => {
      // Skip the poll while the tab is hidden — this interval only
      // refreshes the UI from localStorage + detects day-rollover, so
      // pausing it in background tabs saves CPU without losing data
      // (the next visible-tick picks up any rollover that happened
      // while away). The actual streak-CREDIT tick lives in
      // `use-reader-xp.ts` and has its own visibility guard.
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      const d = load()
      // rollover: if stored today != actual today, reset todaySeconds
      if (d.todayStartedAt && dateKey(d.todayStartedAt) !== todayKey()) {
        const next = { ...d, todaySeconds: 0, todayStartedAt: null }
        save(next)
        setData(next)
      } else {
        setData(d)
      }
    }, 30 * 1000)
    return () => clearInterval(id)
  }, [])

  /** Last 7 days as booleans (oldest → newest), for the weekly dots UI. */
  const week = (() => {
    const out: { key: string; label: string; active: boolean; isToday: boolean }[] = []
    const dayNames = ['یک', 'دو', 'سه', 'چه', 'پن', 'جم', 'شن']
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * DAY)
      const key = todayKey(d)
      out.push({
        key,
        label: dayNames[d.getDay()],
        active: data.activeDays.includes(key),
        isToday: key === todayKey(today),
      })
    }
    return out
  })()

  const goalProgress = Math.min(100, Math.round((data.todaySeconds / data.dailyGoalSeconds) * 100))
  const goalReached = data.todaySeconds >= data.dailyGoalSeconds

  /** Last 12 weeks (84 days) for the calendar heatmap, grouped by week (oldest → newest). */
  const heatmap = (() => {
    const weeks: { key: string; active: boolean; isToday: boolean; date: Date }[][] = []
    const today = new Date()
    // align to start of week (Saturday in Persian calendar week, but use simple 7-day buckets)
    const totalDays = 84
    // find the start: go back to the Saturday on/before (today - (totalDays-1))
    const startOffset = totalDays - 1
    const startDate = new Date(today.getTime() - startOffset * DAY)
    // normalize startDate to Saturday (day 6 in JS getDay: Sun=0..Sat=6)
    const dow = startDate.getDay()
    const daysToSaturday = (dow + 1) % 7 // shift to Saturday
    const alignedStart = new Date(startDate.getTime() - daysToSaturday * DAY)

    let cursor = new Date(alignedStart)
    let currentWeek: { key: string; active: boolean; isToday: boolean; date: Date }[] = []
    const todayStr = todayKey(today)
    const count = Math.ceil((totalDays + daysToSaturday) / 7) * 7
    for (let i = 0; i < count; i++) {
      const key = todayKey(cursor)
      currentWeek.push({
        key,
        active: data.activeDays.includes(key),
        isToday: key === todayStr,
        date: new Date(cursor),
      })
      cursor = new Date(cursor.getTime() + DAY)
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }
    return weeks
  })()

  const refresh = useCallback(() => setData(load()), [])
  const setGoal = useCallback((seconds: number) => {
    setData((prev) => {
      const next = { ...prev, dailyGoalSeconds: seconds }
      save(next)
      return next
    })
  }, [])

  return { data, week, heatmap, goalProgress, goalReached, loaded, refresh, setGoal }
}
