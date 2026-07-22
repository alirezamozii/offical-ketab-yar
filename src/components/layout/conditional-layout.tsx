'use client'

import { usePathname } from 'next/navigation'
import { BottomNav } from '@/components/layout/bottom-nav'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'

/**
 * Fullscreen immersive routes (reader, auth, onboarding) skip the
 * header/footer/bottom-nav so they render as standalone experiences.
 */
const FULLSCREEN = ['/books/read', '/auth', '/onboarding']

function isFullscreen(pathname: string) {
  return FULLSCREEN.some((p) => pathname.startsWith(p))
}

/**
 * ConditionalLayout — splits fullscreen (reader) routes from the standard
 * app shell (header + main + footer + bottom-nav).
 *
 * Layout shell:
 *   <div flex min-h-screen flex-col>
 *     <SiteHeader />     ← sticky top, scroll-shrink, progress bar
 *     <main flex-1>      ← page content (scrolls under the header)
 *     <SiteFooter />     ← mt-auto sticks to bottom on short pages
 *     <BottomNav />      ← mobile-only floating bar (hidden on scroll-down)
 *   </div>
 *
 * The body element (in app/layout.tsx) carries `min-h-screen flex flex-col`
 * so the footer is always pushed to the bottom of the viewport on short
 * pages, and the inner div here composes the actual app shell.
 *
 * Accessibility:
 * - The `<main>` element (and the fullscreen wrapper) carries `id="main-content"`
 *   so the SkipLink can target it. `tabIndex={-1}` makes it programmatically
 *   focusable without breaking tab order, so the skip link can move focus
 *   to it (HTML5 allows focusing any element with tabindex=-1).
 * - `role="main"` is set explicitly so screen readers that don't recognize
 *   the `<main>` element (very old browsers) still get the landmark.
 * - `aria-label` gives the main region a localized, human-readable name.
 *
 * Mobile bottom padding: `pb-24 md:pb-0` on main ensures page content isn't
 * hidden behind the floating bottom-nav (~60px tall + safe-area-inset-bottom).
 * On md+ the bar is hidden so we drop the padding.
 */
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
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main
        id="main-content"
        role="main"
        tabIndex={-1}
        aria-label="محتوای اصلی کتاب‌یار"
        // pb-24 = 96px — clears the bottom-nav (~60px) + safe-area + a bit
        // of breathing room so the last card isn't pinned to the bar.
        // scroll-mt-16 — anchor jumps land below the sticky 64px header.
        className="flex-1 scroll-mt-16 pb-24 outline-none md:pb-0"
      >
        {children}
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  )
}
