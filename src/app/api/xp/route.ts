import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getEffectiveOwner } from '@/lib/session'
import { rateLimit, rateLimitKey, getClientIpHash } from '@/lib/rate-limit'
import {
  calculateLevel,
  calculateReadingXP,
  cefrToDifficulty,
  xpProgressToNextLevel,
  type BookDifficulty,
} from '@/lib/gamification'
import { parseBody } from '@/lib/api-validate'

export interface XPStatsResponse {
  totalXP: number
  level: number
  levelTitle: string
  progressPercentage: number
  xpForNextLevel: number
  pagesRead: number
  booksCompleted: number
  streakDays: number
}

export interface XPGainResponse extends XPStatsResponse {
  gained: ReturnType<typeof calculateReadingXP>
  newLevel: number
  leveledUp: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// H-02 — XP fraud prevention
// ─────────────────────────────────────────────────────────────────────────────
// The previous schema trusted client-supplied `bookLevel` and
// `isFirstReadToday`, capped pagesRead at 10 000 and vocabGameXP at 5 000,
// had no rate limit, and collapsed identity via `guestId: 'user'`.
// A single curl could mint 1 000 000 XP in one shot.
//
// Hardened:
//   • pagesRead ≤ 500 per request
//   • vocabGameXP ≤ 200 per request
//   • bookLevel + isFirstReadToday removed from the client schema — derived
//     server-side from the Book row's CEFR level and the UserStats.lastReadAt.
//   • completedBook verified against the book's actual pageCount — only
//     award the bonus if a ReadingProgress row exists at currentPage >= book.pageCount.
//   • 30 XP requests per minute per identity (userId or guestId).
//   • Uses getEffectiveOwner() — writes userId OR guestId (never both, never
//     the old 'user' collapse).
// ─────────────────────────────────────────────────────────────────────────────

/** Determine whether the user already read today (server-side check). */
async function isReadToday(owner: { userId: string | null; guestId: string | null }): Promise<boolean> {
  const where = owner.userId ? { userId: owner.userId } : { guestId: owner.guestId! }
  const row = await db.userStats.findUnique({ where })
  if (!row?.lastReadAt) return false
  const now = new Date()
  const last = new Date(row.lastReadAt)
  return (
    now.getFullYear() === last.getFullYear() &&
    now.getMonth() === last.getMonth() &&
    now.getDate() === last.getDate()
  )
}

/** Update streakDays based on the gap between lastReadAt and now. */
function nextStreakDays(
  currentStreak: number,
  lastReadAt: Date | null,
  now: Date,
): number {
  if (!lastReadAt) return 1
  const last = new Date(lastReadAt)
  const startOfLast = new Date(
    last.getFullYear(),
    last.getMonth(),
    last.getDate(),
  ).getTime()
  const startOfNow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime()
  const dayMs = 86_400_000
  const dayDiff = Math.round((startOfNow - startOfLast) / dayMs)
  if (dayDiff <= 0) return Math.max(1, currentStreak)
  if (dayDiff === 1) return currentStreak + 1
  return 1 // missed more than a day → reset
}

// ── Input validation ─────────────────────────────────────────────────────────
//
// All fields are bounded to prevent a single buggy client from claiming
// "I read 1 million pages, give me 50 million XP" in one request.
//   • pagesRead ≤ 500 per request (~a chapter in one shot, reasonable cap)
//   • vocabGameXP ≤ 200 per request
//   • bookLevel + isFirstReadToday are NO LONGER client-supplied — the
//     server derives them. (H-02)
const XPSchema = z.object({
  pagesRead: z.number().int().min(0).max(500),
  completedBook: z.boolean().default(false),
  bookSlug: z
    .string()
    .trim()
    .max(200)
    .optional(),
  vocabGameXP: z.number().int().min(0).max(200).default(0),
})

/** Build the compound `where` clause for UserStats upsert/update. */
function statsWhere(owner: { userId: string | null; guestId: string | null }) {
  return owner.userId ? { userId: owner.userId } : { guestId: owner.guestId! }
}

export async function GET(req: NextRequest) {
  // ⏱ Rate limit (30/min/identity).
  const owner = await getEffectiveOwner()
  const ipHash = await getClientIpHash(req)
  const rlKey = rateLimitKey('xp-get', owner.userId ? `u:${owner.userId}` : `g:${owner.guestId}`, `ip:${ipHash}`)
  const rl = rateLimit({ key: rlKey, limit: 30, windowMs: 60_000 })
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'تعداد درخواست‌های شما بیش از حد مجاز است. کمی صبر کنید و دوباره تلاش کنید.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  let row: { totalXP: number; pagesRead: number; booksCompleted: number; streakDays: number; lastReadAt: Date | null }
  try {
    row = await db.userStats.upsert({
      where: statsWhere(owner),
      update: {},
      create: owner.userId
        ? { userId: owner.userId, guestId: null }
        : { guestId: owner.guestId!, userId: null },
    })
  } catch (err) {
    // DB write failed. Return a zero-stats response
    // so the XP bar UI still renders instead of 500-ing.
    console.error('[/api/xp GET] userStats.upsert failed:', err)
    row = { totalXP: 0, pagesRead: 0, booksCompleted: 0, streakDays: 0, lastReadAt: null }
  }

  const progress = xpProgressToNextLevel(row.totalXP)
  const payload: XPStatsResponse = {
    totalXP: row.totalXP,
    level: progress.currentLevel,
    levelTitle: progress.levelTitle,
    progressPercentage: progress.progressPercentage,
    xpForNextLevel: progress.xpForNextLevel,
    pagesRead: row.pagesRead,
    booksCompleted: row.booksCompleted,
    streakDays: row.streakDays,
  }
  return NextResponse.json(payload)
}

export async function POST(req: NextRequest) {
  const owner = await getEffectiveOwner()

  // ⏱ Rate limit (30/min/identity).
  const ipHash = await getClientIpHash(req)
  const rlKey = rateLimitKey('xp-post', owner.userId ? `u:${owner.userId}` : `g:${owner.guestId}`, `ip:${ipHash}`)
  const rl = rateLimit({ key: rlKey, limit: 30, windowMs: 60_000 })
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'تعداد درخواست‌های شما بیش از حد مجاز است. کمی صبر کنید و دوباره تلاش کنید.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const parsed = await parseBody(req, XPSchema, 'ورودی نامعتبر است.')
  if (!parsed.ok) return parsed.response

  const { pagesRead, completedBook: completedBookClaimed, bookSlug, vocabGameXP } = parsed.data

  if (pagesRead <= 0 && !completedBookClaimed && vocabGameXP <= 0) {
    return NextResponse.json(
      { error: 'pagesRead, completedBook, or vocabGameXP required' },
      { status: 400 },
    )
  }

  // ── H-02: derive bookLevel + completedBook server-side ────────────────
  // `bookLevel` is looked up from the Book row's stored CEFR level (fallback
  // "B1"). `completedBook` is only honored if the user actually has a
  // ReadingProgress row at currentPage >= book.pageCount.
  let bookLevel: BookDifficulty | undefined
  let completedBook = false
  if (bookSlug) {
    const book = await db.book.findUnique({
      where: { slug: bookSlug },
      select: { pageCount: true, level: true },
    })
    if (book) {
      bookLevel = cefrToDifficulty(book.level || 'B1')
      if (completedBookClaimed && book.pageCount > 0) {
        const progressRow = await db.readingProgress.findUnique({
          where: owner.userId
            ? { userId_bookSlug: { userId: owner.userId, bookSlug } }
            : { guestId_bookSlug: { guestId: owner.guestId!, bookSlug } },
          select: { currentPage: true },
        })
        if (progressRow && progressRow.currentPage >= book.pageCount) {
          completedBook = true
        }
      }
    }
  }

  // Pull current stats. Tolerate read-only DB by falling back to a zero row.
  let existing: {
    totalXP: number
    level: number
    pagesRead: number
    booksCompleted: number
    streakDays: number
    lastReadAt: Date | null
  }
  try {
    existing = await db.userStats.upsert({
      where: statsWhere(owner),
      update: {},
      create: owner.userId
        ? { userId: owner.userId, guestId: null }
        : { guestId: owner.guestId!, userId: null },
    })
  } catch (err) {
    // DB unavailable. Fall back to a zero row so
    // we can still compute and return the would-be XP gain (status 200).
    console.error('[/api/xp POST] userStats.upsert(existing) failed:', err)
    existing = {
      totalXP: 0,
      level: 1,
      pagesRead: 0,
      booksCompleted: 0,
      streakDays: 0,
      lastReadAt: null,
    }
  }

  // For vocab game XP, we don't touch reading streak/pages — just add XP.
  if (vocabGameXP > 0 && pagesRead <= 0 && !completedBook) {
    const newTotalXP = existing.totalXP + vocabGameXP
    const newLevel = calculateLevel(newTotalXP)
    const leveledUp = newLevel > existing.level
    let updated = {
      ...existing,
      totalXP: newTotalXP,
      level: newLevel,
    }
    try {
      updated = await db.userStats.update({
        where: statsWhere(owner),
        data: { totalXP: newTotalXP, level: newLevel },
      })
    } catch (err) {
      // DB write failed (likely read-only). Use the in-memory computed row so
      // the response still reflects the user's vocab-game XP gain (status 200).
      console.error('[/api/xp POST] userStats.update(vocabXP) failed:', err)
    }
    const progress = xpProgressToNextLevel(updated.totalXP)
    const payload: XPGainResponse = {
      totalXP: updated.totalXP,
      level: progress.currentLevel,
      levelTitle: progress.levelTitle,
      progressPercentage: progress.progressPercentage,
      xpForNextLevel: progress.xpForNextLevel,
      pagesRead: updated.pagesRead,
      booksCompleted: updated.booksCompleted,
      streakDays: updated.streakDays,
      gained: {
        baseXP: 0,
        streakBonus: 0,
        completionBonus: 0,
        difficultyBonus: 0,
        firstReadBonus: 0,
        totalXP: vocabGameXP,
        bonusMultiplier: 0,
      },
      newLevel,
      leveledUp,
    }
    return NextResponse.json(payload)
  }

  const alreadyToday = await isReadToday(owner)
  const isFirstReadToday = !alreadyToday
  const nextStreak = nextStreakDays(
    existing.streakDays,
    existing.lastReadAt,
    new Date(),
  )

  const gained = calculateReadingXP({
    pagesRead,
    hasStreak: existing.streakDays > 0 || nextStreak > 0,
    streakDays: Math.max(existing.streakDays, nextStreak),
    completedBook,
    bookLevel,
    isFirstReadToday,
  })

  const newTotalXP = existing.totalXP + gained.totalXP
  const newLevel = calculateLevel(newTotalXP)
  const leveledUp = newLevel > existing.level

  let updated = {
    ...existing,
    totalXP: newTotalXP,
    level: newLevel,
    pagesRead: existing.pagesRead + pagesRead,
    booksCompleted: existing.booksCompleted + (completedBook ? 1 : 0),
    streakDays: nextStreak,
    lastReadAt: new Date() as Date | null,
  }
  try {
    updated = await db.userStats.update({
      where: statsWhere(owner),
      data: {
        totalXP: newTotalXP,
        level: newLevel,
        pagesRead: existing.pagesRead + pagesRead,
        booksCompleted: existing.booksCompleted + (completedBook ? 1 : 0),
        streakDays: nextStreak,
        lastReadAt: new Date(),
      },
    })
  } catch (err) {
    // DB write failed (likely read-only). Use the in-memory computed row so
    // the response still reflects the user's XP gain (status 200).
    console.error('[/api/xp POST] userStats.update(readingXP) failed:', err)
  }

  const progress = xpProgressToNextLevel(updated.totalXP)
  const payload: XPGainResponse = {
    totalXP: updated.totalXP,
    level: progress.currentLevel,
    levelTitle: progress.levelTitle,
    progressPercentage: progress.progressPercentage,
    xpForNextLevel: progress.xpForNextLevel,
    pagesRead: updated.pagesRead,
    booksCompleted: updated.booksCompleted,
    streakDays: updated.streakDays,
    gained,
    newLevel,
    leveledUp,
  }

  return NextResponse.json(payload)
}
