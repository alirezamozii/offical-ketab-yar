import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateGuestId } from '@/lib/session'
import { calculateLevel } from '@/lib/gamification'
import {
  computeAchievementStates,
  EMPTY_STATS,
  type AchievementStats,
} from '@/lib/achievements'
import { getActiveAchievementDefs } from '@/lib/cms'
import {
  buildLast12Months,
  buildDayOfWeekBuckets,
  buildHourBuckets,
  EMPTY_STATS_PAYLOAD,
  pickRarestAchievement,
  type StatsPayload,
} from '@/lib/stats-data'

/**
 * GET /api/stats — Year-in-Review reading-stats payload.
 *
 * The server returns what it can compute from the UserStats table +
 * Vocabulary count:
 *   • totals.totalPages, totalXP, level, vocabCount, booksCompleted
 *   • achievements unlocked count + rarest + recent
 *
 * The client (`stats-page-client.tsx`) overrides the localStorage-only
 * fields after mount:
 *   • booksStarted, booksInProgress, totalReadingMinutes, gamesPlayed
 *   • topGenres, topAuthors (need the localStorage progress map + book
 *     metadata from /api/books)
 *   • readingByMonth / readingByDayOfWeek / readingByHour (need
 *     `ky_reading_history`)
 *   • bookJourney (need progress map + book metadata)
 *   • vocabGrowth (need `ky_vocab_activity`)
 *   • streak.current / longest / totalReadingDays (need `ky_streak`)
 *   • consistencyScore, avgPagesPerDay, bestHour, bestDayOfWeek
 *   • personality
 *
 * Caching: `private, max-age=30` — guest-scoped (cookie-based id), short
 * TTL so newly-read pages appear on refresh without a hard reload.
 */
export async function GET() {
  try {
    const { id } = await getOrCreateGuestId()

    // Fetch achievement defs from the CMS DB (admin-editable). Replaces the
    // legacy `ACHIEVEMENT_DEFS` constant — the DB is now the single source
    // of truth, so admin edits to achievements propagate here without a
    // redeploy. The defs are also used to compute the achievement states
    // via the canonical `computeAchievementStates(defs, stats, map)` helper.
    const [achievementDefs, statsRow, vocabCount] = await Promise.all([
      getActiveAchievementDefs(),
      db.userStats
        .upsert({
          where: { guestId: id },
          update: {},
          create: { guestId: id },
        })
        .catch((err) => {
          console.error('[/api/stats] userStats.upsert failed:', err)
          return null
        }),
      db.vocabulary
        .count({ where: { guestId: id } })
        .catch((err) => {
          console.error('[/api/stats] vocabulary.count failed:', err)
          return 0
        }),
    ])

    const totalXP = statsRow?.totalXP ?? 0
    const level = statsRow?.level ?? calculateLevel(totalXP)
    const pagesRead = statsRow?.pagesRead ?? 0
    const booksCompleted = statsRow?.booksCompleted ?? 0
    const streakDays = statsRow?.streakDays ?? 0

    // Compute the achievements summary from the DB-known stats. The client
    // will refine it (longest streak, books started, games played) and
    // re-pick the rarest once the localStorage override is applied.
    const achStats: AchievementStats = {
      ...EMPTY_STATS,
      booksCompleted,
      pagesRead,
      totalXP,
      level,
      currentStreak: streakDays,
      longestStreak: streakDays,
      totalReadingDays: streakDays,
      vocabCount,
    }
    const achievementStates = computeAchievementStates(achievementDefs, achStats)
    const unlockedAch = achievementStates.filter((a) => a.unlocked)
    const rarest = pickRarestAchievement(unlockedAch)
    const recent = unlockedAch
      .map((a) => ({
        id: a.id,
        title: a.title,
        icon: a.icon,
        rarity: a.rarity,
        unlockedAt: a.unlockedAt ?? null,
      }))
      .sort((a, b) => (b.unlockedAt ?? '').localeCompare(a.unlockedAt ?? ''))
      .slice(0, 6)

    const payload: StatsPayload = {
      totals: {
        booksStarted: 0, // client override (progress map size)
        booksCompleted,
        booksInProgress: 0, // client override
        totalPages: pagesRead,
        totalReadingMinutes: 0, // client override (history seconds sum)
        totalXP,
        level,
        vocabCount,
        gamesPlayed: 0, // client override (ky_vocab_games_played)
        achievementsUnlocked: unlockedAch.length,
        achievementsTotal: achievementDefs.length,
        consistencyScore: 0, // client override
        avgPagesPerDay: 0, // client override
      },
      streak: {
        current: streakDays,
        longest: streakDays,
        totalReadingDays: streakDays,
      },
      topGenres: [], // client override
      topAuthors: [], // client override
      readingByMonth: buildLast12Months(), // zeros; client overrides
      readingByDayOfWeek: buildDayOfWeekBuckets(), // zeros; client overrides
      readingByHour: buildHourBuckets(), // zeros; client overrides
      bestHour: -1, // client override
      bestDayOfWeek: -1, // client override
      bookJourney: [], // client override (needs progress map + book metadata)
      vocabGrowth: [], // client override (needs ky_vocab_activity)
      achievements: {
        unlocked: unlockedAch.length,
        total: achievementDefs.length,
        rarest,
        recent,
      },
      // Server can't see localStorage; personality is set by the client after
      // it has the full picture. We default to the "casual" placeholder.
      personality: EMPTY_STATS_PAYLOAD.personality,
      // `isEmpty` is true on the server because the client hasn't yet
      // confirmed whether the user has any localStorage reading history.
      // Once the client loads its overrides, it sets isEmpty based on
      // booksStarted + booksCompleted + totalPages + totalReadingMinutes.
      isEmpty: pagesRead === 0 && booksCompleted === 0 && vocabCount === 0,
    }

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'private, max-age=30',
      },
    })
  } catch (err) {
    console.error('[/api/stats] GET failed:', err)
    return NextResponse.json(
      {
        ...EMPTY_STATS_PAYLOAD,
        error: 'بارگذاری آمار مطالعه ناموفق بود. لطفاً دوباره تلاش کنید.',
      },
      { status: 500 },
    )
  }
}
