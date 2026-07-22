import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getEffectiveOwner } from '@/lib/session'
import { parseBody } from '@/lib/api-validate'
import { apiError } from '@/lib/api-error'

/**
 * POST /api/reading/history/sync — bidirectional sync of the user's per-day
 * reading history (the localStorage `ky_reading_history` array).
 *
 * Body: `{ days: ReadingHistoryDay[] }` where each day is:
 *   { date: 'YYYY-MM-DD', pages: number, seconds: number, byHour: number[24] }
 *
 * The server upserts one `ReadingHistoryDayRow` per (owner, date) — newer
 * pages/seconds counts win; the `byHour` array is per-hour MAX so neither
 * side loses time-distribution data. Returns the merged server state.
 *
 * This closes the "Year-in-Review is client-rendered from localStorage"
 * gap flagged in audit 04 §6.5 — reading history now survives browser
 * clears and device switches.
 *
 * H-04: identity resolved via getEffectiveOwner(); signed-in callers use
 * userId+date, anonymous callers use guestId+date — never the old
 * `guestId: 'user'` collapse.
 */

const DaySchema = z.object({
  date: z
    .string()
    .trim()
    .min(1)
    .max(10)
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date باید به‌صورت YYYY-MM-DD باشد.'),
  pages: z.number().int().min(0).max(100_000),
  seconds: z.number().int().min(0).max(24 * 60 * 60),
  byHour: z.array(z.number().int().min(0).max(24 * 60 * 60)).length(24),
})

const SyncSchema = z.object({
  days: z.array(DaySchema).max(400),
})

export async function POST(req: NextRequest) {
  try {
    const owner = await getEffectiveOwner()

    const parsed = await parseBody(req, SyncSchema, 'همگام‌سازی تاریخچه مطالعه ناموفق بود.')
    if (!parsed.ok) return parsed.response
    const clientDays = parsed.data.days

    // Upsert each day. Take the MAX of pages / seconds (not the sum) so a
    // re-sync from a stale client doesn't double-count. For byHour, take
    // the per-hour max for the same reason.
    for (const d of clientDays) {
      const byHourJson = JSON.stringify(d.byHour)
      const existing = owner.userId
        ? await db.readingHistoryDayRow.findUnique({
            where: { userId_date: { userId: owner.userId, date: d.date } },
          })
        : await db.readingHistoryDayRow.findUnique({
            where: { guestId_date: { guestId: owner.guestId!, date: d.date } },
          })

      if (existing) {
        // Merge: max pages / seconds; per-hour max for byHour.
        let existingByHour: number[] = new Array(24).fill(0)
        try {
          const parsed = JSON.parse(existing.byHour)
          if (Array.isArray(parsed) && parsed.length === 24) {
            existingByHour = parsed.map(Number)
          }
        } catch {
          /* ignore */
        }
        const mergedByHour = d.byHour.map((v, i) => Math.max(v, existingByHour[i] || 0))
        await db.readingHistoryDayRow.update({
          where: { id: existing.id },
          data: {
            pages: Math.max(existing.pages, d.pages),
            seconds: Math.max(existing.seconds, d.seconds),
            byHour: JSON.stringify(mergedByHour),
          },
        })
      } else {
        await db.readingHistoryDayRow.create({
          data: owner.userId
            ? { userId: owner.userId, guestId: null, date: d.date, pages: d.pages, seconds: d.seconds, byHour: byHourJson }
            : { guestId: owner.guestId!, userId: null, date: d.date, pages: d.pages, seconds: d.seconds, byHour: byHourJson },
        })
      }
    }

    // Return the merged server state (last 365 days).
    const where = owner.userId ? { userId: owner.userId } : { guestId: owner.guestId! }
    const rows = await db.readingHistoryDayRow.findMany({
      where,
      orderBy: { date: 'asc' },
      take: 365,
    })

    const merged = rows.map((r) => {
      let byHour: number[] = new Array(24).fill(0)
      try {
        const parsed = JSON.parse(r.byHour)
        if (Array.isArray(parsed) && parsed.length === 24) {
          byHour = parsed.map(Number)
        }
      } catch {
        /* ignore */
      }
      return {
        date: r.date,
        pages: r.pages,
        seconds: r.seconds,
        byHour,
      }
    })

    return NextResponse.json(
      { ok: true, days: merged },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.error('[/api/reading/history/sync] POST failed:', err)
    return apiError('همگام‌سازی تاریخچه مطالعه ناموفق بود.', 500)
  }
}

/**
 * GET /api/reading/history/sync — fetch the server-side reading history for
 * the current user (or guest). Used by the client on mount to hydrate
 * localStorage.
 */
export async function GET() {
  try {
    const owner = await getEffectiveOwner()
    const where = owner.userId ? { userId: owner.userId } : { guestId: owner.guestId! }
    const rows = await db.readingHistoryDayRow.findMany({
      where,
      orderBy: { date: 'asc' },
      take: 365,
    })

    const days = rows.map((r) => {
      let byHour: number[] = new Array(24).fill(0)
      try {
        const parsed = JSON.parse(r.byHour)
        if (Array.isArray(parsed) && parsed.length === 24) {
          byHour = parsed.map(Number)
        }
      } catch {
        /* ignore */
      }
      return {
        date: r.date,
        pages: r.pages,
        seconds: r.seconds,
        byHour,
      }
    })

    return NextResponse.json(
      { ok: true, days },
      { headers: { 'Cache-Control': 'private, max-age=10' } },
    )
  } catch (err) {
    console.error('[/api/reading/history/sync] GET failed:', err)
    return apiError('بارگذاری تاریخچه مطالعه ناموفق بود.', 500)
  }
}
