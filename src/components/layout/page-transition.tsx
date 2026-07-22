'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'

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
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const prefersReduced = useReducedMotion()

  // `isFirstLoad` is true only on the first ever mount (SSR + initial
  // client hydration). On subsequent navigations the template remounts,
  // but the module-level flag is already true → isFirstLoad=false → animate.
  const [isFirstLoad] = useState(() => {
    if (typeof window === 'undefined') return true // SSR: never animate
    if (hasMountedGlobally) return false
    hasMountedGlobally = true
    return true
  })

  const shouldAnimate = !isFirstLoad

  return (
    <motion.div
      key={pathname}
      initial={
        shouldAnimate
          ? prefersReduced
            ? { opacity: 0 }
            : { opacity: 0, y: 6 }
          : false
      }
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={
        prefersReduced
          ? { duration: 0.08, ease: 'easeOut' }
          : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
      }
      className="min-h-0"
    >
      {children}
    </motion.div>
  )
}
