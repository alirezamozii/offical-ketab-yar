import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getOrCreateGuestId } from '@/lib/session'
import { getCurrentUser } from '@/lib/auth-session'
import {
  calculateLevel,
  getLevelTitle,
} from '@/lib/gamification'

export type LeaderboardPeriod =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'alltime'

export interface LeaderboardEntry {
  rank: number
  ownerId: string
  name: string
  avatar: string
  xpGained: number
  pagesRead: number
  totalXP: number
  level: number
  levelTitle: string
  isCurrentUser: boolean
  rankChange: number // 0 for now — real rank-change tracking requires historical snapshots (TODO)
}

export interface LeaderboardResponse {
  period: LeaderboardPeriod
  entries: LeaderboardEntry[]
  currentUserRank: number | null
  currentUserRankChange: number
  totalUsers: number
}

const PERIODS: LeaderboardPeriod[] = [
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'alltime',
]

// ── Query-param validation ───────────────────────────────────────────────────
//
// The original route silently fell back to 'weekly' on any unknown period.
// We now reject malformed values explicitly so a buggy client (or a probe
// looking for enum leakage) gets a 400 instead of a confusing 200-with-different-shape.
const QuerySchema = z.object({
  period: z.enum(PERIODS as unknown as [LeaderboardPeriod, ...LeaderboardPeriod[]]).default('weekly'),
})

// XP awarded per page read — mirrors the gamification constant used by /api/xp.
// Kept here (not imported) to avoid a circular dep with the XP route.
const XP_PER_PAGE = 50

/**
 * Compute the inclusive lower-bound timestamp for a leaderboard period.
 * `alltime` returns null (no filter — uses cumulative UserStats).
 */
function periodStart(period: LeaderboardPeriod): Date | null {
  const now = new Date()
  switch (period) {
    case 'daily':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case 'weekly': {
      // ISO week — Monday as the first day.
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const day = d.getDay() || 7 // 0=Sunday → 7
      d.setDate(d.getDate() - (day - 1))
      return d
    }
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    case 'yearly':
      return new Date(now.getFullYear(), 0, 1)
    case 'alltime':
      return null
  }
}

/**
 * Ensure the current caller has a stats row so they appear on the alltime board.
 * Wrapped in try/catch so a DB error doesn't crash the endpoint.
 *
 * Returns the ownerId (userId if signed in, otherwise the guest id).
 */
async function ensureStatsRow(
  owner: { userId: string | null; guestId: string | null },
): Promise<{ ownerId: string; row: { totalXP: number; pagesRead: number; booksCompleted: number; streakDays: number; isMock: boolean; lastReadAt: Date | null; name: string } | null }> {
  const ownerId = owner.userId ?? owner.guestId ?? 'unknown'
  try {
    const row = await db.userStats.upsert({
      where: owner.userId ? { userId: owner.userId } : { guestId: owner.guestId! },
      update: {},
      create: owner.userId
        ? { userId: owner.userId, guestId: null }
        : { guestId: owner.guestId!, userId: null },
    })
    return {
      ownerId,
      row: {
        name: row.name,
        totalXP: row.totalXP,
        pagesRead: row.pagesRead,
        booksCompleted: row.booksCompleted,
        streakDays: row.streakDays,
        isMock: row.isMock,
        lastReadAt: row.lastReadAt,
      },
    }
  } catch (err) {
    console.error('[/api/leaderboard] userStats.upsert failed:', err)
    return {
      ownerId,
      row: {
        name: '',
        totalXP: 0,
        pagesRead: 0,
        booksCompleted: 0,
        streakDays: 0,
        isMock: false,
        lastReadAt: null,
      },
    }
  }
}

const LEADERBOARD_CACHE_CONTROL = 'public, max-age=60, s-maxage=120'

