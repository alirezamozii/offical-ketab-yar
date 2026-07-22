'use client'

/**
 * InstallPrompt — listens for the browser's `beforeinstallprompt` event and
 * shows a dismissible gold-themed banner offering to install the PWA.
 *
 * ─── Why this exists ─────────────────────────────────────────────────────
 *
 * Audit 08 §D-6 flagged "no install prompt UX" as one of the PWA gaps.
 * Browsers show their own minibar / install-button UX, but a custom
 * in-app banner with explicit CTA gives a 3–5× install-rate boost
 * (see audit 11 §5 #14).
 *
 * ─── Behavior ────────────────────────────────────────────────────────────
 *
 *  1. On mount, register a `beforeinstallprompt` listener. The browser
 *     fires this event when its own heuristics decide the app is
 *     "installable" (engagement + manifest + SW + PNG icons — all of
 *     which this task sets up). We `preventDefault()` to suppress the
 *     minibar and show our own banner instead.
 *  2. The banner shows "کتاب‌یار را نصب کنید" with an install button
 *     ("نصب") and a dismiss (X) button. Dismissal is persisted to
 *     localStorage so we don't nag the user every session.
 *  3. When the user clicks "نصب", we call `prompt()` on the stashed
 *     `BeforeInstallPromptEvent`. If the user accepts, the browser
 *     installs the PWA and fires `appinstalled` — we hide the banner.
 *  4. On browsers that don't fire `beforeinstallprompt` (Safari iOS —
 *     which uses "Add to Home Screen" from the share menu instead), the
 *     banner never renders. We could show iOS-specific instructions, but
 *     that's a Phase E polish task.
 *
 * ─── Persistence ────────────────────────────────────────────────────────
 *
 *  Dismissal is stored in `localStorage['ky_pwa_install_dismissed']` as
 *  an ISO timestamp. We re-show the banner after 30 days (so users who
 *  dismissed it early in the product's life can reconsider after the app
 *  has matured). `appinstalled` permanently hides the banner.
 *
 * ─── Theme ──────────────────────────────────────────────────────────────
 *
 *  Gold palette only — no indigo/blue/purple (per project constraints).
 *  Uses the gold-500/600 gradient + warm shadow tokens already in
 *  `globals.css`. Works in both light and dark themes.
 */

import { Download, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { prefetchBook } from '@/lib/book-prefetcher'

const DISMISS_KEY = 'ky_pwa_install_dismissed'
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

/**
 * Minimal type for the `beforeinstallprompt` event. The DOM lib doesn't
 * ship this type by default. We only use `prompt()` and `userChoice`.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function readDismissedAt(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    return raw ? Number(raw) || 0 : 0
  } catch {
    return 0
  }
}

function writeDismissedAt(ts: number) {
  try {
    localStorage.setItem(DISMISS_KEY, String(ts))
  } catch {
    /* private mode / quota — ignore */
  }
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  // iOS Safari standalone
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  // @ts-expect-error — iOS Safari only
  if (window.navigator.standalone === true) return true
  return false
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  )
  const [visible, setVisible] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // Don't show the banner if the app is already installed/standalone.
    if (isStandalone()) return

    // If the user dismissed recently, honor the TTL.
    const dismissedAt = readDismissedAt()
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) return

    const onBeforeInstall = (e: Event) => {
      // Suppress the browser's own minibar — we'll show our own banner.
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
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
        // User dismissed the native prompt — record so we don't re-show
        // our banner until the TTL elapses.
        writeDismissedAt(Date.now())
        setVisible(false)
      }
      // `appinstalled` will fire if accepted; that handler hides + persists.
    } catch {
      // Some browsers throw if prompt() is called twice on the same event.
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
        {/* Icon tile — gold gradient, no indigo/blue */}
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
