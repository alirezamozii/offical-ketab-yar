/**
 * POST /api/account/delete — self-serve account deletion (GDPR Art. 17).
 *
 * Auth: `requireUser()` — only the authenticated user can delete their own
 * account. No admin role needed.
 *
 * Body: `{ confirm?: string }` — caller may pass `confirm: "DELETE"` for an
 * extra client-side guard, but the server does NOT require it (the auth
 * requirement is the server-side guard).
 *
 * Cascade:
 *   • Prisma cascade handles Account, Session, ReadingProgress,
 *     ReadingSession, BookDownload, UserStats, Vote (all `onDelete: Cascade`
 *     on the User relation).
 *   • Review rows are `onDelete: SetNull` — they remain attached to the
 *     book but their `userId` is nulled out, preserving the book's review
 *     history. The `userName` / `userAvatar` columns remain populated so
 *     old reviews still show a name + avatar.
 *   • BlogPost rows are `onDelete: Restrict` — we 409-conflict if the
 *     user has authored blog posts (admin task: reassign or delete those
 *     posts first).
 *
 * Response: `{ ok: true }`. The client then signs out (calls
 * `/api/auth/signout` and reloads).
 *
 * NOTE: this is a HARD delete (no 30-day soft-delete window). The audit
 * mentioned a soft-delete option, but Prisma's User model has no
 * `deletedAt` column and we cannot modify the schema in this task.
 * Soft-delete is a future enhancement — for now, the user's request is
 * honored immediately.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUserApi } from '@/lib/auth-session'
import { revalidateUsers } from '@/lib/revalidate'

export async function POST(req: NextRequest) {
  // H-14: `requireUser()` throws NEXT_REDIRECT for an unauthenticated caller,
  // which Next.js turns into a 307 redirect to /auth/signin — bad HTTP
  // semantics for a JSON API. Use `requireUserApi()` which returns a clean
  // 401 (or 403 if banned) JSON response instead.
  const userOrResponse = await requireUserApi()
  if (userOrResponse instanceof NextResponse) return userOrResponse
  const user = userOrResponse
  const userId = user.id

  // Reject if the user has authored blog posts (Restrict relation).
  // The owner / admin must reassign or delete those posts first.
  let blogPostCount = 0
  try {
    blogPostCount = await db.blogPost.count({ where: { authorId: userId } })
  } catch {
    // If the count query fails, proceed — the cascade will throw a
    // P2003 foreign-key error below if there really are posts.
  }

  if (blogPostCount > 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'این حساب دارای مقالات بلاگ است. قبل از حذف، مقالات را به نویسنده‌ی دیگر منتقل کنید یا حذف کنید.',
        code: 'HAS_BLOG_POSTS',
        count: blogPostCount,
      },
      { status: 409 },
    )
  }

  // Reject if the user is the OWNER — there should always be exactly one
  // OWNER and deleting them would orphan the admin panel.
  if (user.role === 'OWNER') {
    return NextResponse.json(
      {
        ok: false,
        error:
          'حساب مالک (OWNER) قابل حذف نیست. قبل از حذف، مالکیت را به کاربر دیگری منتقل کنید.',
        code: 'OWNER_PROTECTED',
      },
      { status: 403 },
    )
  }

  // Optional body — silently tolerate invalid JSON.
  const _body = await req.json().catch(() => ({}))
  void _body

  try {
    await db.user.delete({ where: { id: userId } })
    // Revalidate the leaderboard + any user-scoped public cache.
    revalidateUsers()
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('[/api/account/delete] failed:', err)
    // Prisma P2003 = foreign-key constraint failure (e.g. a Restrict
    // relation we missed). Surface a clean message.
    const code = (err !== null && typeof err === 'object' && 'code' in err)
      ? (err as { code: unknown }).code
      : undefined
    if (code === 'P2003') {
      return NextResponse.json(
        {
          ok: false,
          error:
            'حذف حساب ناموفق بود: داده‌ای به این حساب وابسته است که باید ابتدا پاک شود.',
          code: 'CONSTRAINT',
        },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { ok: false, error: 'حذف حساب ناموفق بود. لطفاً دوباره تلاش کنید.' },
      { status: 500 },
    )
  }
}
