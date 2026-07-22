'use client'

/**
 * src/hooks/use-reminders.ts
 * ---------------------------------------------------------------
 * Reading Reminders manager hook.
 *
 * Responsibilities:
 *   1. Check notification permission on mount + expose
 *      `requestPermission()` so the banner / settings button can
 *      trigger the browser prompt.
 *   2. Schedule the daily reading reminder at the user's preferred
 *      time (from `settings.notifications.reminderTime`) when
 *      `dailyReminder` is enabled and permission is granted.
 *   3. Schedule the streak-protection warning at the user's
 *      configured time (default 8 PM) when `streakAlerts` is enabled.
 *      The warning only fires if the user hasn't read yet today.
 *   4. Listen for XP events (`ky-xp-update`) and fire a level-up
 *      notification when the response signals `leveledUp` (and
 *      `levelUpAlerts` is enabled).
 *   5. Watch `STORAGE_KEYS.achievementsSeen` for growth and fire
 *      achievement-unlock notifications (when `achievementAlerts`
 *      is enabled). We watch storage rather than calling
 *      `useAchievements()` to avoid double-detecting unlocks (the
 *      dashboard already mounts that hook).
 *   6. Tear down all timeouts/intervals on unmount.
 *
 * Returns:
 *   • `permission` — current NotificationPermissionState
 *   • `requestPermission()` — async; returns the new state
 *   • `sendTestNotification()` — fires a test notification
 *   • `isEnabled` — true if any notification type is enabled in
 *     settings (used by the banner to decide whether to nag the
 *     user for permission)
 *
 * All notifications are gated on (a) the API being supported and
 * (b) permission being granted. If either fails, the relevant
 * schedule / sender is a no-op.
 *
 * The hook never auto-requests permission — that's the job of an
 * explicit user action (banner button or settings button).
 * ---------------------------------------------------------------
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  ACHIEVEMENT_TITLES,
  cancelReadingReminder,
  cancelReminder,
  getNotificationPermission,
  requestNotificationPermission,
  scheduleReadingReminder,
  sendAchievementNotification,
  sendDailyReminder,
  sendLevelUpNotification,
  sendStreakWarning,
  sendTestNotification,
  type NotificationPermissionState,
  type ReminderHandle,
} from '@/lib/notifications'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { useSettings } from '@/lib/settings'
import { onXPUpdate } from '@/lib/xp-events'
import type { StreakData } from '@/hooks/reader/use-reading-streak'

// ---------------------------------------------------------------------------
// Streak helpers (lightweight — we only need today's read state, not
// the full hook). Reading the raw localStorage value avoids the 30s
// polling loop in useReadingStreak, which would be wasteful to mount
// in the always-on notifications provider.
// ---------------------------------------------------------------------------

const DAY = 24 * 60 * 60 * 1000

function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function yesterdayKey(): string {
  return todayKey(new Date(Date.now() - DAY))
}

function loadStreak(): StreakData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.streak)
    if (!raw) return null
    return JSON.parse(raw) as StreakData
  } catch {
    return null
  }
}

/** True if the user has any reading activity recorded for today. */
function hasReadToday(): boolean {
  const data = loadStreak()
  if (!data) return false
  return data.activeDays?.includes(todayKey()) ?? false
}

