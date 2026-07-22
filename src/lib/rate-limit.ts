/**
 * In-memory token-bucket rate limiter.
 *
 * Why in-memory? The app runs as a single long-lived process (standalone Next.js
 * server / Docker). For multi-instance deployments, swap the `Map` for Redis
 * (see `notes` below). The interface stays the same.
 *
 * Usage:
 *   import { rateLimit } from '@/lib/rate-limit'
 *   const { ok, retryAfter } = rateLimit({ key: ip, limit: 20, windowMs: 60_000 })
 *   if (!ok) return NextResponse.json({ error: '...' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } })
 *
 * Notes on scaling:
 *  - The bucket map is pruned every `PRUNE_INTERVAL_MS` to avoid unbounded growth.
 *  - For Redis: replace `buckets` with an `INCR` + `EXPIRE` pipeline. Keep the
 *    `rateLimit()` signature so callers don't change.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const PRUNE_INTERVAL_MS = 5 * 60 * 1000 // prune every 5 minutes
let lastPrune = Date.now()

type RateLimitOptions = {
  /** Unique key — usually the IP or userId (hash before storing). */
  key: string
  /** Max requests allowed in the window. */
  limit: number
  /** Window length in milliseconds. */
  windowMs: number
}

type RateLimitResult = {
  /** Whether the request is allowed. */
  ok: boolean
  /** Seconds until the caller may retry (for the `Retry-After` header). */
  retryAfter: number
  /** Remaining requests in the current window. */
  remaining: number
}

export function rateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now()

  // Periodic prune of expired buckets to keep memory bounded.
  if (now - lastPrune > PRUNE_INTERVAL_MS) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k)
    }
    lastPrune = now
  }

  const existing = buckets.get(key)
  let bucket: Bucket

  if (!existing || existing.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs }
    buckets.set(key, bucket)
  } else {
    bucket = existing
  }

  bucket.count += 1

  if (bucket.count > limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000)
    return { ok: false, retryAfter: Math.max(1, retryAfter), remaining: 0 }
  }

  return {
    ok: true,
    retryAfter: 0,
    remaining: Math.max(0, limit - bucket.count),
  }
}

/**
 * Extract a client IP from standard proxy headers, then sha256-hash it so we
 * never store raw IPs in memory. Falls back to `'unknown'` if no headers are
 * present (e.g. local dev).
 */
export async function getClientIpHash(req: Request): Promise<string> {
  const headers = req.headers
  const raw =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'

  // sha256 via Web Crypto (available in Next.js runtime).
  try {
    const data = new TextEncoder().encode(raw)
    const buf = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 32)
  } catch {
    // Fallback: simple non-crypto hash (dev environments without Web Crypto).
    let h = 0
    for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) | 0
    return `fallback-${h}`
  }
}

/** Convenience: rate-limit key combining an identifier and a route namespace. */
export function rateLimitKey(...parts: string[]): string {
  return parts.join(':')
}

/**
 * Apply a two-tier rate limit to an AI-ish endpoint: anonymous callers get
 * `anonLimit` requests per minute, authenticated callers get `authLimit`.
 * Returns `null` if the request is allowed, or a `Response` (429) to return
 * immediately if the caller is over the limit.
 *
 * Usage:
 *   const blocked = await aiRateLimit(req, { anonLimit: 20, authLimit: 60, name: 'ai-chat' })
 *   if (blocked) return blocked
 */
export async function aiRateLimit(
  req: Request,
  opts: { anonLimit: number; authLimit: number; name: string },
): Promise<Response | null> {
  const { getCurrentUser } = await import('@/lib/auth-session')
  const user = await getCurrentUser().catch(() => null)
  const ipHash = await getClientIpHash(req)
  const limit = user ? opts.authLimit : opts.anonLimit
  const key = rateLimitKey(opts.name, user ? `u:${user.id}` : `ip:${ipHash}`)
  const { ok, retryAfter } = rateLimit({ key, limit, windowMs: 60_000 })
  if (!ok) {
    return new Response(
      JSON.stringify({
        error:
          'تعداد درخواست‌های شما بیش از حد مجاز است. کمی صبر کنید و دوباره تلاش کنید.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Retry-After': String(retryAfter),
        },
      },
    )
  }
  return null
}

