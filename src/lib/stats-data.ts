/**
 * Year-in-Review / Reading Stats — shared types + pure helpers.
 *
 * Used by:
 *   • `/api/stats`        — server route returns a DB-known snapshot
 *     (UserStats + Vocabulary count + achievements summary). The client
 *     overrides the localStorage-only fields after mount.
 *   • `/stats` page       — the Year-in-Review page (`stats-page-client.tsx`).
 *
 * The shape mirrors the Spotify-Wrapped style: a single big payload with
 * "scenes" the client renders top-to-bottom.
 *
 * Color palette: only gold / amber / emerald / rose / stone — no
 * indigo/blue (per project rule).
 */

import type { AchievementRarity } from '@/lib/achievements'
import { toISODate, DAY_MS } from './utils/date'

// ─────────────────────────────────────────────────────────────────────────────
// Payload shape
// ─────────────────────────────────────────────────────────────────────────────

export interface StatsTotals {
  /** Number of distinct books the user has started (any progress > 0). */
  booksStarted: number
  /** Number of books completed (UserStats.booksCompleted, server-known). */
  booksCompleted: number
  /** Started but not yet completed. */
  booksInProgress: number
  /** Total pages read across all books (UserStats.pagesRead, server-known). */
  totalPages: number
  /** Total minutes spent in the reader (sum of reading-history seconds / 60). */
  totalReadingMinutes: number
  /** Total XP (UserStats.totalXP, server-known). */
  totalXP: number
  /** User level (UserStats.level, server-known or derived from XP). */
  level: number
  /** Vocabulary count (DB-backed). */
  vocabCount: number
  /** Vocab games played (localStorage `ky_vocab_games_played`). */
  gamesPlayed: number
  /** Number of achievements unlocked (computed by `computeAchievementStates`). */
  achievementsUnlocked: number
  /** Total achievements in the catalog. */
  achievementsTotal: number
  /** Reading consistency score 0..100 — derived from history. */
  consistencyScore: number
  /** Average pages per day over the last 30 days. */
  avgPagesPerDay: number
}

export interface StatsStreak {
  current: number
  longest: number
  totalReadingDays: number
}

export interface GenreStat {
  name: string
  /** Number of books in this genre the user has touched. */
  count: number
  /** Pages read in this genre. */
  pages: number
}

export interface AuthorStat {
  name: string
  count: number
  pages: number
}

export interface MonthBucket {
  /** ISO month key (YYYY-MM). */
  key: string
  /** Short Persian label (e.g. "فروردین"). */
  label: string
  pages: number
  minutes: number
}

export interface DayOfWeekBucket {
  /** 0 = Saturday ... 6 = Friday (Persian week alignment). */
  day: number
  label: string
  minutes: number
  pages: number
}

export interface HourBucket {
  /** 0..23 */
  hour: number
  minutes: number
}

export interface BookJourneyEntry {
  slug: string
  title: string
  author: string
  /** Pages of this book the user has read. */
  pages: number
  /** Total pages in the book (for percentage). */
  totalPages: number
  percent: number
  coverFrom: string
  coverTo: string
  coverAccent: string
}

export interface VocabGrowthPoint {
  /** ISO date key (YYYY-MM-DD). */
  date: string
  /** Cumulative vocab count at end of day. */
  total: number
  /** Words reviewed that day (from `ky_vocab_activity`). */
  reviewed: number
}

export interface StatsAchievementsSummary {
  unlocked: number
  total: number
  /** The rarest achievement the user has unlocked (highest rarity tier). */
  rarest: {
    id: string
    title: string
    icon: string
    rarity: AchievementRarity
  } | null
  /** Recent unlocks (max 6), newest-first. */
  recent: {
    id: string
    title: string
    icon: string
    rarity: AchievementRarity
    unlockedAt: string | null
  }[]
}

export type ReadingPersonality =
  | 'night-owl'
  | 'marathoner'
  | 'consistent'
  | 'explorer'
  | 'wordsmith'
  | 'casual'

export interface ReadingPersonalityResult {
  kind: ReadingPersonality
  /** Persian title. */
  title: string
  /** Persian description. */
  description: string
  /** Emoji icon. */
  icon: string
  /** Tailwind gradient classes for the badge. */
  color: string
}

export interface StatsPayload {
  totals: StatsTotals
  streak: StatsStreak
  topGenres: GenreStat[]
  topAuthors: AuthorStat[]
  readingByMonth: MonthBucket[]
  readingByDayOfWeek: DayOfWeekBucket[]
  readingByHour: HourBucket[]
  /** Best hour of day (0..23) by minutes spent reading. -1 if none. */
  bestHour: number
  /** Best day-of-week index (0=Sat..6=Fri) by minutes spent reading. -1 if none. */
  bestDayOfWeek: number
  bookJourney: BookJourneyEntry[]
  vocabGrowth: VocabGrowthPoint[]
  achievements: StatsAchievementsSummary
  personality: ReadingPersonalityResult
  /** True when there is no reading activity at all (empty state). */
  isEmpty: boolean
  error?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const MONTHS_FA = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
]

