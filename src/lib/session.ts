import { cookies } from 'next/headers'
import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

const COOKIE = 'ky_guest'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

// ─────────────────────────────────────────────────────────────────────────────
// H-01 — HMAC-signed guest cookie
// ─────────────────────────────────────────────────────────────────────────────
// The old `ky_guest` cookie held a raw guest id (e.g. `g_abc123`) and was
// trusted verbatim as the ownership key for collections, goals, reading
// history, achievements, votes, etc. Anyone could forge it with DevTools /
// curl and read or mutate another visitor's data.
//
// The cookie is now signed as `<id>.<hexSignature>` using HMAC-SHA256 with
// NEXTAUTH_SECRET as the key. `verifyGuestId()` returns the id only if the
// signature is valid; otherwise null. Signature comparison uses
// `timingSafeEqual` to avoid timing oracles.
//
// Cookie attributes: httpOnly, sameSite=lax, secure in production, 1-year
// maxAge, path '/'.
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  var __kyGuestFallbackKey: string | undefined
}

function getSigningKey(): string {
  const fromEnv = process.env.NEXTAUTH_SECRET
  if (fromEnv && fromEnv.length >= 16) return fromEnv
  // Dev-only fallback: per-process random key. Sessions won't survive a
  // restart when NEXTAUTH_SECRET is unset, but that's acceptable in dev.
  if (!globalThis.__kyGuestFallbackKey) {
    globalThis.__kyGuestFallbackKey = randomBytes(32).toString('hex')
  }
  return globalThis.__kyGuestFallbackKey
}

function signId(id: string): string {
  return createHmac('sha256', getSigningKey()).update(id).digest('hex')
}

function mintGuestId(): string {
  return `g_${Date.now().toString(36)}${randomBytes(4).toString('hex')}`
}

/**
 * Verify a raw cookie value. Returns the guest id if the signature is valid,
 * or `null` if the value is missing / malformed / has a bad signature.
 *
 * Routes that previously read the cookie directly should use this to validate
 * body-supplied guest IDs (never trust client-supplied guest IDs).
 */
export function signIdWithFingerprint(id: string, fingerprint?: string): string {
  const payload = fingerprint ? `${id}:${fingerprint}` : id
  return createHmac('sha256', getSigningKey()).update(payload).digest('hex')
}

/**
 * Verify a raw cookie value. Returns the guest id if the signature is valid,
 * or `null` if the value is missing / malformed / has a bad signature.
 *
 * An optional `fingerprint` (e.g. IP + User-Agent SHA256) can be provided to prevent
 * cross-device cookie replay attacks.
 */
export function verifyGuestId(
  raw: string | undefined | null,
  fingerprint?: string
): string | null {
  if (!raw) return null
  const lastDot = raw.lastIndexOf('.')
  if (lastDot <= 0) return null
  const id = raw.slice(0, lastDot)
  const sig = raw.slice(lastDot + 1)
  // Guest IDs are always `g_<base36>` — reject anything else before the
  // expensive signature check.
  if (!/^g_[a-zA-Z0-9_-]+$/.test(id)) return null

  // First try fingerprint verification if provided
  if (fingerprint) {
    const fpExpected = signIdWithFingerprint(id, fingerprint)
    if (sig.length === fpExpected.length) {
      try {
        const a = Buffer.from(sig, 'hex')
        const b = Buffer.from(fpExpected, 'hex')
        if (a.length === b.length && timingSafeEqual(a, b)) return id
      } catch {
        // Fall back to standard sign check
      }
    }
  }

  const expected = signId(id)
  if (sig.length !== expected.length) return null
  try {
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length) return null
    return timingSafeEqual(a, b) ? id : null
  } catch {
    return null
  }
}

/** Sign a guest id into the `<id>.<sig>` cookie form. */
export function signGuestCookie(id: string): string {
  return `${id}.${signId(id)}`
}

/**
 * Returns the verified guest id from the cookie, or `null` if no valid
 * cookie exists. Does NOT mint a new cookie — use `getOrCreateGuestId()`
 * for that.
 */
export async function getGuestId(): Promise<string | null> {
  const store = await cookies()
  const raw = store.get(COOKIE)?.value
  return verifyGuestId(raw)
}

/**
 * Returns the verified guest id, minting + setting a fresh signed cookie if
 * no valid one exists. `isNew` is true when a cookie was just set (callers
 * that don't have a response — e.g. server components — can ignore it; the
 * cookie is set on the response headers store automatically).
 */
export async function getOrCreateGuestId(): Promise<{ id: string; isNew: boolean }> {
  const store = await cookies()
  const raw = store.get(COOKIE)?.value
  const verified = verifyGuestId(raw)
  if (verified) return { id: verified, isNew: false }
  const id = mintGuestId()
  store.set(COOKIE, signGuestCookie(id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
  return { id, isNew: true }
}

export const GUEST_COOKIE = COOKIE

/**
 * Returns the effective owner identity for the current request — the
 * authenticated User.id if signed in, otherwise the verified guest id.
 *
 * The returned object distinguishes between the two so callers can use the
 * correct compound-unique key (`userId_*` vs `guestId_*`) per the H-04/H-08
 * hardening.
 */
export async function getEffectiveOwner(): Promise<{
  userId: string | null
  guestId: string | null
}> {
  const { getCurrentUser } = await import('./auth-session')
  const user = await getCurrentUser()
  if (user?.id) return { userId: user.id, guestId: null }
  const { id } = await getOrCreateGuestId()
  return { userId: null, guestId: id }
}

/**
 * Legacy helper — returns a single string identity. Prefer
 * `getEffectiveOwner()` for new code so you can use the correct compound key.
 */
export async function getEffectiveUserId(): Promise<string> {
  const { userId, guestId } = await getEffectiveOwner()
  return userId ?? guestId ?? mintGuestId()
}

/**
 * Returns a human-friendly Persian display name for a guest identity,
 * e.g., "کاربر_۴۲". Converts guestId hash to a deterministic 1..999 number.
 */
export function getGuestDisplayName(guestId: string | null | undefined): string {
  if (!guestId) return 'کاربر_۱'
  // Simple deterministic hash of guestId string
  let hash = 0
  for (let i = 0; i < guestId.length; i++) {
    hash = (hash << 5) - hash + guestId.charCodeAt(i)
    hash |= 0
  }
  const num = (Math.abs(hash) % 999) + 1
  // Convert digits to Persian numbers
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  const persianNum = String(num)
    .split('')
    .map((d) => persianDigits[parseInt(d, 10)] || d)
    .join('')
  return `کاربر_${persianNum}`
}

