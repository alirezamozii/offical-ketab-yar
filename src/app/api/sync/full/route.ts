import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        collections: true,
        userGoals: true,
        readingHistory: true,
        readingProgress: true,
        vocabularies: true,
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

    return NextResponse.json({
      settings: user.settingsJson,
      collections: user.collections,
      goals: goals,
      history: user.readingHistory,
      progress: user.readingProgress,
      vocabulary: user.vocabularies,
    })
  } catch (error) {
    console.error('[API_SYNC_FULL_GET]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
