import Link from 'next/link'
import { Feather, Home, Languages, LayoutDashboard, Library, Quote, type LucideIcon } from 'lucide-react'
import { BottomNavRuntime } from '@/components/layout/bottom-nav-runtime'
import { BottomNavContinue } from '@/components/layout/bottom-nav-continue'

const ITEMS: Array<{ href: string; label: string; icon: LucideIcon; badge?: boolean }> = [
  { href: '/', label: 'خانه', icon: Home },
  { href: '/library', label: 'کتاب‌ها', icon: Library },
  { href: '/authors', label: 'نویسندگان', icon: Feather },
  { href: '/vocabulary', label: 'واژگان', icon: Languages },
  { href: '/quotes', label: 'کوت‌ها', icon: Quote },
  { href: '/dashboard', label: 'داشبورد', icon: LayoutDashboard, badge: true },
]

function Item({ item }: { item: (typeof ITEMS)[number] }) {
  const Icon = item.icon
  return (
    <li className="flex-1">
      <div className="gpu h-full motion-safe:active:scale-[0.92] motion-safe:transition-transform duration-150">
        <Link href={item.href} prefetch={false} data-nav-href={item.href} aria-label={item.label} title={item.label} className="group relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-lg py-1.5 text-[9px] font-medium text-muted-foreground transition-colors duration-200 no-tap-highlight touch-manipulation tap-target data-[active=true]:text-primary sm:text-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="relative flex h-7 w-10 items-center justify-center sm:h-8">
            <span aria-hidden="true" className="absolute inset-0 scale-90 rounded-xl bg-primary/0 transition-all duration-300 group-data-[active=true]:scale-100 group-data-[active=true]:bg-primary/15 motion-reduce:transition-none" />
            <Icon aria-hidden="true" className="relative h-[18px] w-[18px] sm:h-5 sm:w-5" />
            {item.badge && <span id="bottom-nav-due-badge" hidden className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold leading-none text-white ring-2 ring-background" />}
          </span>
          <span className="relative leading-none">{item.label}</span>
        </Link>
      </div>
    </li>
  )
}

export function BottomNav() {
  return (
    <nav data-bottom-nav data-hidden="false" aria-label="ناوبری پایین — دسترسی سریع به بخش‌های اصلی" className="no-select fixed inset-x-0 bottom-0 z-40 pb-safe transition-all duration-300 ease-out motion-reduce:transition-none data-[hidden=true]:pointer-events-none data-[hidden=true]:translate-y-full data-[hidden=true]:opacity-0 md:hidden">
      <BottomNavRuntime />
      <div className="relative mx-auto max-w-md px-3 pb-2">
        <ul className="relative flex items-stretch justify-around rounded-[26px] border border-border/60 bg-background/95 px-1.5 shadow-[0_10px_32px_rgba(0,0,0,0.22)]">
          {ITEMS.slice(0, 3).map((item) => <Item key={item.href} item={item} />)}
          {/* Spacer reserving the center slot; the dock itself is positioned
              absolutely at the UL's true center (left-1/2 + negative margin —
              RTL-safe, no translate), independent of item distribution.
              Width 72px > 56px circle + 2×4px ring so it never touches the
              neighboring icons. */}
          <li className="w-18 shrink-0" aria-hidden="true" />
          {ITEMS.slice(3).map((item) => <Item key={item.href} item={item} />)}
          <BottomNavContinue />
        </ul>
      </div>
    </nav>
  )
}
