'use client'

import dynamic from 'next/dynamic'

import { CommandPaletteLoader } from '@/components/layout/command-palette-loader'
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
const LazyToaster = dynamic(
  () => import('sonner').then((m) => m.Toaster),
  { ssr: false },
)

import { useEffect, useState } from 'react'

export function ClientWidgets() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const activate = () => setReady(true)

    // Activate immediately on user engagement
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'touchstart', 'keydown', 'scroll']
    events.forEach((evt) => window.addEventListener(evt, activate, { passive: true, once: true }))

    // Background idle fallback after page is fully settled (8 seconds)
    const timer = setTimeout(activate, 8000)

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, activate))
      clearTimeout(timer)
    }
  }, [])

  if (!ready) return null

  return (
    <>
      <CommandPaletteLoader />
      <LazyToaster
        position="bottom-center"
        richColors
        toastOptions={{
          className: 'mb-safe',
        }}
      />
      <InstallPrompt />
      <RegisterSW />
      <OfflineBanner />
      <OnboardingTrigger />
      <NotificationsProvider />
      <SignupPrompt />
    </>
  )
}