/** Persian weekday labels — Saturday-first per Persian-calendar week. */
export const WEEKDAY_LABELS_FA = [
  'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه',
]

/** Single-letter Persian weekday initials (Sat..Fri). */
export const WEEKDAY_INITIALS_FA = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

// ─────────────────────────────────────────────────────────────────────────────
// Date helpers (Persian-calendar aware via Intl)
// ─────────────────────────────────────────────────────────────────────────────



/** Build an ISO month key (YYYY-MM) from a Date. */
export function toISOMonth(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/**
 * Persian (Jalali) month index 0..11 for a Date. Uses `Intl.DateTimeFormat`
 * with the `persian` calendar so we get the right month regardless of where
 * the Gregorian date lands.
 */
export function persianMonthIndex(d: Date): number {
  try {
    const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      month: 'numeric',
    }).formatToParts(d)
    const m = parts.find((p) => p.type === 'month')?.value ?? '1'
    // Persian digits → Latin, then parse.
    const latin = String(m).replace(/[۰-۹]/g, (c) =>
      String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)),
    )
    return Math.max(0, Math.min(11, Number(latin) - 1))
  } catch {
    // Fallback: Gregorian month.
    return d.getMonth()
  }
}

/** Map JS getDay() (0=Sun..6=Sat) → Persian week index (0=Sat..6=Fri). */
export function toPersianWeekday(jsDay: number): number {
  return (jsDay + 1) % 7
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty payload (returned by server on first paint / on error)
// ─────────────────────────────────────────────────────────────────────────────

export const EMPTY_STATS_PAYLOAD: StatsPayload = {
  totals: {
    booksStarted: 0,
    booksCompleted: 0,
    booksInProgress: 0,
    totalPages: 0,
    totalReadingMinutes: 0,
    totalXP: 0,
    level: 1,
    vocabCount: 0,
    gamesPlayed: 0,
    achievementsUnlocked: 0,
    achievementsTotal: 0,
    consistencyScore: 0,
    avgPagesPerDay: 0,
  },
  streak: { current: 0, longest: 0, totalReadingDays: 0 },
  topGenres: [],
  topAuthors: [],
  readingByMonth: [],
  readingByDayOfWeek: [],
  readingByHour: [],
  bestHour: -1,
  bestDayOfWeek: -1,
  bookJourney: [],
  vocabGrowth: [],
  achievements: { unlocked: 0, total: 0, rarest: null, recent: [] },
  personality: {
    kind: 'casual',
    title: 'خواننده پراکنده',
    description: 'هنوز در ابتدای مسیر هستید — با خواندن روزانه، الگوی شخصی شما آشکار می‌شود.',
    icon: '🌱',
    color: 'from-stone-400 to-stone-600',
  },
  isEmpty: true,
}

// ─────────────────────────────────────────────────────────────────────────────
// Reading-history-derived computations (run client-side after localStorage load)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Per-day reading aggregates. Mirrors `ReadingHistoryDay` 
 * but inlined here so this module is self-contained.
 */
export interface ReadingHistoryDay {
  date: string
  pages: number
  seconds: number
  byHour: number[]
}

/**
 * Build the last-12-months bucket array (oldest → newest), all zeroed.
 * Each entry carries the Persian-month label.
 */
export function buildLast12Months(now: Date = new Date()): MonthBucket[] {
  const out: MonthBucket[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({
      key: toISOMonth(d),
      label: MONTHS_FA[persianMonthIndex(d)],
      pages: 0,
      minutes: 0,
    })
  }
  return out
}

/** Build a 7-entry day-of-week bucket array (Sat..Fri), zeroed. */
export function buildDayOfWeekBuckets(): DayOfWeekBucket[] {
  return WEEKDAY_LABELS_FA.map((label, day) => ({
    day,
    label,
    minutes: 0,
    pages: 0,
  }))
}

/** Build a 24-entry hour bucket array (0..23), zeroed. */
export function buildHourBuckets(): HourBucket[] {
  return Array.from({ length: 24 }, (_, hour) => ({ hour, minutes: 0 }))
}

/**
 * Aggregate reading history into the 12-month / 7-day / 24-hour buckets.
 * Returns fresh arrays (does not mutate inputs).
 */
export function aggregateReadingHistory(
  history: ReadingHistoryDay[],
  now: Date = new Date(),
): {
  byMonth: MonthBucket[]
  byDayOfWeek: DayOfWeekBucket[]
  byHour: HourBucket[]
  totalMinutes: number
  avgPagesPerDay30d: number
  bestHour: number
  bestDayOfWeek: number
} {
  const byMonth = buildLast12Months(now)
  const byDayOfWeek = buildDayOfWeekBuckets()
  const byHour = buildHourBuckets()
  let totalMinutes = 0
  let pages30d = 0
  const cutoff30d = toISODate(new Date(now.getTime() - 30 * DAY_MS))

  for (const day of history) {
    const monthKey = day.date.slice(0, 7)
    const monthIdx = byMonth.findIndex((m) => m.key === monthKey)
    const minutes = Math.round(day.seconds / 60)
    totalMinutes += minutes
    if (monthIdx >= 0) {
      byMonth[monthIdx].pages += day.pages
      byMonth[monthIdx].minutes += minutes
    }
    // Day-of-week + hour only count for the last 30 days (for a meaningful
    // signal — see computeTimeDistribution in the legacy goals module which uses the
    // same 30-day window).
    if (day.date >= cutoff30d) {
      pages30d += day.pages
      const d = new Date(day.date + 'T00:00:00')
      const dow = toPersianWeekday(d.getDay())
      byDayOfWeek[dow].minutes += minutes
      byDayOfWeek[dow].pages += day.pages
      for (let h = 0; h < 24; h++) {
        const m = Math.round((day.byHour[h] ?? 0) / 60)
        byHour[h].minutes += m
      }
    }
  }

  // Best hour / day-of-week.
  let bestHour = -1
  let bestHourMin = 0
  for (const h of byHour) {
    if (h.minutes > bestHourMin) {
      bestHourMin = h.minutes
      bestHour = h.hour
    }
  }
  let bestDayOfWeek = -1
  let bestDayMin = 0
  for (const d of byDayOfWeek) {
    if (d.minutes > bestDayMin) {
      bestDayMin = d.minutes
      bestDayOfWeek = d.day
    }
  }

  const avgPagesPerDay30d = Math.round(pages30d / 30)

  return {
    byMonth,
    byDayOfWeek,
    byHour,
    totalMinutes,
    avgPagesPerDay30d,
    bestHour,
    bestDayOfWeek,
  }
}

/**
 * Compute the reading consistency score (0..100).
 *
 * Formula:
 *   consistency = (activeDaysLast30 / 30) * 70 + min(30, currentStreak)
 *
 * - 0 for brand-new users with no reading.
 * - 70 for someone who read every day for the last 30 days but has no streak.
 * - 100 for someone who read every day for 30+ days (70 + 30 streak bonus).
 */
export function computeConsistencyScore(
  history: ReadingHistoryDay[],
  currentStreak: number,
  now: Date = new Date(),
): number {
  const cutoff = toISODate(new Date(now.getTime() - 30 * DAY_MS))
  const todayKey = toISODate(now)
  let activeDays = 0
  for (const day of history) {
    if (day.date >= cutoff && day.date <= todayKey && day.pages > 0) {
      activeDays++
    }
  }
  const freq = Math.min(1, activeDays / 30)
  const streakBonus = Math.min(30, Math.max(0, currentStreak))
  return Math.round(freq * 70 + streakBonus)
}

// ─────────────────────────────────────────────────────────────────────────────
// Personality classifier
// ─────────────────────────────────────────────────────────────────────────────

/** Rarity tier rank — higher = rarer (matches the achievement rarity order). */
const RARITY_RANK: Record<AchievementRarity, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
}

