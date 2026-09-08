import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getEffectiveOwner } from '@/lib/session'
import { parseBody } from '@/lib/api-validate'
import { apiError } from '@/lib/api-error'
import { serializable } from '@/lib/transaction'

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
    const rows = await db.readingProgress.findMany({ where, select: { bookSlug: true, currentPage: true, percent: true, lastReadAt: true } })
    return NextResponse.json(rows, { headers: { 'Cache-Control': 'private, no-store' } })
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

    const { bookSlug, currentPage, totalPages, minutesDelta } = parsed.data
    const now = new Date()
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const ownerWhere = owner.userId ? { userId: owner.userId } : { guestId: owner.guestId! }
    const progressWhere = owner.userId
      ? { userId_bookSlug: { userId: owner.userId, bookSlug } }
      : { guestId_bookSlug: { guestId: owner.guestId!, bookSlug } }
    const row = await serializable(async (tx) => {
      const previous = await tx.readingProgress.findUnique({
        where: progressWhere,
        select: { currentPage: true },
      })
      const page = Math.min(currentPage, totalPages)
      const percent = Math.round((page / totalPages) * 100)
      const saved = await tx.readingProgress.upsert({
        where: progressWhere,
        update: { currentPage: page, percent, lastReadAt: now },
        create: { ...ownerWhere, bookSlug, currentPage: page, percent, lastReadAt: now },
        select: { bookSlug: true, currentPage: true, percent: true, lastReadAt: true },
      })
      // Never trust a client-supplied previous position. Progress and activity
      // commit together so retries cannot double-count the same transition.
      const pagesDelta = Math.max(0, page - (previous?.currentPage ?? 0))
      if (pagesDelta > 0 || minutesDelta > 0) {
        const existing = await tx.readingSession.findFirst({
          where: { ...ownerWhere, bookSlug, startedAt: { gte: dayStart } },
          orderBy: { startedAt: 'desc' },
          select: { id: true },
        })
        if (existing) {
          await tx.readingSession.update({
            where: { id: existing.id },
            data: { pagesRead: { increment: pagesDelta }, minutesRead: { increment: minutesDelta }, endedAt: now },
            select: { id: true },
          })
        } else {
          await tx.readingSession.create({
            data: { ...ownerWhere, bookSlug, pagesRead: pagesDelta, minutesRead: minutesDelta, startedAt: now, endedAt: now },
            select: { id: true },
          })
        }
      }
      return saved
    })

    return NextResponse.json(row)
  } catch (err) {
    console.error('[/api/reading/progress] POST failed:', err)
    return apiError('ذخیره پیشرفت مطالعه ناموفق بود.', 500)
  }
}
