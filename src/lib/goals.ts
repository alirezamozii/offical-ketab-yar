/**
 * src/lib/goals.ts — types, UI constants, and pure helpers for the reading
 * goals / milestones / analytics system.
 *
 * Spiritual successor to `src/lib/the legacy goals module`. The 10-entry
 * `MILESTONE_DEFS` array has moved to the `GoalDef` Prisma model
 * (seeded from `prisma/seed-content.ts`, editable via `/admin/goals`).
 * Runtime consumers should fetch milestone defs via `src/lib/cms.ts`
 * (`getActiveMilestoneDefs`) on the server, or read them from the
 * `/api/goals` response on the client.
 *
 * What remains here:
 *   • TypeScript types (`GoalsConfig`, `GoalProgress`, `MilestoneState`, …).
 *   • Default goal targets + empty-stats constants (small UI fallbacks).
 *   • Pure helpers (`computeGoalProgress`, `computeMilestones`, etc.) —
 *     `computeMilestones` accepts defs as a parameter so the same logic
 *     works against DB rows or client-cached API responses.
 *   • localStorage read/write helpers for the per-day reading history
 *     (the server can't see this; only the client persists + reads it).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Goal configuration
// ─────────────────────────────────────────────────────────────────────────────

export type GoalUnit = 'pages' | 'minutes'
export type GoalPeriod = 'daily' | 'weekly' | 'monthly'

export interface GoalConfig {
  /** Target value (in `unit`). */
  target: number
  /** Unit of measurement for this goal. */
  unit: GoalUnit
}

export interface GoalsConfig {
  daily: GoalConfig
  weekly: GoalConfig
  monthly: GoalConfig
}

export const DEFAULT_GOALS: GoalsConfig = {
  daily: { target: 10, unit: 'pages' },
  weekly: { target: 70, unit: 'pages' },
  monthly: { target: 300, unit: 'pages' },
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-day reading history (localStorage-backed)
// ─────────────────────────────────────────────────────────────────────────────

export interface ReadingHistoryDay {
  /** ISO date key (YYYY-MM-DD, in local time). */
  date: string
  /** Total pages read that day (across all books). */
  pages: number
  /** Total seconds spent in the reader that day. */
  seconds: number
  /** Reading-time distribution by hour of day (0..23), in seconds. */
  byHour: number[]
}

/** Build an empty by-hour bucket array (24 zeros). */
export function emptyByHour(): number[] {
  return new Array(24).fill(0)
}

/**
 * Parse a stored `ReadingHistoryDay[]` from localStorage. Returns an empty
 * array on the server or on parse errors.
 */
export function readReadingHistory(): ReadingHistoryDay[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('ky_reading_history')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (d): d is ReadingHistoryDay =>
        d &&
        typeof d === 'object' &&
        typeof d.date === 'string' &&
        typeof d.pages === 'number' &&
        typeof d.seconds === 'number' &&
        Array.isArray(d.byHour),
    )
  } catch {
    return []
  }
}

/** Persist the reading history array to localStorage. Best-effort. */
export function writeReadingHistory(history: ReadingHistoryDay[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('ky_reading_history', JSON.stringify(history))
  } catch {
    /* ignore quota / private-mode errors */
  }
}

/**
 * Upsert a single day's reading activity into the history array.
 *
 * `pagesDelta` and `secondsDelta` are added to any existing totals for the
 * given date. `hourSeconds` (seconds spent at a specific hour-of-day) is
 * added to the matching `byHour` slot so the time-distribution chart stays
 * accurate.
 */
export function recordReadingDay(opts: {
  date: string
  pagesDelta?: number
  secondsDelta?: number
  /** Hour of day (0..23) the seconds were spent in. */
  hour?: number
}): void {
  if (typeof window === 'undefined') return
  const history = readReadingHistory()
  const idx = history.findIndex((d) => d.date === opts.date)
  const existing: ReadingHistoryDay =
    idx >= 0
      ? history[idx]
      : { date: opts.date, pages: 0, seconds: 0, byHour: emptyByHour() }
  existing.pages += Math.max(0, opts.pagesDelta ?? 0)
  existing.seconds += Math.max(0, opts.secondsDelta ?? 0)
  if (typeof opts.hour === 'number' && opts.hour >= 0 && opts.hour < 24) {
    existing.byHour[opts.hour] += Math.max(0, opts.secondsDelta ?? 0)
  }
  if (idx >= 0) {
    history[idx] = existing
  } else {
    history.push(existing)
  }
  // Keep at most 365 days, newest-last for easy slice.
  history.sort((a, b) => a.date.localeCompare(b.date))
  writeReadingHistory(history.slice(-365))
}

// ─────────────────────────────────────────────────────────────────────────────
// Server-known stats snapshot (UserStats + Vocabulary)
// ─────────────────────────────────────────────────────────────────────────────

