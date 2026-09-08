import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUserApi } from '@/lib/auth-session'

export async function GET() {
  try {
    const currentUser = await requireUserApi()
    if (currentUser instanceof NextResponse) return currentUser

    const user = await db.user.findUnique({
      where: { id: currentUser.id },
      select: {
        settingsJson: true,
        collections: { select: { id: true, name: true, description: true, color: true, icon: true, bookSlugs: true, createdAt: true, updatedAt: true } },
        userGoals: { select: { period: true, target: true, unit: true } },
        readingHistory: { select: { date: true, pages: true, seconds: true, byHour: true } },
        readingProgress: { select: { bookSlug: true, currentPage: true, percent: true, lastReadAt: true } },
        vocabularies: { select: { id: true, word: true, definition: true, translation: true, context: true, bookSlug: true, createdAt: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const goals: Record<string, { target: number; unit: string }> = {
      daily: { target: 10, unit: 'pages' },
      weekly: { target: 70, unit: 'pages' },
      monthly: { target: 300, unit: 'pages' },
    }
    for (const r of user.userGoals) {
      if (['daily', 'weekly', 'monthly'].includes(r.period)) {
        goals[r.period] = { target: r.target, unit: r.unit }
      }
    }

    return NextResponse.json(
      {
        settings: user.settingsJson,
        collections: user.collections,
        goals,
        history: user.readingHistory,
        progress: user.readingProgress,
        vocabulary: user.vocabularies,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('[API_SYNC_FULL_GET]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
