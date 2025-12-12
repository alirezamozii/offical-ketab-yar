/**
 * PWA Provider Component
 * Wraps app with PWA functionality
 */

'use client'

import { initDB } from '@/lib/pwa/offline-storage'
import { useEffect } from 'react'
import { InstallPrompt } from './install-prompt'

export function PWAProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Initialize IndexedDB on mount
        initDB().catch((error) => {
            console.error('Failed to initialize IndexedDB:', error)
        })

        // Register service worker update handler
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (
                                newWorker.state === 'installed' &&
                                navigator.serviceWorker.controller
                            ) {
                                // New service worker available
                                console.log('New service worker available')
                                // You can show a toast here to prompt user to refresh
                            }
                        })
                    }
                })
            })
        }
    }, [])

    return (
        <>
            {children}
            <OpenInAppBanner />
            <InstallPrompt />
        </>
    )
}
