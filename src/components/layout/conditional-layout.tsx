'use client'

import { usePathname } from 'next/navigation'
import { SiteHeader } from '@/components/layout/site-header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { BackToTop } from '@/components/layout/back-to-top'

const FULLSCREEN = ['/books/read', '/auth', '/onboarding']

function isFullscreen(pathname: string) {
  return FULLSCREEN.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (isFullscreen(pathname)) {
    return (
      <main
        id="main-content"
        role="main"
        tabIndex={-1}
        aria-label="محتوای اصلی"
        className="min-h-screen w-full outline-none"
      >
        {children}
      </main>
    )
  }

  return (
    <div className="site-shell flex min-h-screen flex-col">
      <SiteHeader />
      <main
        id="main-content"
        role="main"
        tabIndex={-1}
        aria-label="محتوای اصلی بوکزی"
        className="site-shell-main flex-1 scroll-mt-16 pb-24 outline-none md:pb-0"
      >
        {children}
      </main>
      <BottomNav />
      <BackToTop />
    </div>
  )
}
