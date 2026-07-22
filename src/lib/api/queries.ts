/**
 * src/lib/api/queries.ts
 * ---------------------------------------------------------------
 * TanStack Query query key factory + fetch helpers. Centralizes
 * all query keys so cache invalidation is predictable.
 *
 * Usage:
 *   const { data, isLoading, error } = useQuery({
 *     queryKey: queryKeys.xp,
 *     queryFn: fetchXp,
 *   })
 *
 * Owner: Phase 3 R-FE.2
 * ---------------------------------------------------------------
 */

// ── Query key factory ──────────────────────────────────────────────────────
export const queryKeys = {
  xp: ['xp'] as const,
  books: ['books'] as const,
  booksBySlugs: (slugs: string[]) => ['books', 'slugs', slugs] as const,
  vocabulary: ['vocabulary'] as const,
  leaderboard: (period: string) => ['leaderboard', period] as const,
  quotes: ['quotes'] as const,
  goals: ['goals'] as const,
  achievements: ['achievements'] as const,
  activity: ['activity'] as const,
  dailyWords: ['vocabulary', 'daily-words'] as const,
}

// ── Fetch helpers ──────────────────────────────────────────────────────────

export interface XPStats {
  totalXP: number
  level: number
  booksCompleted: number
  pagesRead: number
  streakDays: number
  gained?: { totalXP: number }
}

export async function fetchXp(): Promise<XPStats> {
  const res = await fetch('/api/xp', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch XP')
  return res.json()
}

export async function fetchBooksBySlugs(slugs: string[]): Promise<unknown[]> {
  if (slugs.length === 0) return []
  const res = await fetch(`/api/books?slugs=${encodeURIComponent(slugs.join(','))}`)
  if (!res.ok) return []
  return res.json()
}

export async function fetchVocabulary(): Promise<unknown[]> {
  const res = await fetch('/api/vocabulary')
  if (!res.ok) return []
  return res.json()
}

export async function fetchLeaderboard(period: string): Promise<unknown> {
  const res = await fetch(`/api/leaderboard?period=${encodeURIComponent(period)}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch leaderboard')
  return res.json()
}

export async function fetchGoals(): Promise<unknown> {
  const res = await fetch('/api/goals', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch goals')
  return res.json()
}

export async function fetchAchievements(): Promise<unknown> {
  const res = await fetch('/api/achievements', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch achievements')
  return res.json()
}

export async function fetchActivity(): Promise<unknown[]> {
  const res = await fetch('/api/activity', { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export async function fetchDailyWords(): Promise<unknown[]> {
  const res = await fetch('/api/vocabulary/daily-words', { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}
