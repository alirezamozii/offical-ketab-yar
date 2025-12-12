'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { NativeBottomNav } from './native-bottom-nav'
import { PageTransition } from './page-transition'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'
import { ThemeTransitionOverlay } from './theme-transition-overlay'

interface ConditionalLayoutProps {
    children: ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
    const pathname = usePathname()

    // Hide header/footer on reading pages for immersive experience
    const isReadingPage = pathname?.startsWith('/books/read/')

    // Hide header/footer on auth pages for clean, modern auth experience (Agent 3: Psychology)
    const isAuthPage = pathname?.startsWith('/auth/')

    if (isReadingPage || isAuthPage) {
        return (
            <>
                <ThemeTransitionOverlay />
                <PageTransition>
                    {children}
                </PageTransition>
            </>
        )
    }

    return (
        <>
            <ThemeTransitionOverlay />
            <SiteHeader />
            <main className="flex-1 pb-20 md:pb-0">
                <PageTransition>
                    {children}
                </PageTransition>
            </main>
            <SiteFooter />
            <NativeBottomNav />
        </>
    )
}
