import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getOrCreateGuestId } from '@/lib/session'
import { getCurrentUser } from '@/lib/auth-session'
import { calculateLevel } from '@/lib/gamification'
import {
  EMPTY_SERVER_STATS,
  computeTimeDistribution,
  computeVelocity,
  computeWeeklySummary,
  computeGoalProgress,
  type GoalsConfig,
  type GoalsProgressPayload,
  type GoalsServerStats,
  type MilestoneDef,
} from '@/lib/goals'
import { getGoalsConfigFromDB, getActiveMilestoneDefs } from '@/lib/cms'
import { parseBody } from '@/lib/api-validate'
import { apiError } from '@/lib/api-error'

/**
 * GET /api/goals — returns the user's current goals + a full progress payload
 * for the /goals page.
 *
 * The server returns:
 *   • goals (default if never set)
 *   • progress for each period (daily / weekly / monthly) computed from the
 *     `ReadingHistoryDay[]` in localStorage IF the client passes it via the
 *     `X-Ky-Goals-Stats` header — but for SSR / first paint we compute a
 *     server-side snapshot from UserStats (pagesRead, booksCompleted,
 *     streakDays) + Vocabulary count.
 *   • velocity (last 14 days) — server returns zeros; client overrides.
 *   • time distribution — server returns zeros; client overrides.
 *   • milestones — server computes from UserStats.
 *   • weekly summary — server returns zeros; client overrides.
 *
 * The client (`goals-page-client.tsx`) calls `readReadingHistory()` on mount
 * and re-derives the velocity / time-distribution / weekly summary locally,
 * then merges those values with the server-returned milestones + stats.
 *
 * Caching: `private, max-age=30` — guest-scoped, short TTL so newly-read
 * pages appear on refresh without a hard reload.
 */
export async function GET() {
  try {
    const { id: guestId } = await getOrCreateGuestId()
    // Attach the signed-in user (if any) so goal progress can be
    // cross-device synced via `userId` (audit 04 §6.5 fix).
    const user = await getCurrentUser().catch(() => null)
    const userId = user?.id
    const ownerWhere = userId ? { OR: [{ userId }, { guestId }] } : { guestId }

    // Fetch goals + milestone defs from the CMS DB (admin-editable).
    const [goals, milestoneDefs] = await Promise.all([
      getGoalsConfigFromDB(),
      getActiveMilestoneDefs(),
    ])

    const [statsRow, vocabCount] = await Promise.all([
      // H-08: use the correct unique key — userId for signed-in, guestId for
      // anonymous. Never set both (both are @unique; setting both collides).
      db.userStats
        .upsert({
          where: userId ? { userId } : { guestId },
          update: {},
          create: userId ? { userId } : { guestId },
        })
        .catch((err) => {
          console.error('[/api/goals] userStats.upsert failed:', err)
          return null
        }),
      db.vocabulary
        .count({ where: ownerWhere })
        .catch((err) => {
          console.error('[/api/goals] vocabulary.count failed:', err)
          return 0
        }),
    ])

    const stats: GoalsServerStats = {
      ...EMPTY_SERVER_STATS,
      totalXP: statsRow?.totalXP ?? 0,
      level: statsRow?.level ?? calculateLevel(statsRow?.totalXP ?? 0),
      pagesRead: statsRow?.pagesRead ?? 0,
      booksCompleted: statsRow?.booksCompleted ?? 0,
      streakDays: statsRow?.streakDays ?? 0,
      vocabCount,
    }

    // Server-side milestones — the client will refresh these once it has
    // loaded localStorage (longestStreak, readingDays, etc.).
    const milestones = computeMilestonesFromDefs(milestoneDefs, {
      pagesRead: stats.pagesRead,
      booksCompleted: stats.booksCompleted,
      streakDays: stats.streakDays,
      longestStreak: stats.streakDays,
      readingDays: stats.streakDays,
      vocabCount: stats.vocabCount,
      level: stats.level,
    })

    // Server-side goals + progress (using UserStats as the source of pagesRead).
    // For "today" / "this week" / "this month" the server doesn't have per-day
    // granularity, so we return a degraded progress payload (current = pagesRead
    // for monthly, 0 for daily / weekly). The client overrides with history.
    const progress = computeGoalProgress(goals, [
      // Single synthetic "today" entry carrying the server-known pagesRead total
      // so the monthly ring at least shows *something* on first paint.
      {
        date: new Date().toISOString().slice(0, 10),
        pages: stats.pagesRead,
        seconds: 0,
        byHour: new Array(24).fill(0),
      },
    ])

    const payload: GoalsProgressPayload = {
      daily: progress.daily,
      weekly: progress.weekly,
      monthly: progress.monthly,
      velocity: computeVelocity([], 14),
      avgPagesPerDay: 0,
      bestDayPages: 0,
      bestDayDate: '',
      timeDistribution: computeTimeDistribution([]),
      bestHour: -1,
      streak: {
        current: stats.streakDays,
        longest: stats.streakDays,
        totalReadingDays: stats.streakDays,
      },
      milestones,
      weeklySummary: computeWeeklySummary([]),
      stats,
    }

    return NextResponse.json(
      { goals, ...payload },
      {
        headers: {
          'Cache-Control': 'private, max-age=30',
        },
      },
    )
  } catch (err) {
    console.error('[/api/goals] GET failed:', err)
    return NextResponse.json(
      {
        error:
          'بارگذاری اهداف و آمار مطالعه ناموفق بود. لطفاً دوباره تلاش کنید.',
        goals: { daily: { target: 10, unit: 'pages' }, weekly: { target: 70, unit: 'pages' }, monthly: { target: 300, unit: 'pages' } },
        daily: { current: 0, target: 10, pct: 0, reached: false },
        weekly: { current: 0, target: 70, pct: 0, reached: false },
        monthly: { current: 0, target: 300, pct: 0, reached: false },
        velocity: [],
        avgPagesPerDay: 0,
        bestDayPages: 0,
        bestDayDate: '',
        timeDistribution: [],
        bestHour: -1,
        streak: { current: 0, longest: 0, totalReadingDays: 0 },
        milestones: [],
        weeklySummary: {
          pagesRead: 0,
          secondsRead: 0,
          booksTouched: 0,
          avgPagesPerDay: 0,
          vsLastWeekPct: 0,
        },
        stats: EMPTY_SERVER_STATS,
      },
      { status: 500 },
    )
  }
}