/** Pick the highest-rarity unlocked achievement (or null if none). */
export function pickRarestAchievement(
  unlocked: { id: string; title: string; icon: string; rarity: AchievementRarity }[],
): StatsAchievementsSummary['rarest'] {
  if (unlocked.length === 0) return null
  let best = unlocked[0]
  for (const a of unlocked) {
    if (RARITY_RANK[a.rarity] > RARITY_RANK[best.rarity]) best = a
  }
  return { id: best.id, title: best.title, icon: best.icon, rarity: best.rarity }
}

/**
 * Pick the user's "reading personality" badge from their stats.
 *
 * Priority (first match wins):
 *   1. night-owl     — best hour 21..23 or 0..4
 *   2. marathoner    — avgPagesPerDay30d >= 20 OR any-day pages >= 50
 *   3. consistent    — longestStreak >= 14
 *   4. explorer      — unique genres touched >= 4
 *   5. wordsmith     — vocabCount >= 50
 *   6. casual        — fallback
 */
export function classifyPersonality(input: {
  bestHour: number
  avgPagesPerDay30d: number
  maxDayPages: number
  longestStreak: number
  uniqueGenres: number
  vocabCount: number
}): ReadingPersonalityResult {
  const { bestHour, avgPagesPerDay30d, maxDayPages, longestStreak, uniqueGenres, vocabCount } = input

  if (bestHour >= 21 || (bestHour >= 0 && bestHour <= 4)) {
    return {
      kind: 'night-owl',
      title: 'خواننده شب‌کوش',
      description: 'وقتی همه خوابند، شما در دنیای کتاب‌ها غرق می‌شوید. سکوت شب، همراه همیشگی شماست.',
      icon: '🌙',
      color: 'from-amber-300 to-orange-500',
    }
  }
  if (avgPagesPerDay30d >= 20 || maxDayPages >= 50) {
    return {
      kind: 'marathoner',
      title: 'ماراتن‌خوان',
      description: 'مسافت‌های طولانی در دنیای کتاب‌ها را با سرعتی شگفت‌انگیز طی می‌کنید.',
      icon: '⚡',
      color: 'from-gold-400 to-amber-600',
    }
  }
  if (longestStreak >= 14) {
    return {
      kind: 'consistent',
      title: 'استمرار‌دار',
      description: 'هر روز، قدمی کوچک. زنجیره استمرار شما، قدرت واقعی شماست.',
      icon: '🔥',
      color: 'from-rose-400 to-red-500',
    }
  }
  if (uniqueGenres >= 4) {
    return {
      kind: 'explorer',
      title: 'کاوشگر ژانر',
      description: 'مرزهای سلیقه را جابه‌جا می‌کنید — هر ژانر، دریچه‌ای تازه به روی شماست.',
      icon: '🧭',
      color: 'from-emerald-400 to-teal-600',
    }
  }
  if (vocabCount >= 50) {
    return {
      kind: 'wordsmith',
      title: 'واژه‌شناس',
      description: 'هر واژه‌ای که یاد می‌گیرید، آجری در بنای زبان شماست. دایره لغاتتان رو به گسترش است.',
      icon: '📚',
      color: 'from-emerald-400 to-cyan-500',
    }
  }
  return EMPTY_STATS_PAYLOAD.personality
}

