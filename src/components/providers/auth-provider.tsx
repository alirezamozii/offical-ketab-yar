'use client'

import { SessionProvider } from 'next-auth/react'
import { useSyncOnAuth } from '@/hooks/use-sync-on-auth'

/**
 * Inner component that runs the sync-on-auth effect.
 * Must be rendered INSIDE <SessionProvider> so useSession() works.
 */
function SyncOnAuthBoundary({ children }: { children: React.ReactNode }) {
  useSyncOnAuth()
  return <>{children}</>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SyncOnAuthBoundary>{children}</SyncOnAuthBoundary>
    </SessionProvider>
  )
}
