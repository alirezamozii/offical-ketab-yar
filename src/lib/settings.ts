'use client'

/**
 * src/lib/settings.ts — centralized user-settings module for Ketab-Yar.
 *
 * Spiritual successor to `src/lib/the legacy settings module` (renamed; the old
 * path is removed). The TypeScript types + React hooks + localStorage
 * persistence all live here.
 *
 * The settings themselves are NOT in the `SettingDef` Prisma model —
 * `SettingDef` is for **app-wide admin-tunable defaults** (e.g. the
 * first-read XP bonus, the daily-reminder default time). Per-user
 * settings (typography, accent color, notification prefs) live in
 * `localStorage` only, keyed by `STORAGE_KEYS.settings` /
 * `STORAGE_KEYS.accentColor`, so they work offline + without an account.
 *
 * Sections:
 *   • reading         — typography & layout for the book reader
 *   • notifications   — daily reminders, streak/achievement alerts
 *   • accessibility   — reduced motion, high contrast, large text, …
 *   • privacy         — share stats / history / public profile
 *   • language        — interface + book-language preference
 *
 * Cross-tab sync is provided via the `storage` event so an open reader
 * tab picks up theme/font changes made in /settings.
 */

import { useCallback, useEffect, useState } from 'react'
import { STORAGE_KEYS } from '@/lib/storage-keys'

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

export type ReadingFontFamily = 'vazirmatn' | 'serif' | 'sans'
export type ReadingTheme = 'day' | 'night' | 'sepia' | 'high-contrast'
export type ReadingLayout = 'paginated' | 'continuous'
export type ReadingMarginWidth = 'narrow' | 'medium' | 'wide'

export interface ReadingSettings {
  /** Font size in px (14–24). */
  fontSize: number
  /** Line-height multiplier (1.4–2.2). */
  lineHeight: number
  /** Letter-spacing in em (-0.05..0.05). */
  letterSpacing: number
  fontFamily: ReadingFontFamily
  /** Reading column margin density. */
  marginWidth: ReadingMarginWidth
  /** Per-paragraph background theme. */
  theme: ReadingTheme
  /** Continuous scroll vs. paginated page-flip. */
  layout: ReadingLayout
  /** Render a drop cap on the first letter of each paragraph. */
  dropCaps: boolean
  /** Show paragraph numbers in the margin. */
  paragraphNumbers: boolean
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface NotificationSettings {
  /** Daily reminder to read. */
  dailyReminder: boolean
  /** Time-of-day (HH:MM) for the daily reminder. */
  reminderTime: string
  /** Warn the user before their streak breaks. */
  streakAlerts: boolean
  /** Time-of-day (HH:MM) to send the streak-protection warning (default 20:00). */
  streakAlertsTime: string
  /** Toast on new achievement unlock. */
  achievementAlerts: boolean
  /** Toast + notification when the user reaches a new level. */
  levelUpAlerts: boolean
  /** Weekly reading-summary push/notification. */
  weeklyReport: boolean
  /** Notify when new books matching the user's interests are added. */
  newBookAlerts: boolean
}

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

export interface AccessibilitySettings {
  /** Disable all animations across the app. */
  reducedMotion: boolean
  /** Max-contrast surfaces + text. */
  highContrast: boolean
  /** Bump the root font-size up. */
  largeText: boolean
  /** Tidy DOM for screen readers (aria-hidden decorative clutter). */
  screenReaderOptimized: boolean
  /** Always render visible focus rings. */
  focusIndicators: boolean
}

// ---------------------------------------------------------------------------
// Privacy
// ---------------------------------------------------------------------------

export interface PrivacySettings {
  /** Share aggregated reading stats (pages, streak) on the leaderboard. */
  shareStats: boolean
  /** Share per-book reading history publicly. */
  shareReadingHistory: boolean
  /** Profile page is discoverable by other readers. */
  publicProfile: boolean
  /** Appear in the global leaderboard. */
  showInLeaderboard: boolean
}

// ---------------------------------------------------------------------------
// Language
// ---------------------------------------------------------------------------

export type InterfaceLanguage = 'fa' | 'en'
export type BookLanguagePreference = 'en' | 'fa' | 'both'

export interface LanguageSettings {
  /** App UI language. */
  interfaceLanguage: InterfaceLanguage
  /** Preferred language for book recommendations. */
  bookLanguagePreference: BookLanguagePreference
  /** Suggested language for new books the user is shown. */
  preferredNewBookLanguage: BookLanguagePreference
}

// ---------------------------------------------------------------------------
// Combined settings
// ---------------------------------------------------------------------------

export interface UserSettings {
  reading: ReadingSettings
  notifications: NotificationSettings
  accessibility: AccessibilitySettings
  privacy: PrivacySettings
  language: LanguageSettings
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_READING: ReadingSettings = {
  fontSize: 20,
  lineHeight: 1.8,
  letterSpacing: 0,
  fontFamily: 'vazirmatn',
  marginWidth: 'medium',
  theme: 'sepia',
  layout: 'continuous',
  dropCaps: false,
  paragraphNumbers: false,
}

export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  dailyReminder: true,
  reminderTime: '20:00',
  streakAlerts: true,
  streakAlertsTime: '20:00',
  achievementAlerts: true,
  levelUpAlerts: true,
  weeklyReport: true,
  newBookAlerts: false,
}

export const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  screenReaderOptimized: false,
  focusIndicators: false,
}

