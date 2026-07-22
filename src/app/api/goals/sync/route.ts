import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getEffectiveOwner } from '@/lib/session'
import { parseBody } from '@/lib/api-validate'
import { apiError } from '@/lib/api-error'

/**
 * POST /api/goals/sync — bidirectional sync of the user's per-period goals.
 *
 * Body: `{ goals: { daily, weekly, monthly } }` — the localStorage
 * `ky_goals` object (the client's current goal targets).
 *
 * The server upserts one `UserGoal` row per period (keyed on userId+period
 * when signed in, guestId+period when anonymous) and returns the merged
 * server state. This closes the "POST /api/goals doesn't persist" gap
 * flagged in audit 04 §6.5 — goal choices now survive browser clears and
 * device switches.
 *
 * H-04: identity resolved via getEffectiveOwner(); signed-in callers use
 * userId+period, anonymous callers use guestId+period — never the old
 * `guestId: 'user'` collapse.
 */

const PERIODS = ['daily', 'weekly', 'monthly'] as const
type Period = (typeof PERIODS)[number]

/** Type guard — narrow a DB `period` string into the canonical Period union. */
function isPeriod(value: string): value is Period {
  return (PERIODS as readonly string[]).includes(value)
}

const GoalPeriodSchema = z.object({
  target: z.number().int().min(1).max(10_000),
  unit: z.enum(['pages', 'minutes']),
})
const SyncSchema = z.object({
  goals: z.object({
    daily: GoalPeriodSchema,
    weekly: GoalPeriodSchema,
    monthly: GoalPeriodSchema,
  }),
})

export async function POST(req: NextRequest) {
  try {
    const owner = await getEffectiveOwner()

    const parsed = await parseBody(req, SyncSchema, 'همگام‌سازی اهداف ناموفق بود.')
    if (!parsed.ok) return parsed.response
    const goals = parsed.data.goals

    // Upsert one row per period using the correct compound unique key.
    for (const period of PERIODS) {
      const g = goals[period]
      if (owner.userId) {
        await db.userGoal.upsert({
          where: { userId_period: { userId: owner.userId, period } },
          update: { target: g.target, unit: g.unit },
          create: { userId: owner.userId, guestId: null, period, target: g.target, unit: g.unit },
        })
      } else {
        await db.userGoal.upsert({
          where: { guestId_period: { guestId: owner.guestId!, period } },
          update: { target: g.target, unit: g.unit },
          create: { guestId: owner.guestId!, userId: null, period, target: g.target, unit: g.unit },
        })
      }
    }

    // Return the merged server state (identity-scoped only — no OR crossing).
    const where = owner.userId ? { userId: owner.userId } : { guestId: owner.guestId! }
    const rows = await db.userGoal.findMany({ where })

    const merged: Record<string, { target: number; unit: string }> = {
      daily: { target: 10, unit: 'pages' },
      weekly: { target: 70, unit: 'pages' },
      monthly: { target: 300, unit: 'pages' },
    }
    for (const r of rows) {
      if (isPeriod(r.period)) {
        merged[r.period] = { target: r.target, unit: r.unit }
      }
    }

    return NextResponse.json(
      { ok: true, goals: merged },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.error('[/api/goals/sync] POST failed:', err)
    return apiError('همگام‌سازی اهداف ناموفق بود.', 500)
  }
}

/**
 * GET /api/goals/sync — fetch the server-side goal state for the current
 * user (or guest). Used by the client on mount to hydrate localStorage.
 */
export async function GET() {
  try {
    const owner = await getEffectiveOwner()
    const where = owner.userId ? { userId: owner.userId } : { guestId: owner.guestId! }
    const rows = await db.userGoal.findMany({ where })

    const goals: Record<string, { target: number; unit: string }> = {
      daily: { target: 10, unit: 'pages' },
      weekly: { target: 70, unit: 'pages' },
      monthly: { target: 300, unit: 'pages' },
    }
    for (const r of rows) {
      if (isPeriod(r.period)) {
        goals[r.period] = { target: r.target, unit: r.unit }
      }
    }

    return NextResponse.json(
      { ok: true, goals },
      { headers: { 'Cache-Control': 'private, max-age=10' } },
    )
  } catch (err) {
    console.error('[/api/goals/sync] GET failed:', err)
    return apiError('بارگذاری اهداف ناموفق بود.', 500)
  }
}
