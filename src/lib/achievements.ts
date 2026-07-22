/**
 * src/lib/achievements.ts — types, UI constants, and pure helpers for the
 * achievement system.
 *
 * Spiritual successor to `src/lib/the legacy achievements module`. The 22-entry
 * `ACHIEVEMENT_DEFS` array has moved to the `AchievementDef` Prisma model
 * (seeded from `prisma/seed-content.ts`, editable via `/admin/achievements`).
 * Runtime consumers should fetch defs via `src/lib/cms.ts`
 * (`getActiveAchievementDefs`) on the server, or read them from the
 * `/api/achievements` response on the client.
 *
 * What remains here:
 *   • TypeScript types (`AchievementDef`, `AchievementRarity`, …).
 *   • UI constants (`RARITY_STYLES`, `RARITY_LABELS`, `CATEGORY_LABELS`)
 *     — these are Tailwind gradient classes + Persian labels that drive
 *     card rendering; they belong in code, not the DB.
 *   • Pure helpers (`progressFor`, `computeAchievementStates`) — accept
 *     defs as a parameter so the same logic works against DB rows or
 *     against API-fetched client caches.
 */

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'

export type AchievementCategory =
  | 'reading'
  | 'vocabulary'
  | 'streak'
  | 'level'
  | 'games'

export interface AchievementDef {
  id: string
  /** Persian title. */
  title: string
  /** Persian description (shown on card + dialog). */
  description: string
  /** Emoji icon — works without icon-font on every platform. */
  icon: string
  /** Tailwind gradient classes for the badge background. */
  color: string
  rarity: AchievementRarity
  category: AchievementCategory
  /** XP awarded when unlocked (display-only; actual XP comes from the XP API). */
  xpReward: number
  /** Numeric target used to render the progress bar. */
  maxProgress: number
  /** Unit label (Persian) shown next to the progress count, e.g. "صفحه". */
  unit: string
}

/**
 * Rarity tier metadata — border / glow / label / accent color used by the
 * gallery cards. Kept here so both server and client agree on look-and-feel.
 */
export interface RarityStyle {
  /** Persian label. */
  label: string
  /** Tailwind gradient classes for the card's badge border / glow. */
  border: string
  /** Tailwind gradient classes for the ambient glow behind the badge. */
  glow: string
  /** Tailwind text color for the rarity chip. */
  text: string
  /** Tailwind background for the rarity chip. */
  chipBg: string
  /** Confetti / celebration strength (0..3). Legendary = 3 (full confetti). */
  fanfare: 0 | 1 | 2 | 3
}

export const RARITY_STYLES: Record<AchievementRarity, RarityStyle> = {
  common: {
    label: 'معمولی',
    border: 'from-stone-400 to-stone-600',
    glow: 'from-stone-400/20 to-stone-600/10',
    text: 'text-stone-600 dark:text-stone-300',
    chipBg: 'bg-stone-500/15',
    fanfare: 0,
  },
  rare: {
    label: 'نادر',
    border: 'from-emerald-400 to-teal-600',
    glow: 'from-emerald-400/30 to-teal-600/15',
    text: 'text-emerald-600 dark:text-emerald-300',
    chipBg: 'bg-emerald-500/15',
    fanfare: 1,
  },
  epic: {
    label: 'حماسی',
    border: 'from-gold-400 to-amber-600',
    glow: 'from-gold-400/40 to-amber-600/20',
    text: 'text-gold-700 dark:text-gold-300',
    chipBg: 'bg-gold-500/15',
    fanfare: 2,
  },
  legendary: {
    label: 'افسانه‌ای',
    border: 'from-rose-400 via-pink-500 to-fuchsia-600',
    glow: 'from-rose-400/50 via-pink-500/30 to-fuchsia-600/20',
    text: 'text-rose-600 dark:text-rose-300',
    chipBg: 'bg-rose-500/15',
    fanfare: 3,
  },
}

/** Persian labels for the category filter tabs. */
export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  reading: 'مطالعه',
  vocabulary: 'واژگان',
  streak: 'استمرار',
  level: 'سطح',
  games: 'بازی',
}

