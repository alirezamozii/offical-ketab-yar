'use client'

/**
 * SignupPrompt — auto sign-up popup that appears after the user browses
 * a few pages (like Google's auto sign-up flow).
 *
 * Behavior:
 *   - Tracks page views in localStorage (`ky_page_views`)
 *   - After 3 page views (configurable), shows a one-time modal
 *   - User can: "Sign up with Google" / "Maybe later" / "Don't show again"
 *   - "Maybe later" → snooze for 24 hours
 *   - "Don't show again" → never show again (until they clear storage)
 *   - Never shows if user is already logged in
 *   - Never shows on /auth/* or /admin/* or /onboarding routes
 *
 * This implements the "let users read a few pages free, then prompt signup"
 * behavior the user asked for — non-intrusive, dismissible, smart timing.
 *
 * The popup is now a Radix `Dialog` (via the shadcn `Dialog` primitive) —
 * it gets `role="dialog"`, `aria-modal="true"`, a focus trap, focus
 * restore, Escape-to-close, click-outside-to-close, and scroll lock for
 * free. The visual design (warm gold gradient card, BookOpen icon, three
 * CTAs) is preserved.
 */

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { GoogleIcon } from '@/components/icons/google-icon'
import { BookOpen, X, Sparkles, Clock } from 'lucide-react'

const PAGE_VIEW_THRESHOLD = 4 // show after 4 page views for gentle timing
const SNOOZE_HOURS = 24
const STORAGE_KEY = 'ky_signup_prompt'
const PAGE_VIEW_KEY = 'ky_page_views'

type PromptState = {
  // 'show' | 'snoozed' | 'never' | 'pending'
  status: 'pending' | 'show' | 'snoozed' | 'never'
  snoozedUntil?: number
  shownCount: number
}

function getPromptState(): PromptState {
  if (typeof window === 'undefined') {
    return { status: 'pending', shownCount: 0 }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { status: 'pending', shownCount: 0 }
    const parsed = JSON.parse(raw)
    // Check if snooze expired
    if (parsed.status === 'snoozed' && parsed.snoozedUntil && Date.now() > parsed.snoozedUntil) {
      return { status: 'pending', shownCount: parsed.shownCount || 0 }
    }
    return parsed
  } catch {
    return { status: 'pending', shownCount: 0 }
  }
}