/** Current streak count (0 if no data). */
function currentStreakCount(): number {
  const data = loadStreak()
  if (!data) return 0
  // If today isn't active yet, the streak hook still keeps `currentStreak`
  // alive via yesterday — so we can use the stored value directly. We
  // only zero it out if the streak was already broken (yesterday not
  // active either).
  const today = todayKey()
  const yesterday = yesterdayKey()
  const set = new Set(data.activeDays ?? [])
  if (!set.has(today) && !set.has(yesterday)) return 0
  return data.currentStreak ?? 0
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseRemindersResult {
  /** Current permission state ('unsupported' if the API is missing). */
  permission: NotificationPermissionState
  /** True once the hook has read the initial permission state. */
  loaded: boolean
  /** Request notification permission. Returns the resulting state. */
  requestPermission: () => Promise<NotificationPermissionState>
  /** Fire a test notification. Returns true if one was actually shown. */
  sendTestNotification: () => boolean
  /** True if any notification category is enabled in settings. */
  isEnabled: boolean
}

export function useReminders(): UseRemindersResult {
  const { settings } = useSettings()
  const n = settings.notifications

  const [permission, setPermission] = useState<NotificationPermissionState>('default')
  const [loaded, setLoaded] = useState(false)

  // Keep a ref to the latest settings so the scheduler callbacks
  // (which close over `n` at scheduling time) can read fresh values
  // when they fire hours later. Updated inside an effect to avoid
  // the "ref access during render" lint rule.
  const settingsRef = useRef(n)
  useEffect(() => {
    settingsRef.current = n
  }, [n])

  // ---------------------------------------------------------------------
  // 1. Initial permission read
  // ---------------------------------------------------------------------
  useEffect(() => {
    setPermission(getNotificationPermission())
    setLoaded(true)
    // Some browsers fire a `notificationclick` / permissionchange event;
    // we listen for the standard `permissionchange` where available.
    const onPermissionChange = () => {
      setPermission(getNotificationPermission())
    }
    // H-21: hold the PermissionStatus in a stable closure variable so the
    // cleanup function (returned below) can remove the listener. The
    // previous code scoped the status to the `.then()` callback, leaving
    // the listener attached forever — one leak per mount.
    let permStatus: PermissionStatus | null = null
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions
        .query({ name: 'notifications' as PermissionName })
        .then((status) => {
          permStatus = status
          status.addEventListener('change', onPermissionChange)
        })
        .catch(() => {
          /* some browsers reject 'notifications' as a PermissionName — fine */
        })
    }
    return () => {
      if (permStatus) {
        permStatus.removeEventListener('change', onPermissionChange)
      }
    }
  }, [])

  // ---------------------------------------------------------------------
  // 2. Daily reading reminder scheduler
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!loaded) return
    if (permission !== 'granted') return
    if (!n.dailyReminder) return

    const handle: ReminderHandle | null = scheduleReadingReminder(
      n.reminderTime,
      () => {
        // Re-check permission at fire time — the user may have revoked it.
        if (getNotificationPermission() !== 'granted') return
        if (!settingsRef.current.dailyReminder) return
        sendDailyReminder()
      },
    )

    return () => {
      // Cancel just this reminder (the streak-warning scheduler runs
      // concurrently and manages its own handle).
      cancelReminder(handle)
    }
  }, [loaded, permission, n.dailyReminder, n.reminderTime])

  // ---------------------------------------------------------------------
  // 3. Streak-protection warning scheduler
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!loaded) return
    if (permission !== 'granted') return
    if (!n.streakAlerts) return

    const handle: ReminderHandle | null = scheduleReadingReminder(
      n.streakAlertsTime,
      () => {
        if (getNotificationPermission() !== 'granted') return
        if (!settingsRef.current.streakAlerts) return
        // Only warn if the user hasn't read yet today.
        if (hasReadToday()) return
        const streak = currentStreakCount()
        sendStreakWarning(streak)
      },
    )

    return () => {
      cancelReminder(handle)
    }
  }, [loaded, permission, n.streakAlerts, n.streakAlertsTime])

  // ---------------------------------------------------------------------
  // 4. Level-up notification via XP events
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (permission !== 'granted') return
    if (!n.levelUpAlerts) return

    const unsubscribe = onXPUpdate(({ response }) => {
      if (getNotificationPermission() !== 'granted') return
      if (!settingsRef.current.levelUpAlerts) return
      // The /api/xp response signals a level-up via `leveledUp: true`
      // (preferred) or `newLevel > level` (defensive fallback).
      if (response.leveledUp) {
        const lvl = Number(response.newLevel ?? response.level ?? 0)
        if (lvl > 0) sendLevelUpNotification(lvl)
      } else if (
        typeof response.newLevel === 'number' &&
        typeof response.level === 'number' &&
        response.newLevel > response.level
      ) {
        sendLevelUpNotification(response.newLevel)
      }
    })
    return unsubscribe
  }, [permission, n.levelUpAlerts])

  // ---------------------------------------------------------------------
  // 5. Achievement-unlock notifications via storage watch
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (permission !== 'granted') return
    if (!n.achievementAlerts) return

    let lastSeen: Set<string> = (() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.achievementsSeen)
        if (!raw) return new Set<string>()
        return new Set<string>(JSON.parse(raw) as string[])
      } catch {
        return new Set<string>()
      }
    })()

    const checkForNew = (nextRaw: string | null) => {
      if (!nextRaw) return
      let nextSet: Set<string>
      try {
        nextSet = new Set<string>(JSON.parse(nextRaw) as string[])
      } catch {
        return
      }
      // Find ids present in `nextSet` but not in `lastSeen`.
      const newIds: string[] = []
      for (const id of nextSet) {
        if (!lastSeen.has(id)) newIds.push(id)
      }
      lastSeen = nextSet
      if (newIds.length === 0) return
      if (!settingsRef.current.achievementAlerts) return
      if (getNotificationPermission() !== 'granted') return
      for (const id of newIds) {
        const title = ACHIEVEMENT_TITLES[id]
        if (title) sendAchievementNotification(title)
      }
    }

    // Cross-tab updates.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEYS.achievementsSeen) return
      checkForNew(e.newValue)
    }
    // Same-tab updates (the achievements hook dispatches a synthetic
    // ky:storage event whenever it saves the seen set).
    const onLocal = (e: Event) => {
      const ce = e as CustomEvent<{ key: string; value: unknown }>
      if (!ce.detail || ce.detail.key !== STORAGE_KEYS.achievementsSeen) return
      // The synthetic event carries the new value directly; serialise
      // it back to a JSON string so `checkForNew` can parse it.
      try {
        checkForNew(JSON.stringify(ce.detail.value ?? []))
      } catch {
        /* ignore */
      }
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener('ky:storage', onLocal as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('ky:storage', onLocal as EventListener)
    }
  }, [permission, n.achievementAlerts])

  // ---------------------------------------------------------------------
  // 6. Cleanup on unmount — belt-and-braces. The per-effect cleanups
  // already cancel their own handles, but a cancel-all here ensures
  // we never leak a timer if React skips an effect cleanup (it
  // shouldn't, but the cost is negligible).
  // ---------------------------------------------------------------------
  useEffect(() => {
    return () => {
      cancelReadingReminder()
    }
  }, [])

  // ---------------------------------------------------------------------
  // Exposed actions
  // ---------------------------------------------------------------------
  const requestPermission = useCallback(async () => {
    const result = await requestNotificationPermission()
    setPermission(result)
    return result
  }, [])

  const sendTest = useCallback(() => {
    return sendTestNotification()
  }, [])

  const isEnabled = Boolean(
    n.dailyReminder ||
      n.streakAlerts ||
      n.achievementAlerts ||
      n.levelUpAlerts ||
      n.weeklyReport ||
      n.newBookAlerts,
  )

  return {
    permission,
    loaded,
    requestPermission,
    sendTestNotification: sendTest,
    isEnabled,
  }
}
