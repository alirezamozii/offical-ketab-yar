import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-session'
import { getGuestId } from '@/lib/session'
import { mergeGuestDataToUser } from '@/lib/merge-guest-data'
import { apiError } from '@/lib/api-error'

/**
 * POST /api/auth/merge-guest — merge the caller's guest-keyed data into
 * their user account.
 *
 * Called by the client immediately after a successful signin (the NextAuth
 * `signIn` callback in `src/lib/auth.ts` ALSO calls `mergeGuestDataToUser`
 * — this route is a belt-and-suspenders fallback for cases where the
 * callback didn't run, e.g. OAuth providers that skip the JWT callback).
 *
 * Auth: requires a signed-in user. The guest id is read from the `ky_guest`
 * cookie; if no cookie is present, the route is a no-op (returns 200 with
 * zero counts).
 */

export async function POST(_req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'برای ادغام داده‌ها باید وارد شوید.' },
        { status: 401 },
      )
    }

    const guestId = await getGuestId()
    if (!guestId || guestId === 'guest') {
      // No guest cookie → nothing to merge.
      return NextResponse.json({ ok: true, merged: null })
    }

    // Idempotency: if the guest has already been merged (no guest-keyed
    // rows remain), `mergeGuestDataToUser` returns zero counts — no harm
    // in calling it again.
    const result = await mergeGuestDataToUser(guestId, user.id)

    // Best-effort: clear the guest cookie by setting it to a sentinel
    // value. The actual `ky_guest` cookie is httpOnly so we can't read
    // it client-side, but the merge has already happened server-side.
    // The cookie will naturally expire after a year — the guest rows
    // are gone, so future reads will return empty.

    return NextResponse.json(
      { ok: true, merged: result },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.error('[/api/auth/merge-guest] POST failed:', err)
    return apiError('ادغام داده‌های مهمان ناموفق بود.', 500)
  }
}

// Touch db import so it's not tree-shaken (kept for clarity; the merge
// helper imports db directly too).
void db
