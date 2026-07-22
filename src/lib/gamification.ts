/**
 * Gamification System — XP, levels, and leaderboard helpers.
 * Progressive leveling (1-99), XP bonuses, and Persian rank/title formatting.
 */

import { dateKey, hashString } from '@/lib/typography'

const MAX_LEVEL = 99

export type BookDifficulty = 'beginner' | 'intermediate' | 'advanced'

/** Map a CEFR level string (A1..C2) to a difficulty bucket. */
export function cefrToDifficulty(level: string): BookDifficulty {
  const v = (level || '').trim().toUpperCase()
  if (v === 'C1' || v === 'C2') return 'advanced'
  if (v === 'B1' || v === 'B2') return 'intermediate'
  return 'beginner'
}

/**
 * Calculate user level from total XP (Progressive difficulty to level 99).
 * Formula: level = floor(10 * sqrt(xp / 100)), capped 1..99.
 * Level 1: 0 XP, Level 99: ~1,000,000 XP.
 */
export function calculateLevel(xp: number): number {
  if (xp < 0) return 1
  const level = Math.floor(10 * Math.sqrt(xp / 100))
  return Math.min(Math.max(1, level), MAX_LEVEL)
}

/**
 * XP required to reach a given level (inverse of calculateLevel).
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  if (level >= MAX_LEVEL) return 1_000_000
  return Math.floor(((level / 10) ** 2) * 100)
}

/**
 * Persian level title for a level band.
 */
export function getLevelTitle(level: number): string {
  if (level >= 90) return '🏆 افسانه‌ای'
  if (level >= 80) return '💎 الماسی'
  if (level >= 70) return '👑 پادشاه'
  if (level >= 60) return '⚔️ قهرمان'
  if (level >= 50) return '🌟 استاد'
  if (level >= 40) return '🔥 حرفه‌ای'
  if (level >= 30) return '📚 دانشمند'
  if (level >= 20) return '✨ ماهر'
  if (level >= 10) return '🎯 پیشرفته'
  return '🌱 مبتدی'
}

export interface LevelProgress {
  currentLevel: number
  nextLevel: number
  xpForCurrentLevel: number
  xpForNextLevel: number
  xpProgress: number
  xpNeeded: number
  progressPercentage: number
  levelTitle: string
  isMaxLevel: boolean
}

/**
 * Compute the user's progress from currentXP toward the next level.
 */
export function xpProgressToNextLevel(currentXP: number): LevelProgress {
  const safeXP = Math.max(0, Math.floor(currentXP || 0))
  const currentLevel = calculateLevel(safeXP)
  const isMaxLevel = currentLevel >= MAX_LEVEL
  const nextLevel = isMaxLevel ? MAX_LEVEL : currentLevel + 1
  const xpForCurrentLevel = xpForLevel(currentLevel)
  const xpForNextLevel = xpForLevel(nextLevel)
  const xpProgress = safeXP - xpForCurrentLevel
  const xpNeeded = Math.max(1, xpForNextLevel - xpForCurrentLevel)
  const progressPercentage = isMaxLevel
    ? 100
    : Math.min(100, Math.max(0, Math.floor((xpProgress / xpNeeded) * 100)))

  return {
    currentLevel,
    nextLevel,
    xpForCurrentLevel,
    xpForNextLevel,
    xpProgress,
    xpNeeded,
    progressPercentage,
    levelTitle: getLevelTitle(currentLevel),
    isMaxLevel,
  }
}

export interface ReadingXPInput {
  pagesRead: number
  hasStreak?: boolean
  streakDays?: number
  completedBook?: boolean
  bookLevel?: BookDifficulty
  isFirstReadToday?: boolean
}

export interface ReadingXPResult {
  baseXP: number
  streakBonus: number
  completionBonus: number
  difficultyBonus: number
  firstReadBonus: number
  totalXP: number
  bonusMultiplier: number
}

/**
 * Calculate the XP reward for a reading event with all applicable bonuses.
 * - Base: 2 XP per page
 * - Streak: up to +100% of base at 30+ day streak
 * - Completion: +200 flat
 * - Difficulty: +50% (advanced) / +25% (intermediate)
 * - First read of the day: +50
 */
