import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.vocabulary.deleteMany({
      where: { userId: session.user.id }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[API_CLEAR_VOCAB]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
