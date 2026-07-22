'use client'

import { ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Lenis smooth-scroll provider.
 * Wraps the app to provide buttery-smooth scrolling with the brand's
 * signature easing. Respects prefers-reduced-motion.
 *
 * Performance: the Lenis rAF loop is **skipped entirely** on reader pages
 * (`/books/read/*`). Those routes own their own scroll container with custom
 * behavior, so a second rAF loop running in the background only wastes CPU.
 * When the user navigates away from a reader page, Lenis is re-initialized
 * on the next effect tick (driven by the `pathname` dependency).
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/'
  // The reader owns its own scroll container; don't run Lenis there.
  const isReaderPage = pathname.startsWith('/books/read/')

  useEffect(() => {
    if (isReaderPage) return
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (prefersReduced) return

    let lenis: import('lenis').default | null = null
    let rafId: number
    let cancelled = false

    // Dynamic import so the lib isn't in the SSR bundle
    import('lenis').then((mod) => {
      // Guard against the effect having been torn down during the dynamic
      // import window (e.g. user navigated to /books/read/* mid-load).
      if (cancelled) return
      const Lenis = mod.default
      lenis = new Lenis({
        // Per user feedback: "سرریع تر باشه حس کند بودن نده حس لگ بودن
        // ندهولی به شدت نرم" — keep the smooth feel but make it faster /
        // more responsive. Lower duration = faster settle, the easing
        // stays soft (easeOutExpo) so it doesn't feel jumpy.
        duration: 0.7,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        // Higher wheel multiplier = scroll further per wheel tick → feels
        // snappier without losing the smooth interpolation.
        wheelMultiplier: 1.4,
        touchMultiplier: 1.5,
      })

      function raf(time: number) {
        lenis?.raf(time)
        rafId = requestAnimationFrame(raf)
      }
      rafId = requestAnimationFrame(raf)
    })

    return () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
      lenis?.destroy()
    }
  }, [isReaderPage])

  return <>{children}</>
}
