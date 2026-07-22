import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getOrCreateGuestId } from '@/lib/session'
import { getCurrentUser } from '@/lib/auth-session'
import { parseBody } from '@/lib/api-validate'
import { apiError } from '@/lib/api-error'

// ── Input validation ─────────────────────────────────────────────────────────
//
// Caps match the existing PATCH route's `.slice()` calls so behaviour is
// unchanged for valid input; only invalid/oversized input now gets a 400
// instead of being silently truncated.
const MAX_WORD = 200
const MAX_DEFINITION = 5_000
const MAX_TRANSLATION = 500
const MAX_CONTEXT = 2_000
const MAX_BOOK_SLUG = 200

const VocabCreateSchema = z.object({
  word: z
    .string({ error: 'word الزامی است.' })
    .trim()
    .min(1, 'word required')
    .max(MAX_WORD, `word نمی‌تواند بیشتر از ${MAX_WORD} کاراکتر باشد.`),
  definition: z.string().trim().max(MAX_DEFINITION).default(''),
  translation: z.string().trim().max(MAX_TRANSLATION).default(''),
  context: z.string().trim().max(MAX_CONTEXT).default(''),
  bookSlug: z.string().trim().max(MAX_BOOK_SLUG).default(''),
})

const VocabPatchSchema = z.object({
  id: z
    .string({ error: 'id الزامی است.' })
    .trim()
    .min(1, 'id required')
    .max(200),
  definition: z.string().trim().max(MAX_DEFINITION).optional(),
  translation: z.string().trim().max(MAX_TRANSLATION).optional(),
  context: z.string().trim().max(MAX_CONTEXT).optional(),
})

export async function GET() {
  try {
    const { id: guestId } = await getOrCreateGuestId()
    // Attach the signed-in user (if any) so vocab is cross-device synced via
    // `userId` (audit 04 §6.5 fix).
    const user = await getCurrentUser().catch(() => null)
    const userId = user?.id
    const where = userId ? { OR: [{ userId }, { guestId }] } : { guestId }
    const words = await db.vocabulary.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(words)
  } catch (err) {
    console.error('[/api/vocabulary] GET failed:', err)
    return apiError('بارگذاری واژگان ناموفق بود.', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id: guestId } = await getOrCreateGuestId()
    // Populate `userId` when the caller is signed in so the saved word is
    // attributed to the user (survives device switches) — audit 04 §6.5 fix.
    const user = await getCurrentUser().catch(() => null)
    const userId = user?.id
    const parsed = await parseBody(req, VocabCreateSchema)
    if (!parsed.ok) return parsed.response

    const { word, definition, translation, context, bookSlug } = parsed.data
    const created = await db.vocabulary.create({
      data: {
        guestId,
        word,
        definition,
        translation,
        context,
        bookSlug,
        ...(userId ? { userId } : {}),
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error('[/api/vocabulary] POST failed:', err)
    return apiError('ذخیره واژه ناموفق بود.', 500)
  }
}

// ── DELETE: validate query param ?id=... ─────────────────────────────────────
const VocabDeleteIdSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, 'id required')
    .max(200, 'id بیش از حد طولانی است.'),
})

export async function DELETE(req: NextRequest) {
  try {
    const { id: guestId } = await getOrCreateGuestId()
    const user = await getCurrentUser().catch(() => null)
    const userId = user?.id
    const url = new URL(req.url)
    const wordIdRaw = url.searchParams.get('id') ?? ''
    const result = VocabDeleteIdSchema.safeParse({ id: wordIdRaw })
    if (!result.success) {
      return apiError('id required', 400, result.error.flatten())
    }
    const wordId = result.data.id
    // Delete across both userId and guestId scopes so a signed-in user can
    // remove words they saved while anonymous on a different device.
    const where = userId
      ? { id: wordId, OR: [{ userId }, { guestId }] }
      : { id: wordId, guestId }
    await db.vocabulary.deleteMany({ where })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/vocabulary] DELETE failed:', err)
    return apiError('حذف واژه ناموفق بود.', 500)
  }
}

/**
 * PATCH — inline edit of a saved word's definition and/or translation.
 * Body: { id, definition?, translation?, context? }
 * Only the supplied fields are updated; the rest are left untouched.
 * Used by the vocabulary list's inline-edit affordance.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { id: guestId } = await getOrCreateGuestId()
    const user = await getCurrentUser().catch(() => null)
    const userId = user?.id
    const parsed = await parseBody(req, VocabPatchSchema)
    if (!parsed.ok) return parsed.response

    const { id: wordId, definition, translation, context } = parsed.data

    const data: Record<string, string> = {}
    if (definition !== undefined) data.definition = definition
    if (translation !== undefined) data.translation = translation
    if (context !== undefined) data.context = context
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'no fields to update' },
        { status: 400 },
      )
    }

    // updateMany so a wrong-guest id is a silent no-op (no leak). Match
    // across both userId and guestId scopes so a signed-in user can edit
    // words they saved while anonymous on a different device.
    const where = userId
      ? { id: wordId, OR: [{ userId }, { guestId }] }
      : { id: wordId, guestId }
    const result = await db.vocabulary.updateMany({ where, data })
    if (result.count === 0) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }
    const updated = await db.vocabulary.findUnique({ where: { id: wordId } })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('[/api/vocabulary] PATCH failed:', err)
    return apiError('به‌روزرسانی واژه ناموفق بود.', 500)
  }
}
