import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getEffectiveOwner } from '@/lib/session'
import { parseBody } from '@/lib/api-validate'
import { apiError } from '@/lib/api-error'

/**
 * POST /api/collections/sync — bidirectional sync of the user's collections.
 *
 * Body: `{ collections: Collection[] }` — the localStorage `ky_collections`
 * array (the client's current state).
 *
 * The server:
 *   1. Upserts each client collection into the DB (keyed on userId+name when
 *      signed in, guestId+name when anonymous) — newer client `updatedAt`
 *      wins; otherwise the server's version is kept.
 *   2. Returns the merged server state so the client can replace its
 *      localStorage with the authoritative version.
 *
 * This closes the "localStorage-only" gap flagged in audit 04 §6.5:
 * collections now survive browser clears, device switches, and private
 * browsing — as long as the user signs in (or keeps the guest cookie).
 *
 * Auth: the route accepts EITHER a signed-in user (in which case the
 * collections are keyed on `userId`) OR an anonymous guest (keyed on
 * `guestId`). On signin, `mergeGuestDataToUser` re-parents guest rows to
 * the user — see `src/lib/merge-guest-data.ts`.
 *
 * H-04: identity is resolved via getEffectiveOwner(). When the caller is
 * signed in, ownership is set to `userId` and `guestId` is null — never
 * the old `guestId: 'user'` collapse.
 */

const CollectionSchema = z.object({
  id: z.string().trim().max(200).optional(),
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(240).default(''),
  bookSlugs: z.array(z.string().trim().max(200)).max(500).default([]),
  color: z.string().trim().max(60).default('gold'),
  icon: z.string().trim().max(60).default('BookOpen'),
  createdAt: z.string().trim().max(60).optional(),
  updatedAt: z.string().trim().max(60).optional(),
  isDefault: z.boolean().optional(),
})

const SyncSchema = z.object({
  collections: z.array(CollectionSchema).max(200),
})

export async function POST(req: NextRequest) {
  try {
    const owner = await getEffectiveOwner()

    const parsed = await parseBody(req, SyncSchema, 'همگام‌سازی پلی‌لیست‌ها ناموفق بود.')
    if (!parsed.ok) return parsed.response
    const clientCollections = parsed.data.collections

    // Upsert each client collection into the DB using the correct compound
    // unique key for the caller's identity.
    for (const c of clientCollections) {
      const bookSlugsJson = JSON.stringify(c.bookSlugs)
      const existing = owner.userId
        ? await db.collection.findUnique({
            where: { userId_name: { userId: owner.userId, name: c.name } },
          })
        : await db.collection.findUnique({
            where: { guestId_name: { guestId: owner.guestId!, name: c.name } },
          })

      // Last-write-wins: only update if the client's updatedAt is newer.
      const clientUpdatedAt = c.updatedAt ? new Date(c.updatedAt).getTime() : 0
      const serverUpdatedAt = existing?.updatedAt?.getTime() ?? 0
      const clientWins = clientUpdatedAt >= serverUpdatedAt

      if (existing) {
        if (clientWins) {
          await db.collection.update({
            where: { id: existing.id },
            data: {
              description: c.description,
              color: c.color,
              icon: c.icon,
              bookSlugs: bookSlugsJson,
            },
          })
        }
      } else {
        await db.collection.create({
          data: owner.userId
            ? { userId: owner.userId, guestId: null, name: c.name, description: c.description, color: c.color, icon: c.icon, bookSlugs: bookSlugsJson }
            : { guestId: owner.guestId!, userId: null, name: c.name, description: c.description, color: c.color, icon: c.icon, bookSlugs: bookSlugsJson },
        })
      }
    }

    // Return the merged server state. Use the correct identity key only —
    // no OR-crossing between userId and guestId (which would let a guest
    // signed-in-as-A read user B's collections if both were ever attached
    // to the same cookie).
    const where = owner.userId ? { userId: owner.userId } : { guestId: owner.guestId! }
    const rows = await db.collection.findMany({ where, orderBy: { createdAt: 'asc' } })

    const merged = rows.map((r) => {
      let bookSlugs: string[] = []
      try {
        const parsed = JSON.parse(r.bookSlugs)
        if (Array.isArray(parsed)) bookSlugs = parsed.map(String)
      } catch {
        bookSlugs = []
      }
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        color: r.color,
        icon: r.icon,
        bookSlugs,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }
    })

    return NextResponse.json(
      { ok: true, collections: merged },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.error('[/api/collections/sync] POST failed:', err)
    return apiError('همگام‌سازی پلی‌لیست‌ها ناموفق بود.', 500)
  }
}

/**
 * GET /api/collections/sync — fetch the server-side collection state for the
 * current user (or guest). Used by the client on mount to hydrate localStorage
 * from the server before applying local overrides.
 */
export async function GET() {
  try {
    const owner = await getEffectiveOwner()
    const where = owner.userId ? { userId: owner.userId } : { guestId: owner.guestId! }
    const rows = await db.collection.findMany({ where, orderBy: { createdAt: 'asc' } })

    const collections = rows.map((r) => {
      let bookSlugs: string[] = []
      try {
        const parsed = JSON.parse(r.bookSlugs)
        if (Array.isArray(parsed)) bookSlugs = parsed.map(String)
      } catch {
        bookSlugs = []
      }
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        color: r.color,
        icon: r.icon,
        bookSlugs,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }
    })

    return NextResponse.json(
      { ok: true, collections },
      { headers: { 'Cache-Control': 'private, max-age=10' } },
    )
  } catch (err) {
    console.error('[/api/collections/sync] GET failed:', err)
    return apiError('بارگذاری پلی‌لیست‌ها ناموفق بود.', 500)
  }
}
