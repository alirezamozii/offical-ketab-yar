'use client'

/**
 * OnboardingGate — redirects signed-in users to /onboarding if they haven't
 * completed the post-signin wizard yet.
 *
 * Skipped on:
 *   - /onboarding itself (would loop)
 *   - /auth/* (sign-in flow)
 *   - /api/* (server routes)
 *   - /admin/* (admins/owners bypass onboarding)
 *   - /offline (utility page)
 *   - when no session is present (logged-out users see the public page)
 */

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

const SKIP_PREFIXES = ['/onboarding', '/auth', '/api', '/admin', '/offline']
const SKIP_EXACT = ['/onboarding']

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated') return
    // Skip on certain paths
    if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return
    if (SKIP_EXACT.includes(pathname)) return

    const user = session?.user
    // Only gate regular users (not admins/owners)
    if (user?.role === 'ADMIN' || user?.role === 'OWNER') return
    // If onboarding not completed, redirect
    if (user && user.onboardingCompleted === false) {
      router.replace('/onboarding')
    }
  }, [session, status, pathname, router])

  return <>{children}</>
}
