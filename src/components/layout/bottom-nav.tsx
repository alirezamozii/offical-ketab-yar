'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Home,
  Library,
  Languages,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { useScrollDirection } from '@/hooks/use-scroll-direction'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { useLastReadBook } from '@/hooks/reader/use-last-read-book'

/**
 * BottomNav — mobile-only floating bottom navigation.
 *
 * Per user feedback (latest revision):
 *   • All header items move to the bottom nav (except Search + Theme toggle,
 *     which stay in the header). So the bottom nav now has:
 *     Home / Library / [ORB] / Vocabulary / Dashboard
 *   • The center orb is renamed to «ادامه» (Continue):
 *     - Shows the LAST READ book's cover colors (as a mini cover preview)
 *     - Tapping opens the reader at the last position
 *     - If no book has been started → no orb (just 5 nav items, no center)
 *   • Brand name + logo stay in the header (not duplicated here).
 */

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  accessKey?: string
  badgeKey?: 'dueReviews'
}

// 5 nav items (the orb sits in the middle, between Library and Vocabulary).
// Per user feedback: "هرپی که تو دسنکاناپ اون بالا هست بیاد پایین تو نو
// به جز سرچ و تم عوض کردن". So we have: Home, Library, [orb], Vocabulary,
// Dashboard.
const ITEMS_LEFT: NavItem[] = [
  { href: '/', label: 'خانه', icon: Home, accessKey: 'h' },
  { href: '/library', label: 'کتابخانه', icon: Library, accessKey: 'l' },
]

const ITEMS_RIGHT: NavItem[] = [
  { href: '/vocabulary', label: 'واژگان', icon: Languages, accessKey: 'v' },
  { href: '/dashboard', label: 'داشبورد', icon: LayoutDashboard, accessKey: 'd', badgeKey: 'dueReviews' },
]

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg'

