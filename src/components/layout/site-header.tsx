'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  BookMarked,
  BookOpen,
  ChevronDown,
  Feather,
  FileText,
  Library,
  LogIn,
  LogOut,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  X,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnimatedGlowBorder } from '@/components/ui/animated-glow-border'
import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useScrollDirection } from '@/hooks/use-scroll-direction'
import { useScrollProgressScaleX } from '@/hooks/use-scroll-progress'

type NavItem = {
  href: string
  label: string
  icon: typeof BookOpen
  accessKey?: string
}

const NAV_PRIMARY: NavItem[] = [
  { href: '/', label: 'خانه', icon: BookOpen, accessKey: 'h' },
  { href: '/library', label: 'کتابخانه', icon: Library, accessKey: 'l' },
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


export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Track scroll state: threshold 20px for shrink, 5px expand
  const { scrolled } = useScrollDirection(20, 120, 5)
  
  const progressBarRef = useRef<HTMLDivElement>(null)
  useScrollProgressScaleX(progressBarRef, 'right')

  useEffect(() => setMounted(true), [])

  const user = session?.user
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER'

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
  }, [searchOpen])

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
      <div className="fixed top-0 inset-x-0 z-[100] h-1 pointer-events-none" aria-hidden>
        <div
          className="h-full w-full bg-gradient-to-l from-gold-400 via-gold-500 to-gold-700 progress-bar-gpu"
        />
      </div>

      {/* Fixed top container shell */}
      <div
        className={cn(
          'fixed top-0 inset-x-0 z-50 pointer-events-none',
          'transition-all duration-500 ease-[var(--ease-out-expo)]',
          scrolled ? 'px-4 sm:px-6 pt-3 sm:pt-4' : 'px-0 pt-0'
        )}
      >
        <header
          role="banner"
          aria-label="سرصفحه اصلی"
          className={cn(
            'pointer-events-auto no-select mx-auto w-full relative flex items-center justify-between overflow-hidden',
            'transition-all duration-500 ease-[var(--ease-out-expo)]',
            scrolled
              ? 'h-16 max-w-5xl lg:max-w-6xl rounded-[32px] bg-gold-500/20 dark:bg-gold-900/50 border border-gold-500/40 dark:border-gold-700/40 shadow-xl shadow-black/5 dark:shadow-black/40 px-5 sm:px-8 mac-glass-header'
              : 'h-20 max-w-full rounded-none bg-background/100 dark:bg-background/100 border-b border-border/20 px-6 sm:px-10'
          )}
        >
          {/* SVG Filter for Liquid Magnifying Glass */}
          <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
            <filter id="container-glass" x="-30%" y="-30%" width="160%" height="160%">
              <feImage href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><radialGradient id='g' cx='50%' cy='50%' r='50%'><stop offset='0%' stop-color='%23000000'/><stop offset='100%' stop-color='%23ffffff'/></radialGradient><rect width='200' height='200' fill='url(%23g)'/></svg>" result="lensMap" />
              <feDisplacementMap in="SourceGraphic" in2="lensMap" scale="-250" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </svg>
          {/* Brand */}
          <Link
            href="/"
            aria-label="کتاب‌یار — خانه"
            title="کتاب‌یار — خانه"
            className={cn('group flex items-center gap-3 shrink-0', FOCUS_RING)}
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex items-center justify-center rounded-2xl',
                'bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 text-white',
                'shadow-md shadow-gold-500/30 ring-1 ring-gold-400/30',
                'transition-all duration-500 ease-[var(--ease-out-expo)]',
                scrolled ? 'h-10 w-10 rounded-xl' : 'h-12 w-12'
              )}
            >
              <BookOpen className={cn(
                'transition-all duration-500 ease-[var(--ease-out-expo)]',
                scrolled ? 'h-5 w-5' : 'h-6 w-6'
              )} strokeWidth={2.2} />
            </span>
            <span
              className={cn(
                'font-extrabold tracking-tight text-foreground',
                'transition-all duration-500 ease-[var(--ease-out-expo)]',
                scrolled ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
              )}
              style={{ fontFamily: 'var(--font-vazirmatn), system-ui' }}
            >
              کتاب‌یار
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      'group relative flex items-center gap-1 px-3 py-1.5 rounded-full',
                      'text-xs font-semibold transition-colors duration-200',
                      FOCUS_RING,
                      secondaryActive
                        ? 'text-gold-700 dark:text-gold-300 bg-gold-500/15 ring-1 ring-gold-500/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                    )}
                    aria-label="بیشتر"
                  >
                    <ChevronDown className="h-4 w-4" />
                    <span>بیشتر</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-2xl backdrop-blur-xl">
                  {NAV_SECONDARY.map((item) => {
                    const active = pathname.startsWith(item.href)
                    const Icon = item.icon
                    return (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            'gap-2 cursor-pointer',
                            active && 'text-gold-600 dark:text-gold-400 font-bold'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>

          {/* Right-side actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="جستجو (/)"
              title="جستجو (/)"
              onClick={() => setSearchOpen(true)}
              className="rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/60"
            >
              <Search aria-hidden="true" className="h-5 w-5" />
            </Button>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              aria-label={
                mounted
                  ? resolvedTheme === 'dark'
                    ? 'تغییر به حالت روشن'
                    : 'تغییر به حالت تاریک'
                  : 'تغییر تم'
              }
              title="تغییر تم روشن/تاریک"
              onClick={() =>
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
              }
              className="rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/60"
            >
              {mounted ? (
                resolvedTheme === 'dark' ? (
                  <Sun aria-hidden="true" className="h-5 w-5" />
                ) : (
                  <Moon aria-hidden="true" className="h-5 w-5" />
                )
              ) : (
                <Sun aria-hidden="true" className="h-5 w-5 opacity-0" />
              )}
            </Button>

            {/* User Dropdown / Auth */}
            {mounted && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 rounded-full p-0.5 ring-offset-background transition-all hover:ring-2 hover:ring-ring/40"
                    aria-label="حساب کاربری"
                  >
                    <Avatar className="h-8 w-8 shadow-sm">
                      <AvatarImage src={user.image || ''} alt={user.name || 'user'} />
                      <AvatarFallback className="text-xs font-bold">
                        {(user.name || user.email || '?')[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl backdrop-blur-xl">
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="font-medium">{user.name || user.username || 'کاربر'}</span>
                    {user.email && (
                      <span className="text-xs text-muted-foreground font-normal" dir="ltr">
                        {user.email}
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      داشبورد
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="gap-2 cursor-pointer">
                        <ShieldCheck className="h-4 w-4" />
                        پنل مدیریت
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    خروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : mounted ? (
              <button
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="group relative inline-flex items-center gap-2 px-4 h-9 sm:h-10 rounded-full font-bold text-xs sm:text-sm overflow-hidden"
                aria-label="ورود با گوگل"
                style={{
                  background:
                    'linear-gradient(135deg, #b8956a 0%, #8a6847 50%, #6d523a 100%)',
                  color: '#fff',
                  boxShadow: '0 4px 14px rgba(138, 104, 71, 0.35)',
                }}
              >
                <AnimatedGlowBorder color="rgba(255,255,255,0.9)" thickness={2.5} />
                <span
                  className="absolute inset-0 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #cdb89a, #b8956a, #cdb89a)',
                    padding: '1.5px',
                    WebkitMask:
                      'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                  }}
                  aria-hidden="true"
                />
                <LogIn className="relative z-10 h-3.5 w-3.5" strokeWidth={2.5} />
                <span className="relative z-10">ورود</span>
              </button>
            ) : (
              <div className="h-9 w-20" />
            )}
          </div>
        </header>
      </div>

      {/* Static Spacer — exactly matches the unscrolled header height (80px).
          This prevents ANY layout shift or content jumping when scrolling. */}
      <div className="h-20 shrink-0" aria-hidden="true" />

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-20 w-full max-w-2xl px-4"
            >
              <form
                onSubmit={submitSearch}
                className="flex items-center gap-2 rounded-2xl border border-border bg-background/95 p-3 shadow-2xl backdrop-blur-xl"
              >
                <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-muted-foreground" />
                <input
                  type="search"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی کتاب، نویسنده یا ژانر…"
                  className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                  aria-label="جستجو"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="پاک کردن"
                    className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <Button type="submit" size="sm" variant="glow" disabled={!searchQuery.trim()}>
                  جستجو
                </Button>
              </form>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Enter بزنید تا به صفحه نتایج کامل برید · Escape برای بستن
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
