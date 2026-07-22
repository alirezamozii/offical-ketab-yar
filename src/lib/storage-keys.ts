'use client'

/**
 * Centralized localStorage key registry for Ketab-Yar.
 *
 * ─ Why this exists ────────────────────────────────────────────────────────
 * Previously every hook/component declared its own `const KEY = 'ky_xxx'`
 * string literal. That made it easy for keys to drift (typos like
 * `ky_reading_prefs` vs the real `ky_reader_prefs`), and made it hard to
 * bulk-clear local data or wire up cross-tab sync. This module is the single
 * source of truth — grep for `STORAGE_KEYS.<name>` to find every reader.
 *
 * Conventions:
 *  • Every key starts with the `ky_` prefix.
 *  • Per-entity keys (per-book, per-day) live as a `Prefix` entry — pass the
 *    suffix (slug / ISO date) to `getStorageKey()`.
 *  • New keys should be added here, not invented ad-hoc.
 *
 * Cross-tab sync: see `useStorageSync` at the bottom of this file.
 */

import { useCallback, useEffect, useState } from 'react'

// ---------------------------------------------------------------------------
// Static keys (single global value)
// ---------------------------------------------------------------------------
const STATIC_KEYS = {
  /** Map<slug, FavoriteBook> — favorited books. */
  favorites: 'ky_favorites',
  /** Map<slug, ProgressEntry> — per-book reading progress (the ONE truth). */
  progress: 'ky_progress',
  /** ReadingPreferences (theme, language, column, margins, etc.). */
  readerPrefs: 'ky_reader_prefs',
  /** SrsMap<wordId, SrsRecord> — Leitner spaced-repetition state. */
  srs: 'ky_srs',
  /** StreakData — active days, current/longest streak, today's seconds. */
  streak: 'ky_streak',
  /** string[] of achievement ids the user has already been notified about. */
  achievementsSeen: 'ky_achievements_seen',
  /** Record<id, ISO timestamp> — when each achievement was first observed unlocked (gallery dates). */
  achievementsUnlockedAt: 'ky_achievements_unlocked_at',
  /** number — count of vocab games ever played. */
  vocabGamesPlayed: 'ky_vocab_games_played',
  /** ISO string — first-seen timestamp for the profile "عضو از" label. */
  memberSince: 'ky_member_since',
  /** 'grid' | 'list' — library list view preference. */
  libraryView: 'ky_lib_view',
  /** StatusValue — library "all|unread|reading|finished" filter. */
  libraryStatus: 'ky_lib_status',
  /** XPTodayRecord — today's XP baseline + gained. */
  xpToday: 'ky_xp_today',
  /** number — last known level, for level-up celebration detection. */
  lastLevel: 'ky_last_level',
  /** PracticeStats — vocab practice lifetime counters. */
  practiceStats: 'ky_practice_stats',
  /** string[] — recent search terms (most-recent-first). */
  recentSearches: 'ky_recent_searches',
  /** RecentPageEntry[] — recently-visited book reader pages (most-recent-first). */
  recentPages: 'ky_recent_pages',
  /** string — id of the most-recently-submitted review (sessionStorage mirror). */
  newReview: 'ky_new_review',
  /** VocabCategories — user-defined folder labels + per-word category membership. */
  vocabCategories: 'ky_vocab_categories',
  /** VocabWordMeta — per-word metadata: difficulty (A1-C2), synonyms, antonyms, category ids. */
  vocabWordMeta: 'ky_vocab_word_meta',
  /** VocabActivity — Map<ISO date, number> counting vocab reviews per day (for streaks + daily goal). */
  vocabActivity: 'ky_vocab_activity',
  /** string — ISO date (YYYY-MM-DD) when "daily words" were last rotated. */
  vocabDailyWordsDate: 'ky_vocab_daily_words_date',
  /** boolean — whether vocab game sound effects are enabled. */
  vocabSoundEnabled: 'ky_vocab_sound_enabled',
  /** VocabGamePrefs — preferred difficulty (easy/medium/hard) for each game mode. */
  vocabGamePrefs: 'ky_vocab_game_prefs',
  /** ReaderSessionHistory[] — recent reader session summaries (most-recent-first). */
  readerSessionHistory: 'ky_reader_session_history',
  /** boolean — whether the reader shortcuts tooltip has been shown at least once. */
  readerShortcutsHintSeen: 'ky_reader_shortcuts_hint_seen',
  /** string — preferred UI locale (BCP-47 tag like fa-IR, en-US). */
  locale: 'ky_locale',
  /** GoalsConfig — user-set daily / weekly / monthly reading targets (pages or minutes). */
  goals: 'ky_goals',
  /** ReadingHistoryDay[] — per-day reading aggregates (pages, seconds, hours) for charts + calendar. */
  readingHistory: 'ky_reading_history',
  /** Record<milestoneId, ISO date> — when each reading milestone was first reached (drives the timeline UI). */
  goalsMilestones: 'ky_goals_milestones',
  /** Collection[] — user-defined book collections (bookshelves). Each entry holds name, description, color, icon, and a list of book slugs. */
  collections: 'ky_collections',
  /** UserSettings — global settings: reading prefs, notifications, accessibility, privacy, language (see the legacy settings module). */
  settings: 'ky_settings',
  /** AccentColor — accent color theme key (gold/amber/emerald/rose/teal/stone). */
  accentColor: 'ky_accent_color',
  /** string[] — ids of curated quotes the user has saved from the /quotes gallery. */
  savedQuotes: 'ky_saved_quotes',
  /** OnboardingState — first-run wizard progress (completed/skipped flag, selected level, genres, first book). */
  onboarding: 'ky_onboarding',
  /** boolean — true once the user has dismissed the notifications-permission banner so it doesn't re-appear. */
  notifBannerDismissed: 'ky_notif_banner_dismissed',
} as const