function savePromptState(state: PromptState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

function getPageViews(): number {
  if (typeof window === 'undefined') return 0
  try {
    return Number(localStorage.getItem(PAGE_VIEW_KEY) || '0')
  } catch {
    return 0
  }
}

function incrementPageViews(): number {
  if (typeof window === 'undefined') return 0
  try {
    const current = getPageViews() + 1
    localStorage.setItem(PAGE_VIEW_KEY, String(current))
    return current
  } catch {
    return 0
  }
}

const SKIP_PREFIXES = ['/auth', '/api', '/admin', '/onboarding']

export function SignupPrompt() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const reduceMotion = useReducedMotion()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Skip on certain routes
    if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return
    // Skip if user is logged in or session is loading
    if (status === 'loading') return
    if (session?.user) return

    // Increment page view counter
    const views = incrementPageViews()

    // Check prompt state
    const state = getPromptState()

    let timer: NodeJS.Timeout | undefined

    // Show if: threshold reached AND state is pending
    if (views >= PAGE_VIEW_THRESHOLD && state.status === 'pending') {
      // Gentle 2.5s delay after page transition
      timer = setTimeout(() => {
        setVisible(true)
        savePromptState({
          status: 'snoozed', // mark as snoozed so it doesn't immediately re-show
          snoozedUntil: Date.now() + SNOOZE_HOURS * 60 * 60 * 1000,
          shownCount: state.shownCount + 1,
        })
      }, 2500)
    }

    return () => {
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [pathname, status, session])

  function handleSignup() {
    setVisible(false)
    signIn('google', { callbackUrl: pathname })
  }

  function handleLater() {
    setVisible(false)
    savePromptState({
      status: 'snoozed',
      snoozedUntil: Date.now() + SNOOZE_HOURS * 60 * 60 * 1000,
      shownCount: getPromptState().shownCount,
    })
  }

  function handleNever() {
    setVisible(false)
    savePromptState({
      status: 'never',
      shownCount: getPromptState().shownCount,
    })
  }

  return (
    <Dialog open={visible} onOpenChange={(o) => { if (!o) handleLater() }}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="gap-0 overflow-hidden rounded-3xl border p-0 sm:max-w-md bg-gradient-to-br from-gold-50 via-white to-gold-100 dark:from-background dark:to-card border-gold-400/50 shadow-2xl shadow-gold-800/40"
      >
        <DialogTitle className="sr-only">از کتاب‌یار لذت می‌برید؟</DialogTitle>
        <DialogDescription className="sr-only">
          با ثبت‌نام رایگان، پیشرفت خود را ذخیره کنید، واژگان بسازید و به همه امکانات هوش مصنوعی دسترسی پیدا کنید.
        </DialogDescription>

        {/* Top gradient accent */}
        <div
          className="h-1.5 w-full bg-gradient-to-l from-gold-500 via-gold-700 to-gold-800"
        />

        {/* Close button */}
        <button
          onClick={handleLater}
          className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5 text-gold-700 dark:text-gold-300"
          aria-label="بستن"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-5 p-6 text-center sm:p-8">
          {/* Icon */}
          <motion.div
            initial={reduceMotion ? {} : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl text-white bg-gradient-to-br from-gold-500 via-gold-700 to-gold-800 shadow-xl shadow-gold-700/40 ring-4 ring-gold-500/20"
          >
            <BookOpen className="h-8 w-8" strokeWidth={1.5} />
          </motion.div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gold-950 dark:text-gold-100">
              از کتاب‌یار لذت می‌برید؟
            </h2>
            <p className="text-sm leading-relaxed text-gold-800 dark:text-gold-300 max-w-xs mx-auto">
              با ثبت‌نام رایگان، تمام پیشرفت مطالعه، واژگان و دستاوردهای شما در حساب کاربری شما ذخیره خواهد شد.
            </p>
          </div>

          {/* Benefits */}
          <div className="flex justify-center gap-4 py-2 bg-gold-500/5 dark:bg-gold-500/10 rounded-2xl p-3 border border-gold-400/20">
            <div className="text-center flex-1">
              <Sparkles className="mx-auto mb-1 h-5 w-5 text-gold-600 dark:text-gold-400" />
              <div className="text-[11px] font-bold text-gold-900 dark:text-gold-200">
                هوش مصنوعی
              </div>
            </div>
            <div className="text-center flex-1 border-x border-gold-300/40 dark:border-gold-700/40">
              <BookOpen className="mx-auto mb-1 h-5 w-5 text-gold-600 dark:text-gold-400" />
              <div className="text-[11px] font-bold text-gold-900 dark:text-gold-200">
                حفظ تمام پیشرفت
              </div>
            </div>
            <div className="text-center flex-1">
              <Clock className="mx-auto mb-1 h-5 w-5 text-gold-600 dark:text-gold-400" />
              <div className="text-[11px] font-bold text-gold-900 dark:text-gold-200">
                دسترسی همیشگی
              </div>
            </div>
          </div>

          {/* Actions with strict attention hierarchy */}
          <div className="space-y-3 pt-1">
            {/* High Attention: Primary CTA */}
            <Button
              onClick={handleSignup}
              className="h-12 w-full gap-3 border-0 text-base font-bold text-white bg-gradient-to-r from-gold-600 via-gold-700 to-amber-700 hover:from-gold-700 hover:to-amber-800 shadow-lg shadow-gold-700/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <GoogleIcon className="h-5 w-5" />
              ثبت‌نام و ورود رایگان با گوگل
            </Button>

            {/* Medium Attention: Secondary CTA */}
            <Button
              onClick={handleLater}
              variant="outline"
              className="h-11 w-full text-sm font-semibold border-gold-300/80 text-gold-900 dark:text-gold-200 hover:bg-gold-50 dark:hover:bg-gold-950/40"
            >
              بعداً یادآوری کن
            </Button>

            {/* Low Attention / Low Friction: Tertiary CTA */}
            <button
              onClick={handleNever}
              className="text-xs text-muted-foreground hover:text-gold-700 dark:hover:text-gold-300 underline underline-offset-4 pt-1 transition-colors block mx-auto"
            >
              دیگر این پیام را نشان نده
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
