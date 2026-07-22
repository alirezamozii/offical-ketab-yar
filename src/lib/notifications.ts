'use client'

/**
 * src/lib/notifications.ts
 * ---------------------------------------------------------------
 * Web Notifications API wrapper for Ketab-Yar's Reading Reminders
 * system.
 *
 * ─ Why this exists ──────────────────────────────────────────────
 * Browsers expose notifications through `window.Notification` and
 * the Permissions API. The surface is small but easy to misuse:
 *   • `Notification.requestPermission()` returns a Promise in
 *     modern browsers but a callback in old Safari.
 *   • Service-worker registrations are required for `showNotification`
 *     on the worker — but plain `new Notification(...)` works on the
 *     main thread in most browsers (with the notable exception of
 *     iOS Safari, which requires SW-based notifications).
 *   • Permission can be one of 'granted' | 'denied' | 'default' and
 *     can change between sessions.
 *
 * This module centralises all of that so callers don't have to
 * reproduce the feature-detect / permission-check dance. Every
 * function is a no-op when notifications aren't supported, so the
 * rest of the app can call them unconditionally.
 *
 * ─ Scheduler ────────────────────────────────────────────────────
 * The Web Notifications API has no built-in scheduler. We use a
 * `setTimeout` whose delay is "ms until the next HH:MM" today (or
 * tomorrow if HH:MM has already passed). After firing, we re-arm
 * with a 24-hour `setInterval`. The hook is responsible for
 * clearing these handles on unmount / settings change.
 *
 * ─ Achievement lookup ───────────────────────────────────────────
 * The hook in `use-reminders.ts` watches `STORAGE_KEYS.achievementsSeen`
 * for growth and dispatches achievement notifications. To map an
 * achievement id → Persian title without re-running the full
 * achievements computation, we keep a static lookup table here.
 *
 * Client-only — uses `window`/`Notification`, so callers must be
 * inside Client Components or guard with `typeof window !== 'undefined'`.
 * ---------------------------------------------------------------
 */

import { STORAGE_KEYS } from '@/lib/storage-keys'

// ---------------------------------------------------------------------------
// Permission helpers
// ---------------------------------------------------------------------------

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

/** True if the Web Notifications API is available in this browser. */
export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/** Read the current permission state. Returns 'unsupported' if the API is missing. */
export function getNotificationPermission(): NotificationPermissionState {
  if (!notificationsSupported()) return 'unsupported'
  // `Notification.permission` is the canonical property; some browsers
  // also expose `Notification.permission` via the Permissions API, but
  // the direct read is simpler and synchronous.
  return Notification.permission as NotificationPermissionState
}

/**
 * Ask the browser for notification permission. Returns the resulting
 * state — 'granted', 'denied', or 'default' (the user closed the
 * prompt). Returns 'unsupported' immediately if the API is missing.
 *
 * Modern browsers return a Promise from `Notification.requestPermission()`;
 * very old Safari (≤ 11) used a callback form. We feature-detect and
 * normalise both to a Promise.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!notificationsSupported()) return 'unsupported'
  try {
    // Cast: older lib.dom typings may not know the Promise form is
    // universal in evergreen browsers. We've already feature-detected.
    const result = await (Notification.requestPermission() as unknown as Promise<NotificationPermission>)
    return result as NotificationPermissionState
  } catch {
    return 'denied'
  }
}

// ---------------------------------------------------------------------------
// Sending notifications
// ---------------------------------------------------------------------------

export interface SendNotificationOptions {
  /** Larger icon shown in the notification body. */
  icon?: string
  /** Smaller monochrome icon for the status bar. */
  badge?: string
  /** Tag dedupes notifications with the same tag — newer replaces older. */
  tag?: string
  /** Arbitrary data attached to the notification (e.g. a deep-link URL). */
  data?: Record<string, unknown>
  /** Whether the notification should stay until the user interacts. */
  requireInteraction?: boolean
  /** Silent notification (no sound / vibration). */
  silent?: boolean
}

