import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  COLLECTION_COLOR_LIST,
  COLLECTION_ICON_LIST,
  DEFAULT_COLLECTIONS,
  type CollectionColor,
  type CollectionIconName,
} from '@/lib/collections'
import { parseBody } from '@/lib/api-validate'
import { apiError } from '@/lib/api-error'

/**
 * /api/collections — schema + validation endpoint for the book-collections
 * feature.
 *
 * Collections live entirely in the browser (localStorage key `ky_collections`)
 * because they are guest-scoped: each device has its own shelves and there's
 * no value in round-tripping every add/remove through the server. The
 * `useCollections` hook in `src/lib/collections.ts` is the single source of
 * truth — it reads and writes localStorage directly and broadcasts changes
 * via the synthetic `ky:storage` event for same-tab consumers.
 *
 * This route exists for three reasons:
 *   1. To document the canonical `Collection` schema (GET `/api/collections`
 *      returns the catalog of colors, icons, and the seeded default
 *      collections so future clients can introspect without hardcoding).
 *   2. To validate a create payload (POST) — name length, color/icon
 *      membership, etc. — so the client can show a Persian error before
 *      touching localStorage if the user submits junk.
 *   3. To validate an add/remove payload (PATCH) — same idea.
 *
 * DELETE is supported symmetrically for completeness; the hook handles
 * deletion client-side.
 *
 * All responses are Persian where user-facing.
 */

const MAX_NAME_LEN = 60
const MAX_DESC_LEN = 240
const MAX_BOOKS_PER_COLLECTION = 500

// ── Zod schemas ──────────────────────────────────────────────────────────────
//
// The previous hand-rolled validators did the same job; consolidating onto
// zod shrinks the route and gives us the standard `{ error, details }` 400
// shape for free.
const CreateSchema = z.object({
  name: z
    .string({ error: 'نام پلی‌لیست الزامی است.' })
    .trim()
    .min(1, 'نام پلی‌لیست نمی‌تواند خالی باشد.')
    .max(MAX_NAME_LEN, `نام پلی‌لیست نمی‌تواند بیشتر از ${MAX_NAME_LEN} کاراکتر باشد.`),
  description: z
    .string()
    .trim()
    .max(MAX_DESC_LEN, `توضیحات نمی‌تواند بیشتر از ${MAX_DESC_LEN} کاراکتر باشد.`)
    .optional()
    .or(z.literal('')),
  color: z
    .enum(COLLECTION_COLOR_LIST as unknown as [CollectionColor, ...CollectionColor[]], {
      error: 'رنگ پلی‌لیست نامعتبر است.',
    }),
  icon: z
    .enum(COLLECTION_ICON_LIST as unknown as [CollectionIconName, ...CollectionIconName[]], {
      error: 'نماد پلی‌لیست نامعتبر است.',
    }),
})

const PatchSchema = z.object({
  collectionId: z
    .string({ error: 'شناسه پلی‌لیست الزامی است.' })
    .trim()
    .min(1, 'شناسه پلی‌لیست نامعتبر است.')
    .max(200),
  bookSlug: z
    .string({ error: 'شناسه کتاب الزامی است.' })
    .trim()
    .min(1, 'شناسه کتاب نامعتبر است.')
    .max(200),
  action: z.enum(['add', 'remove'], {
    error: 'عملیات باید «افزودن» یا «حذف» باشد.',
  }),
})

const DeleteSchema = z.object({
  collectionId: z
    .string({ error: 'شناسه پلی‌لیست الزامی است.' })
    .trim()
    .min(1, 'شناسه پلی‌لیست نامعتبر است.')
    .max(200),
})

/**
 * GET /api/collections — returns the schema catalog: available colors (with
 * their gradient classes + Persian labels), available icons (with Persian
 * labels), and the four seeded default collections. Useful for the create
 * dialog and for any future admin/debug UI.
 */
export async function GET() {
  try {
    return NextResponse.json(
      {
        schema: {
          colors: COLLECTION_COLOR_LIST,
          icons: COLLECTION_ICON_LIST,
          maxNameLength: MAX_NAME_LEN,
          maxDescriptionLength: MAX_DESC_LEN,
          maxBooksPerCollection: MAX_BOOKS_PER_COLLECTION,
        },
        defaults: DEFAULT_COLLECTIONS,
        // The four default ids are stable so the client can detect them and
        // disable rename/delete UI for them.
        defaultIds: DEFAULT_COLLECTIONS.map((c) => c.id),
        // Acknowledge that the API does not persist anything — the client owns
        // the data via localStorage.
        storage: { key: 'ky_collections', scope: 'guest', location: 'client' },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300',
        },
      },
    )
  } catch (err) {
    console.error('[/api/collections] GET failed:', err)
    return apiError('بارگذاری اطلاعات پلی‌لیست‌ها ناموفق بود.', 500)
  }
}

/**
 * POST /api/collections — validates a create-collection payload.
 *
 * Body: { name: string, description?: string, color: CollectionColor, icon: CollectionIconName }
 *
 * Returns 200 + the validated payload (the client then calls
 * `useCollections().create(...)` to persist). Returns 400 with a Persian
 * message on validation failure.
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = await parseBody(req, CreateSchema, 'ایجاد پلی‌لیست ناموفق بود.')
    if (!parsed.ok) return parsed.response

    const { name, description, color, icon } = parsed.data

    return NextResponse.json(
      {
        ok: true,
        validated: {
          name,
          description: (description ?? '').trim(),
          color,
          icon,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.error('[/api/collections] POST failed:', err)
    return apiError('ایجاد پلی‌لیست ناموفق بود. لطفاً دوباره تلاش کنید.', 500)
  }
}

/**
 * PATCH /api/collections — validates an add/remove-book payload.
 *
 * Body: {
 *   collectionId: string,
 *   bookSlug: string,
 *   action: 'add' | 'remove',
 * }
 *
 * Returns 200 + the validated payload (the client then calls
 * `useCollections().addBook(...)` or `removeBook(...)` to persist). Returns
 * 400 with a Persian message on validation failure.
 */
export async function PATCH(req: NextRequest) {
  try {
    const parsed = await parseBody(req, PatchSchema, 'به‌روزرسانی پلی‌لیست ناموفق بود.')
    if (!parsed.ok) return parsed.response

    const { collectionId, bookSlug, action } = parsed.data

    return NextResponse.json(
      {
        ok: true,
        validated: { collectionId, bookSlug, action },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.error('[/api/collections] PATCH failed:', err)
    return apiError('به‌روزرسانی پلی‌لیست ناموفق بود.', 500)
  }
}

/**
 * DELETE /api/collections — validates a delete-collection payload.
 *
 * Body: { collectionId: string }
 *
 * Returns 200 + the validated payload (the client then calls
 * `useCollections().remove(...)` to persist). Default collections cannot be
 * deleted — the hook silently no-ops, but we surface a Persian error here
 * so callers can show feedback before round-tripping.
 */
export async function DELETE(req: NextRequest) {
  try {
    const parsed = await parseBody(req, DeleteSchema, 'حذف پلی‌لیست ناموفق بود.')
    if (!parsed.ok) return parsed.response

    const { collectionId } = parsed.data

    if (DEFAULT_COLLECTIONS.some((c) => c.id === collectionId)) {
      return NextResponse.json(
        {
          error:
            'پلی‌لیست‌های پیش‌فرض قابل حذف نیستند — می‌توانید کتاب‌های داخلشان را خالی کنید.',
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { ok: true, validated: { collectionId } },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.error('[/api/collections] DELETE failed:', err)
    return apiError('حذف پلی‌لیست ناموفق بود.', 500)
  }
}
