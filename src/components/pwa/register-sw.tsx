'use client'

/**
 * src/components/pwa/register-sw.tsx
 * ---------------------------------------------------------------
 * Registers the service worker (`/sw.js`) on the client. The SW file
 * is pre-built and served as a static asset from `public/sw.js`.
 *
 * Registration happens after `load` so it doesn't compete with
 * first-paint resources. In development, registration is skipped
 * (the SW would cache dev assets and cause stale-content bugs).
 *
 * Owner: Phase 10 R-DEV.2
 * ---------------------------------------------------------------
 */

import { useEffect } from 'react'

export function RegisterSW() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // Register after load so it doesn't block first paint
    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          // eslint-disable-next-line no-console
          console.log('[SW] registered with scope:', reg.scope)
        })
        .catch((err) => {
          console.warn('[SW] registration failed:', err)
        })
    }

    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register)
    }

    return () => {
      window.removeEventListener('load', register)
    }
  }, [])

  return null
}