// ─────────────────────────────────────────────────────────────────────────────
// Vocab growth helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a vocab-growth line chart from `ky_vocab_activity` (Map<ISO date,
 * review-count>) and the current total vocab count.
 *
 * Returns the last 14 days (oldest → newest) with cumulative totals. If no
 * activity is recorded, returns an empty array (the UI shows an empty state).
 */
export function buildVocabGrowth(
  activity: Record<string, number>,
  currentTotal: number,
  days = 14,
  now: Date = new Date(),
): VocabGrowthPoint[] {
  const entries = Object.entries(activity)
  if (entries.length === 0 && currentTotal === 0) return []

  const out: VocabGrowthPoint[] = []
  // Estimate the cumulative total at the start of the window by counting
  // activity entries strictly before the window start.
  const windowStart = toISODate(new Date(now.getTime() - (days - 1) * DAY_MS))
  let cumulative = 0
  for (const [date, n] of entries) {
    if (date < windowStart) cumulative += n
  }
  // Cap cumulative at currentTotal so we never report more than reality.
  cumulative = Math.min(cumulative, currentTotal)

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS)
    const key = toISODate(d)
    const reviewed = Math.max(0, activity[key] ?? 0)
    cumulative += reviewed
    // Cap at currentTotal again (activity counts can exceed total because
    // the same word may be reviewed multiple times).
    const capped = Math.min(cumulative, currentTotal)
    out.push({ date: key, total: capped, reviewed })
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// Share-text builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a Persian share-text summary of the user's year-in-review. Used by
 * the ShareCard's "copy text" and Web Share API actions.
 */
export function buildShareText(p: StatsPayload): string {
  const books = p.totals.booksCompleted
  const pages = p.totals.totalPages
  const minutes = p.totals.totalReadingMinutes
  const topGenre = p.topGenres[0]?.name
  const longest = p.streak.longest
  const personality = p.personality.title

  const lines: string[] = []
  lines.push(`📚 سال من در کتاب‌ها — کتاب‌یار`)
  lines.push(``)
  lines.push(`📖 ${books} کتاب تمام شد`)
  lines.push(`📄 ${pages} صفحه خواندم`)
  lines.push(`⏱️ ${minutes} دقیقه مطالعه`)
  if (topGenre) lines.push(`🏷️ ژانر محبوب: ${topGenre}`)
  if (longest > 0) lines.push(`🔥 طولانی‌ترین استمرار: ${longest} روز`)
  lines.push(`✨ شخصیت مطالعه‌ای من: ${personality}`)
  lines.push(``)
  lines.push(`شما هم سال خود را مرور کنید: ketabyar.ir/stats`)
  return lines.join('\n')
}
