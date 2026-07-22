/**
 * /api/support — POST a new support ticket.
 *
 * Body:
 *   { name: string, email: string, subject: string, message: string }
 *
 * Behaviour:
 *   • Validates input with zod (all fields required, max-length capped).
 *   • Stores a SupportTicket row in the DB.
 *   • Captures the userId when the caller is signed in (guests allowed).
 *   • In-memory per-IP rate limit (max 5 tickets / hour / IP). The limit is
 *     soft — it resets on server restart, which is acceptable for a
 *     low-traffic /support endpoint on a single-instance deployment.
 *   • Never returns raw Prisma errors — the user always sees a Persian
 *     message, never a stack trace.
 *
 * Responses:
 *   201 — { ok: true, id: ticketId }
 *   400 — validation error (Persian)
 *   429 — rate-limited (Persian, with Retry-After header)
 *   500 — server error (Persian, generic)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createHash } from 'node:crypto'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-session'
import { parseBody } from '@/lib/api-validate'

// ── Validation ────────────────────────────────────────────────────────────────
const Schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'نام باید حداقل ۲ کاراکتر باشد')
    .max(80, 'نام بیش از حد طولانی است'),
  email: z
    .string()
    .trim()
    .min(3, 'ایمیل نامعتبر است')
    .max(160, 'ایمیل بیش از حد طولانی است')
    .email('فرمت ایمیل نامعتبر است'),
  subject: z
    .string()
    .trim()
    .min(3, 'موضوع باید حداقل ۳ کاراکتر باشد')
    .max(160, 'موضوع بیش از حد طولانی است'),
  message: z
    .string()
    .trim()
    .min(10, 'پیام باید حداقل ۱۰ کاراکتر باشد')
    .max(4000, 'پیام بیش از حد طولانی است'),
})

// ── Rate limiting (in-memory, per hashed IP) ─────────────────────────────────
//
// Simple sliding-window counter: keep the timestamps of the last N requests
// per IP, prune anything older than the window, reject if the remaining count
// exceeds the cap.
//
// • Single-instance only — multi-instance deploys would need Redis or a
//   shared cache. Acceptable for the current deployment shape (see audit 08).
// • We hash the IP before using it as a key so the in-memory map never stores
//   raw IPs (a small privacy hygiene win).
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 5 // 5 tickets / hour / IP

type RateBucket = { timestamps: number[] }
const rateBuckets = new Map<string, RateBucket>()

function rateLimit(key: string): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now()
  const bucket = rateBuckets.get(key) ?? { timestamps: [] }
  // Prune old entries.
  const recent = bucket.timestamps.filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  )
  if (recent.length >= RATE_LIMIT_MAX) {
    // Oldest entry tells us when the window will free up a slot.
    const oldest = recent[0]
    const retryAfter = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000)
    return { ok: false, retryAfter: Math.max(1, retryAfter) }
  }
  recent.push(now)
  rateBuckets.set(key, { timestamps: recent })
  return { ok: true }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Best-effort client IP extraction. Falls back to 'unknown' if no header. */
function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) {
    // First hop is the client.
    return fwd.split(',')[0]?.trim() || 'unknown'
  }
  return req.headers.get('x-real-ip') || 'unknown'
}

/** SHA-256 hash of the IP for storage + rate-limit key. Never store raw IP. */
function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Parse + validate body (zod via shared parseBody helper) ────────────────
  // parseBody returns a 400 response with a Persian error message + zod-flattened
  // details on failure; on success it returns the typed data.
  const parsed = await parseBody(req, Schema, 'ورودی نامعتبر است')
  if (!parsed.ok) return parsed.response

  const { name, email, subject, message } = parsed.data

  // ── Rate limit (per hashed IP) ──────────────────────────────────────────────
  const ip = getClientIp(req)
  const ipHash = hashIp(ip)
  const rl = rateLimit(ipHash)
  if (!rl.ok) {
    return NextResponse.json(
      {
        error:
          'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.',
        retryAfter: rl.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rl.retryAfter),
          'Cache-Control': 'no-store',
        },
      },
    )
  }

  // ── Auth (optional — guests allowed) ────────────────────────────────────────
  let userId: string | null = null
  try {
    const user = await getCurrentUser()
    if (user) userId = user.id
  } catch {
    // Session fetch failed — treat as guest. The ticket still goes through.
    userId = null
  }

  // ── Persist ─────────────────────────────────────────────────────────────────
  try {
    const ticket = await db.supportTicket.create({
      data: {
        userId,
        name,
        email: email.toLowerCase(),
        subject,
        message,
        userAgent: req.headers.get('user-agent')?.slice(0, 500) ?? '',
        ipHash,
      },
      select: {
        id: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        ok: true,
        id: ticket.id,
        createdAt: ticket.createdAt.toISOString(),
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.error('[/api/support] POST failed:', err)
    return NextResponse.json(
      {
        error:
          'ثبت پیام ناموفق بود. لطفاً چند لحظه بعد دوباره تلاش کنید یا به ایمیل support@ketabyar.ir پیام بزنید.',
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}

/**
 * GET /api/support — lightweight availability probe.
 * Lets the client verify the endpoint exists without submitting a ticket.
 */
export async function GET() {
  return NextResponse.json(
    { ok: true, service: 'support' },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