function useDueReviewCount(): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const compute = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.srs)
        if (!raw) return 0
        const map = JSON.parse(raw) as Record<
          string,
          { nextReview?: number; box?: number }
        >
        const now = Date.now()
        let due = 0
        for (const v of Object.values(map)) {
          if (v && typeof v.nextReview === 'number' && v.nextReview <= now) {
            due++
          }
        }
        return due
      } catch {
        return 0
      }
    }
    setCount(compute())
    const onChange = () => setCount(compute())
    window.addEventListener('ky_srs:change', onChange as EventListener)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener('ky_srs:change', onChange as EventListener)
      window.removeEventListener('storage', onChange)
    }
  }, [])
  return count
}

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const prefersReduced = useReducedMotion()
  const { toPersianDigits } = usePersianLocale()
  const { hidden } = useScrollDirection(8, 120)
  const dueCount = useDueReviewCount()
  const { book: lastReadBook, loading: lastReadLoading } = useLastReadBook()

  const isReaderRoute = pathname.startsWith('/books/read')
  const shouldHide = isReaderRoute || hidden

  const triggerHaptic = useCallback(() => {
    if (prefersReduced) return
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8)
      } catch {
        /* no-op */
      }
    }
  }, [prefersReduced])

  // Center orb → resume the last-read book (if any).
  const handleFabClick = useCallback(() => {
    if (!lastReadBook) return
    triggerHaptic()
    router.push(`/books/read/${lastReadBook.slug}`)
  }, [router, lastReadBook, triggerHaptic])

  const showOrb = !lastReadLoading && lastReadBook !== null

  const renderItem = (item: NavItem) => {
    const active =
      item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
    const Icon = item.icon
    const showBadge =
      item.badgeKey === 'dueReviews' && dueCount > 0
    return (
      <li key={item.href} className="flex-1">
        <motion.div
          aria-hidden="true"
          whileTap={prefersReduced ? undefined : { scale: 0.92 }}
          transition={
            prefersReduced
              ? { duration: 0 }
              : { type: 'spring', stiffness: 500, damping: 30 }
          }
          className="gpu h-full"
        >
          <Link
            href={item.href}
            accessKey={item.accessKey}
            aria-current={active ? 'page' : undefined}
            aria-label={
              showBadge
                ? `${item.label}، ${toPersianDigits(dueCount)} مرور سررسید`
                : item.label
            }
            title={
              item.accessKey
                ? `${item.label} (Alt+${item.accessKey.toUpperCase()})`
                : item.label
            }
            onClick={triggerHaptic}
            className={cn(
              'relative flex min-h-[56px] flex-col items-center justify-center gap-1 py-1.5',
              'no-tap-highlight touch-manipulation tap-target',
              'text-[10px] font-medium transition-colors duration-200 sm:text-[11px]',
              FOCUS_RING,
              active ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <span className="relative flex h-7 w-12 items-center justify-center sm:h-8">
              {active && (
                <motion.span
                  aria-hidden="true"
                  layoutId={
                    prefersReduced
                      ? undefined
                      : 'bottom-nav-active-pill'
                  }
                  className="absolute inset-0 rounded-xl bg-primary/15"
                  transition={
                    prefersReduced
                      ? { duration: 0 }
                      : {
                          type: 'spring',
                          stiffness: 380,
                          damping: 30,
                          mass: 0.8,
                        }
                  }
                />
              )}
              <Icon aria-hidden="true" className="relative h-[18px] w-[18px] sm:h-5 sm:w-5" />
              {showBadge && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute -right-0.5 -top-0.5',
                    'flex h-4 min-w-4 items-center justify-center',
                    'rounded-full bg-destructive px-1',
                    'text-[9px] font-bold leading-none text-white',
                    'ring-2 ring-background',
                  )}
                >
                  {toPersianDigits(dueCount > 99 ? 99 : dueCount)}
                </span>
              )}
            </span>
            <span className="relative leading-none">{item.label}</span>
          </Link>
        </motion.div>
      </li>
    )
  }

  return (
    <AnimatePresence>
      {!shouldHide && (
        <motion.nav
          role="navigation"
          aria-label="ناوبری پایین — دسترسی سریع به بخش‌های اصلی"
          initial={prefersReduced ? false : { y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={prefersReduced ? { opacity: 0 } : { y: 80, opacity: 0 }}
          transition={
            prefersReduced
              ? { duration: 0.12 }
              : { type: 'spring', stiffness: 500, damping: 36, mass: 0.7 }
          }
          className={cn(
            'no-select fixed inset-x-0 bottom-0 z-40 md:hidden',
            'pb-safe',
          )}
        >
          <div className="relative mx-auto max-w-md px-2">
            {/* ─── Center orb — «ادامه» (Continue) ───
                Per user feedback: "اورب تو توبار اسمش باید بشه ادامه" +
                "اون ادامه عکس پلی بیاد" — the orb is now called «ادامه»
                and shows a MINI BOOK COVER PREVIEW (using the same gradient
                + spine + frame as the real BookCover component) so it
                reads as "continue reading this book", not just a colored
                circle. Tapping opens the reader at the last position. */}
            {showOrb && lastReadBook && (
              <motion.button
                type="button"
                onClick={handleFabClick}
                aria-label={`ادامه مطالعه ${lastReadBook.title} — ${lastReadBook.percent}٪ پیش رفته است`}
                title={`ادامه ${lastReadBook.title}`}
                whileTap={prefersReduced ? undefined : { scale: 0.92 }}
                transition={
                  prefersReduced
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 600, damping: 25 }
                }
                className={cn(
                  'absolute left-1/2 -top-7 z-10 -translate-x-1/2',
                  'flex h-16 w-12 flex-col items-stretch',
                  'overflow-hidden rounded-md shadow-xl ring-2 ring-background',
                  'transition-shadow hover:shadow-2xl',
                  'no-callout no-tap-highlight touch-manipulation tap-target',
                  FOCUS_RING,
                )}
                style={{
                  // Use the book's cover gradient — same as BookCover.tsx.
                  background: `linear-gradient(150deg, ${lastReadBook.coverFrom} 0%, ${lastReadBook.coverTo} 100%)`,
                  boxShadow: `0 10px 25px -5px ${lastReadBook.coverFrom}99, 0 0 0 1px ${lastReadBook.coverAccent}40`,
                }}
              >
                {/* Spine — darker right edge (bound side), like a real book */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 w-2"
                  style={{
                    background:
                      'linear-gradient(to left, rgba(0,0,0,0.7), rgba(0,0,0,0.25) 60%, transparent)',
                  }}
                />
                {/* Inner frame — accent-tinted, like BookCover */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-1 rounded border opacity-30"
                  style={{ borderColor: lastReadBook.coverAccent }}
                />
                {/* Centered book-open icon in white — small so the cover
                    colors stay the dominant visual. */}
                <span className="relative flex flex-1 items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="h-5 w-5 text-white/90 drop-shadow"
                  >
                    <path d="M12 7v14" />
                    <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
                  </svg>
                </span>
                {/* «ادامه» label below the mini cover */}
                <span className="relative bg-black/40 py-0.5 text-center text-[8px] font-bold leading-none text-white backdrop-blur-sm">
                  ادامه
                </span>
                <span className="sr-only">
                  ادامه مطالعه {lastReadBook.title}
                </span>
                {/* Soft pulsing glow — uses the book's accent color */}
                {!prefersReduced && (
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 rounded-md blur-md"
                    style={{ background: lastReadBook.coverAccent }}
                    animate={{ opacity: [0.2, 0.45, 0.2], scale: [1, 1.08, 1] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
              </motion.button>
            )}

            {/* ─── The bar itself ───
                5 items split around the center orb slot:
                [Home] [Library]   [orb slot]   [Vocabulary] [Dashboard]
                When there's no orb, the slot still takes space so the
                layout stays balanced. */}
            <ul
              className={cn(
                'flex items-stretch justify-around',
                'rounded-t-2xl border-t border-border/70',
                'bg-background/90 backdrop-blur-xl',
                'supports-[backdrop-filter]:bg-background/75',
                'shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.18)]',
              )}
            >
              {ITEMS_LEFT.map(renderItem)}
              {/* Center slot — reserved for the orb.
                  Width matches the orb (w-12 = 48px). The orb sits
                  *above* the bar (negative top), so this slot just keeps
                  the items from crowding the center. */}
              <li className="w-12 shrink-0" aria-hidden="true" />
              {ITEMS_RIGHT.map(renderItem)}
            </ul>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}
