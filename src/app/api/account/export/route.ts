/**
 * GET /api/account/export — GDPR Art. 20 data portability export.
 *
 * Auth: `requireUser()` — only the authenticated user can export their own
 * data.
 *
 * Returns a JSON blob of all server-side user data we have on file:
 *   • profile  — User row (password redacted)
 *   • accounts — OAuth Account rows (token fields redacted)
 *   • sessions — Session rows (token redacted)
 *   • reviews  — Review rows authored by this user
 *   • votes    — Vote rows cast by this user
 *   • readingProgress
 *   • readingSessions
 *   • userStats
 *   • bookDownloads
 *   • blogPosts — posts authored by this user
 *   • supportTickets
 *   • imageAssets (uploaded images metadata — not the binary)
 *
 * Response:
 *   Content-Type: application/json
 *   Content-Disposition: attachment; filename="ketabyar-data-YYYY-MM-DD.json"
 *
 * Cache-Control: no-store — this is a private, user-scoped data dump.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUserApi } from '@/lib/auth-session'

function redact<T extends Record<string, unknown>>(row: T, keys: string[]): T {
  const out: Record<string, unknown> = { ...row }
  for (const k of keys) {
    if (k in out) out[k] = '[redacted]'
  }
  return out as T
}

export async function GET() {
  // H-14: `requireUser()` throws NEXT_REDIRECT for an unauthenticated caller,
  // which Next.js turns into a 307 redirect to /auth/signin — bad HTTP
  // semantics for a JSON API. Use `requireUserApi()` which returns a clean
  // 401 (or 403 if banned) JSON response instead.
  const userOrResponse = await requireUserApi()
  if (userOrResponse instanceof NextResponse) return userOrResponse
  const userId = userOrResponse.id

  try {
    const [
      profile,
      accounts,
      sessions,
      reviews,
      votes,
      readingProgress,
      readingSessions,
      userStats,
      bookDownloads,
      blogPosts,
      supportTickets,
      imageAssets,
    ] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        // password is hashed but still sensitive — exclude it.
        // The Prisma `select` covers every other field on the User row.
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          emailVerified: true,
          image: true,
          role: true,
          banned: true,
          banReason: true,
          bannedAt: true,
          onboardingCompleted: true,
          englishLevel: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.account.findMany({
        where: { userId },
        // Redact all token fields.
      }),
      db.session.findMany({
        where: { userId },
        // sessionToken is sensitive — redacted below.
      }),
      db.review.findMany({ where: { userId } }),
      db.vote.findMany({ where: { userId } }),
      db.readingProgress.findMany({ where: { userId } }),
      db.readingSession.findMany({ where: { userId } }),
      db.userStats.findUnique({ where: { userId } }),
      db.bookDownload.findMany({ where: { userId } }),
      db.blogPost.findMany({
        where: { authorId: userId },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          content: true,
          coverUrl: true,
          tags: true,
          published: true,
          publishedAt: true,
          viewCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.supportTicket.findMany({ where: { userId } }),
      db.imageAsset.findMany({ where: { userId } }),
    ])

    const exportedAt = new Date().toISOString()
    const date = exportedAt.slice(0, 10)

    const dump = {
      _exportedAt: exportedAt,
      _app: 'KetabYar',
      _schemaVersion: 1,
      _note:
        'This is a complete export of your Ketab-Yar account data per GDPR Article 20 (right to data portability). Token fields are redacted for security. Contact support@ketabyar.ir to request deletion of any remaining data.',
      profile,
      accounts: accounts.map((a) =>
        redact(a, [
          'refresh_token',
          'access_token',
          'id_token',
          'session_state',
          'token_type',
        ]),
      ),
      sessions: sessions.map((s) => redact(s, ['sessionToken'])),
      reviews,
      votes,
      readingProgress,
      readingSessions,
      userStats,
      bookDownloads,
      blogPosts,
      supportTickets,
      imageAssets,
    }

    const filename = `ketabyar-data-${date}.json`
    const body = JSON.stringify(dump, null, 2)

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[/api/account/export] failed:', err)
    return NextResponse.json(
      { ok: false, error: 'خروجی داده‌ها ناموفق بود. لطفاً دوباره تلاش کنید.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