export interface GoalsServerStats {
  totalXP: number
  level: number
  pagesRead: number
  booksCompleted: number
  streakDays: number
  vocabCount: number
}

export const EMPTY_SERVER_STATS: GoalsServerStats = {
  totalXP: 0,
  level: 1,
  pagesRead: 0,
  booksCompleted: 0,
  streakDays: 0,
  vocabCount: 0,
}

// ─────────────────────────────────────────────────────────────────────────────
// Combined progress payload (the API returns this; the client refines it)
// ─────────────────────────────────────────────────────────────────────────────

export interface GoalProgress {
  /** Current progress value (pages or minutes, depending on the goal's unit). */
  current: number
  /** Goal target value. */
  target: number
  /** Percentage 0..100, clamped. */
  pct: number
  /** True when current >= target. */
  reached: boolean
}

export interface GoalsProgressPayload {
  daily: GoalProgress
  weekly: GoalProgress
  monthly: GoalProgress
  /** Pages read per day, last 14 entries (oldest → newest). */
  velocity: { date: string; label: string; pages: number; isToday: boolean }[]
  /** Average pages/day over the last 7 days (rounded). */
  avgPagesPerDay: number
  /** Best day's page count in the velocity window. */
  bestDayPages: number
  /** ISO date string of the best day (or empty). */
  bestDayDate: string
  /** Hour-of-day distribution (0..23), in minutes. */
  timeDistribution: { hour: number; minutes: number; label: string }[]
  /** Best reading hour (0..23) by minutes spent. */
  bestHour: number
  /** Streak stats (server-side: derived from UserStats.streakDays only). */
  streak: { current: number; longest: number; totalReadingDays: number }
  /** Milestone timeline — derived from server stats + history. */
  milestones: MilestoneState[]
  /** Weekly summary — current week vs last week. */
  weeklySummary: WeeklySummary
  /** Server-known stats snapshot (for the header summary). */
  stats: GoalsServerStats
}

export interface MilestoneDef {
  id: string
  /** Persian title. */
  title: string
  /** Persian description. */
  description: string
  /** Emoji icon. */
  icon: string
  /** Metric kind used by `milestoneProgress`. */
  kind:
    | 'pages'
    | 'booksCompleted'
    | 'streak'
    | 'vocab'
    | 'level'
    | 'readingDays'
  /** Numeric target. */
  target: number
}

export interface MilestoneState extends MilestoneDef {
  /** Current progress count. */
  progress: number
  /** Percentage 0..100. */
  pct: number
  /** True when progress >= target. */
  unlocked: boolean
  /** ISO date string (YYYY-MM-DD) the milestone was first reached, or null. */
  unlockedAt: string | null
}

export interface WeeklySummary {
  pagesRead: number
  secondsRead: number
  booksTouched: number
  avgPagesPerDay: number
  /** Percent change vs the previous 7-day window. Can be negative. */
  vsLastWeekPct: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers used by both server and client
// ─────────────────────────────────────────────────────────────────────────────

import { toISODate, DAY_MS } from './utils/date'
export { toISODate, DAY_MS }

/** Build a short Persian weekday label for the chart axis. */
export function weekdayShortLabel(d: Date): string {
  // Persian weekday initials — Sat, Sun, Mon, Tue, Wed, Thu, Fri.
  // JS getDay: 0=Sun..6=Sat. Reorder so Saturday is index 0.
  const map = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش']
  // Shift so Sat=0, Sun=1, ... Fri=6.
  const idx = (d.getDay() + 1) % 7
  return map[idx]
}

/**
 * Compute the pages-per-day velocity series for the last N days.
 * Returns `[]` if `history` is empty.
 */
export function computeVelocity(
  history: ReadingHistoryDay[],
  days = 14,
): { date: string; label: string; pages: number; isToday: boolean }[] {
  const out: { date: string; label: string; pages: number; isToday: boolean }[] = []
  const today = new Date()
  const todayKey = toISODate(today)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS)
    const key = toISODate(d)
    const entry = history.find((h) => h.date === key)
    out.push({
      date: key,
      label: weekdayShortLabel(d),
      pages: entry?.pages ?? 0,
      isToday: key === todayKey,
    })
  }
  return out
}

/**
 * Compute the hour-of-day distribution (0..23) as minutes.
 */
export function computeTimeDistribution(
  history: ReadingHistoryDay[],
): { hour: number; minutes: number; label: string }[] {
  // Sum across the last 30 days for a meaningful signal.
  const cutoff = toISODate(new Date(Date.now() - 30 * DAY_MS))
  const totals = emptyByHour()
  for (const day of history) {
    if (day.date < cutoff) continue
    for (let h = 0; h < 24; h++) {
      totals[h] += day.byHour[h] ?? 0
    }
  }
  return totals.map((seconds, hour) => ({
    hour,
    minutes: Math.round(seconds / 60),
    label: String(hour).padStart(2, '0'),
  }))
}

