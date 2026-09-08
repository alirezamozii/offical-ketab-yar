'use client'

import { useEffect, useState, type ReactNode } from 'react'

/**
 * Module-level flag — persists across template re-mounts (which happen on
 * every client-side navigation). Used to detect the very first render
 * (SSR + initial hydration) so we DON'T render `opacity:0` on the server
 * (which would briefly hide content before JS hydrates).
 */
let hasMountedGlobally = false

/**
 * PageTransition — wraps page content with a subtle fade + slide-up.
 *
 * Behaviour:
 * - First page load (SSR + hydration): no animation. Content renders at
 *   full opacity immediately — good for SEO and perceived performance.
 * - Subsequent client-side navigations (template re-mounts): fade + slide
 *   entrance animation, keyed implicitly by component re-mount.
 * - Duration: 200ms (fast — feels instant but is visible). Reduced-motion
 *   users get an opacity-only 80ms cross-fade so navigation still feels
 *   responsive without motion.
 * - Respects `prefers-reduced-motion`: opacity-only, near-instant.
 *
 * Used inside `src/app/template.tsx`.
 *
 * Performance: Pure CSS transitions — no framer-motion dependency.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  // Capture this once per template mount. Reading the global on each
  // render can hide the initial page when a provider rerenders it.
  const [shouldAnimate] = useState(() => hasMountedGlobally)

  useEffect(() => {
    hasMountedGlobally = true
  }, [])

  // First load: no animation classes at all — content visible immediately
  if (!shouldAnimate) {
    return <div className="min-h-0">{children}</div>
  }

  return (
    <div
      className="min-h-0 motion-safe:animate-page-fade"
    >
      {children}
    </div>
  )
}
