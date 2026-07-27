import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      // Guest users can't sync settings to DB, but that's fine
      return NextResponse.json({ success: true, guest: true })
    }

    const json = await req.json()
    const { settings } = json

    if (!settings) {
      return NextResponse.json({ error: 'Missing settings' }, { status: 400 })
    }

    // Save full settings object to the user's settingsJson field
    await db.user.update({
      where: { id: session.user.id },
      data: { settingsJson: settings },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API_SETTINGS_POST]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