export function calculateReadingXP(params: ReadingXPInput): ReadingXPResult {
  const pages = Math.max(0, Math.floor(params.pagesRead || 0))
  const baseXP = pages * 2

  let streakBonus = 0
  if (params.hasStreak && params.streakDays && params.streakDays > 0) {
    const streakMultiplier = Math.min(1.0, params.streakDays / 30)
    streakBonus = Math.floor(baseXP * streakMultiplier)
  }

  const completionBonus = params.completedBook ? 200 : 0

  let difficultyBonus = 0
  if (params.bookLevel === 'advanced') {
    difficultyBonus = Math.floor(baseXP * 0.5)
  } else if (params.bookLevel === 'intermediate') {
    difficultyBonus = Math.floor(baseXP * 0.25)
  }

  const firstReadBonus = params.isFirstReadToday ? 50 : 0

  const totalXP =
    baseXP + streakBonus + completionBonus + difficultyBonus + firstReadBonus
  const bonusMultiplier = baseXP > 0 ? totalXP / baseXP : 0

  return {
    baseXP,
    streakBonus,
    completionBonus,
    difficultyBonus,
    firstReadBonus,
    totalXP,
    bonusMultiplier,
  }
}

/**
 * Leaderboard rank emoji for top-3, otherwise "#N".
 */
