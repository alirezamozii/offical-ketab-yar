/**
 * /api/auth/check-username — quick uniqueness check
 *
 * H-13: rate-limited (20 req/min/IP) and length/character-validated to
 * prevent username enumeration via timing or brute-force probing. Public
 * endpoints that take a free-text `u` param and hit the DB are a classic
 * oracle for "does this username exist?" — the rate limit raises the cost
 * of that scan, and the char whitelist + length cap reject obviously
 * invalid candidates before they touch the DB.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rateLimit, getClientIpHash, rateLimitKey } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  // H-13: 20 checks per minute per IP — blocks automated enumeration.
  const ipHash = await getClientIpHash(req)
  const { ok, retryAfter } = rateLimit({
    key: rateLimitKey('check-username', ipHash),
    limit: 20,
    windowMs: 60_000,
  })
  if (!ok) {
    return NextResponse.json(
      {
        available: false,
        reason: 'rate-limited',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'Cache-Control': 'no-store',
        },
      },
    )
  }

  const url = new URL(req.url)
  const u = (url.searchParams.get('u') || '').trim().toLowerCase()

  // Length validation — must be at least 3 chars and at most 30.
  if (u.length < 3) {
    return NextResponse.json(
      { available: false, reason: 'too-short' },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }
  if (u.length > 30) {
    return NextResponse.json(
      { available: false, reason: 'too-long' },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }

  // Character whitelist — only lowercase letters, digits, and underscores.
  // Rejects anything else BEFORE touching the DB so a probe can't use weird
  // unicode to feel out the matching algorithm.
  if (!/^[a-z0-9_]+$/i.test(u)) {
    return NextResponse.json(
      { available: false, reason: 'invalid-chars' },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const existing = await db.user.findFirst({
    where: { username: u },
    select: { id: true },
  })
  return NextResponse.json(
    { available: !existing },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