/** Persian labels for the rarity filter tabs. */
export const RARITY_LABELS: Record<AchievementRarity, string> = {
  common: 'معمولی',
  rare: 'نادر',
  epic: 'حماسی',
  legendary: 'افسانه‌ای',
}

/**
 * Computed achievement state — what the gallery renders. Returned by the
 * /api/achievements route and refined on the client with localStorage-only
 * stats (streak.longestStreak, booksStarted, gamesPlayed).
 */
export interface AchievementState extends AchievementDef {
  unlocked: boolean
  /** Current progress count (e.g. 15 of 50 pages). Clamped to [0, maxProgress]. */
  progress: number
  /** Percentage 0..100 — convenience for the progress bar. */
  progressPct: number
  /** ISO timestamp the achievement was first observed unlocked (client-only). */
  unlockedAt?: string
}

/**
 * Aggregated stats snapshot used to compute unlock states. The API fills what
 * it can from the UserStats table + Vocabulary count; the client overrides
 * with localStorage values for fields the server can't see (booksStarted,
 * longestStreak, currentStreak, totalReadingDays, gamesPlayed).
 */
export interface AchievementStats {
  booksStarted: number
  booksCompleted: number
  pagesRead: number
  currentStreak: number
  longestStreak: number
  totalReadingDays: number
  totalXP: number
  level: number
  vocabCount: number
  gamesPlayed: number
}

export const EMPTY_STATS: AchievementStats = {
  booksStarted: 0,
  booksCompleted: 0,
  pagesRead: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalReadingDays: 0,
  totalXP: 0,
  level: 1,
  vocabCount: 0,
  gamesPlayed: 0,
}

/**
 * Compute the progress count for a single achievement given a stats snapshot.
 * Returns a non-negative integer (clamped to >= 0; NOT clamped to maxProgress
 * so the UI can show "۱۲ / ۵" if a user exceeds a target — though unlock
 * itself fires at >= maxProgress).
 *
 * The id → stat-field mapping is stable across DB-backed defs and legacy
 * code paths (the slug is the same string in both).
 */
export function progressFor(id: string, s: AchievementStats): number {
  switch (id) {
    case 'first-book':
      return s.booksStarted
    case 'books-5':
      return s.booksStarted
    case 'books-10-start':
      return s.booksStarted
    case 'first-finish':
      return s.booksCompleted
    case 'books-finish-3':
      return s.booksCompleted
    case 'books-finish-10':
      return s.booksCompleted
    case 'pages-100':
    case 'pages-500':
      return s.pagesRead
    case 'reader-10':
      return s.totalReadingDays
    case 'streak-3':
    case 'streak-7':
    case 'streak-30':
      return s.longestStreak
    case 'streak-30-cur':
      return s.currentStreak
    case 'vocab-50':
    case 'vocab-200':
    case 'vocab-500':
      return s.vocabCount
    case 'games-5':
    case 'games-25':
      return s.gamesPlayed
    case 'level-10':
    case 'level-30':
    case 'level-50':
    case 'level-99':
      return s.level
    default:
      return 0
  }
}

/**
 * Compute the full achievement state array from a stats snapshot. Used by the
 * API (server-side, DB-only stats) AND by the client (after overriding stats
 * with localStorage values).
 *
 * Accepts the defs as the first argument so the same helper works against:
 *   • DB rows fetched via `getActiveAchievementDefs()` (server)
 *   • Achievement-state arrays fetched from `/api/achievements` (client —
 *     `states` is a superset of `AchievementDef`, so passing the API
 *     response's `achievements` field works directly)
 */
export function computeAchievementStates(
  defs: AchievementDef[],
  stats: AchievementStats,
  unlockedAtMap?: Record<string, string>,
): AchievementState[] {
  return defs.map((def) => {
    const raw = progressFor(def.id, stats)
    const progress = Math.max(0, Math.min(raw, def.maxProgress))
    const unlocked = raw >= def.maxProgress
    const progressPct =
      def.maxProgress > 0
        ? Math.min(100, Math.round((progress / def.maxProgress) * 100))
        : 0
    return {
      ...def,
      unlocked,
      progress,
      progressPct,
      unlockedAt: unlocked ? unlockedAtMap?.[def.id] : undefined,
    }
  })
}