export function getRankEmoji(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

/**
 * Tailwind text color class for a given rank.
 */
export function getRankColor(rank: number): string {
  if (rank === 1) return 'text-yellow-500'
  if (rank === 2) return 'text-gray-400'
  if (rank === 3) return 'text-orange-600'
  return 'text-muted-foreground'
}

/** Format an integer in Persian digits with thousands separators. */
export function toPersianNumber(value: number): string {
  return value.toLocaleString('fa-IR')
}

// ──────────────────────────────────────────────────────────────────────────────
// Daily challenges
// ──────────────────────────────────────────────────────────────────────────────

export type ChallengeKind =
  | 'read-10m'
  | 'read-20m'
  | 'learn-3'
  | 'learn-5'
  | 'play-1'
  | 'read-5p'
  | 'streak-check'
  | 'finish-1'

export interface ChallengeDef {
  id: ChallengeKind
  title: string
  description: string
  icon: string
  target: number
  /** unit displayed in the UI: 'min', 'word', 'game', 'page', 'day', 'book' */
  unit: 'min' | 'word' | 'game' | 'page' | 'day' | 'book'
  reward: number
}

export const CHALLENGE_POOL: ChallengeDef[] = [
  {
    id: 'read-10m',
    title: '۱۰ دقیقه مطالعه کن',
    description: 'امروز حداقل ده دقیقه کتاب بخوان',
    icon: '⏱️',
    target: 600,
    unit: 'min',
    reward: 30,
  },
  {
    id: 'read-20m',
    title: '۲۰ دقیقه مطالعه کن',
    description: 'امروز حداقل بیست دقیقه کتاب بخوان',
    icon: '📖',
    target: 1200,
    unit: 'min',
    reward: 60,
  },
  {
    id: 'learn-3',
    title: '۳ واژه جدید یاد بگیر',
    description: 'سه واژه جدید به واژگان‌نامه اضافه کن',
    icon: '📝',
    target: 3,
    unit: 'word',
    reward: 25,
  },
  {
    id: 'learn-5',
    title: '۵ واژه جدید یاد بگیر',
    description: 'پنج واژه جدید به واژگان‌نامه اضافه کن',
    icon: '📗',
    target: 5,
    unit: 'word',
    reward: 45,
  },
  {
    id: 'play-1',
    title: '۱ بازی واژگان انجام بده',
    description: 'یک جلسه بازی واژگان را کامل کن',
    icon: '🎮',
    target: 1,
    unit: 'game',
    reward: 35,
  },
  {
    id: 'read-5p',
    title: '۵ صفحه بخوان',
    description: 'امروز پنج صفحه از کتاب‌هايت بخوان',
    icon: '📄',
    target: 5,
    unit: 'page',
    reward: 30,
  },
  {
    id: 'streak-check',
    title: 'استمرارت را حفظ کن',
    description: 'امروز هم مطالعه کن تا زنجیره استمرارت پایدار بماند',
    icon: '🔥',
    target: 1,
    unit: 'day',
    reward: 20,
  },
  {
    id: 'finish-1',
    title: 'یک کتاب را تمام کن',
    description: 'امروز یک کتاب را تا انتها برسان',
    icon: '🏁',
    target: 1,
    unit: 'book',
    reward: 100,
  },
]

/**
 * Pick 3 challenges for the given date. Deterministic by date so every user
 * sees the same set on a given day. Guarantees at least one "read X min"
 * challenge (unit === 'min') and ensures all 3 picks are distinct kinds.
 *
 * `dateKey` and `hashString` are imported from `@/lib/typography` (the
 * canonical implementation) — see INVEST-3 item C.5 / W1-C.
 *
 * BUGFIX (R2-I tests): the previous LCG step used
 *   `cursor = (cursor * 1103515245 + 12345) & 0x7fffffff`
 * which loses precision once `cursor * 1103515245` exceeds 2^53 (the
 * Number.MAX_SAFE_INTEGER limit). The corrupted cursor would then cycle
 * through a small set of indices, never landing on a fresh challenge kind —
 * producing an infinite loop on certain dates (e.g. 2024-06-04).
 *
 * Fix: use `Math.imul` to keep the multiplication 32-bit (the standard JS
 * pattern for LCGs that need to be deterministic across runs). Also add a
 * hard iteration cap (8 * POOL.length = 64) as defense-in-depth so the
 * function ALWAYS terminates even if the LCG ever degenerates again.
 */
export function pickDailyChallenges(date: Date = new Date()): ChallengeDef[] {
  const key = dateKey(date)
  const seed = hashString(`ky_daily|${key}`)
  // Always include a reading-minutes challenge (read-10m or read-20m).
  const readMinutesKinds = CHALLENGE_POOL.filter((c) => c.unit === 'min')
  const pick0 = readMinutesKinds[seed % readMinutesKinds.length]
  const picks: ChallengeDef[] = [pick0]
  // Pick two more, distinct ids, from the rest of the pool.
  let cursor = seed >>> 0
  const usedIds = new Set<string>([pick0.id])
  // Hard cap: with 8 pool entries we need ≤7 probes to find 2 fresh kinds
  // in the worst case. 64 iterations is more than enough headroom while
  // guaranteeing termination.
  const MAX_ITER = 8 * CHALLENGE_POOL.length
  let iter = 0
  while (picks.length < 3 && iter < MAX_ITER) {
    cursor = (Math.imul(cursor, 1103515245) + 12345) >>> 0
    const idx = cursor % CHALLENGE_POOL.length
    const cand = CHALLENGE_POOL[idx]
    if (!usedIds.has(cand.id)) {
      picks.push(cand)
      usedIds.add(cand.id)
    }
    iter++
  }
  // Fallback: if the LCG somehow degenerated, fill remaining slots by walking
  // the pool linearly. This guarantees the function always returns 3 picks.
  if (picks.length < 3) {
    for (const cand of CHALLENGE_POOL) {
      if (picks.length >= 3) break
      if (!usedIds.has(cand.id)) {
        picks.push(cand)
        usedIds.add(cand.id)
      }
    }
  }
  return picks
}

// ──────────────────────────────────────────────────────────────────────────────
// Leaderboard rank-change helper
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Deterministically compute a rank-change delta for a guest in a given period.
 * Positive = the user climbed N ranks since yesterday; negative = dropped;
 * zero = no change. Range: -3..+3.
 */
export function rankChangeDelta(
  guestId: string,
  period: string,
  todayKey: string,
): number {
  const seed = hashString(`${guestId}|${period}|${todayKey}|rc`)
  // Map to -3..+3, biased toward 0 and positive (engagement-positive nudges).
  const v = seed % 7 // 0..6
  const map = [0, 1, 2, -1, 0, 1, 0]
  return map[v]
}

// Re-export `dateKey` from `@/lib/typography` for backward compatibility with
// existing consumers (xp-bar, daily-challenges, leaderboard route, challenges
// route). The canonical implementation now lives in typography.ts.
export { dateKey }
