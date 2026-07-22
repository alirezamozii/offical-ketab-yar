/**
 * src/lib/auth.ts — NextAuth configuration for Ketab-Yar
 *
 * Roles:
 *   - USER   : default, can read books, leave reviews, track progress
 *   - ADMIN  : can access /admin panel (must be on ADMIN_EMAIL_WHITELIST)
 *   - OWNER  : the boss — auto-granted on first Google sign-in with OWNER_EMAIL
 *
 * Sign-in methods:
 *   1. Google OAuth — the ONLY sign-in method (no password login)
 *
 * Owner login:
 *   - NOT shown on the public /auth/signin page
 *   - The owner signs in with their Google account (OWNER_EMAIL)
 *   - On first sign-in, they automatically get the OWNER role
 *   - The /auth/signin page only shows the Google button
 *
 * Admin whitelist:
 *   ADMIN_EMAIL_WHITELIST env var (comma-separated). The OWNER can promote
 *   a user to ADMIN only if their email is on this list.
 */

import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { getGuestId } from '@/lib/session'
import { mergeGuestDataToUser } from '@/lib/merge-guest-data'

// ── Env access helpers ─────────────────────────────────────────────────────
// We read env vars through the validated `env` object from src/lib/env.ts.
// If validation hasn't been run yet (or fails — e.g. during a static page
// generation pass where process.env isn't fully populated), we fall back to
// process.env with a console.warn so auth never hard-crashes a request.
// See audits/08 §1 BLOCKER 2 (env validation) and the worklog R1-A entry.

function safeEnv<T>(key: keyof typeof env, fallback: T): T {
  try {
    const v = env[key]
    return (v ?? fallback) as T
  } catch (e) {
    console.warn(
      `[auth] env validation failed for "${String(key)}", falling back to process.env:`,
      e instanceof Error ? e.message : e,
    )
    return fallback
  }
}

function rawOwnerEmail(): string {
  const fallback = process.env.OWNER_EMAIL || ''
  return (safeEnv('OWNER_EMAIL', fallback) || fallback).trim().toLowerCase()
}

/** Parse ADMIN_EMAIL_WHITELIST into a Set of lowercase emails. */
function getAdminWhitelist(): Set<string> | '*' {
  const fallback = process.env.ADMIN_EMAIL_WHITELIST || ''
  const raw = (safeEnv('ADMIN_EMAIL_WHITELIST', fallback) || fallback) as string
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '*') return '*'
  return new Set(
    trimmed
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  )
}

/** True if `email` is allowed to hold the ADMIN role. */
export function canBeAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const list = getAdminWhitelist()
  if (list === '*') return true
  return list.has(email.toLowerCase())
}

/** True if `email` is the owner. */
export function isOwnerEmail(email: string | null | undefined): boolean {
  const owner = rawOwnerEmail()
  if (!email || !owner) return false
  return email.toLowerCase() === owner
}

