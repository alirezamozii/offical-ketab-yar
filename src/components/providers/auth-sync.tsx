'use client'

import { useSyncOnAuth } from '@/hooks/use-sync-on-auth'

export function AuthSync() {
  useSyncOnAuth()
  return null
}
