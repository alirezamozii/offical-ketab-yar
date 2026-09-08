'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  BookMarked,
  BookOpen,
  Feather,
  FileText,
  Library,
  Moon,
  Quote,
  Search,
  Sparkles,
  Sun,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useThemeToggle } from '@/hooks/use-theme-toggle'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useScrollDirection } from '@/hooks/use-scroll-direction'
import { useScrollProgressScaleX } from '@/hooks/use-scroll-progress'
import { SiteHeaderAuth } from '@/components/layout/site-header-auth'

const SiteHeaderMore = dynamic(
  () => import('./site-header-more').then((m) => m.SiteHeaderMore),
  { ssr: false },
)

const HeaderSearchModal = dynamic(
  () => import('./header-search-modal').then((m) => m.HeaderSearchModal),
  { ssr: false },
)

type NavItem = {
  href: string
  label: string
  icon: typeof BookOpen
  accessKey?: string
}

const NAV_PRIMARY: NavItem[] = [
  { href: '/', label: 'خانه', icon: BookOpen, accessKey: 'h' },
  { href: '/library', label: 'کتابخانه', icon: Library, accessKey: 'l' },
  { href: '/quotes', label: 'کوت‌ها', icon: Quote, accessKey: 'q' },
  { href: '/authors', label: 'نویسندگان', icon: Feather, accessKey: 'a' },
  { href: '/blog', label: 'بلاگ', icon: FileText, accessKey: 'g' },
  { href: '/dashboard', label: 'داشبورد', icon: Sparkles, accessKey: 'd' },
]

const NAV_SECONDARY: NavItem[] = [
  { href: '/vocabulary', label: 'واژگان', icon: BookMarked, accessKey: 'v' },
  { href: '/leaderboard', label: 'لیدربورد', icon: BarChart3, accessKey: 'b' },
]

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg'


function useHeaderSearchShortcut(searchOpen: boolean, setSearchOpen: (open: boolean) => void) {
  useEffect(() => {
    document.body.style.overflow = searchOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [searchOpen])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === '/' &&
        !searchOpen &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searchOpen, setSearchOpen])
}

