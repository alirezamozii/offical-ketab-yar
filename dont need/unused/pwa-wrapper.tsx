/**
 * PWA Wrapper - Client Component for Root Layout
 * This wrapper ensures PWA components only load on client side
 */

'use client'

import { PWAProvider } from '@/components/pwa/pwa-provider'
import { useEffect, useState } from 'react'

export function PWAWrapper({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <>{children}</>
    }

    return <PWAProvider>{children}</PWAProvider>
}
