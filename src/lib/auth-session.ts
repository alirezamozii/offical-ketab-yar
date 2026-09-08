/**
 * src/lib/auth-session.ts — NextAuth session helpers
 *
 * `requireAdmin()` calls `notFound()` (404) if the caller is not an
 * authenticated admin/owner. This HIDES the existence of the admin panel —
 * non-admins and logged-out visitors see a 404 page, not a redirect to
 * signin. This makes it harder for attackers to discover /admin.
 *
 * Both OWNER and ADMIN use the SAME /admin URL — the panel is identical,
 * only permissions differ (owner can promote/demote admins, delete users).
 */

import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { authOptions } from './auth'

import { type SessionUser } from './auth-types'
export type { SessionUser }

export async function getSession() {
  return getServerSession(authOptions)
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession()
  if (!session?.user?.id) return null
  const u = session.user
  return {
    id: u.id ?? '',
    name: u.name,
    email: u.email,
    image: u.image,
    role: u.role || 'USER',
    username: u.username,
    banned: u.banned || false,
    onboardingCompleted: u.onboardingCompleted,
    englishLevel: u.englishLevel,
  }
}

/** Resolve privileged access from the database so revocations take effect immediately. */
export async function getVerifiedAdminUser(candidate?: SessionUser | null): Promise<SessionUser | null> {
  const user = candidate === undefined ? await getCurrentUser() : candidate
  if (!user) return null
  const { db } = await import('./db')
  const current = await db.user.findUnique({
    where: { id: user.id },
    select: { role: true, banned: true },
  })
  if (!current || current.banned || !['ADMIN', 'OWNER'].includes(current.role)) return null
  return { ...user, ...current }
}

/**
 * Guard for /admin pages. Returns 404 (not redirect) if the user is not
 * admin/owner — this hides the existence of the admin panel from
 * non-admins and logged-out visitors.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getVerifiedAdminUser()
  if (!user) {
    // Return 404 — hides the admin panel's existence
    notFound()
  }
  return user
}

/**
 * Guard for owner-only actions (promote/demote admin, delete users).
 * Also returns 404 to hide the existence of owner-level endpoints.
 */
export async function requireOwner(): Promise<SessionUser> {
  const user = await getVerifiedAdminUser()
  if (!user || user.role !== 'OWNER') {
    notFound()
  }
  return user
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }
  if (user.banned) {
    redirect('/auth/signin?error=banned')
  }
  return user
}

/**
 * H-14: API-route variant of `requireUser()`. `requireUser()` calls
 * `redirect('/auth/signin')` which throws NEXT_REDIRECT — for an API route
 * this surfaces as a 307 redirect with HTML, not a clean 401 JSON. Bad HTTP
 * semantics for an XHR/fetch caller that expects a JSON error envelope.
 *
 * Returns a `NextResponse` (401 if no session, 403 if banned) the caller
 * MUST short-circuit on, OR the `SessionUser` if authenticated.
 *
 * Usage:
 *   const userOrResponse = await requireUserApi()
 *   if (userOrResponse instanceof NextResponse) return userOrResponse
 *   const userId = userOrResponse.id
 */
export async function requireUserApi(): Promise<SessionUser | NextResponse> {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: 'برای این عملیات باید وارد شوید.' },
      { status: 401 },
    )
  }
  if (user.banned) {
    return NextResponse.json(
      { error: 'حساب کاربری شما مسدود شده است.' },
      { status: 403 },
    )
  }
  return user
}

export function isAdmin(user: SessionUser | null): boolean {
  return !!user && !user.banned && (user.role === 'ADMIN' || user.role === 'OWNER')
}

export function isOwner(user: SessionUser | null): boolean {
  return !!user && !user.banned && user.role === 'OWNER'
}

/** Recheck privileged API access against the database, bypassing JWT staleness. */
export async function requireAdminApi(): Promise<SessionUser | NextResponse> {
  const sessionUser = await getCurrentUser()
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const verified = await getVerifiedAdminUser(sessionUser)
  if (!verified) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return verified
}
