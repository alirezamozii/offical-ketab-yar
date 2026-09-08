'use client'

/**
 * src/components/onboarding/onboarding-trigger.tsx
 * ---------------------------------------------------------------
 * Mounts the OnboardingFlow dialog on first visit (when the user has
 * not yet completed or skipped the wizard). Renders `null` otherwise.
 *
 * Behavior:
 *   - Reads onboarding state from localStorage on mount (client-only)
 *     to avoid SSR/CSR mismatch.
 *   - Skips if the URL contains `?skip_onboarding` (developer/test
 *     escape hatch).
 *   - Skips if the route is the reader (so a deep-linked reader URL
 *     on first visit doesn't interrupt reading with the wizard).
 *
 * Owner: onboarding-flow-builder (CRON4-B).
 * ---------------------------------------------------------------
 */

import * as React from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { getOnboardingState } from '@/lib/onboarding'

const OnboardingFlow = dynamic(
  () => import('@/components/onboarding/onboarding-flow').then((m) => m.OnboardingFlow),
  { ssr: false }
)

export function OnboardingTrigger() {
  const pathname = usePathname()
  const [shouldRender, setShouldRender] = React.useState<boolean | null>(null)

  const isEligibleRoute = pathname === '/dashboard' || pathname?.startsWith('/dashboard/') || pathname === '/onboarding'

  React.useEffect(() => {
    if (!isEligibleRoute) return

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('skip_onboarding') !== null) {
        setShouldRender(false)
        return
      }
    }
    const state = getOnboardingState()
    const alreadyDone = state.completed || state.skipped
    setShouldRender(!alreadyDone)
  }, [isEligibleRoute])

  if (!isEligibleRoute || shouldRender !== true) return null
  return <OnboardingFlow />
}
