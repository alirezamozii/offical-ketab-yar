import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getEffectiveOwner } from '@/lib/session'

/**
 * GDPR Subject Access Request (SAR) / Data Export Endpoint
 * GET /api/account/export
 *
 * Export all data associated with the current signed-in user or guest session
 * in standard, human-readable JSON format.
 */
export async function GET() {
  try {
    const { userId, guestId } = await getEffectiveOwner()

    const whereUser = userId ? { userId } : { guestId: guestId ?? 'none' }

    const [
      user,
      progress,
      reviews,
      votes,
      collections,
      goals,
      history,
      achievements,
      vocabularies,
    ] = await Promise.all([
      userId ? db.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true, createdAt: true } }) : null,
      db.readingProgress.findMany({ where: whereUser }),
      db.review.findMany({ where: whereUser }),
      db.vote.findMany({ where: whereUser }),
      db.collection.findMany({ where: whereUser }),
      db.userGoal.findMany({ where: whereUser }),
      db.readingHistoryDayRow.findMany({ where: whereUser }),
      db.userAchievement.findMany({ where: whereUser }),
      db.vocabulary.findMany({ where: whereUser }),
    ])

    const exportPayload = {
      meta: {
        exportedAt: new Date().toISOString(),
        identityType: userId ? 'authenticated_user' : 'guest_session',
        ownerId: userId || guestId,
      },
      profile: user,
      readingProgress: progress,
      reviews,
      votes,
      collections,
      goals,
      readingHistory: history,
      achievements,
      vocabularies,
    }

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="ketab-yar-data-export-${Date.now()}.json"`,
      },
    })
  } catch (err) {
    console.error('[/api/account/export] Error building data export:', err)
    return NextResponse.json(
      { error: 'خطا در استخراج اطلاعات کاربری. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    )
  }
}