// ---------------------------------------------------------------------------
// Prefixed keys (per-book / per-day) — build with getStorageKey()
// ---------------------------------------------------------------------------
const PREFIX_KEYS = {
  /** `ky_hl_{slug}` — Highlight[] for a given book. */
  highlights: 'ky_hl_',
  /** `ky_complete_{slug}` — '1' once the completion XP bonus has been paid out. */
  bookComplete: 'ky_complete_',
  /** `ky_chat_{slug}` — ChatMessage[] for the AI assistant on a given book. */
  chat: 'ky_chat_',
  /** `ky_xp_baseline_{date}` — XP total at the start of the given day. */
  xpBaseline: 'ky_xp_baseline_',
  /** `ky_challenges_{date}` — StateMap of daily-challenge progress. */
  challenges: 'ky_challenges_',
  /** `ky_challenges_bonus_{date}` — '1' once the all-done bonus was claimed. */
  challengesBonus: 'ky_challenges_bonus_',
  /** `ky_vocab_baseline_{date}` — vocab count at start of day. */
  vocabBaseline: 'ky_vocab_baseline_',
  /** `ky_pages_baseline_{date}` — pages-read total at start of day. */
  pagesBaseline: 'ky_pages_baseline_',
  /** `ky_games_today_{date}` — vocab games played on the given day. */
  gamesToday: 'ky_games_today_',
  /** `ky_bm_{slug}` — ReaderBookmark[] for a given book. */
  bookmarks: 'ky_bm_',
} as const

/**
 * Union of every named key (static + prefix). Components use this to refer to
 * keys by name rather than by raw string, so renames are refactor-safe.
 */
export const STORAGE_KEYS = {
  ...STATIC_KEYS,
  ...PREFIX_KEYS,
} as const

export type StorageKeyName = keyof typeof STORAGE_KEYS
export type StaticStorageKeyName = keyof typeof STATIC_KEYS
export type PrefixStorageKeyName = keyof typeof PREFIX_KEYS

