'use client'

/**
 * InstallPrompt — listens for the browser's `beforeinstallprompt` event and
 * shows a dismissible gold-themed banner offering to install the PWA.
 *
 * Frequency Constraint:
 *  - The prompt can ONLY appear AT MOST ONCE A DAY (every 24 hours).
 *  - When shown or dismissed, a 24-hour cooldown is recorded in localStorage.
 *  - Once installed (`appinstalled`), it is permanently suppressed.
 */

import { Download, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { prefetchBook } from '@/lib/book-prefetcher'

export const DISMISS_KEY = 'ky_pwa_install_dismissed'
export const LAST_SHOWN_KEY = 'ky_pwa_install_last_shown'
export const ONE_DAY_MS = 24 * 60 * 60 * 1000 // 24 hours (once a day limit)

/**
 * Minimal type for the `beforeinstallprompt` event.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function readDismissedAt(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    return raw ? Number(raw) || 0 : 0
  } catch {
    return 0
  }
}

export function writeDismissedAt(ts: number) {
  try {
    localStorage.setItem(DISMISS_KEY, String(ts))
  } catch {
    /* private mode / quota — ignore */
  }
}

export function readLastShownAt(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem(LAST_SHOWN_KEY)
    return raw ? Number(raw) || 0 : 0
  } catch {
    return 0
  }
}

export function writeLastShownAt(ts: number) {
  try {
    localStorage.setItem(LAST_SHOWN_KEY, String(ts))
  } catch {
    /* private mode / quota — ignore */
  }
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  // iOS Safari standalone
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  // @ts-expect-error — iOS Safari only
  if (window.navigator.standalone === true) return true
  return false
}

export function canShowInstallPrompt(now: number = Date.now()): boolean {
  if (isStandalone()) return false

  const dismissedAt = readDismissedAt()
  // Permanently hidden if installed
  if (dismissedAt >= Number.MAX_SAFE_INTEGER - 1000000) return false

  // If dismissed within the last 24 hours, don't show
  if (dismissedAt && now - dismissedAt < ONE_DAY_MS) return false

  // If shown within the last 24 hours, don't show again today (once a day rule)
  const lastShownAt = readLastShownAt()
  if (lastShownAt && now - lastShownAt < ONE_DAY_MS) return false

  return true
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // Check 24-hour rate limit on mount
    if (!canShowInstallPrompt()) return

    const onBeforeInstall = (e: Event) => {
      // Re-verify 24h limit before presenting UI
      if (!canShowInstallPrompt()) return

      // Suppress the browser's own minibar — we'll show our custom banner.
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)

      // Mark as shown today (24-hour throttle)
      writeLastShownAt(Date.now())
    }

    const onAppInstalled = () => {
      setVisible(false)
      setDeferred(null)
      // Permanently hide — the app is installed, no need to re-prompt.
      writeDismissedAt(Number.MAX_SAFE_INTEGER)
      toast.success('کتاب‌یار نصب شد!', {
        description: 'می‌توانید آن را از صفحه اصلی باز کنید.',
      })

      // Prefetch favorites in background for immediate offline availability
      try {
        const rawFavs = localStorage.getItem('ky_favorites')
        if (rawFavs) {
          const parsed = JSON.parse(rawFavs)
          const books = Object.values(parsed || {}) as any[]
          books.slice(0, 3).forEach((book) => {
            if (book.slug) {
              fetch(`/api/books/${book.slug}`)
                .then((res) => res.json())
                .then((data) => {
                  if (data && data.pageCount) {
                    prefetchBook(book.slug, book.title, data.pageCount)
                  }
                })
                .catch(() => {})
            }
          })
        }
      } catch (err) {
        console.error('Failed to prefetch favorites on install:', err)
      }
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferred) return
    setInstalling(true)
    try {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'dismissed') {
        // User dismissed the native prompt — record cooldown so it won't show again for 24h
        writeDismissedAt(Date.now())
        writeLastShownAt(Date.now())
        setVisible(false)
      }
      // `appinstalled` will fire if accepted; that handler permanently hides.
    } catch {
      toast.error('نصب ناموفق بود', {
        description: 'لطفاً از منوی مرورگر نصب را امتحان کنید.',
      })
    } finally {
      setDeferred(null)
      setInstalling(false)
    }
  }

  const handleDismiss = () => {
    writeDismissedAt(Date.now())
    writeLastShownAt(Date.now())
    setVisible(false)
  }

  if (!visible || !deferred) return null

  return (
    <div
      role="dialog"
      aria-label="نصب کتاب‌یار"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex justify-center px-3"
    >
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-gold-500/30 bg-background/95 p-3 shadow-lg-warm backdrop-blur-md">
        {/* Icon tile — gold gradient */}
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold-600 via-gold-500 to-gold-600 text-white shadow-md-warm"
        >
          <Download className="h-5 w-5" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1 text-right">
          <p className="text-sm font-bold leading-tight">
            کتاب‌یار را نصب کنید
          </p>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            دسترسی سریع و مطالعه آفلاین — مستقیم از صفحه اصلی
          </p>
        </div>

        <button
          type="button"
          onClick={handleInstall}
          disabled={installing}
          className="shrink-0 rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm-warm transition hover:from-gold-700 hover:to-gold-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {installing ? 'در حال نصب…' : 'نصب'}
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="بستن"
          className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
