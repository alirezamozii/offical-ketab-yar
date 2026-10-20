import { SiteHeader } from '@/components/layout/site-header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { BackToTop } from '@/components/layout/back-to-top'

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
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
      <div className="site-shell-bottom">
        <BottomNav />
        <BackToTop />
      </div>
    </div>
  )
}
