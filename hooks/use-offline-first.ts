/**
 * KETAB-YAR: Offline-First Hook
 * 
 * React hook for offline-first data management
 * Automatically syncs with Supabase when online
 */

import { getSyncStatus, isOnline, setupAutoSync } from '@/lib/offline/sync-manager'
import { useEffect, useState } from 'react'

export function useOfflineFirst() {
    const [online, setOnline] = useState(true)
    const [pendingSync, setPendingSync] = useState(0)

    useEffect(() => {
        // Setup auto-sync
        setupAutoSync()

        // Update online status
        const updateOnlineStatus = () => {
            
            setOnline(navigator.onLine)
        }

        window.addEventListener('online', updateOnlineStatus)
        window.addEventListener('offline', updateOnlineStatus)

        // Update sync status
        const updateSyncStatus = async () => {
            const status = await getSyncStatus()
            setPendingSync(status.pending)
        }

        updateSyncStatus()
        const interval = setInterval(updateSyncStatus, 10000) // Every 10 seconds

        return () => {
            window.removeEventListener('online', updateOnlineStatus)
            window.removeEventListener('offline', updateOnlineStatus)
            clearInterval(interval)
        }
    }, [])

    return {
        online,
        pendingSync,
        isOnline: isOnline(),
    }
}
