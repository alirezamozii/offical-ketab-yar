import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db, isDbOffline, safeQuery, tripDbOffline } from '@/lib/db'
import { getOrCreateGuestId } from '@/lib/session'
import { getCurrentUser } from '@/lib/auth-session'
import {
  calculateLevel,
  getLevelTitle,
} from '@/lib/gamification'

type LeaderboardPeriod =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'alltime'

interface LeaderboardEntry {
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
  rankChange: number
}

interface LeaderboardResponse {
  period: LeaderboardPeriod
  entries: LeaderboardEntry[]
  currentUserRank: number | null
  currentUserRankChange: number
  totalUsers: number
}

interface BaseEntry {
  ownerId: string
  name: string
  avatar: string
  xpGained: number
  pagesRead: number
  totalXP: number
  level: number
  levelTitle: string
  rankChange: number
}

interface CachedLeaderboard {
  timestamp: number
  baseEntries: BaseEntry[]
}

const PERIODS: LeaderboardPeriod[] = [
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'alltime',
]

const QuerySchema = z.object({
  period: z.enum(PERIODS as unknown as [LeaderboardPeriod, ...LeaderboardPeriod[]]).default('weekly'),
})

const XP_PER_PAGE = 50
const LEADERBOARD_CACHE_CONTROL = 'public, max-age=60, s-maxage=120, stale-while-revalidate=300'
const CACHE_TTL_MS = 60_000 // 60 seconds

// In-memory cache for aggregated period results (shared across all requests)
const periodCache = new Map<LeaderboardPeriod, CachedLeaderboard>()

