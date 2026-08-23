'use client'

import dynamic from 'next/dynamic'

const CommandPalette = dynamic(
  () => import('@/components/layout/command-palette').then((m) => m.CommandPalette),
  { ssr: false },
)
const OnboardingTrigger = dynamic(
  () => import('@/components/onboarding/onboarding-trigger').then((m) => m.OnboardingTrigger),
  { ssr: false },
)
const NotificationsProvider = dynamic(
  () => import('@/components/providers/notifications-provider').then((m) => m.NotificationsProvider),
  { ssr: false },
)
const SignupPrompt = dynamic(
  () => import('@/components/providers/signup-prompt').then((m) => m.SignupPrompt),
  { ssr: false },
)
const InstallPrompt = dynamic(
  () => import('@/components/pwa/install-prompt').then((m) => m.InstallPrompt),
  { ssr: false },
)
const RegisterSW = dynamic(
  () => import('@/components/pwa/register-sw').then((m) => m.RegisterSW),
  { ssr: false },
)
const OfflineBanner = dynamic(
  () => import('@/components/pwa/offline-banner').then((m) => m.OfflineBanner),
  { ssr: false },
)

export function ClientWidgets() {
  return (
    <>
      <InstallPrompt />
      <RegisterSW />
      <OfflineBanner />
      <CommandPalette />
      <OnboardingTrigger />
      <NotificationsProvider />
      <SignupPrompt />
    </>
  )
}
