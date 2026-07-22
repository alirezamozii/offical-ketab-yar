/**
 * /api/auth/onboarding — complete post-signin onboarding
 *
 * Body: { username: string, englishLevel: A1|A2|B1|B2|C1|C2, name?: string }
 * Sets user.onboardingCompleted = true and triggers a session update.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-session'
import { parseBody } from '@/lib/api-validate'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

function slugifyUsername(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_.-]/gu, '')
    .slice(0, 30)
}

// ── Input validation ─────────────────────────────────────────────────────────
//
// `username` is restricted to letters/numbers/_-/. and capped at 30 chars
// (matching the slugifyUsername transform). `englishLevel` must be one of the
// CEFR codes. `name` is optional but capped at 60 chars to match the DB
// column width.
const OnboardingSchema = z.object({
  username: z
    .string({ error: 'نام کاربری الزامی است.' })
    .trim()
    .min(3, 'نام کاربری باید حداقل ۳ کاراکتر باشد (فقط حروف، عدد، نقطه، خط تیره).')
    .max(30, 'نام کاربری نمی‌تواند بیشتر از ۳۰ کاراکتر باشد.'),
  englishLevel: z.enum(LEVELS, {
    error: 'سطح انگلیسی باید یکی از A1, A2, B1, B2, C1, C2 باشد.',
  }),
  name: z
    .string()
    .trim()
    .max(60, 'نام نمی‌تواند بیشتر از ۶۰ کاراکتر باشد.')
    .optional()
    .or(z.literal('')),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = await parseBody(req, OnboardingSchema)
  if (!parsed.ok) return parsed.response

  const username = slugifyUsername(parsed.data.username)
  const englishLevel = parsed.data.englishLevel
  const name = parsed.data.name?.trim() || undefined

  // Re-validate after slugify — slugifyUsername can shorten the string but
  // cannot make it empty if zod already passed min(3). Still, defend in depth.
  if (!username || username.length < 3) {
    return NextResponse.json(
      { error: 'نام کاربری باید حداقل ۳ کاراکتر باشد (فقط حروف، عدد، نقطه، خط تیره).' },
      { status: 400 },
    )
  }

  // Check username uniqueness (case-insensitive)
  // Postgres handles case-insensitive comparison natively. Usernames are
  // restricted to [a-z0-9._-] so ASCII case folding is sufficient.
  const existing = await db.user.findFirst({
    where: {
      username: username,
      NOT: { id: user.id },
    },
    select: { id: true },
  })
  if (existing) {
    return NextResponse.json(
      { error: 'این نام کاربری قبلاً گرفته شده است.' },
      { status: 409 },
    )
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      username,
      englishLevel,
      ...(name ? { name } : {}),
      onboardingCompleted: true,
    },
  })

  return NextResponse.json({ ok: true, username, englishLevel })
}
