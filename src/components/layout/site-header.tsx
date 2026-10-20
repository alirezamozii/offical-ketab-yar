import Link from 'next/link'
import { BarChart3, BookMarked, BookOpen, Feather, FileText, Library, MoreHorizontal, Quote, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SiteHeaderControls } from '@/components/layout/site-header-controls'
import { SiteHeaderRuntime } from '@/components/layout/site-header-runtime'

const PRIMARY = [
  { href: '/', label: 'خانه', icon: BookOpen, accessKey: 'h' },
  { href: '/library', label: 'کتابخانه', icon: Library, accessKey: 'l' },
  { href: '/quotes', label: 'کوت‌ها', icon: Quote, accessKey: 'q' },
  { href: '/authors', label: 'نویسندگان', icon: Feather, accessKey: 'a' },
  { href: '/blog', label: 'بلاگ', icon: FileText, accessKey: 'g' },
  { href: '/dashboard', label: 'داشبورد', icon: Sparkles, accessKey: 'd' },
] as const

const SECONDARY = [
  { href: '/vocabulary', label: 'واژگان', icon: BookMarked, accessKey: 'v' },
  { href: '/leaderboard', label: 'لیدربورد', icon: BarChart3, accessKey: 'b' },
] as const

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg'

function NavLink({ item }: { item: (typeof PRIMARY)[number] | (typeof SECONDARY)[number] }) {
  const Icon = item.icon
  return (
    <Link href={item.href} prefetch={false} accessKey={item.accessKey} data-nav-href={item.href} title={`${item.label} (Alt+${item.accessKey.toUpperCase()})`} className={cn('group relative flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-muted-foreground transition-colors duration-200 hover:text-foreground lg:text-sm data-[active=true]:text-gold-600 dark:data-[active=true]:text-gold-400', FOCUS_RING)}>
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110 group-data-[active=true]:text-gold-500 dark:group-data-[active=true]:text-gold-400" />
      <span className="relative z-10">{item.label}</span>
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-2 -bottom-px h-[2.5px] origin-center scale-x-0 overflow-hidden rounded-t-full bg-gradient-to-l from-gold-400 via-gold-500 to-gold-700 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:scale-x-100 group-data-[active=true]:scale-x-100" />
    </Link>
  )
}

export function SiteHeader() {
  return (
    <>
      <SiteHeaderRuntime />
      <div className="fixed inset-x-0 top-0 z-[100] h-1 pointer-events-none" aria-hidden="true">
        <div id="site-scroll-progress" className="h-full w-full origin-right scale-x-0 bg-gradient-to-l from-gold-400 via-gold-500 to-gold-700 will-change-transform" />
      </div>
      <div id="site-header-shell" className="site-shell-header fixed inset-x-0 top-0 z-50 translate-y-0 px-0 pt-0 opacity-100 pointer-events-none transition-all duration-300 ease-[var(--ease-out-expo)] motion-reduce:transition-none data-[scrolled=true]:px-3 data-[scrolled=true]:pt-2 sm:data-[scrolled=true]:px-6 sm:data-[scrolled=true]:pt-4">
        <header id="site-header" aria-label="سرصفحه اصلی" className="pointer-events-auto no-select mac-glass-header relative mx-auto flex h-16 w-full items-center justify-between overflow-hidden rounded-none border-0 border-b border-gold-500/20 px-4 transition-all duration-300 ease-[var(--ease-out-expo)] motion-reduce:transition-none dark:border-border/40 sm:h-20 sm:px-10 data-[scrolled=true]:max-w-5xl data-[scrolled=true]:rounded-2xl data-[scrolled=true]:border data-[scrolled=true]:border-gold-500/35 data-[scrolled=true]:px-4 data-[scrolled=true]:shadow-lg dark:data-[scrolled=true]:border-gold-500/20 sm:data-[scrolled=true]:rounded-[36px] sm:data-[scrolled=true]:px-8 lg:data-[scrolled=true]:max-w-6xl">
          <Link href="/" prefetch={false} aria-label="بوکزی — خانه" title="بوکزی — زیست‌بومِ کتاب‌های دوزبانه" className={cn('group flex shrink-0 items-center gap-2.5 sm:gap-3', FOCUS_RING)}>
            <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 text-white shadow-md shadow-gold-500/30 ring-1 ring-gold-400/30 sm:h-11 sm:w-11 sm:rounded-2xl"><BookOpen className="h-4.5 w-4.5 sm:h-5.5 sm:w-5.5" strokeWidth={2.2} /></span>
            <span className="text-lg font-extrabold tracking-tight text-foreground sm:text-2xl" style={{ fontFamily: 'var(--font-vazirmatn), system-ui' }}>بوکزی</span>
          </Link>
          <nav aria-label="ناوبری اصلی" className="hidden items-center gap-1.5 md:flex">
            {PRIMARY.map((item) => <NavLink key={item.href} item={item} />)}
            <div className="hidden lg:contents">{SECONDARY.map((item) => <NavLink key={item.href} item={item} />)}</div>
            <details className="group relative lg:hidden">
              <summary className="flex cursor-pointer list-none items-center gap-1 rounded-lg px-2 py-2 text-xs font-bold text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden"><MoreHorizontal aria-hidden="true" className="h-4 w-4" />بیشتر</summary>
              <div className="absolute end-0 top-full mt-2 min-w-36 rounded-xl border border-border/70 bg-popover p-1.5 shadow-xl">{SECONDARY.map((item) => <NavLink key={item.href} item={item} />)}</div>
            </details>
          </nav>
          <SiteHeaderControls />
        </header>
      </div>
      <div className="h-16 shrink-0 sm:h-20" aria-hidden="true" />
    </>
  )
}
