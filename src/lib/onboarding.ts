'use client'

/**
 * src/lib/onboarding.ts
 * ---------------------------------------------------------------
 * First-run onboarding state — persisted to localStorage under
 * `STORAGE_KEYS.onboarding` (`ky_onboarding`).
 *
 * The state drives the OnboardingFlow dialog: when `completed` is
 * `false` AND `skipped` is `false`, the OnboardingTrigger renders
 * the wizard on next mount. Both flags are sticky (only the
 * `resetOnboarding()` helper clears them) so returning users never
 * see the wizard a second time unless they explicitly reset it from
 * the Settings → About section.
 *
 * Owner: onboarding-flow-builder (CRON4-B).
 * ---------------------------------------------------------------
 */

import { useCallback, useEffect, useState } from 'react'
import { STORAGE_KEYS } from '@/lib/storage-keys'

/**
 * Onboarding wizard state. All fields optional except `completed`
 * and `skipped` (the two flags the trigger checks).
 *
 *   - `completed`   — true once the user finishes (or skips) the wizard.
 *   - `skipped`     — true if the user hit "رد کردن" instead of finishing.
 *   - `step`        — last step index the user was on (0..4).
 *   - `readingLevel` — 'beginner' | 'intermediate' | 'advanced'.
 *   - `favoriteGenres` — list of genre tag strings (Fiction, Classic, …).
 *   - `firstBookSlug` — slug of the book the user chose as their first read.
 *   - `completedAt`  — ISO timestamp of completion (for analytics / "member since").
 */
export interface OnboardingState {
  completed: boolean
  skipped: boolean
  step: number
  readingLevel?: string
  favoriteGenres?: string[]
  firstBookSlug?: string
  completedAt?: string
}

/** Fresh state for a brand-new user. */
export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  completed: false,
  skipped: false,
  step: 0,
}

/**
 * Read the onboarding state from localStorage. Safe to call during SSR
 * (returns the default state — never throws).
 */
export function getOnboardingState(): OnboardingState {
  if (typeof window === 'undefined') return { ...DEFAULT_ONBOARDING_STATE }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.onboarding)
    if (!raw) return { ...DEFAULT_ONBOARDING_STATE }
    const parsed = JSON.parse(raw) as Partial<OnboardingState>
    // Defensive merge — old/corrupt entries fall back to defaults so the
    // wizard never crashes on parse errors.
    return {
      ...DEFAULT_ONBOARDING_STATE,
      ...parsed,
    }
  } catch {
    return { ...DEFAULT_ONBOARDING_STATE }
  }
}

/**
 * Persist the onboarding state. Silently ignores quota / private-mode
 * errors — the wizard should keep working even if persistence fails.
 */
export function setOnboardingState(state: OnboardingState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.onboarding, JSON.stringify(state))
    // Broadcast to same-tab listeners (Browsers don't fire `storage`
    // for the originating tab — same pattern as useStorageSync).
    window.dispatchEvent(
      new CustomEvent('ky:storage', {
        detail: { key: STORAGE_KEYS.onboarding, value: state },
      }),
    )
  } catch {
    /* ignore quota / private-mode errors */
  }
}

/**
 * Mark onboarding as completed with the user's selections. Awards a
 * "first login" XP bonus (POST /api/xp with `isFirstReadToday: true`
 * so the backend credits +50 first-read-of-the-day XP). The bonus is
 * intentionally fired-and-forgotten — the wizard still completes if
 * the network is offline.
 */
export async function completeOnboarding(
  state?: Partial<Omit<OnboardingState, 'completed' | 'skipped' | 'completedAt'>>,
): Promise<void> {
  const prev = getOnboardingState()
  const next: OnboardingState = {
    ...prev,
    ...state,
    completed: true,
    skipped: false,
    completedAt: new Date().toISOString(),
  }
  setOnboardingState(next)
  // Fire the XP bonus. We import lazily so SSR code paths that call
  // completeOnboarding (there are none today, but be safe) don't pull
  // the fetch-based xp-events module into the server bundle.
  try {
    const { postXP } = await import('@/lib/xp-events')
    await postXP({ isFirstReadToday: true })
  } catch {
    /* ignore — onboarding must complete even if XP award fails */
  }
}

/**
 * Skip the wizard with sensible defaults (level B1/intermediate, no
 * genres, no first book). Marks `completed = true` so the trigger
 * doesn't re-show it on the next page load.
 */
export function skipOnboarding(): void {
  const prev = getOnboardingState()
  const next: OnboardingState = {
    ...prev,
    completed: true,
    skipped: true,
    readingLevel: prev.readingLevel ?? 'intermediate',
    completedAt: new Date().toISOString(),
  }
  setOnboardingState(next)
}

/**
 * Reset onboarding state back to defaults — called from the Settings →
 * About section's "بازنشانی معرفی" button so the user can re-run the
 * wizard (e.g. to re-pick genres or change their first book).
 */
export function resetOnboarding(): void {
  setOnboardingState({ ...DEFAULT_ONBOARDING_STATE })
}

/**
 * React hook that subscribes to onboarding state with cross-tab sync.
 *
 * Returns `[state, refresh]` where `refresh` re-reads from localStorage
 * (useful after `completeOnboarding` / `resetOnboarding` in the same tab).
 */
export function useOnboarding(): {
  state: OnboardingState
  refresh: () => void
} {
  const [state, setState] = useState<OnboardingState>(DEFAULT_ONBOARDING_STATE)

  const refresh = useCallback(() => {
    setState(getOnboardingState())
  }, [])

  // Hydrate on mount (client-only) to avoid SSR/CSR mismatch.
  useEffect(() => {
    refresh()
  }, [refresh])

  // Cross-tab + same-tab sync (mirrors useStorageSync pattern).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEYS.onboarding) return
      refresh()
    }
    const onLocal = (e: Event) => {
      const ce = e as CustomEvent<{ key: string; value: unknown }>
      if (!ce.detail || ce.detail.key !== STORAGE_KEYS.onboarding) return
      // value may be the partial just-written; re-read from storage to be safe.
      refresh()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('ky:storage', onLocal as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('ky:storage', onLocal as EventListener)
    }
  }, [refresh])

  return { state, refresh }
}