/**
 * Show a notification if (a) the API is supported and (b) permission
 * has been granted. Returns true if a notification was actually
 * created, false otherwise (so callers can fall back to a toast).
 *
 * We deliberately use the main-thread `new Notification(...)` form.
 * Service-worker-based notifications would also work but require a
 * registered SW — which we don't ship (the app is fully client-side
 * with no offline cache layer). On iOS Safari 16.4+ the main-thread
 * form requires the page to be installed to the home screen; the
 * `notificationsSupported()` check above still returns true there,
 * but `new Notification(...)` will throw. We catch and report false.
 */
export function sendNotification(
  title: string,
  body: string,
  options: SendNotificationOptions = {},
): boolean {
  if (!notificationsSupported()) return false
  if (Notification.permission !== 'granted') return false
  try {
    const n = new Notification(title, {
      body,
      icon: options.icon,
      badge: options.badge,
      tag: options.tag,
      data: options.data,
      requireInteraction: options.requireInteraction ?? false,
      silent: options.silent ?? false,
    })
    // Auto-close after 8 seconds unless requireInteraction was requested.
    // Some browsers (notably Chrome on Windows) leave non-persistent
    // notifications on screen until manually dismissed, which is noisy.
    if (!options.requireInteraction) {
      const closeMs = 8000
      setTimeout(() => {
        try {
          n.close()
        } catch {
          /* already closed */
        }
      }, closeMs)
    }
    // Clicking the notification focuses the app. If `data.url` is set,
    // navigate to it.
    n.onclick = () => {
      try {
        window.focus()
        const url = options.data?.url
        // H-16: only allow same-origin relative URLs. A naive `startsWith('/')`
        // check would also accept protocol-relative URLs (`//evil.com`) and
        // backslash-prefixed ones (`/\evil.com`) — both of which browsers
        // resolve as cross-origin navigations, enabling open-redirect / XSS
        // via a crafted notification payload. Reject both explicitly.
        if (
          typeof url === 'string' &&
          url.startsWith('/') &&
          !url.startsWith('//') &&
          !url.startsWith('/\\')
        ) {
          window.location.href = url
        }
      } catch {
        /* ignore */
      }
      try {
        n.close()
      } catch {
        /* ignore */
      }
    }
    return true
  } catch {
    // Thrown on iOS Safari without home-screen install, or in private
    // mode on some browsers. Graceful degradation — caller can fall
    // back to a toast.
    return false
  }
}

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------

/**
 * Scheduler handle returned by `scheduleReadingReminder`. Pass to
 * `cancelReminder(handle)` to tear down both the initial timeout and
 * the recurring interval. The global `cancelReadingReminder()` (no
 * args) cancels every currently-active reminder.
 */
export interface ReminderHandle {
  /** setTimeout id for the first fire (ms-until-HH:MM today/tomorrow). */
  timeoutId: ReturnType<typeof setTimeout> | null
  /** setInterval id for subsequent 24-hour fires. */
  intervalId: ReturnType<typeof setInterval> | null
  /** The HH:MM string this handle was scheduled for. */
  time: string
}

/**
 * Compute the ms delay until the next occurrence of `HH:MM` (24-hour
 * local time). If HH:MM has already passed today, returns the delay
 * until tomorrow's HH:MM. Returns null for malformed input.
 */
export function msUntilNext(time: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (!m) return null
  const hours = Number(m[1])
  const minutes = Number(m[2])
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null

  const now = new Date()
  const target = new Date(now)
  target.setHours(hours, minutes, 0, 0)
  let delta = target.getTime() - now.getTime()
  // If the time has already passed today, schedule for tomorrow.
  // Add a 30-second grace window so a 20:00 reminder set at 19:59:59
  // still fires "today" rather than 24h later.
  if (delta < -30_000) {
    delta += 24 * 60 * 60 * 1000
  }
  // Floor to non-negative.
  return Math.max(0, delta)
}

/**
 * Set of all currently-active reminder handles. We allow multiple
 * concurrent reminders because the user may have both a daily
 * reminder (at e.g. 09:00) and a streak-protection warning (at
 * 20:00) scheduled at the same time. Each call to
 * `scheduleReadingReminder` adds a new entry; the caller is
 * responsible for cancelling via either `cancelReminder(handle)`
 * (per-handle) or `cancelReadingReminder()` (cancel-all).
 */
const activeReminders = new Set<ReminderHandle>()