/** True if `email` is allowed to sign up at all (signup mode check). */
function canSignUp(email: string | null | undefined): boolean {
  // SIGNUP_MODE: 'open' (default — anyone can sign up), 'closed' (no one),
  // 'invite' (only emails on ADMIN_EMAIL_WHITELIST can sign in).
  const fallback = process.env.SIGNUP_MODE || 'open'
  const mode = safeEnv('SIGNUP_MODE', fallback) as 'open' | 'closed' | 'invite'
  if (mode === 'closed') return false
  if (mode === 'invite') {
    if (!email) return false
    const list = getAdminWhitelist()
    if (list === '*') return true
    return list.has(email.toLowerCase())
  }
  return true // 'open'
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt', // JWT for stateless sessions
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  providers: [
    // Google OAuth is the ONLY sign-in method.
    // If not configured yet, the sign-in page shows a helpful message.
    // We read through the validated `env` object (src/lib/env.ts) with a
    // process.env fallback so a missing NEXTAUTH_SECRET at build time
    // doesn't crash static page generation.
    ...(() => {
      const clientId =
        safeEnv<string | null>('GOOGLE_CLIENT_ID', process.env.GOOGLE_CLIENT_ID || null) || null
      const clientSecret =
        safeEnv<string | null>('GOOGLE_CLIENT_SECRET', process.env.GOOGLE_CLIENT_SECRET || null) ||
        null
      if (clientId && clientSecret) {
        return [
          GoogleProvider({
            clientId,
            clientSecret,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      }
      return []
    })(),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user
        token.id = u.id
        token.role = u.role || 'USER'
        token.username = u.username
        token.onboardingCompleted = u.onboardingCompleted
      }
      if (trigger === 'update' && session) {
        if (session.username) token.username = session.username
        if (session.role) token.role = session.role
        if (session.onboardingCompleted !== undefined) {
          token.onboardingCompleted = session.onboardingCompleted
        }
        // H-10: force a fresh DB read on the next request after an `update`
        // trigger (e.g. user changed their username, admin promoted them,
        // user completed onboarding). Setting `_lastDbCheck = 0` makes the
        // staleness check below fall through to the DB read path.
        token._lastDbCheck = 0
      }
      // H-10: avoid hitting the DB on EVERY authenticated request. The JWT
      // callback fires for each request that resolves a session, so a busy
      // page can trigger dozens of `db.user.findUnique` calls per render.
      // We cache the DB read for 30s per token; an `update` trigger (above)
      // zeroes the timestamp to force a fresh read after profile changes.
      // Role/ban changes propagate within at most 30s instead of instantly,
      // which is an acceptable trade-off for the DB-load reduction.
      const DB_CACHE_TTL_MS = 30_000
      const shouldReadDb =
        !!token.id && (Date.now() - (token._lastDbCheck ?? 0) > DB_CACHE_TTL_MS || trigger === 'update')
      if (shouldReadDb) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id },
          select: {
            role: true,
            banned: true,
            username: true,
            name: true,
            image: true,
            onboardingCompleted: true,
            englishLevel: true,
          },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.username = dbUser.username
          token.name = dbUser.name
          token.picture = dbUser.image
          token.onboardingCompleted = dbUser.onboardingCompleted
          token.englishLevel = dbUser.englishLevel
          if (dbUser.banned) {
            token.banned = true
          }
        }
        token._lastDbCheck = Date.now()
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user
        u.id = token.id
        u.role = token.role
        u.username = token.username
        u.banned = token.banned || false
        u.onboardingCompleted = token.onboardingCompleted
        u.englishLevel = token.englishLevel
      }
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        // Invite mode check
        if (!canSignUp(user.email)) return false
        // Check ban status
        const dbUser = await db.user.findUnique({ where: { email: user.email } })
        if (dbUser?.banned) return false

        // ── Cross-device merge (audit 04 §6.5 fix) ──────────────────────
        // On successful signin, re-parent the caller's guest-keyed data
        // (collections, goals, reading history, achievements, progress,
        // vocab, votes, stats) to their user account. Idempotent — if
        // there's no guest cookie or the rows have already been merged,
        // this is a no-op. Failures are logged but DO NOT block signin
        // (the user can still sign in; the /api/auth/merge-guest route is
        // a belt-and-suspenders retry path).
        if (dbUser?.id) {
          try {
            // H-01/H-07: use the verified guest id — the cookie value is
            // now HMAC-signed (`<id>.<sig>`), so reading the raw cookie
            // would pass the whole signed blob as the guestId key (which
            // matches no rows). `getGuestId()` returns the bare verified
            // id (or null if the signature is invalid / cookie missing).
            const guestId = await getGuestId()
            if (guestId) {
              await mergeGuestDataToUser(guestId, dbUser.id)
              console.warn(`[auth.signIn] merged guest data for user ${dbUser.id} (guestId=${guestId})`)
            }
          } catch (mergeErr) {
            console.error('[auth.signIn] mergeGuestDataToUser failed (non-blocking):', mergeErr)
          }
        }
      }
      return true
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email) return
      // If this is the owner's email, grant OWNER role immediately
      if (isOwnerEmail(user.email)) {
        await db.user.update({
          where: { id: user.id },
          data: { role: 'OWNER', onboardingCompleted: true },
        })
      }
      // Create empty stats row
      await db.userStats.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      })
    },
  },
}

// Type augmentation
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      username?: string | null
      banned?: boolean
      onboardingCompleted?: boolean
      englishLevel?: string | null
    }
  }
  interface User {
    role?: string
    username?: string | null
    onboardingCompleted?: boolean
    englishLevel?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
    username?: string | null
    banned?: boolean
    onboardingCompleted?: boolean
    englishLevel?: string | null
    // H-10: timestamp (ms) of the last DB read in the jwt callback. Used to
    // rate-limit DB reads to once per 30s per token (zeroed on `update`).
    _lastDbCheck?: number
  }
}
