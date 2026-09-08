'use client'

import { ClientWidgets } from '@/components/providers/client-widgets'
import { AuthProvider } from '@/components/providers/auth-provider'
import { AuthSync } from '@/components/providers/auth-sync'
import { OnboardingGate } from '@/components/providers/onboarding-gate'

export function DeferredAuthFeatures() {
  return (
    <AuthProvider>
      <OnboardingGate />
      <AuthSync />
      <ClientWidgets />
    </AuthProvider>
  )
}
