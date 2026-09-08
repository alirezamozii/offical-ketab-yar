import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireUserApi } from '@/lib/auth-session'
import { parseBody } from '@/lib/api-validate'

const SettingsSchema = z.object({ settings: z.record(z.string(), z.unknown()) })

export async function POST(req: NextRequest) {
  try {
    const user = await requireUserApi()
    if (user instanceof NextResponse) return user
    const parsed = await parseBody(req, SettingsSchema)
    if (!parsed.ok) return parsed.response
    if (JSON.stringify(parsed.data.settings).length > 64_000) {
      return NextResponse.json({ error: 'Settings payload is too large' }, { status: 413 })
    }

    // Save full settings object to the user's settingsJson field
    await db.user.update({
      where: { id: user.id },
      data: { settingsJson: parsed.data.settings as Prisma.InputJsonObject },
      select: { id: true },
    })

    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[API_SETTINGS_POST]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
