import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getEffectiveOwner } from '@/lib/session'
import { parseBody } from '@/lib/api-validate'
import { apiError } from '@/lib/api-error'

/**
 * /api/reading/progress — persist + read per-book reading progress.
 *
 * H-04: identity resolved via getEffectiveOwner(); signed-in callers use
 * userId+bookSlug as the compound key, anonymous callers use
 * guestId+bookSlug. Never the old `guestId: 'user'` collapse — signed-in
 * rows have guestId=null, anonymous rows have userId=null.
 */

export async function GET() {
  try {
    const owner = await getEffectiveOwner()
    const where = owner.userId ? { userId: owner.userId } : { guestId: owner.guestId! }
    const rows = await db.readingProgress.findMany({ where })
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[/api/reading/progress] GET failed:', err)
    return apiError('بارگذاری پیشرفت مطالعه ناموفق بود.', 500)
  }
}

// ── Input validation ─────────────────────────────────────────────────────────
//
// `bookSlug` is the only required field; everything else is numeric and
// bounded so a buggy client can't send a 10-million-page "progress" update
// that breaks the leaderboard math.
const ProgressSchema = z.object({
  bookSlug: z
    .string({ error: 'bookSlug الزامی است.' })
    .trim()
    .min(1, 'bookSlug الزامی است.')
    .max(200, 'bookSlug بیش از حد طولانی است.'),
  currentPage: z.number().int().min(0).max(1_000_000).default(0),
  totalPages: z.number().int().min(1).max(1_000_000).default(1),
  prevPage: z.number().int().min(0).max(1_000_000).default(0),
  minutesDelta: z.number().int().min(0).max(24 * 60).default(0), // ≤ 1 day in minutes
})

export async function POST(req: NextRequest) {
  try {
    const owner = await getEffectiveOwner()

    const parsed = await parseBody(req, ProgressSchema)
    if (!parsed.ok) return parsed.response

    const { bookSlug, currentPage, totalPages, prevPage, minutesDelta } = parsed.data
    const percent = Math.max(
      0,
      Math.min(100, Math.round((currentPage / Math.max(totalPages, 1)) * 100)),
    )

    const row = await db.readingProgress.upsert({
      where: owner.userId
        ? { userId_bookSlug: { userId: owner.userId, bookSlug } }
        : { guestId_bookSlug: { guestId: owner.guestId!, bookSlug } },
      update: { currentPage, percent, lastReadAt: new Date() },
      create: owner.userId
        ? { userId: owner.userId, guestId: null, bookSlug, currentPage, percent }
        : { guestId: owner.guestId!, userId: null, bookSlug, currentPage, percent },
    })

    // ── A7: Record a real ReadingSession so the leaderboard can aggregate
    //    genuine per-period reading activity instead of fabricating it.
    //
    // One ReadingSession row per (owner, book, calendar day). We upsert so
    // repeated progress saves within the same day accumulate pages/minutes.
    // Pages are only counted forward (a user re-reading earlier pages doesn't
    // inflate the count). The delta is `currentPage - prevPage` when positive.
    const now = new Date()
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const pagesDelta = Math.max(0, currentPage - prevPage)

    if (pagesDelta > 0 || minutesDelta > 0) {
      try {
        // Find today's session for this owner+book (if any) to accumulate.
        const sessionWhere = owner.userId
          ? { userId: owner.userId, bookSlug }
          : { guestId: owner.guestId!, bookSlug }
        const existing = await db.readingSession.findFirst({
          where: {
            ...sessionWhere,
            startedAt: { gte: dayStart },
            endedAt: null,
          },
          orderBy: { startedAt: 'desc' },
        })

        if (existing) {
          await db.readingSession.update({
            where: { id: existing.id },
            data: {
              pagesRead: existing.pagesRead + pagesDelta,
              minutesRead: existing.minutesRead + minutesDelta,
              endedAt: now,
            },
          })
        } else {
          await db.readingSession.create({
            data: owner.userId
              ? { userId: owner.userId, guestId: null, bookSlug, pagesRead: pagesDelta, minutesRead: minutesDelta, endedAt: now }
              : { guestId: owner.guestId!, userId: null, bookSlug, pagesRead: pagesDelta, minutesRead: minutesDelta, endedAt: now },
          })
        }
      } catch (sessionErr) {
        // ReadingSession write is best-effort — never fail the whole progress
        // save because of it (the ReadingProgress row above already succeeded).
        console.error('[/api/reading/progress] ReadingSession write failed:', sessionErr)
      }
    }

    return NextResponse.json(row)
  } catch (err) {
    console.error('[/api/reading/progress] POST failed:', err)
    return apiError('ذخیره پیشرفت مطالعه ناموفق بود.', 500)
  }
}
