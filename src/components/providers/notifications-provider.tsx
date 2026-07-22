'use client'

/**
 * src/components/providers/notifications-provider.tsx
 * ---------------------------------------------------------------
 * App-wide Reading Reminders provider.
 *
 * Mounts the `useReminders()` hook (which schedules daily reminders,
 * streak-protection warnings, and listens for XP/achievement events).
 * Renders no UI by default — except a dismissible permission-request
 * banner that appears when the user has at least one notification
 * category enabled in settings but the browser hasn't granted
 * permission yet.
 *
 * Banner rules:
 *   • Show only if `isEnabled` (any notification category on) AND
 *     `permission === 'default'` (browser hasn't been asked or the
 *     user dismissed the prompt without choosing).
 *   • Don't show if `permission === 'denied'` — at that point a
 *     banner nag won't help; the user must change the site
 *     permission in browser settings. (The settings page still
 *     surfaces the denied state.)
 *   • Don't show if `permission === 'unsupported'`.
 *   • Don't show if the user has clicked "بعداً" (Later) — that
 *     dismissal is persisted in localStorage via the
 *     `notifBannerDismissed` key so it doesn't reappear next session.
 *     Dismissal is reset whenever the user manually changes any
 *     notification setting in /settings, so re-enabling a category
 *     after dismissing will re-show the banner.
 *
 * The provider is mounted in the root layout and lives for the
 * app's entire lifetime. It must be a Client Component because the
 * Notifications API is browser-only.
 * ---------------------------------------------------------------
 */

import * as React from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BellRing, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useReminders } from '@/hooks/use-reminders'
import {
  isNotifBannerDismissed,
  setNotifBannerDismissed,
} from '@/lib/notifications'

/**
 * Permission-request banner. Slides in from the top of the viewport
 * and sticks there until the user picks an action. Animations are
 * gated on `useReducedMotion()`.
 */
function PermissionBanner({
  onEnable,
  onDismiss,
}: {
  onEnable: () => void
  onDismiss: () => void
}) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -24 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-auto fixed inset-x-0 top-0 z-[60] flex justify-center px-3 pt-3 sm:px-4 sm:pt-4"
      role="dialog"
      aria-label="درخواست مجوز اعلان‌ها"
      aria-live="polite"
    >
      <div className="flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-gold-500/30 bg-gradient-to-br from-card to-gold-500/10 p-3 shadow-lg backdrop-blur-md sm:gap-4 sm:p-4">
        <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-500/15 text-gold-600 ring-1 ring-gold-500/30 dark:text-gold-400 sm:flex">
          <BellRing className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-bold leading-snug text-foreground">
            برای دریافت یادآوری‌های مطالعه، اعلان‌ها را فعال کنید
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            یادآوری روزانه و هشدار حفظ زنجیره نیاز به مجوز اعلان‌های مرورگر دارند.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={onEnable}
            className="bg-gradient-to-r from-gold-500 to-amber-500 text-gold-950 hover:from-gold-600 hover:to-amber-600"
            aria-label="فعال کردن اعلان‌ها"
          >
            فعال کردن
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground"
            aria-label="بستن درخواست اعلان‌ها"
          >
            بعداً
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onDismiss}
            className="h-8 w-8 text-muted-foreground hover:text-foreground sm:hidden"
            aria-label="بستن"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export function NotificationsProvider({
  children,
}: {
  /** Optional — the provider renders the banner alongside whatever you wrap. */
  children?: React.ReactNode
}) {
  const {
    permission,
    loaded,
    isEnabled,
    requestPermission,
  } = useReminders()

  // Hydrate the banner-dismissed flag from localStorage on mount.
  // Starts as `null` so SSR / first paint doesn't flash the banner
  // (the banner only renders after the client has decided).
  const [bannerDismissed, setBannerDismissed] = React.useState<boolean | null>(
    null,
  )

  React.useEffect(() => {
    setBannerDismissed(isNotifBannerDismissed())
  }, [])

  // Reset the dismissal if the user has just granted permission (so
  // future category toggles can re-trigger the banner if they later
  // revoke it).
  React.useEffect(() => {
    if (permission === 'granted' && bannerDismissed) {
      setNotifBannerDismissed(false)
      setBannerDismissed(false)
    }
  }, [permission, bannerDismissed])

  // Decide whether to show the banner.
  const showBanner =
    loaded &&
    permission === 'default' &&
    isEnabled &&
    bannerDismissed === false

  const handleEnable = React.useCallback(async () => {
    const result = await requestPermission()
    // If the user granted or denied, hide the banner. If they
    // dismissed the prompt (still 'default'), also hide — they've
    // seen it once this session.
    if (result !== 'default') {
      setNotifBannerDismissed(true)
      setBannerDismissed(true)
    } else {
      // Prompt dismissed without a choice — also hide for this
      // session so we don't pester them on every navigation.
      setNotifBannerDismissed(true)
      setBannerDismissed(true)
    }
  }, [requestPermission])

  const handleDismiss = React.useCallback(() => {
    setNotifBannerDismissed(true)
    setBannerDismissed(true)
  }, [])

  return (
    <>
      {children}
      <AnimatePresence>
        {showBanner ? (
          <PermissionBanner
            onEnable={handleEnable}
            onDismiss={handleDismiss}
          />
        ) : null}
      </AnimatePresence>
    </>
  )
}
