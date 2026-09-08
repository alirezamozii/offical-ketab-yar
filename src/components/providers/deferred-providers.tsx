'use client'

import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'

const SmoothScrollProvider = lazy(() =>
  import('@/components/providers/smooth-scroll-provider').then((m) => ({
    default: m.SmoothScrollProvider,
  })),
)
const DeferredAuthFeatures = lazy(() =>
  import('@/components/providers/deferred-auth-features').then((m) => ({
    default: m.DeferredAuthFeatures,
  })),
)

export function DeferredProviders({ children }: { children?: ReactNode } = {}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const activate = () => setMounted(true)
    const events: (keyof WindowEventMap)[] = [
      'pointerdown',
      'touchstart',
      'keydown',
      'scroll',
    ]
    events.forEach((event) =>
      window.addEventListener(event, activate, { passive: true, once: true }),
    )
    const timer = setTimeout(activate, 8000)

    return () => {
      events.forEach((event) => window.removeEventListener(event, activate))
      clearTimeout(timer)
    }
  }, [])

  return (
    <>
      {mounted && (
        <Suspense fallback={null}>
          <SmoothScrollProvider />
          <DeferredAuthFeatures />
        </Suspense>
      )}
      {children}
    </>
  )
}