export async function GET(req: NextRequest) {
  // H-17: identity = userId if signed in, else guestId. We avoid leaking
  // either to the client (the entry uses an opaque `ownerId` field — which
  // is the same string for the same identity, so the client can still tell
  // "is this me?" without exposing the underlying user/guest id).
  const { id: guestId } = await getOrCreateGuestId()
  const user = await getCurrentUser().catch(() => null)
  const userId = user?.id ?? null
  const ownerId = userId ?? guestId

  const periodParamRaw = req.nextUrl.searchParams.get('period')
  // Use safeParse on the *raw* string so an unknown value gets a clean 400
  // instead of being silently coerced to 'weekly'.
  const periodParse = QuerySchema.safeParse({ period: periodParamRaw ?? 'weekly' })
  if (!periodParse.success) {
    return NextResponse.json(
      {
        error: 'پارامتر period نامعتبر است.',
        details: periodParse.error.flatten(),
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  const period: LeaderboardPeriod = periodParse.data.period

  if (period === 'alltime') {
    // ── Alltime: rank by cumulative totalXP from UserStats (real, honest). ──
    type StatsRow = {
      userId: string | null
      guestId: string | null
      name: string
      totalXP: number
      pagesRead: number
      booksCompleted: number
      streakDays: number
      isMock: boolean
      lastReadAt: Date | null
    }
    let rows: StatsRow[] = []
    try {
      rows = await db.userStats.findMany({ orderBy: { totalXP: 'desc' } })
    } catch (err) {
      console.error('[/api/leaderboard] userStats.findMany failed:', err)
    }

    // Ensure the current caller has a row so they show up.
    const { row: meRow } = await ensureStatsRow({ userId, guestId })
    if (meRow && !rows.some((r) => (r.userId ?? r.guestId) === ownerId)) {
      rows.push({
        userId,
        guestId,
        ...meRow,
      })
    }
    // Sort by totalXP desc (after possibly appending the current user).
    rows.sort((a, b) => b.totalXP - a.totalXP)

    let currentUserRank: number | null = null
    const entries: LeaderboardEntry[] = rows.map((r, i) => {
      const rank = i + 1
      const rowOwnerId = r.userId ?? r.guestId ?? `r-${i}`
      const isCurrentUser = rowOwnerId === ownerId
      if (isCurrentUser) currentUserRank = rank
      const level = calculateLevel(r.totalXP)
      const name = r.name || (isCurrentUser ? 'شما' : 'کاربر')
      return {
        rank,
        ownerId: rowOwnerId,
        name,
        avatar: name.trim().charAt(0) || '؟',
        xpGained: r.totalXP,
        pagesRead: r.pagesRead,
        totalXP: r.totalXP,
        level,
        levelTitle: getLevelTitle(level),
        isCurrentUser,
        rankChange: 0, // TODO: track historical ranks for real deltas
      }
    })

    const payload: LeaderboardResponse = {
      period,
      entries,
      currentUserRank,
      currentUserRankChange: 0,
      totalUsers: entries.length,
    }
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': LEADERBOARD_CACHE_CONTROL },
    })
  }

  // ── Per-period: aggregate REAL ReadingSession rows within the window. ──
  const start = periodStart(period)
  if (!start) {
    return NextResponse.json({ error: 'invalid period' }, { status: 400 })
  }

  // Group ReadingSession by owner (userId preferred, else guestId), summing
  // pagesRead and minutesRead. We also join against UserStats for the
  // cumulative totalXP + display name.
  type SessionAgg = { ownerId: string; pagesRead: number; minutesRead: number }
  let sessions: SessionAgg[] = []
  try {
    const raw = await db.readingSession.findMany({
      where: { startedAt: { gte: start } },
      select: { userId: true, guestId: true, pagesRead: true, minutesRead: true },
    })
    const map = new Map<string, SessionAgg>()
    for (const s of raw) {
      const oid = s.userId ?? s.guestId
      if (!oid) continue // orphan row with neither key — skip
      const cur = map.get(oid) || { ownerId: oid, pagesRead: 0, minutesRead: 0 }
      cur.pagesRead += s.pagesRead
      cur.minutesRead += s.minutesRead
      map.set(oid, cur)
    }
    sessions = Array.from(map.values())
  } catch (err) {
    console.error('[/api/leaderboard] readingSession aggregation failed:', err)
  }

  // Pull display names + cumulative XP from UserStats for everyone who read.
  const ownerIds = sessions.map((s) => s.ownerId)
  const statsByName = new Map<
    string,
    { name: string; totalXP: number; pagesRead: number }
  >()
  try {
    // Look up stats by userId OR guestId — ownerIds contains whichever is
    // set per row (we used `userId ?? guestId` above).
    const [byUser, byGuest] = await Promise.all([
      db.userStats.findMany({
        where: { userId: { in: ownerIds } },
        select: { userId: true, name: true, totalXP: true, pagesRead: true },
      }),
      db.userStats.findMany({
        where: { guestId: { in: ownerIds } },
        select: { guestId: true, name: true, totalXP: true, pagesRead: true },
      }),
    ])
    for (const s of byUser) {
      if (s.userId) {
        statsByName.set(s.userId, {
          name: s.name,
          totalXP: s.totalXP,
          pagesRead: s.pagesRead,
        })
      }
    }
    for (const s of byGuest) {
      if (s.guestId) {
        statsByName.set(s.guestId, {
          name: s.name,
          totalXP: s.totalXP,
          pagesRead: s.pagesRead,
        })
      }
    }
  } catch (err) {
    console.error('[/api/leaderboard] userStats lookup failed:', err)
  }

  // Ensure the current caller is represented even if they haven't read this
  // period yet (so they see themselves at the bottom with 0 pages).
  if (!sessions.some((s) => s.ownerId === ownerId)) {
    sessions.push({ ownerId, pagesRead: 0, minutesRead: 0 })
  }
  // Make sure the current caller has a stats row for their display name + totalXP.
  await ensureStatsRow({ userId, guestId })

  // Rank by pagesRead in the period (desc), tiebreaker by minutesRead.
  sessions.sort((a, b) => b.pagesRead - a.pagesRead || b.minutesRead - a.minutesRead)

  let currentUserRank: number | null = null
  const entries: LeaderboardEntry[] = sessions.map((s, i) => {
    const rank = i + 1
    const isCurrentUser = s.ownerId === ownerId
    if (isCurrentUser) currentUserRank = rank
    const stat = statsByName.get(s.ownerId)
    const totalXP = stat?.totalXP ?? 0
    const level = calculateLevel(totalXP)
    // Derive period XP from pages read in the period (honest, not fabricated).
    const xpGained = s.pagesRead * XP_PER_PAGE
    const name = stat?.name || (isCurrentUser ? 'شما' : 'کاربر')
    return {
      rank,
      ownerId: s.ownerId,
      name,
      avatar: name.trim().charAt(0) || '؟',
      xpGained,
      pagesRead: s.pagesRead,
      totalXP,
      level,
      levelTitle: getLevelTitle(level),
      isCurrentUser,
      rankChange: 0, // TODO: track historical ranks for real deltas
    }
  })

  const payload: LeaderboardResponse = {
    period,
    entries,
    currentUserRank,
    currentUserRankChange: 0,
    totalUsers: entries.length,
  }

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': LEADERBOARD_CACHE_CONTROL },
  })
}
