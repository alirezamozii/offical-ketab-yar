import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateGuestId } from '@/lib/session'
import { getCurrentUser } from '@/lib/auth-session'
import {
  EMPTY_STATS,
  computeAchievementStates,
  type AchievementState,
  type AchievementStats,
} from '@/lib/achievements'
import { getActiveAchievementDefs } from '@/lib/cms'
import { calculateLevel } from '@/lib/gamification'

/**
 * GET /api/achievements — returns the full achievement catalog with each
 * item's unlock status, current progress, rarity, and XP reward.
 *
 * The server computes what it can from the UserStats table + Vocabulary count
 * (guest-scoped). Client-only stats (streak.longestStreak, booksStarted from
 * the localStorage progress map, vocabGamesPlayed, currentStreak, totalReadingDays)
 * are returned as 0 by the server and overridden by the gallery client after
 * mount — see `achievements-gallery-client.tsx` `loadLocalStats()`.
 *
 * Response shape:
 *   {
 *     achievements: AchievementState[],
 *     stats: AchievementStats,
 *     summary: { total, unlocked, totalXPEarned, completionPct }
 *   }
 *
 * Caching: `private, max-age=30` — guest-scoped (cookie-based id), short TTL
 * so newly-unlocked achievements appear on refresh without a hard reload.
 */
export async function GET() {
  try {
    const { id: guestId } = await getOrCreateGuestId()
    // Attach the signed-in user (if any) so achievements + unlock state can
    // be cross-device synced via `userId`. The lookup is best-effort.
    const user = await getCurrentUser().catch(() => null)
    const userId = user?.id

    // Fetch achievement definitions from the CMS DB (admin-editable). Falls
    // back to the legacy static array if the DB is empty (e.g. before the
    // seed script has run on a fresh DB).
    const defs = await getActiveAchievementDefs()

    // Pull whatever the server can know. Each call is independently wrapped
    // so a single failure (e.g. DB unavailable) doesn't poison the
    // whole response — we fall back to a zero-row for that field.
    const ownerWhere = userId ? { OR: [{ userId }, { guestId }] } : { guestId }
    const [statsRow, vocabCount, unlockedRows] = await Promise.all([
      // H-08: use the correct unique key — userId for signed-in, guestId for
      // anonymous. Never set both (both are @unique; setting both collides).
      db.userStats
        .upsert({
          where: userId ? { userId } : { guestId },
          update: {},
          create: userId ? { userId } : { guestId },
        })
        .catch((err) => {
          console.error('[/api/achievements] userStats.upsert failed:', err)
          return null
        }),
      db.vocabulary
        .count({ where: ownerWhere })
        .catch((err) => {
          console.error('[/api/achievements] vocabulary.count failed:', err)
          return 0
        }),
      db.userAchievement
        .findMany({ where: ownerWhere, select: { achievementSlug: true, unlockedAt: true } })
        .catch((err) => {
          console.error('[/api/achievements] userAchievement.findMany failed:', err)
          return [] as { achievementSlug: string; unlockedAt: Date }[]
        }),
    ])

    const unlockedAtMap: Record<string, string> = {}
    for (const u of unlockedRows) {
      unlockedAtMap[u.achievementSlug] = u.unlockedAt.toISOString()
    }

    const stats: AchievementStats = {
      ...EMPTY_STATS,
      // Server-known fields (DB-backed):
      booksCompleted: statsRow?.booksCompleted ?? 0,
      pagesRead: statsRow?.pagesRead ?? 0,
      totalXP: statsRow?.totalXP ?? 0,
      level: statsRow?.level ?? calculateLevel(statsRow?.totalXP ?? 0),
      // Streak from DB is the rolling streak-day count kept by /api/xp.
      // The richer streak object (longestStreak, currentStreak, totalReadingDays)
      // lives in localStorage only — the client overrides these.
      currentStreak: statsRow?.streakDays ?? 0,
      longestStreak: statsRow?.streakDays ?? 0,
      totalReadingDays: statsRow?.streakDays ?? 0,
      // Vocab count is server-known (DB-backed):
      vocabCount,
      // Client-only fields (returned as 0; gallery overrides from localStorage):
      booksStarted: 0,
      gamesPlayed: 0,
    }

    // Compute achievement states from the DB-backed defs. `computeAchievementStates`
    // (from `src/lib/achievements`) takes the defs as its first argument so the
    // same pure helper works against DB rows (server) or API-fetched client caches.
    const achievements = computeAchievementStates(defs, stats, unlockedAtMap)

    const total = achievements.length
    const unlocked = achievements.filter((a) => a.unlocked).length
    const totalXPEarned = achievements
      .filter((a) => a.unlocked)
      .reduce((sum, a) => sum + a.xpReward, 0)
    const completionPct =
      total > 0 ? Math.round((unlocked / total) * 100) : 0

    const payload = {
      achievements,
      stats,
      summary: { total, unlocked, totalXPEarned, completionPct },
    }

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'private, max-age=30',
      },
    })
  } catch (err) {
    console.error('[/api/achievements] GET failed:', err)
    return NextResponse.json(
      {
        error: 'بارگذاری دستاوردها ناموفق بود. لطفاً دوباره تلاش کنید.',
        achievements: [] as AchievementState[],
        stats: EMPTY_STATS,
        summary: {
          total: 0,
          unlocked: 0,
          totalXPEarned: 0,
          completionPct: 0,
        },
      },
      { status: 500 },
    )
  }
}

/**
 * NOTE: The legacy `computeAchievementStatesFromDefs` wrapper has been
 * removed — the canonical `computeAchievementStates(defs, stats, map)` in
 * `src/lib/achievements` now accepts defs as its first argument, so the
 * wrapper was a no-op shim. Callers above use the canonical helper directly.
 */
