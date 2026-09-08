import { NextResponse } from 'next/server'
import { requireUserApi } from '@/lib/auth-session'
import { db } from '@/lib/db'

export async function DELETE() {
  try {
    const user = await requireUserApi()
    if (user instanceof NextResponse) return user

    await db.vocabulary.deleteMany({
      where: { userId: user.id }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[API_CLEAR_VOCAB]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
