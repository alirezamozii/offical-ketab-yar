import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth-session'
import { getEffectiveOwner } from '@/lib/session'
import { rateLimit, getClientIpHash, rateLimitKey } from '@/lib/rate-limit'
import { parseBody } from '@/lib/api-validate'
import { apiError } from '@/lib/api-error'

// ─────────────────────────────────────────────────────────────────────────────
// H-05 — Review POST hardening
// ─────────────────────────────────────────────────────────────────────────────
// Previous issues:
//   • No rate limit → a bot could mint thousands of reviews per minute.
//   • No dedup check → the same user could spam reviews for the same book.
//   • Review create + Book rating recompute were two separate writes — a
//     crash between them would leave the Book.rating / reviewCount out of
//     sync with the actual Review rows.
//   • `guestId` was body-supplied (forgeable) instead of read from the
//     signed cookie.
//
// Hardened:
//   • 5 reviews per minute per IP.
//   • Dedup check: signed-in users checked on (userId, bookId); guests on
//     (guestId, bookId). Returns 409 with a Persian message on conflict.
//   • Review create + Book rating/reviewCount recompute wrapped in
//     db.$transaction — atomic, all-or-nothing.
//   • Identity via getEffectiveOwner(); guestId read from the verified
//     cookie via getGuestId() (string | null) — body-supplied guestId is
//     ignored.
// ─────────────────────────────────────────────────────────────────────────────

// ── Input validation ─────────────────────────────────────────────────────────
//
// Review comment cap tightened from 1000 → 2000 chars (task spec requires
// ≤ 2000). Rating is 1-5 integer (task spec). userName capped at 60 chars.
const ReviewSchema = z.object({
  bookSlug: z
    .string({ error: 'bookSlug الزامی است.' })
    .trim()
    .min(1, 'bookSlug الزامی است.')
    .max(200, 'bookSlug بیش از حد طولانی است.'),
  userName: z
    .string({ error: 'نام کاربر الزامی است.' })
    .trim()
    .min(1, 'نام کاربر الزامی است.')
    .max(60, 'نام نمی‌تواند بیشتر از ۶۰ کاراکتر باشد.'),
  rating: z
    .number({ error: 'امتیاز الزامی است.' })
    .int('امتیاز باید عدد صحیح باشد.')
    .min(1, 'امتیاز باید بین ۱ و ۵ باشد.')
    .max(5, 'امتیاز باید بین ۱ و ۵ باشد.'),
  comment: z
    .string({ error: 'متن نظر الزامی است.' })
    .trim()
    .min(3, 'متن نظر باید حداقل ۳ کاراکتر باشد.')
    .max(2000, 'متن نظر نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد.'),
})

export async function POST(req: NextRequest) {
  // ⏱ Rate limit: 5 reviews per minute per IP.
  const ipHash = await getClientIpHash(req)
  const rl = rateLimit({ key: rateLimitKey('review-post', ipHash), limit: 5, windowMs: 60_000 })
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'تعداد درخواست‌های شما بیش از حد مجاز است. کمی صبر کنید و دوباره تلاش کنید.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const parsed = await parseBody(req, ReviewSchema, 'ورودی نامعتبر است')
  if (!parsed.ok) return parsed.response

  const { bookSlug, userName, rating, comment } = parsed.data

  // Identity — userId if signed in, otherwise the verified guestId from the
  // signed cookie. Body-supplied guestId is NEVER trusted.
  const owner = await getEffectiveOwner()
  const user = await getCurrentUser().catch(() => null)

  try {
    const book = await db.book.findUnique({
      where: { slug: bookSlug },
      select: { id: true },
    })
    if (!book) {
      return NextResponse.json({ error: 'کتاب یافت نشد' }, { status: 404 })
    }

    // ── Dedup check: one review per (owner, book) ──────────────────────
    if (owner.userId) {
      const existing = await db.review.findFirst({
        where: { userId: owner.userId, bookId: book.id },
        select: { id: true },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'شما قبلاً برای این کتاب نقد ثبت کرده‌اید' },
          { status: 409 },
        )
      }
    } else if (owner.guestId) {
      const existing = await db.review.findFirst({
        where: { guestId: owner.guestId, bookId: book.id },
        select: { id: true },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'شما قبلاً برای این کتاب نقد ثبت کرده‌اید' },
          { status: 409 },
        )
      }
    }

    // ── Atomic create + Book recompute in a transaction ────────────────
    const review = await db.$transaction(async (tx) => {
      // For signed-in users, derive display name + avatar from the session
      // so a banned user can't post under a forged identity. The body
      // `userName` is kept as the fallback for anonymous guests.
      const resolvedUserName = owner.userId
        ? user?.name || user?.username || userName
        : userName
      const created = await tx.review.create({
        data: {
          bookId: book.id,
          userName: resolvedUserName,
          rating,
          comment,
          ...(owner.userId
            ? {
                userId: owner.userId,
                guestId: null,
                userAvatar: user?.image || '',
              }
            : {
                userId: null,
                guestId: owner.guestId,
              }),
        },
      })

      // Recompute aggregate rating + count on the book inside the same
      // transaction so a crash mid-write can't desync Book.rating from
      // the actual Review rows.
      const agg = await tx.review.aggregate({
        where: { bookId: book.id },
        _avg: { rating: true },
        _count: { _all: true },
      })
      await tx.book.update({
        where: { id: book.id },
        data: {
          rating: Number(agg._avg.rating?.toFixed(2) || 0),
          reviewCount: agg._count._all,
        },
      })

      return created
    })

    // Sync the updated rating and review count back to Payload CMS
    try {
      const { getPayloadClient } = await import('@/lib/payload')
      const payload = await getPayloadClient()
      const updatedBook = await db.book.findUnique({
        where: { id: book.id },
        select: { rating: true, reviewCount: true },
      })
      if (updatedBook) {
        await payload.update({
          collection: 'books',
          id: book.id,
          data: {
            rating: updatedBook.rating,
            reviewCount: updatedBook.reviewCount,
          },
        })
        console.log(`[Review Sync] Synced book rating/reviewCount back to Payload for ID: ${book.id}`)
      }
    } catch (err) {
      console.error('[Review Sync Error] Failed to sync rating back to Payload:', err)
    }

    revalidatePath(`/books/${bookSlug}`)

    return NextResponse.json(
      {
        id: review.id,
        userName: review.userName,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[/api/reviews] POST failed:', err)
    return apiError('ثبت نظر ناموفق بود. لطفاً دوباره تلاش کنید.', 500)
  }
}
