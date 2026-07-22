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

export type SessionUser = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role: string
  username?: string | null
  banned?: boolean
  onboardingCompleted?: boolean
  englishLevel?: string | null
}

export async function getSession() {
  return getServerSession(authOptions)
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession()
  if (!session?.user) return null
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

/**
 * Guard for /admin pages. Returns 404 (not redirect) if the user is not
 * admin/owner — this hides the existence of the admin panel from
 * non-admins and logged-out visitors.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
    // Return 404 — hides the admin panel's existence
    notFound()
  }
  if (user.banned) {
    notFound()
  }
  return user
}

/**
 * Guard for owner-only actions (promote/demote admin, delete users).
 * Also returns 404 to hide the existence of owner-level endpoints.
 */
export async function requireOwner(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'OWNER') {
    notFound()
  }
  if (user.banned) {
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
  return !!user && (user.role === 'ADMIN' || user.role === 'OWNER')
}

export function isOwner(user: SessionUser | null): boolean {
  return !!user && user.role === 'OWNER'
}
