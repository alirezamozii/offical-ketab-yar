'use client'

import { initDB } from '@/lib/offline/indexeddb'
import { setupAutoSync } from '@/lib/offline/sync-manager'
import { useEffect } from 'react'

/**
 * KETAB-YAR: Offline Provider
 * 
 * Initializes IndexedDB and auto-sync on app load
 * Add this to your root layout
 */
export function OfflineProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Initialize IndexedDB
        initDB()
            .then(() => {
                console.log('✅ IndexedDB initialized')
            })
            .catch((error) => {
                console.error('❌ Failed to initialize IndexedDB:', error)
            })

        // Setup auto-sync
        setupAutoSync()
        console.log('✅ Auto-sync enabled')

        // Log online/offline status
        const handleOnline = () => console.log('🌐 Back online!')
        const handleOffline = () => console.log('📴 Offline mode')

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    return <>{children}</>
}
