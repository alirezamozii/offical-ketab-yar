/**
 * src/lib/env.ts — zod-validated environment variable loader.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Audit 08 (Deployment Readiness) §1 BLOCKER 2: previously the app read
 * `process.env.X` directly in a dozen call sites, with zero validation.
 * A missing `NEXTAUTH_SECRET` would silently fall back to an ephemeral
 * random secret, invalidating every JWT on every restart. A typo'd
 * `NEXTAUTH_URL` would break OAuth redirects with no error message.
 *
 * This module is the single source of truth. Import `env` from anywhere;
 * the FIRST access triggers validation and throws a clear bilingual error
 * if a required var is missing. We also export `validateEnv()` so callers
 * (e.g. instrumentation.ts or a top-level `import '@/lib/env'` in
 * layout.tsx) can trigger validation eagerly at boot.
 *
 * USAGE
 * ─────
 *   import { env } from '@/lib/env'
 *   const url = env.NEXTAUTH_URL        // typed as string
 *   const google = env.GOOGLE_CLIENT_ID // typed as string | null
 *   const mode  = env.SIGNUP_MODE       // typed as 'open'|'closed'|'invite'
 *
 * CRITICAL DESIGN NOTES
 * ─────────────────────
 * 1. We do NOT throw at module load time. Throwing here would break
 *    Next.js's static page generation / edge runtime imports even when
 *    the env vars would be present at runtime. Instead, validation runs
 *    lazily on first property access — and `validateEnv()` exists for
 *    eager boot-time validation.
 * 2. Optional vars (GOOGLE_CLIENT_ID, OWNER_EMAIL, …) are typed as
 *    `string | null` — null when unset / empty. This is unambiguous:
 *    `if (env.GOOGLE_CLIENT_ID) { ... }` works exactly as you'd expect.
 * 3. We accept `'placeholder'` for GOOGLE_CLIENT_ID as "intentionally
 *    unset" (the existing dev convention — see .env.example).
 * 4. `process.env.X ?? ''` coerces `undefined` to `''` so zod's
 *    `.min(1)` validation fires with a clear "is required" message
 *    instead of a confusing "expected string, received undefined".
 */

import { z } from 'zod'

// ── Schema ───────────────────────────────────────────────────────────────────

const envSchema = z.object({
  /** Database connection string. Postgres for both dev and prod
   * (`postgresql://user:pass@host:5432/db?schema=public`). */
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  /** NextAuth JWT signing secret. Must be ≥16 chars to be safe. */
  NEXTAUTH_SECRET: z
    .string()
    .min(16, 'NEXTAUTH_SECRET must be at least 16 characters — generate with `openssl rand -base64 32`'),

  /** Canonical public URL — used for OAuth redirects, absolute links, etc. */
  NEXTAUTH_URL: z
    .string()
    .url('NEXTAUTH_URL must be a valid URL (e.g. https://your-domain.tld)'),

  /** Google OAuth client ID. Optional — sign-in disabled if unset. */
  GOOGLE_CLIENT_ID: z.string().optional().nullable().default(null),

  /** Google OAuth client secret. Optional — sign-in disabled if unset. */
  GOOGLE_CLIENT_SECRET: z.string().optional().nullable().default(null),

  /** Owner email — auto-promoted to OWNER role on first sign-in. Optional. */
  OWNER_EMAIL: z
    .string()
    .email('OWNER_EMAIL must be a valid email address')
    .optional()
    .nullable()
    .default(null),

  /** Signup gate. `open` (anyone), `closed` (no one), `invite` (whitelist only). */
  SIGNUP_MODE: z
    .enum(['open', 'closed', 'invite'])
    .default('open'),

  /** Comma-separated admin email whitelist. Optional. '*' = anyone. */
  ADMIN_EMAIL_WHITELIST: z.string().optional().nullable().default(null),

  /** Node env — defaults to 'development' if unset. */
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  /** Public domain — used by Caddy for auto-HTTPS. Optional (only required in prod Docker). */
  DOMAIN: z.string().optional().nullable().default(null),
})