// fallow-ignore-next-line complexity
export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { toggleTheme } = useThemeToggle()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Track scroll state: threshold 24px for shrink into floating mac-glass pill
  const { scrolled } = useScrollDirection(24, 120, 12)

  const progressBarRef = useRef<HTMLDivElement>(null)
  useScrollProgressScaleX(progressBarRef, 'right')

  useHeaderSearchShortcut(searchOpen, setSearchOpen)

  function submitSearch(e?: React.FormEvent) {
    e?.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    setSearchOpen(false)
    setSearchQuery('')
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  const renderNavLink = (item: NavItem) => {
    const active =
      item.href === '/'
        ? pathname === '/'
        : pathname.startsWith(item.href)
    const Icon = item.icon
    
    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch={false}
        accessKey={item.accessKey}
        aria-current={active ? 'page' : undefined}
        title={
          item.accessKey
            ? `${item.label} (Alt+${item.accessKey.toUpperCase()})`
            : item.label
        }
        className={cn(
          'group relative flex items-center gap-1.5 px-3 py-2',
          'text-xs lg:text-sm font-bold transition-colors duration-200',
          FOCUS_RING,
          active
            ? 'text-gold-600 dark:text-gold-400'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Icon
          aria-hidden="true"
          className={cn(
            'h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110',
            active && 'text-gold-500 dark:text-gold-400'
          )}
        />
        <span className="relative z-10">{item.label}</span>
        {/* Underline indicator with tiny light spark sweep */}
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-x-2 -bottom-px h-[2.5px] overflow-hidden rounded-t-full',
            'transition-transform duration-300 ease-[var(--ease-out-expo)]',
            active
              ? 'scale-x-100'
              : 'scale-x-0 group-hover:scale-x-100',
          )}
          style={{ transformOrigin: 'center' }}
        >
          {/* Gold gradient line */}
          <span className="absolute inset-0 bg-gradient-to-l from-gold-400 via-gold-500 to-gold-700" />

          {/* Tiny light spark sweep on hover */}
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/80 to-transparent transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-full" />
        </span>
      </Link>
    )
  }

  const secondaryActive = NAV_SECONDARY.some((item) =>
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
  )

  return (
    <>
      {/* Linear scroll progress bar at the very top of the screen */}
      <div className="fixed top-0 inset-x-0 z-[100] h-1 pointer-events-none" aria-hidden="true">
        <div
          ref={progressBarRef}
          className="h-full w-full bg-gradient-to-l from-gold-400 via-gold-500 to-gold-700"
          style={{ willChange: 'transform', transform: 'scaleX(0)', transformOrigin: 'right' }}
        />
      </div>

      {/* Fixed top container shell */}
      <div
        className={cn(
          'fixed top-0 inset-x-0 z-50 pointer-events-none transition-all duration-300 ease-[var(--ease-out-expo)] motion-reduce:transition-none',
          'translate-y-0 opacity-100',
          scrolled ? 'px-3 sm:px-6 pt-2 sm:pt-4' : 'px-0 pt-0'
        )}
      >
        <header
          role="banner"
          aria-label="سرصفحه اصلی"
          className={cn(
            'pointer-events-auto no-select mx-auto w-full relative flex items-center justify-between overflow-hidden mac-glass-header',
            'h-16 sm:h-20 transition-all duration-300 ease-[var(--ease-out-expo)] motion-reduce:transition-none will-change-[max-width,padding,border-radius,box-shadow]',
            scrolled
              ? 'max-w-5xl lg:max-w-6xl rounded-2xl sm:rounded-[36px] border border-gold-500/35 dark:border-gold-500/20 shadow-lg px-4 sm:px-8'
              : 'w-full rounded-none border-0 border-b border-gold-500/20 dark:border-border/40 px-4 sm:px-10'
          )}
        >
          {/* Brand */}
          <Link
            href="/"
            prefetch={false}
            aria-label="بوکزی — خانه"
            title="بوکزی — زیست‌بومِ کتاب‌های دوزبانه"
            className={cn('group flex items-center gap-2.5 sm:gap-3 shrink-0', FOCUS_RING)}
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex items-center justify-center',
                'bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 text-white',
                'shadow-md shadow-gold-500/30 ring-1 ring-gold-400/30',
                'h-9 w-9 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl'
              )}
            >
              <BookOpen className="h-4.5 w-4.5 sm:h-5.5 sm:w-5.5" strokeWidth={2.2} />
            </span>
            <span
              className="font-extrabold tracking-tight text-foreground text-lg sm:text-2xl"
              style={{ fontFamily: 'var(--font-vazirmatn), system-ui' }}
            >
              بوکزی
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            role="navigation"
            aria-label="ناوبری اصلی"
            className="hidden items-center gap-1.5 md:flex"
          >
            {NAV_PRIMARY.map(renderNavLink)}

            <div className="hidden lg:contents">
              {NAV_SECONDARY.map(renderNavLink)}
            </div>

            <div className="lg:hidden">
              <SiteHeaderMore items={NAV_SECONDARY} />
            </div>
          </nav>

          {/* Right-side actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="جستجو (/)"
              title="جستجو (/)"
              onClick={() => setSearchOpen(true)}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/60"
            >
              <Search aria-hidden="true" className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </Button>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="تغییر تم روشن/تاریک"
              title="تغییر تم روشن/تاریک"
              onClick={(e) => toggleTheme(e)}
              className="h-8 w-8 sm:h-9 sm:w-9 relative rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/60"
            >
              <Sun aria-hidden="true" className="h-4.5 w-4.5 sm:h-5 sm:w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon aria-hidden="true" className="absolute h-4.5 w-4.5 sm:h-5 sm:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* User Dropdown / Auth */}
            <SiteHeaderAuth />
          </div>
        </header>
      </div>

      {/* Static Spacer — matches the header height on mobile and desktop */}
      <div className="h-16 sm:h-20 shrink-0" aria-hidden="true" />

      {/* Search overlay */}
      {searchOpen && (
        <HeaderSearchModal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          query={searchQuery}
          setQuery={setSearchQuery}
          onSubmit={submitSearch}
        />
      )}
    </>
  )
}