function periodStart(period: LeaderboardPeriod): Date | null {
  const now = new Date()
  switch (period) {
    case 'daily':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case 'weekly': {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const day = d.getDay() || 7
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

function formatGuestDisplayName(guestId: string): string {
  let hash = 0
  for (let i = 0; i < guestId.length; i++) {
    hash = (hash * 31 + guestId.charCodeAt(i)) >>> 0
  }
  const code = (hash % 9000) + 1000
  return `کاربر مهمان #${code}`
}

async function getAggregatedPeriodEntries(period: LeaderboardPeriod): Promise<BaseEntry[]> {
  // Check memory cache
  const cached = periodCache.get(period)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.baseEntries
  }

  // If DB is offline, return empty list immediately (0ms)
  if (isDbOffline()) {
    return []
  }

  let baseEntries: BaseEntry[] = []

  try {
    if (period === 'alltime') {
      const rows = await safeQuery(
        () =>
          db.userStats.findMany({
            where: { totalXP: { gt: 0 } },
            orderBy: { totalXP: 'desc' },
            take: 100,
            select: {
              userId: true,
              guestId: true,
              name: true,
              totalXP: true,
              pagesRead: true,
            },
          }),
        [],
        600,
      )

      baseEntries = rows.map((r, i) => {
        const rowOwnerId = r.userId ?? r.guestId ?? `r-${i}`
        const level = calculateLevel(r.totalXP)
        const isGuest = !r.userId || Boolean(r.guestId) || rowOwnerId.startsWith('g_')
        const fallbackName = isGuest
          ? formatGuestDisplayName(r.guestId || rowOwnerId)
          : 'کاربر بوکزی'
        const name = r.name || fallbackName
        return {
          ownerId: rowOwnerId,
          name,
          avatar: name.trim().charAt(0) || (isGuest ? 'م' : '؟'),
          xpGained: r.totalXP,
          pagesRead: r.pagesRead,
          totalXP: r.totalXP,
          level,
          levelTitle: getLevelTitle(level),
          rankChange: 0,
        }
      })
    } else {
      const start = periodStart(period)
      if (!start) return []

      const raw = await safeQuery(
        () =>
          db.readingSession.findMany({
            where: { startedAt: { gte: start } },
            select: { userId: true, guestId: true, pagesRead: true, minutesRead: true },
            take: 1500,
          }),
        [],
        600,
      )

      const map = new Map<string, { ownerId: string; pagesRead: number; minutesRead: number }>()
      for (const s of raw) {
        const oid = s.userId ?? s.guestId
        if (!oid) continue
        const cur = map.get(oid) || { ownerId: oid, pagesRead: 0, minutesRead: 0 }
        cur.pagesRead += s.pagesRead
        cur.minutesRead += s.minutesRead
        map.set(oid, cur)
      }

      const sessions = Array.from(map.values())
      sessions.sort((a, b) => b.pagesRead - a.pagesRead || b.minutesRead - a.minutesRead)
      const topSessions = sessions.slice(0, 100)
      const topOwnerIds = topSessions.map((s) => s.ownerId)

      let byUser: Array<{ userId: string | null; name: string; totalXP: number; pagesRead: number }> = []
      let byGuest: Array<{ guestId: string | null; name: string; totalXP: number; pagesRead: number }> = []

      if (topOwnerIds.length > 0) {
        const res = await safeQuery(
          () =>
            Promise.all([
              db.userStats.findMany({
                where: { userId: { in: topOwnerIds } },
                select: { userId: true, name: true, totalXP: true, pagesRead: true },
              }),
              db.userStats.findMany({
                where: { guestId: { in: topOwnerIds } },
                select: { guestId: true, name: true, totalXP: true, pagesRead: true },
              }),
            ]),
          [[], []],
          600,
        )
        byUser = res[0]
        byGuest = res[1]
      }

      const statsMap = new Map<string, { name: string; totalXP: number }>()
      for (const s of byUser) {
        if (s.userId) statsMap.set(s.userId, { name: s.name, totalXP: s.totalXP })
      }
      for (const s of byGuest) {
        if (s.guestId) statsMap.set(s.guestId, { name: s.name, totalXP: s.totalXP })
      }

      baseEntries = topSessions.map((s) => {
        const stat = statsMap.get(s.ownerId)
        const totalXP = stat?.totalXP ?? (s.pagesRead * XP_PER_PAGE)
        const level = calculateLevel(totalXP)
        const xpGained = s.pagesRead * XP_PER_PAGE
        const isGuest = s.ownerId.startsWith('g_')
        const fallbackName = isGuest ? formatGuestDisplayName(s.ownerId) : 'کاربر بوکزی'
        const name = stat?.name || fallbackName
        return {
          ownerId: s.ownerId,
          name,
          avatar: name.trim().charAt(0) || (isGuest ? 'م' : '؟'),
          xpGained,
          pagesRead: s.pagesRead,
          totalXP,
          level,
          levelTitle: getLevelTitle(level),
          rankChange: 0,
        }
      })
    }

    periodCache.set(period, { timestamp: Date.now(), baseEntries })
  } catch (err) {
    const msg = (err as { message?: string })?.message || ''
    const code = (err as { code?: string })?.code || ''
    if (code === 'P1001' || msg.includes("Can't reach database server")) {
      tripDbOffline(30000)
    }
  }

  return baseEntries
}

// fallow-ignore-next-line complexity
export async function GET(req: NextRequest) {
  const { id: guestId } = await getOrCreateGuestId()
  const user = await getCurrentUser().catch(() => null)
  const userId = user?.id ?? null
  const ownerId = userId ?? guestId

  const periodParamRaw = req.nextUrl.searchParams.get('period')
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

  // Fast retrieval: uses in-memory cached base entries (0ms) or bounded safeQuery
  const baseEntries = await getAggregatedPeriodEntries(period)

  const isGuest = !userId || Boolean(guestId) || ownerId.startsWith('g_')
  const fallbackGuestName = isGuest ? formatGuestDisplayName(guestId || ownerId) : (user?.name || 'کاربر بوکزی')

  // Find if current user is already in top entries
  let currentUserRank: number | null = null
  let currentUserEntryFound = false

  const entries: LeaderboardEntry[] = baseEntries.map((b, idx) => {
    const rank = idx + 1
    const isCurrentUser = b.ownerId === ownerId
    if (isCurrentUser) {
      currentUserRank = rank
      currentUserEntryFound = true
    }
    const displayName = isCurrentUser
      ? (isGuest ? `شما (${fallbackGuestName})` : (user?.name ? `${user.name} (شما)` : 'شما'))
      : b.name
    return {
      rank,
      ownerId: b.ownerId,
      name: displayName,
      avatar: b.avatar,
      xpGained: b.xpGained,
      pagesRead: b.pagesRead,
      totalXP: b.totalXP,
      level: b.level,
      levelTitle: b.levelTitle,
      isCurrentUser,
      rankChange: b.rankChange,
    }
  })

  // If current user is not in the top entries:
  // Lookup caller stats if DB is reachable, or default to 0 stats
  if (!currentUserEntryFound) {
    let callerTotalXP = 0
    let callerPagesRead = 0
    let callerName = user?.name || ''

    if (!isDbOffline()) {
      const callerStat = await safeQuery(
        () =>
          db.userStats.findFirst({
            where: userId ? { userId } : { guestId },
            select: { name: true, totalXP: true, pagesRead: true },
          }),
        null,
        300,
      )
      if (callerStat) {
        callerTotalXP = callerStat.totalXP
        callerPagesRead = callerStat.pagesRead
        callerName = callerStat.name || callerName
      }
    }

    const callerLevel = calculateLevel(callerTotalXP)
    const displayName = isGuest ? `شما (${fallbackGuestName})` : (callerName ? `${callerName} (شما)` : 'شما')

    if (entries.length === 0) {
      // Empty board: return current user with rank 1 (or empty state handled by client if 0 xp)
      currentUserRank = callerTotalXP > 0 ? 1 : null
      entries.push({
        rank: 1,
        ownerId,
        name: displayName,
        avatar: (callerName || fallbackGuestName).trim().charAt(0) || 'ش',
        xpGained: period === 'alltime' ? callerTotalXP : 0,
        pagesRead: callerPagesRead,
        totalXP: callerTotalXP,
        level: callerLevel,
        levelTitle: getLevelTitle(callerLevel),
        isCurrentUser: true,
        rankChange: 0,
      })
    } else if (callerTotalXP > 0) {
      // User has XP but isn't in top 100, append at bottom with rank N+1
      currentUserRank = entries.length + 1
      entries.push({
        rank: currentUserRank,
        ownerId,
        name: displayName,
        avatar: (callerName || fallbackGuestName).trim().charAt(0) || 'ش',
        xpGained: period === 'alltime' ? callerTotalXP : 0,
        pagesRead: callerPagesRead,
        totalXP: callerTotalXP,
        level: callerLevel,
        levelTitle: getLevelTitle(callerLevel),
        isCurrentUser: true,
        rankChange: 0,
      })
    }
  }

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