export const DEFAULT_PRIVACY: PrivacySettings = {
  shareStats: true,
  shareReadingHistory: false,
  publicProfile: false,
  showInLeaderboard: true,
}

export const DEFAULT_LANGUAGE: LanguageSettings = {
  interfaceLanguage: 'fa',
  bookLanguagePreference: 'both',
  preferredNewBookLanguage: 'en',
}

export const DEFAULT_SETTINGS: UserSettings = {
  reading: DEFAULT_READING,
  notifications: DEFAULT_NOTIFICATIONS,
  accessibility: DEFAULT_ACCESSIBILITY,
  privacy: DEFAULT_PRIVACY,
  language: DEFAULT_LANGUAGE,
}

// ---------------------------------------------------------------------------
// Accent colors
// ---------------------------------------------------------------------------

export type AccentColor = 'gold' | 'amber' | 'emerald' | 'rose' | 'teal' | 'stone'

export const ACCENT_COLORS: Record<
  AccentColor,
  { label: string; swatch: string; ring: string }
> = {
  gold: { label: 'طلایی', swatch: '#b8956a', ring: 'ring-gold-500' },
  amber: { label: 'کهربایی', swatch: '#d97706', ring: 'ring-amber-500' },
  emerald: { label: 'زمردی', swatch: '#10b981', ring: 'ring-emerald-500' },
  rose: { label: 'گلی', swatch: '#f43f5e', ring: 'ring-rose-500' },
  teal: { label: 'فیروزه‌ای', swatch: '#14b8a6', ring: 'ring-teal-500' },
  stone: { label: 'سنگی', swatch: '#78716c', ring: 'ring-stone-500' },
}

export const DEFAULT_ACCENT: AccentColor = 'gold'

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const SETTINGS_KEY = STORAGE_KEYS.settings
const ACCENT_KEY = STORAGE_KEYS.accentColor

/** Deep-merge `partial` onto `base` (one level — used to hydrate settings). */
function mergeSettings(base: UserSettings, partial: unknown): UserSettings {
  if (!partial || typeof partial !== 'object') return base
  const p = partial as Record<string, unknown>
  const out: UserSettings = { ...base }
  ;(Object.keys(base) as (keyof UserSettings)[]).forEach((section) => {
    const incoming = p[section]
    if (incoming && typeof incoming === 'object') {
      out[section] = { ...base[section], ...(incoming as object) } as never
    }
  })
  return out
}

/** Synchronously read the persisted settings from localStorage (client-only). */
export function getSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return mergeSettings(DEFAULT_SETTINGS, JSON.parse(raw))
  } catch {
    return DEFAULT_SETTINGS
  }
}