export type Env = z.infer<typeof envSchema>

// ── Internal: normalize empty strings → null for optional fields ─────────────

/**
 * The schema marks optional fields as `nullable().default(null)`, but zod's
 * `.default()` only fires when the key is `undefined` — not when it's `''`.
 * Since process.env always returns strings (or undefined), and our .env
 * example uses empty strings for "unset", we normalize `''` → `undefined`
 * for the optional fields so the `.default(null)` kicks in.
 */
function normalizeRawEnv(raw: NodeJS.ProcessEnv): Record<string, string | undefined> {
  const OPTIONAL_KEYS = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'OWNER_EMAIL',
    'ADMIN_EMAIL_WHITELIST',
    'DOMAIN',
  ] as const
  const out: Record<string, string | undefined> = { ...raw }
  for (const k of OPTIONAL_KEYS) {
    if (out[k] === '') delete out[k]
  }
  // Treat GOOGLE_CLIENT_ID='placeholder' as unset (matches .env.example
  // convention + auth.ts's existing logic).
  if (out.GOOGLE_CLIENT_ID === 'placeholder') delete out.GOOGLE_CLIENT_ID
  return out
}

// ── Lazy singleton ──────────────────────────────────────────────────────────

let cached: Env | null = null
let cachedError: Error | null = null

/**
 * Validate process.env against the schema and return a typed `env` object.
 * Throws a bilingual error if required vars are missing/invalid. Results are
 * cached — call as many times as you like.
 *
 * Throws are deferred until you call this — so importing `env` at the top of
 * a file does NOT trigger validation (which would break static analysis /
 * edge runtime imports that don't have process.env). Use `env.X` to read a
 * value (this is where validation fires) or call `validateEnv()` eagerly.
 */
export function validateEnv(): Env {
  if (cached) return cached
  if (cachedError) throw cachedError

  const parsed = envSchema.safeParse(normalizeRawEnv(process.env))
  if (!parsed.success) {
    // Build a clear, bilingual error message. Audit 08 §1 BLOCKER 2 called
    // for "fail-fast at boot with a clear Persian + English error".
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    const msg =
      `\n` +
      `╔══════════════════════════════════════════════════════════════════════╗\n` +
      `║  خطا در تنظیمات محیطی — Environment validation failed               ║\n` +
      `║  برنامه به دلیل متغیرهای ناقص یا نامعتبر اجرا نمی‌شود.               ║\n` +
      `║  The app cannot start because required env vars are missing/invalid. ║\n` +
      `╚══════════════════════════════════════════════════════════════════════╝\n` +
      `\n` +
      `مشکلات / Issues:\n` +
      `${issues}\n` +
      `\n` +
      `راه‌حل / Fix:\n` +
      `  • Check .env against .env.example\n` +
      `  • Required: DATABASE_URL, NEXTAUTH_SECRET (min 16 chars), NEXTAUTH_URL\n` +
      `  • Generate NEXTAUTH_SECRET with: openssl rand -base64 32\n` +
      `\n`
    cachedError = new Error(msg)
    throw cachedError
  }
  cached = parsed.data
  return cached
}

// ── Proxy that triggers validation on first property access ─────────────────
//
// `import { env } from '@/lib/env'` is the public API. The proxy defers
// validation until you actually read a property — so `import` alone (which
// happens during static analysis, type-checking, edge runtime warmup) is
// side-effect-free. Reading `env.NEXTAUTH_SECRET` triggers validation and
// either returns the typed value or throws.

export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    const validated = validateEnv()
    return (validated as Record<string, unknown>)[prop]
  },
  ownKeys() {
    return Reflect.ownKeys(validateEnv())
  },
  getOwnPropertyDescriptor(_target, prop: string) {
    if (prop in validateEnv()) {
      return { enumerable: true, configurable: true, value: (validateEnv() as Record<string, unknown>)[prop] }
    }
    return undefined
  },
})
