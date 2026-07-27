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
import { motion, useScroll, useTransform, useSpring, useReducedMotion, AnimatePresence } from 'framer-motion'
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
import { useScrollProgressScaleX } from '@/hooks/use-scroll-progress'

type NavItem = {
  href: string
  label: string
  icon: typeof BookOpen
  accessKey?: string
}

const NAV: NavItem[] = [
  { href: '/', label: 'خانه', icon: BookOpen, accessKey: 'h' },
  { href: '/library', label: 'کتابخانه', icon: Library, accessKey: 'l' },
  { href: '/authors', label: 'نویسندگان', icon: Feather, accessKey: 'a' },
  { href: '/blog', label: 'بلاگ', icon: FileText, accessKey: 'g' },
  { href: '/vocabulary', label: 'واژگان', icon: BookMarked, accessKey: 'v' },
  { href: '/dashboard', label: 'داشبورد', icon: Sparkles, accessKey: 'd' },
  { href: '/leaderboard', label: 'لیدربورد', icon: BarChart3, accessKey: 'b' },
]

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg'

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const { data: session } = useSession()
  const prefersReduced = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredNav, setHoveredNav] = useState<string | null>(null)

  const progressBarRef = useRef<HTMLDivElement>(null)
  useScrollProgressScaleX(progressBarRef, 'right')
  useEffect(() => setMounted(true), [])

  const user = session?.user
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER'

  // Lock body scroll when search overlay is open
  useEffect(() => {
    if (searchOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [searchOpen])

  // Keyboard shortcut: "/" to focus search, Escape to close
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

  // Continuous fluid water-drop / blob spring physics linked to scroll
  const { scrollY } = useScroll()

  // Water-drop spring config with subtle organic bounce
  const springConfig = prefersReduced
    ? { stiffness: 1000, damping: 50 }
    : { stiffness: 180, damping: 16, mass: 0.6 }

  const scrollProgress = useTransform(scrollY, [0, 100], [0, 1])
  const scrollSpring = useSpring(scrollProgress, springConfig)

  // Fluid dynamic properties based on scroll position
  const headerHeight = useTransform(scrollSpring, [0, 1], [74, 58])
  const logoScale = useTransform(scrollSpring, [0, 1], [1.05, 0.92])
  const containerMarginTop = useTransform(scrollSpring, [0, 1], [10, 14])
  const shadowIntensity = useTransform(
    scrollSpring,
    [0, 1],
    ['0 8px 30px rgba(0,0,0,0.08)', '0 16px 40px rgba(0,0,0,0.22)']
  )

  return (
    <>
      {/* Fixed top container shell with smooth floating margin */}
      <motion.div
        style={{ paddingTop: containerMarginTop }}
        className="fixed top-0 inset-x-0 z-50 pointer-events-none px-3 sm:px-6"
      >
        <motion.header
          role="banner"
          aria-label="سرصفحه اصلی"
          style={{ boxShadow: shadowIntensity }}
          className={cn(
            'pointer-events-auto no-select mx-auto w-full transition-all duration-300 relative',
            'max-w-6xl lg:max-w-7xl',
            'rounded-2xl sm:rounded-3xl border border-gold-500/35 dark:border-gold-400/30',
            'bg-background/80 dark:bg-card/85 backdrop-blur-2xl backdrop-saturate-180',
            'ring-1 ring-gold-500/25 dark:ring-gold-400/25',
            // 360-degree ambient perimeter glow ring wrapping the whole header
            'before:absolute before:-inset-[1.5px] before:rounded-[inherit] before:bg-gradient-to-r before:from-gold-400/35 before:via-amber-500/25 before:to-gold-600/35 before:-z-10 before:blur-[2px] before:opacity-90',
            'after:absolute after:-inset-1 after:rounded-[inherit] after:bg-gradient-to-b after:from-gold-500/10 after:to-transparent after:-z-20 after:blur-md'
          )}
        >
          {/* Scroll progress bar — glowing 360-aware gold line at top perimeter */}
          <div
            className="absolute inset-x-0 top-0 z-50 h-[2.5px] overflow-hidden rounded-t-2xl sm:rounded-t-3xl"
            aria-hidden
          >
            <div
              ref={progressBarRef}
              className="h-full bg-gradient-to-l from-gold-400 via-gold-500 to-amber-500 shadow-[0_0_12px_rgba(234,179,8,0.95)]"
              style={{ transform: 'scaleX(0)', transformOrigin: 'right' }}
            />
          </div>

          <motion.div
            style={{ height: headerHeight }}
            className="mx-auto flex items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6"
          >
            {/* Brand */}
            <Link
              href="/"
              accessKey="h"
              aria-label="کتاب‌یار — خانه"
              title="کتاب‌یار — خانه (Alt+H)"
              className={cn('group flex items-center gap-3', FOCUS_RING)}
            >
              <motion.span
                style={{ scale: logoScale }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                aria-hidden="true"
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-2xl',
                  'bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 text-white',
                  'shadow-lg shadow-gold-500/35 ring-1 ring-gold-300/40',
                  'will-change-transform'
                )}
              >
                <BookOpen className="h-5 w-5" strokeWidth={2.2} />
              </motion.span>
              <motion.span
                className="font-extrabold tracking-tight text-foreground origin-right will-change-transform text-xl sm:text-2xl"
                style={{ fontFamily: 'var(--font-vazirmatn), system-ui' }}
              >
                کتاب‌یار
              </motion.span>
            </Link>

            {/* Desktop Navigation with Animated Glowing Active Pill + Glowing Bottom Line */}
            <nav
              role="navigation"
              aria-label="ناوبری اصلی"
              className="hidden items-center gap-1 md:flex"
              onMouseLeave={() => setHoveredNav(null)}
            >
              {NAV.map((item) => {
                const active =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href)
                const Icon = item.icon
                const isHovered = hoveredNav === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    accessKey={item.accessKey}
                    aria-current={active ? 'page' : undefined}
                    onMouseEnter={() => setHoveredNav(item.href)}
                    title={
                      item.accessKey
                        ? `${item.label} (Alt+${item.accessKey.toUpperCase()})`
                        : item.label
                    }
                    className={cn(
                      'group relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl',
                      'text-sm font-bold transition-colors duration-200',
                      FOCUS_RING,
                      active
                        ? 'text-primary dark:text-gold-400'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {/* Hover indicator background pill */}
                    {isHovered && !active && (
                      <motion.span
                        layoutId={prefersReduced ? undefined : 'header-hover-pill'}
                        className="absolute inset-0 rounded-xl bg-accent/70 dark:bg-white/10 -z-10"
                        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                      />
                    )}

                    {/* Active tab background pill & glowing bottom accent line */}
                    {active && (
                      <>
                        <motion.span
                          layoutId={prefersReduced ? undefined : 'header-active-pill'}
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-gold-500/20 via-amber-500/20 to-gold-600/15 dark:from-gold-400/25 dark:to-amber-500/20 border border-gold-500/40 dark:border-gold-400/40 -z-10 shadow-sm shadow-gold-500/20"
                          transition={{ type: 'spring', stiffness: 360, damping: 26, mass: 0.7 }}
                        />
                        <motion.span
                          layoutId={prefersReduced ? undefined : 'header-active-line'}
                          className="absolute bottom-0 inset-x-2 h-[3px] rounded-full bg-gradient-to-r from-gold-400 via-gold-500 to-amber-400 shadow-[0_0_12px_rgba(234,179,8,1)]"
                          transition={{ type: 'spring', stiffness: 360, damping: 26, mass: 0.7 }}
                        />
                      </>
                    )}

                    <Icon
                      aria-hidden="true"
                      className={cn(
                        'h-4 w-4 transition-transform group-hover:scale-110',
                        active && 'text-gold-500 dark:text-gold-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.6)]'
                      )}
                    />
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Right-side actions — search + theme + auth */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Search button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="جستجو (/)"
                title="جستجو (/)"
                onClick={() => setSearchOpen(true)}
                className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/60"
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
                className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/60"
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
                      <Avatar className="h-8 w-8">
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
                <motion.button
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                  className="group relative inline-flex items-center gap-2 px-4 h-9 sm:h-10 rounded-full font-bold text-xs sm:text-sm overflow-hidden"
                  aria-label="ورود با گوگل"
                  whileHover={prefersReduced ? undefined : { scale: 1.04 }}
                  whileTap={prefersReduced ? undefined : { scale: 0.96 }}
                  style={{
                    background:
                      'linear-gradient(135deg, #b8956a 0%, #8a6847 50%, #6d523a 100%)',
                    color: '#fff',
                    boxShadow: '0 4px 14px rgba(138, 104, 71, 0.35)',
                  }}
                >
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
                </motion.button>
              ) : (
                <div className="h-9 w-20" />
              )}
            </div>
          </motion.div>
        </motion.header>
      </motion.div>

      {/* Spacer so page content starts cleanly below the fixed header */}
      <div className="h-20 sm:h-24" />

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