/** Persist `settings` to localStorage (client-only). */
export function saveSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    // Cross-tab + same-tab broadcast — see storage-keys useStorageSync.
    window.dispatchEvent(
      new CustomEvent('ky:storage', {
        detail: { key: SETTINGS_KEY, value: settings },
      }),
    )
  } catch {
    /* quota / private-mode — ignore */
  }
}

/** Read the accent color from localStorage (client-only). */
export function getAccentColor(): AccentColor {
  if (typeof window === 'undefined') return DEFAULT_ACCENT
  try {
    const raw = localStorage.getItem(ACCENT_KEY) as AccentColor | null
    if (raw && raw in ACCENT_COLORS) return raw
  } catch {
    /* ignore */
  }
  return DEFAULT_ACCENT
}

/** Persist the accent color (client-only). */
export function saveAccentColor(color: AccentColor): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ACCENT_KEY, color)
    window.dispatchEvent(
      new CustomEvent('ky:storage', { detail: { key: ACCENT_KEY, value: color } }),
    )
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

/**
 * `useSettings` — owns the full settings object in React state and keeps
 * it in sync with localStorage. Returns `{ settings, updateSection, update,
 * reset, loaded }`:
 *
 *   • `updateSection(section, key, value)` — patch a single field in a
 *     section (most common case).
 *   • `update(next)` — replace the whole object (used by import).
 *   • `reset()` — restore DEFAULT_SETTINGS.
 *   • `loaded` — false during SSR / first render, true once hydrated.
 */
export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setSettings(getSettings())
    setLoaded(true)
    // Cross-tab sync: re-read when another tab updates settings.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== SETTINGS_KEY) return
      try {
        setSettings(
          e.newValue
            ? mergeSettings(DEFAULT_SETTINGS, JSON.parse(e.newValue))
            : DEFAULT_SETTINGS,
        )
      } catch {
        /* ignore corrupt writes */
      }
    }
    const onLocal = (e: Event) => {
      const ce = e as CustomEvent<{ key: string; value: unknown }>
      if (!ce.detail || ce.detail.key !== SETTINGS_KEY) return
      setSettings(
        ce.detail.value
          ? mergeSettings(DEFAULT_SETTINGS, ce.detail.value)
          : DEFAULT_SETTINGS,
      )
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('ky:storage', onLocal as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('ky:storage', onLocal as EventListener)
    }
  }, [])

  const updateSection = useCallback(
    <S extends keyof UserSettings, K extends keyof UserSettings[S]>(
      section: S,
      key: K,
      value: UserSettings[S][K],
    ) => {
      setSettings((prev) => {
        const next: UserSettings = {
          ...prev,
          [section]: { ...prev[section], [key]: value },
        }
        saveSettings(next)
        return next
      })
    },
    [],
  )

  const update = useCallback((next: UserSettings) => {
    setSettings(next)
    saveSettings(next)
  }, [])

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    saveSettings(DEFAULT_SETTINGS)
  }, [])

  return { settings, updateSection, update, reset, loaded }
}

/**
 * `useAccentColor` — React hook wrapper around `getAccentColor` /
 * `saveAccentColor`. Cross-tab sync is included.
 */
export function useAccentColor() {
  const [color, setColor] = useState<AccentColor>(DEFAULT_ACCENT)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setColor(getAccentColor())
    setLoaded(true)
    const onStorage = (e: StorageEvent) => {
      if (e.key !== ACCENT_KEY) return
      const next = (e.newValue ?? DEFAULT_ACCENT) as AccentColor
      if (next in ACCENT_COLORS) setColor(next)
    }
    const onLocal = (e: Event) => {
      const ce = e as CustomEvent<{ key: string; value: AccentColor }>
      if (!ce.detail || ce.detail.key !== ACCENT_KEY) return
      if (ce.detail.value in ACCENT_COLORS) setColor(ce.detail.value)
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('ky:storage', onLocal as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('ky:storage', onLocal as EventListener)
    }
  }, [])

  const set = useCallback((next: AccentColor) => {
    setColor(next)
    saveAccentColor(next)
  }, [])

  return { color, set, loaded }
}
