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
  // `shouldRender` is null until we've hydrated from localStorage — this
  // prevents a flash of the wizard on every page load for returning users.
  const [shouldRender, setShouldRender] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    // Developer escape hatch — `?skip_onboarding` disables the wizard
    // for the current tab session (useful for QA / screenshots).
    // We read window.location.search directly instead of useSearchParams
    // to avoid Next.js's static-render Suspense requirement.
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
  }, [])

  // Don't render the wizard on reader routes — a deep-linked reader URL on
  // a first visit shouldn't be interrupted by the wizard. The user will see
  // it next time they hit a non-reader page.
  if (pathname && pathname.startsWith('/books/')) {
    return null
  }

  if (shouldRender !== true) return null
  return <OnboardingFlow />
}