/**
 * Schedule a daily reading reminder at `time` (HH:MM, 24h local).
 * On each fire, the caller's `onFire` callback is invoked — the
 * caller decides what notification to send (daily reminder vs.
 * streak warning, etc.). Multiple reminders can be active
 * concurrently; cancel each via `cancelReminder(handle)` or all
 * via `cancelReadingReminder()`.
 *
 * Because the Web Notifications API has no built-in scheduler, we
 * use setTimeout(ms-until-next-HH:MM) followed by setInterval(24h).
 * The hook is responsible for clearing these handles on unmount /
 * settings change.
 */
export function scheduleReadingReminder(
  time: string,
  onFire: () => void,
): ReminderHandle | null {
  const delay = msUntilNext(time)
  if (delay == null) return null

  const handle: ReminderHandle = {
    timeoutId: null,
    intervalId: null,
    time,
  }

  handle.timeoutId = setTimeout(() => {
    try {
      onFire()
    } catch {
      /* swallow — never let observation break the scheduler */
    }
    // Re-arm as a 24h interval for subsequent days. We use a fixed
    // 24h interval rather than recomputing ms-until-next-HH:MM each
    // day because daylight-saving transitions are rare and a few
    // minutes of drift is acceptable for a reading reminder.
    handle.intervalId = setInterval(() => {
      try {
        onFire()
      } catch {
        /* swallow */
      }
    }, 24 * 60 * 60 * 1000)
  }, delay)

  activeReminders.add(handle)
  return handle
}

/**
 * Cancel a specific reminder handle. Safe to call with an already-
 * cancelled handle — the timeouts/intervals are no-ops in that case.
 */
export function cancelReminder(handle: ReminderHandle | null): void {
  if (!handle) return
  if (handle.timeoutId) {
    clearTimeout(handle.timeoutId)
    handle.timeoutId = null
  }
  if (handle.intervalId) {
    clearInterval(handle.intervalId)
    handle.intervalId = null
  }
  activeReminders.delete(handle)
}

/**
 * Cancel every currently-active reminder scheduled by
 * `scheduleReadingReminder`. Safe to call when nothing is scheduled.
 * This is the "cancel-all" entry point for the public API.
 */
export function cancelReadingReminder(): void {
  for (const handle of activeReminders) {
    if (handle.timeoutId) clearTimeout(handle.timeoutId)
    if (handle.intervalId) clearInterval(handle.intervalId)
  }
  activeReminders.clear()
}

// ---------------------------------------------------------------------------
// Motivational messages (Persian)
// ---------------------------------------------------------------------------

/**
 * Persian motivational messages shown in the body of daily reminders.
 * One is picked at random each fire. Kept short (under ~50 chars) so
 * it fits in a single notification line on most platforms.
 */
export const MOTIVATIONAL_MESSAGES: readonly string[] = [
  'هر کتاب یک سفر جدید است.',
  'بیایید امروز چند صفحه بخوانیم.',
  'خواندن، غذای ذهن است.',
  'یک صفحه هم که بخوانی، از دیروز بهتری.',
  'هر روز یک کلمه جدید، هر هفته یک دنیای جدید.',
  'زنجیره‌ات را زنده نگه دار.',
  'کتاب‌ها دوستانی هستند که هرگز رهایت نمی‌کنند.',
  'پنج دقیقه مطالعه، یک قدم به هدف.',
  'امروز فرصت یادگیری است، آن را از دست نده.',
  'موفقیت از تکرار روزانه می‌آید.',
  'ورق بزن، یاد بگیر، رشد کن.',
  'کوتاه‌ترین راه به دانش، خواندن است.',
] as const

/** Pick a random motivational message (Persian). Returns a stable fallback if Math.random is unavailable. */
export function pickMotivationalMessage(): string {
  const arr = MOTIVATIONAL_MESSAGES
  if (arr.length === 0) return 'وقت مطالعه است!'
  const idx = Math.floor(Math.random() * arr.length)
  return arr[idx] ?? arr[0]
}

// ---------------------------------------------------------------------------
// Achievement id → Persian title lookup
// ---------------------------------------------------------------------------

/**
 * Static lookup of achievement id → Persian title. Used by the
 * `useReminders` hook to fire achievement-unlock notifications
 * without re-running the full `useAchievements` computation
 * (which lives in a separate component and would cause double-
 * detection if instantiated twice).
 *
 * Keep this in sync with `src/hooks/reader/use-achievements.ts`.
 */
