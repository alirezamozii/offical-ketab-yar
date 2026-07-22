import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getEffectiveOwner } from '@/lib/session'
import { rateLimit, getClientIpHash, rateLimitKey } from '@/lib/rate-limit'
import { parseBody } from '@/lib/api-validate'

// ─────────────────────────────────────────────────────────────────────────────
// Review votes — persisted in the Prisma `Vote` table.
//
// This replaces the old `db/votes.json` filesystem hack that could not survive
// multi-instance or serverless deployments. One row per (reviewId, guestId) or
// (reviewId, userId); toggling the same direction deletes the row.
//
// API shape is unchanged so the client doesn't need edits:
//   POST { reviewId, direction: 'up'|'down' } → { reviewId, up, down, myVote }
//   GET                                       → { [reviewId]: { up, down, myVote } }
//
// H-06 hardening:
//   • `guestId` removed from the POST body schema — identity comes from
//     getEffectiveOwner() (signed cookie or session).
//   • Uses typed compound unique keys: `reviewId_userId` for signed-in
//     callers, `reviewId_guestId` for anonymous. No more
//     `as unknown as Prisma.VoteWhereUniqueInput` cast — the schema now
//     declares BOTH `@@unique([reviewId, userId])` AND `@@unique([reviewId, guestId])`.
//   • Removed all `.catch(() => null)` / `.catch(() => {})` swallows —
//     errors propagate to the outer try/catch (which returns a clean 500).
//   • GET handler ignores the `?guestId=` query param (was an IDOR vector
//     — any client could read any other guest's vote state). Identity is
//     cookie/session-only.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Count up/down votes for a single review, plus the caller's own vote.
 */
async function tallyForReview(
  reviewId: string,
  voterKey: { guestId: string | null; userId: string | null },
) {
  const votes = await db.vote.findMany({
    where: { reviewId },
    select: { direction: true, guestId: true, userId: true },
  })
  let up = 0
  let down = 0
  let myVote: 'up' | 'down' | null = null
  for (const v of votes) {
    if (v.direction === 'up') up++
    else down++
    const isMe = voterKey.userId
      ? v.userId === voterKey.userId
      : voterKey.guestId
        ? v.guestId === voterKey.guestId
        : false
    if (isMe) myVote = v.direction as 'up' | 'down'
  }
  return { up, down, myVote }
}

// ── Input validation ─────────────────────────────────────────────────────────
// Note: `guestId` is intentionally ABSENT from the schema — identity is
// derived from the verified cookie / session only (H-06).
const VoteSchema = z.object({
  reviewId: z
    .string({ error: 'reviewId الزامی است.' })
    .trim()
    .min(1, 'reviewId + direction required')
    .max(200, 'reviewId بیش از حد طولانی است.'),
  direction: z.enum(['up', 'down'], {
    error: 'direction باید یکی از «up» یا «down» باشد.',
  }),
})

export async function POST(req: NextRequest) {
  try {
    // ⏱ Rate limit voting (prevent ballot-stuffing bots): 60/min per IP.
    const ipHash = await getClientIpHash(req)
    const rl = rateLimit({ key: rateLimitKey('review-vote', ipHash), limit: 60, windowMs: 60_000 })
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'تعداد درخواست‌های شما بیش از حد مجاز است.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      )
    }

    const parsed = await parseBody(req, VoteSchema, 'reviewId + direction required')
    if (!parsed.ok) return parsed.response

    const { reviewId, direction } = parsed.data

    // Verify the review exists.
    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { id: true },
    })
    if (!review) {
      return NextResponse.json({ error: 'review not found' }, { status: 404 })
    }

    // Identity — userId if signed in, else the verified guestId from the
    // signed cookie. Body-supplied guestId is ignored (H-06).
    const owner = await getEffectiveOwner()

    // Typed compound unique key — the schema now declares both
    // `@@unique([reviewId, userId])` and `@@unique([reviewId, guestId])`,
    // so no `as unknown as Prisma.VoteWhereUniqueInput` cast is needed.
    const voterWhere = owner.userId
      ? { reviewId_userId: { reviewId, userId: owner.userId } }
      : { reviewId_guestId: { reviewId, guestId: owner.guestId! } }

    const existing = await db.vote.findUnique({ where: voterWhere })

    let myVote: 'up' | 'down' | null = null

    if (existing && existing.direction === direction) {
      // Toggle off — remove the vote.
      await db.vote.delete({ where: { id: existing.id } })
      myVote = null
    } else if (existing) {
      // Flip direction.
      await db.vote.update({
        where: { id: existing.id },
        data: { direction, ...(owner.userId ? { userId: owner.userId } : {}) },
      })
      myVote = direction
    } else {
      // New vote. Use upsert to handle any race condition gracefully —
      // both compound keys are typed so the call type-checks cleanly.
      await db.vote.upsert({
        where: voterWhere,
        update: { direction, ...(owner.userId ? { userId: owner.userId } : {}) },
        create: owner.userId
          ? { reviewId, userId: owner.userId, guestId: null, direction }
          : { reviewId, guestId: owner.guestId!, userId: null, direction },
      })
      myVote = direction
    }

    const tally = await tallyForReview(
      reviewId,
      owner.userId
        ? { userId: owner.userId, guestId: null }
        : { guestId: owner.guestId, userId: null },
    )

    return NextResponse.json({
      reviewId,
      up: tally.up,
      down: tally.down,
      myVote,
    })
  } catch (err) {
    console.error('[/api/reviews/vote] POST failed:', err)
    return NextResponse.json(
      { error: 'ثبت رأی ناموفق بود. لطفاً دوباره تلاش کنید.' },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    // Identity is cookie/session-only — the old `?guestId=` query param is
    // ignored (it was an IDOR vector: any client could read any other
    // guest's vote state by passing their guestId in the URL).
    const owner = await getEffectiveOwner()

    // Pull all votes once and aggregate in-memory (cheap for a review section).
    const votes = await db.vote.findMany({
      select: { reviewId: true, direction: true, guestId: true, userId: true },
    })

    const byReview = new Map<
      string,
      { up: number; down: number; myVote: 'up' | 'down' | null }
    >()
    for (const v of votes) {
      let entry = byReview.get(v.reviewId)
      if (!entry) {
        entry = { up: 0, down: 0, myVote: null }
        byReview.set(v.reviewId, entry)
      }
      if (v.direction === 'up') entry.up++
      else entry.down++
      const isMe = owner.userId
        ? v.userId === owner.userId
        : owner.guestId
          ? v.guestId === owner.guestId
          : false
      if (isMe) entry.myVote = v.direction as 'up' | 'down'
    }

    // Mark this URL as non-cacheable per-request since it depends on the
    // caller's cookie identity.
    return NextResponse.json(Object.fromEntries(byReview), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('[/api/reviews/vote] GET failed:', err)
    return NextResponse.json(
      { error: 'بارگذاری رأی‌ها ناموفق بود.' },
      { status: 500 },
    )
  }
}