/**
 * Compute the best reading hour (0..23) from a time-distribution array.
 * Returns -1 if no reading time was recorded.
 */
export function computeBestHour(
  distribution: { hour: number; minutes: number; label: string }[],
): number {
  let best = -1
  let bestMin = 0
  for (const d of distribution) {
    if (d.minutes > bestMin) {
      bestMin = d.minutes
      best = d.hour
    }
  }
  return best
}

/**
 * Compute the weekly summary for the current 7-day window vs the previous one.
 */
export function computeWeeklySummary(
  history: ReadingHistoryDay[],
  progressMap?: Record<string, unknown>,
): WeeklySummary {
  const today = new Date()
  const todayKey = toISODate(today)
  const weekStart = toISODate(new Date(today.getTime() - 6 * DAY_MS))
  const prevWeekStart = toISODate(new Date(today.getTime() - 13 * DAY_MS))

  let thisPages = 0
  let thisSeconds = 0
  let prevPages = 0
  for (const d of history) {
    if (d.date >= weekStart && d.date <= todayKey) {
      thisPages += d.pages
      thisSeconds += d.seconds
    } else if (d.date >= prevWeekStart && d.date < weekStart) {
      prevPages += d.pages
    }
  }
  const booksTouched = progressMap ? Object.keys(progressMap).length : 0
  const avgPagesPerDay = Math.round(thisPages / 7)
  const vsLastWeekPct =
    prevPages > 0
      ? Math.round(((thisPages - prevPages) / prevPages) * 100)
      : thisPages > 0
        ? 100
        : 0
  return {
    pagesRead: thisPages,
    secondsRead: thisSeconds,
    booksTouched,
    avgPagesPerDay,
    vsLastWeekPct,
  }
}

/**
 * Compute the milestone timeline given a stats snapshot.
 *
 * Accepts the defs as the first argument so the same helper works against:
 *   • DB rows fetched via `getActiveMilestoneDefs()` (server)
 *   • The `milestones` field of the `/api/goals` response (client —
 *     already a `MilestoneState[]`, so recompute is rarely needed)
 */
export function computeMilestones(
  defs: MilestoneDef[],
  input: {
    pagesRead: number
    booksCompleted: number
    streakDays: number
    longestStreak: number
    readingDays: number
    vocabCount: number
    level: number
    unlockedAtMap?: Record<string, string>
  },
): MilestoneState[] {
  const lookup: Record<MilestoneDef['kind'], number> = {
    pages: input.pagesRead,
    booksCompleted: input.booksCompleted,
    streak: input.longestStreak || input.streakDays,
    vocab: input.vocabCount,
    level: input.level,
    readingDays: input.readingDays,
  }
  return defs.map((def) => {
    const raw = lookup[def.kind]
    const progress = Math.max(0, Math.min(raw, def.target))
    const unlocked = raw >= def.target
    const pct = def.target > 0 ? Math.min(100, Math.round((progress / def.target) * 100)) : 0
    return {
      ...def,
      progress,
      pct,
      unlocked,
      unlockedAt: unlocked ? (input.unlockedAtMap?.[def.id] ?? null) : null,
    }
  })
}

/**
 * Compute the goal-progress triple (daily / weekly / monthly) given the user's
 * goal config + the per-day history.
 */
export function computeGoalProgress(
  goals: GoalsConfig,
  history: ReadingHistoryDay[],
): { daily: GoalProgress; weekly: GoalProgress; monthly: GoalProgress } {
  const today = new Date()
  const todayKey = toISODate(today)
  const weekStart = toISODate(new Date(today.getTime() - 6 * DAY_MS))
  const monthStart = toISODate(new Date(today.getTime() - 29 * DAY_MS))

  let todayPages = 0
  let todaySeconds = 0
  let weekPages = 0
  let weekSeconds = 0
  let monthPages = 0
  let monthSeconds = 0
  for (const d of history) {
    if (d.date === todayKey) {
      todayPages += d.pages
      todaySeconds += d.seconds
    }
    if (d.date >= weekStart && d.date <= todayKey) {
      weekPages += d.pages
      weekSeconds += d.seconds
    }
    if (d.date >= monthStart && d.date <= todayKey) {
      monthPages += d.pages
      monthSeconds += d.seconds
    }
  }

  const build = (
    goal: GoalConfig,
    pages: number,
    seconds: number,
  ): GoalProgress => {
    const current = goal.unit === 'pages' ? pages : Math.floor(seconds / 60)
    const target = Math.max(1, goal.target)
    const pct = Math.min(100, Math.round((current / target) * 100))
    return { current, target, pct, reached: current >= target }
  }

  return {
    daily: build(goals.daily, todayPages, todaySeconds),
    weekly: build(goals.weekly, weekPages, weekSeconds),
    monthly: build(goals.monthly, monthPages, monthSeconds),
  }
}