export const ACHIEVEMENT_TITLES: Readonly<Record<string, string>> = {
  'first-book': 'آغاز سفر',
  'first-finish': 'پایان اولین کتاب',
  'streak-3': 'سه روز متوالی',
  'streak-7': 'یک هفته پایدار',
  'streak-30': 'یک ماه پایدار',
  'reader-10': 'وفادار به کتاب',
  'books-5': 'کتاب‌خوان',
  'books-finish-3': 'پایان‌بنده',
  'vocab-50': 'واژه‌شناس',
  'games-5': 'بازی‌باز',
  'streak-30-cur': 'یک ماهه',
  'books-10-start': 'فصل‌خوان',
}

// ---------------------------------------------------------------------------
// High-level senders — each composes a Persian title + body and
// delegates to `sendNotification`. Returns true if a notification
// was actually shown.
// ---------------------------------------------------------------------------

/** Daily reading reminder: "وقت مطالعه است!" with a random motivational message. */
export function sendDailyReminder(): boolean {
  return sendNotification(
    'وقت مطالعه است!',
    pickMotivationalMessage(),
    {
      tag: 'ky-daily-reminder',
      data: { url: '/dashboard' },
    },
  )
}

/**
 * Streak-protection warning. Sent at the user's configured time
 * (default 8 PM) if they haven't read yet today.
 *
 * Title: "زنجیره مطالعه شما در خطر است!"
 * Body: a short prompt to start reading before midnight.
 */
export function sendStreakWarning(streak: number): boolean {
  const streakLabel = streak > 0
    ? `زنجیره ${toPersianDigitsInline(streak)} روزه‌ات را از دست نده.`
    : 'امروز هنوز نخوانده‌ای — یک صفحه بخوان و شروع کن.'
  return sendNotification(
    'زنجیره مطالعه شما در خطر است!',
    `${streakLabel} همین حالا چند صفحه بخوان.`,
    {
      tag: 'ky-streak-warning',
      data: { url: '/dashboard' },
    },
  )
}

/**
 * Achievement-unlock notification.
 * Title: "دستاورد جدید باز شد!"
 * Body: the achievement's Persian title.
 */
export function sendAchievementNotification(achievementName: string): boolean {
  return sendNotification(
    'دستاورد جدید باز شد!',
    `«${achievementName}» باز شد. آفرین!`,
    {
      tag: `ky-achievement-${achievementName}`,
      data: { url: '/dashboard' },
    },
  )
}

/**
 * Level-up notification.
 * Title: "سطح جدید رسیدید!"
 * Body: announces the new level number in Persian digits.
 */
export function sendLevelUpNotification(level: number): boolean {
  return sendNotification(
    'سطح جدید رسیدید!',
    `تبریک! به سطح ${toPersianDigitsInline(level)} رسیدی.`,
    {
      tag: 'ky-level-up',
      data: { url: '/dashboard' },
    },
  )
}

/**
 * Test notification — used by the "آزمایش اعلان" button in Settings
 * to verify the user has granted permission and that notifications
 * actually fire on their platform.
 */
export function sendTestNotification(): boolean {
  return sendNotification(
    'اعلان آزمایشی کتاب‌یار',
    'اگر این را می‌بینید، اعلان‌ها به‌درستی کار می‌کنند!',
    {
      tag: 'ky-test',
      data: { url: '/settings' },
    },
  )
}

// ---------------------------------------------------------------------------
// Banner-dismissed persistence
// ---------------------------------------------------------------------------

/** True if the user has dismissed the permission-request banner (persists in localStorage). */
export function isNotifBannerDismissed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_KEYS.notifBannerDismissed) === '1'
  } catch {
    return false
  }
}

/** Persist banner-dismissal so it doesn't reappear next session. */
export function setNotifBannerDismissed(value: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.notifBannerDismissed, value ? '1' : '0')
  } catch {
    /* ignore quota errors */
  }
}

// ---------------------------------------------------------------------------
// Small private helper — Persian digit conversion without the React
// hook (this module is framework-agnostic). Mirrors the digit table
// in `src/lib/typography.ts`.
// ---------------------------------------------------------------------------

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

function toPersianDigitsInline(input: number | string): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)] ?? d)
}