/**
 * Compute the milestone timeline from DB-fetched milestone defs + a stats
 * snapshot. Mirrors the legacy `computeMilestones` helper but reads the
 * `kind` field from the DB rows instead of the legacy `MILESTONE_DEFS`
 * constant (the constant has been deleted; the DB is the source of truth).
 */
function computeMilestonesFromDefs(
  defs: MilestoneDef[],
  input: {
    pagesRead: number
    booksCompleted: number
    streakDays: number
    longestStreak: number
    readingDays: number
    vocabCount: number
    level: number
  },
) {
  const lookup: Record<string, number> = {
    pages: input.pagesRead,
    booksCompleted: input.booksCompleted,
    streak: input.longestStreak || input.streakDays,
    vocab: input.vocabCount,
    level: input.level,
    readingDays: input.readingDays,
  }
  return defs.map((def) => {
    const raw = lookup[def.kind] ?? 0
    const progress = Math.max(0, Math.min(raw, def.target))
    const unlocked = raw >= def.target
    const pct = def.target > 0 ? Math.min(100, Math.round((progress / def.target) * 100)) : 0
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      icon: def.icon,
      kind: def.kind,
      target: def.target,
      progress,
      pct,
      unlocked,
      unlockedAt: null as string | null,
    }
  })
}

// ── Input validation ─────────────────────────────────────────────────────────
//
// Goals live client-side (localStorage) — this endpoint is primarily a
// validation pass-through. We accept the same shape the client persists:
// each period has { target: number, unit: 'pages' | 'minutes' }, target is
// capped at 10 000 to keep the math reasonable.
const GoalUnitSchema = z.enum(['pages', 'minutes'])
const GoalPeriodSchema = z.object({
  target: z.number().int().min(1).max(10_000),
  unit: GoalUnitSchema,
})

const GoalsSchema = z.object({
  goals: z.object({
    daily: GoalPeriodSchema,
    weekly: GoalPeriodSchema,
    monthly: GoalPeriodSchema,
  }),
})

/**
 * POST /api/goals — update the user's goal targets. Body:
 *   { goals: GoalsConfig }
 *
 * Goals are persisted to localStorage (`ky_goals`) on the client side;
 * the server endpoint exists primarily so the page can validate the payload
 * and so future server-side features (XP rewards for hitting goals, weekly
 * digests) have a single integration point.
 *
 * Returns 200 with the validated goals on success, 400 on validation error.
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = await parseBody(req, GoalsSchema, 'بدنه درخواست نامعتبر است.')
    if (!parsed.ok) return parsed.response

    const validated = parsed.data.goals as GoalsConfig

    return NextResponse.json(
      { goals: validated },
      {
        headers: {
          'Cache-Control': 'private, max-age=30',
        },
      },
    )
  } catch (err) {
    console.error('[/api/goals] POST failed:', err)
    return apiError('ذخیره اهداف ناموفق بود. لطفاً دوباره تلاش کنید.', 500)
  }
}
