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
import { useScrollDirection } from '@/hooks/use-scroll-direction'
import { useScrollProgressScaleX } from '@/hooks/use-scroll-progress'

/**
 * SiteHeader — redesigned per user feedback:
 *   • Apple-style glassmorphism (cleaner, more premium, not "too much")
 *   • Reduced nav items (removed Discovery, /search page link, duplicates)
 *   • Single search entry point — opens an inline search overlay
 *   • Renamed: داشبورد → داشبورد, مجموعه‌ها → پلی‌لیست
 *   • Shorter height (h-14 → h-12 on scroll)
 *   • Brand stays readable through the blur
 */

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
  // `scrolled` is a binary state (needs re-render for class swap) so we
  // keep using useScrollDirection for it. But the smooth progress bar is
  // now driven by the singleton useScrollProgressScaleX hook which
  // updates the DOM directly — no re-renders, no lag.
  // useScrollDirection with hysteresis (35px shrink threshold, 5px expand threshold)
  const { scrolled } = useScrollDirection(35, 120, 5)
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
      if (e.key === '/' && !searchOpen && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
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

  // Continuous progressive scroll-linked spring values (0px to 90px scroll)
  const { scrollY } = useScroll()

  const springConfig = prefersReduced
    ? { stiffness: 1000, damping: 50 }
    : { stiffness: 220, damping: 26, mass: 0.5 }

  const rawScrollProgress = useTransform(scrollY, [0, 90], [0, 1])
  const scrollSpring = useSpring(rawScrollProgress, springConfig)

  const headerHeight = useTransform(scrollSpring, [0, 1], [80, 64])
  const logoScale = useTransform(scrollSpring, [0, 1], [1.12, 0.94])
  const textScale = useTransform(scrollSpring, [0, 1], [1.06, 0.95])

  const borderRadius = useTransform(scrollSpring, [0, 1], ['0rem', '1.5rem'])
  const top = useTransform(scrollSpring, [0, 1], ['0rem', '1rem'])
  const width = useTransform(scrollSpring, [0, 1], ['calc(100% - 0rem)', 'calc(100% - 2rem)'])

  return (
    <>
      <motion.header
        role="banner"
        aria-label="سرصفحه اصلی"
        style={{
          borderRadius,
          top,
          width,
        }}
        className={cn(
          'no-select sticky z-40 mx-auto pt-safe border',
          'transition-[background-color,border-color,backdrop-filter,shadow] duration-400 ease-out-expo',
          'supports-[backdrop-filter]:bg-background/60 supports-[backdrop-filter]:backdrop-blur-xl',
          'supports-[backdrop-saturate]:backdrop-saturate-150',
          scrolled 
            ? 'bg-background/80 shadow-md shadow-black/5 border-border/40'
            : 'border-transparent border-b-border/40',
        )}
      >
        {/* Scroll progress bar — gold gradient at the very top */}
        <motion.div
          className="absolute inset-x-0 top-0 z-50 h-0.5 overflow-hidden"
          style={{
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
          }}
          aria-hidden
        >
          <div
            ref={progressBarRef}
            className="h-full bg-gradient-to-l from-gold-400 via-gold-500 to-gold-700"
            style={{ transform: 'scaleX(0)', transformOrigin: 'right' }}
          />
        </motion.div>

        <motion.div
          style={{ height: headerHeight }}
          className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6"
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
              whileHover={{ scale: 1.15 }}
              aria-hidden="true"
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-2xl',
                'bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 text-white',
                'shadow-md shadow-gold-500/30 ring-1 ring-gold-400/30',
                'will-change-transform',
              )}
            >
              <BookOpen className="h-5 w-5" strokeWidth={2.2} />
            </motion.span>
            <motion.span
              className="font-extrabold tracking-tight text-foreground origin-right will-change-transform text-xl sm:text-2xl"
              style={{ fontFamily: 'var(--font-vazirmatn), system-ui', scale: textScale }}
            >
              کتاب‌یار
            </motion.span>
          </Link>

          {/* Desktop nav (md+) — compact, 5 items only */}
          <nav
            role="navigation"
            aria-label="ناوبری اصلی"
            className="hidden items-center gap-0.5 md:flex"
          >
            {NAV.map((item) => {
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
                    'group relative flex items-center gap-2 px-4 py-2',
                    'text-base font-bold transition-[transform,opacity,colors,border-color,background-color] duration-200',
                    FOCUS_RING,
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform group-hover:scale-110"
                  />
                  {item.label}
                  {/* Underline indicator with tiny light spark sweep */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'pointer-events-none absolute inset-x-2 -bottom-px h-0.5 overflow-hidden rounded-t-full',
                      'transition-transform duration-300 ease-out-expo',
                      active
                        ? 'scale-x-100'
                        : 'scale-x-0 group-hover:scale-x-100',
                    )}
                    style={{ transformOrigin: 'center' }}
                  >
                    {/* Gold gradient line */}
                    <span className="absolute inset-0 bg-gradient-to-l from-gold-400 via-gold-500 to-gold-700 shadow-[0_0_8px_rgba(205,184,154,0.8)]" />

                    {/* Tiny light spark sweep on hover */}
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/80 to-transparent transition-transform duration-700 ease-out-expo group-hover:translate-x-full" />
                  </span>

                  {/* Ambient gold glow backdrop */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'pointer-events-none absolute inset-x-2 -bottom-0.5 h-1 rounded-full bg-gold-400/60 blur-[3px]',
                      'transition-opacity duration-300 ease-out-expo',
                      active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                    )}
                  />
                </Link>
              )
            })}
          </nav>

          {/* Right-side actions — search + theme + CTA */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Single search trigger (per user feedback: one search only,
                lives in the header). Opens an inline overlay. */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="جستجو (/)"
              title="جستجو (/)"
              onClick={() => setSearchOpen(true)}
              className="text-muted-foreground hover:text-foreground"
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

            {/* Auth — user dropdown when signed in, premium login button when
                signed out, and a same-size placeholder while mounting so the
                header doesn't shift on hydration. */}
            {mounted && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 rounded-full p-0.5 ring-offset-background transition-[transform,opacity,colors,border-color,background-color] hover:ring-2 hover:ring-ring/40"
                    aria-label="حساب کاربری"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image || ''} alt={user.name || 'user'} />
                      <AvatarFallback className="text-xs">
                        {(user.name || user.email || '?')[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
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
                className="group relative inline-flex items-center gap-2 px-5 h-11 rounded-full font-bold text-sm overflow-hidden"
                aria-label="ورود با گوگل"
                whileHover={prefersReduced ? undefined : { scale: 1.03 }}
                whileTap={prefersReduced ? undefined : { scale: 0.97 }}
                style={{
                  background:
                    'linear-gradient(135deg, #b8956a 0%, #8a6847 50%, #6d523a 100%)',
                  color: '#fff',
                  boxShadow: '0 4px 14px rgba(138, 104, 71, 0.35)',
                }}
              >
                {/* Glowing border ring — premium feel */}
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
                {/* Glow pulse on hover */}
                <span
                  className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    boxShadow: '0 0 20px rgba(184, 149, 106, 0.6), 0 0 40px rgba(184, 149, 106, 0.3)',
                  }}
                  aria-hidden="true"
                />
                {/* Shimmer sweep on hover — moved from the old "شروع مطالعه"
                    button per user feedback: "اون انمیشن که نور میده زیرش
                    اون بیا به ورود اضافه کن". A diagonal light band sweeps
                    from bottom-left to top-right on hover. */}
                <span
                  className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
                  aria-hidden="true"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-[1100ms] ease-out-expo group-hover:translate-x-full" />
                </span>
                <LogIn className="relative z-10 h-4 w-4" strokeWidth={2.5} />
                <span className="relative z-10">ورود</span>
              </motion.button>
            ) : (
              <div className="h-11 w-24" />
            )}

            {/* "شروع مطالعه" CTA — REMOVED per user feedback: "دکمه شرئغ
                مطلبغه پاک کن از هدر". The glow/shimmer animation that was
                under it is now on the ورود button instead. */}
          </div>
        </motion.div>
      </motion.header>

      {/* Search overlay — single, header-anchored search per user feedback.
          Slides down from the top with a soft animation. */}
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