/**
 * Build a fully-qualified localStorage key.
 *
 * Static keys take no suffix:
 *   getStorageKey('favorites') → 'ky_favorites'
 *
 * Prefix keys require a suffix (the book slug, ISO date, etc.):
 *   getStorageKey('highlights', 'alice') → 'ky_hl_alice'
 *
 * Note: passing a suffix for a static key is a programmer error and is
 * ignored at runtime — `STORAGE_KEYS[name]` is the entire key.
 */
export function getStorageKey(
  name: StaticStorageKeyName | PrefixStorageKeyName,
  suffix?: string,
): string {
  const base = STORAGE_KEYS[name]
  if (!base) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[storage-keys] unknown key name: ${String(name)}`)
    }
    return ''
  }
  // A prefix key always ends with `_` by convention; if a suffix is provided
  // (even for a static key) we append it. For static keys the caller should
  // not pass a suffix — but if they do, the most useful behavior is still to
  // append it (e.g. a future namespaced variant).
  return suffix ? `${base}${suffix}` : base
}

// ---------------------------------------------------------------------------
// Bulk helpers
// ---------------------------------------------------------------------------

/**
 * Returns the static storage keys that should be wiped when the user clicks
 * "Clear local data" on the profile page. Per-book / per-day prefix keys
 * can't all be enumerated cheaply, so the caller is expected to loop over
 * `localStorage` and delete by prefix when needed — see `clearAllKyStorage`.
 */
export function clearableStaticKeys(): readonly string[] {
  return [
    STATIC_KEYS.favorites,
    STATIC_KEYS.progress,
    STATIC_KEYS.readerPrefs,
    STATIC_KEYS.srs,
    STATIC_KEYS.streak,
    STATIC_KEYS.achievementsSeen,
    STATIC_KEYS.achievementsUnlockedAt,
    STATIC_KEYS.vocabGamesPlayed,
    STATIC_KEYS.memberSince,
    STATIC_KEYS.libraryView,
    STATIC_KEYS.libraryStatus,
    STATIC_KEYS.xpToday,
    STATIC_KEYS.lastLevel,
    STATIC_KEYS.practiceStats,
    STATIC_KEYS.recentSearches,
    STATIC_KEYS.recentPages,
    STATIC_KEYS.vocabCategories,
    STATIC_KEYS.vocabWordMeta,
    STATIC_KEYS.vocabActivity,
    STATIC_KEYS.vocabDailyWordsDate,
    STATIC_KEYS.vocabSoundEnabled,
    STATIC_KEYS.vocabGamePrefs,
    STATIC_KEYS.readerSessionHistory,
    STATIC_KEYS.readerShortcutsHintSeen,
    STATIC_KEYS.locale,
    STATIC_KEYS.goals,
    STATIC_KEYS.readingHistory,
    STATIC_KEYS.goalsMilestones,
    STATIC_KEYS.collections,
    STATIC_KEYS.settings,
    STATIC_KEYS.accentColor,
    STATIC_KEYS.savedQuotes,
    STATIC_KEYS.onboarding,
    STATIC_KEYS.notifBannerDismissed,
  ]
}

/** Prefixes that should be wiped when the user clears local data. */
export function clearablePrefixes(): readonly string[] {
  return [
    PREFIX_KEYS.highlights,
    PREFIX_KEYS.bookComplete,
    PREFIX_KEYS.chat,
    PREFIX_KEYS.xpBaseline,
    PREFIX_KEYS.challenges,
    PREFIX_KEYS.challengesBonus,
    PREFIX_KEYS.vocabBaseline,
    PREFIX_KEYS.pagesBaseline,
    PREFIX_KEYS.gamesToday,
    PREFIX_KEYS.bookmarks,
  ]
}

/**
 * Wipe every Ketab-Yar localStorage entry — static keys + every prefixed
 * variant (ky_hl_*, ky_chat_*, ky_challenges_*, etc.). Safe to call from
 * the client only. Returns the number of entries removed.
 *
 * This replaces the old hand-maintained array in profile-client.tsx which
 * had drifted (it referenced `ky_reading_prefs` (typo for `ky_reader_prefs`)
 * and `ky_highlights` (no such key — real key is `ky_hl_{slug}`)).
 */
export function clearAllKyStorage(): number {
  if (typeof window === 'undefined') return 0
  const toRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k || !k.startsWith('ky_')) continue
    // Skip the session cookie mirror — ky_guest is a cookie, never in LS,
    // but guard against future overlap.
    if (k === 'ky_guest') continue
    toRemove.push(k)
  }
  for (const k of toRemove) {
    try {
      localStorage.removeItem(k)
    } catch {
      /* ignore quota / private-mode errors */
    }
  }
  return toRemove.length
}

// ---------------------------------------------------------------------------
// Cross-tab sync hook
// ---------------------------------------------------------------------------

/**
 * `useStorageSync` — a useState-shaped hook backed by localStorage with
 * automatic cross-tab synchronization.
 *
 * What it does:
 *  1. Reads the initial value from `localStorage[key]` on mount (falling
 *     back to `initialValue`). The value is JSON-parsed.
 *  2. On `setValue`, writes JSON to `localStorage[key]`. The browser fires
 *     a `storage` event in *other* tabs (not the originating one) — those
 *     tabs re-read and update.
 *  3. Also listens for the local `storage` event, so changes from other
 *     hooks in the *same* tab that call `localStorage.setItem(key, ...)`
 *     are picked up too. Browsers don't fire `storage` for the originating
 *     tab, so we additionally dispatch a synthetic `'ky:storage'`
 *     CustomEvent from `setValue` to bridge the gap.
 *
 * The hook is generic over `T`. Pass any JSON-serializable type.
 *
 * Usage:
 *   const [favorites, setFavorites] = useStorageSync(STORAGE_KEYS.favorites, {})
 *
 * Note: the hook intentionally keeps its API surface identical to useState
 * so callers can swap `useState` → `useStorageSync` with minimal changes.
 */
export function useStorageSync<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initialValue)

  // Hydrate from localStorage on mount (client-only). Re-runs when `key`
  // changes (rare but supported — e.g. switching from a per-book to a
  // global key).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw != null) {
        setValue(JSON.parse(raw) as T)
      } else {
        // Seed localStorage with the initial value so other tabs see it.
        try {
          localStorage.setItem(key, JSON.stringify(initialValue))
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* corrupt JSON — keep initialValue */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialValue is a seed-only fallback; including it would re-run the effect on every parent re-render.
  }, [key])

  // Cross-tab + same-tab sync. Browsers fire `storage` only in OTHER tabs,
  // so we additionally listen for a synthetic `'ky:storage'` CustomEvent
  // dispatched by our own `set` (below) for same-tab consumers.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return
      try {
        setValue(
          e.newValue == null ? initialValue : (JSON.parse(e.newValue) as T),
        )
      } catch {
        /* ignore parse errors */
      }
    }
    const onLocal = (e: Event) => {
      const ce = e as CustomEvent<{ key: string; value: unknown }>
      if (!ce.detail || ce.detail.key !== key) return
      setValue(ce.detail.value as T)
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('ky:storage', onLocal as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('ky:storage', onLocal as EventListener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialValue is a fallback for null storage values; including it would re-subscribe on every parent re-render.
  }, [key])

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === 'function' ? (next as (p: T) => T)(prev) : next
        try {
          localStorage.setItem(key, JSON.stringify(resolved))
          // Broadcast to same-tab listeners (other hooks subscribed to the
          // same key). Browsers don't fire `storage` for the originating tab.
          window.dispatchEvent(
            new CustomEvent('ky:storage', {
              detail: { key, value: resolved },
            }),
          )
        } catch {
          /* ignore quota / private-mode errors */
        }
        return resolved
      })
    },
    [key],
  )

  return [value, set]
}
