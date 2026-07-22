/**
 * useSyncOnAuth — hydrate server-side data when a user signs in.
 *
 * Problem: collections, goals, and reading history are stored in localStorage
 * for offline-first support. But when a user signs in on a new device, their
 * localStorage is empty — so they see no collections/goals/history even though
 * the server has them.
 *
 * Solution: when `useSession()` reports an authenticated user, fire the
 * `/api/{collections,goals,reading/history}/sync` GET endpoints to hydrate
 * localStorage from the server. This runs once per signin.
 *
 * The sync is one-directional (server → localStorage) on mount. Writes still
 * go to localStorage first (offline-first), then to the server via POST.
 * The merge-on-signin flow (in NextAuth signIn callback) handles the
 * guest → user re-parenting.
 *
 * Usage:
 *   useSyncOnAuth()  // call once, near the app root (inside SessionProvider)
 */

'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

// Storage keys mirrored from src/lib/storage-keys.ts (kept inline to avoid
// a circular import — these never change).
const COLLECTIONS_KEY = 'ky_collections'
const GOALS_KEY = 'ky_goals'
const HISTORY_KEY = 'ky_reading_history'

async function hydrate(_key: string, url: string, merge: (server: unknown) => void) {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    if (!data || (Array.isArray(data) && data.length === 0)) return
    merge(data)
  } catch {
    // Network error or parse error — silently fall back to localStorage.
    // The user can still use the app offline; sync will retry next mount.
  }
}

export function useSyncOnAuth() {
  const { data: session, status } = useSession()
  const hydrated = useRef(false)

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return
    if (hydrated.current) return // only once per session
    hydrated.current = true

    // Hydrate collections: merge server collections into localStorage (server wins
    // on conflict by slug, since the server is authoritative for signed-in users).
    hydrate(COLLECTIONS_KEY, '/api/collections/sync', (server) => {
      try {
        const serverCols = (server as Array<{ slug: string; [k: string]: unknown }>) ?? []
        if (serverCols.length === 0) return
        const raw = localStorage.getItem(COLLECTIONS_KEY)
        const local: Array<{ slug: string; [k: string]: unknown }> = raw ? JSON.parse(raw) : []
        const bySlug = new Map<string, { slug: string; [k: string]: unknown }>()
        // Local first (lower priority), then server overwrites.
        for (const c of local) bySlug.set(c.slug, c)
        for (const c of serverCols) bySlug.set(c.slug, c)
        localStorage.setItem(COLLECTIONS_KEY, JSON.stringify([...bySlug.values()]))
        // Notify same-tab listeners that the store changed.
        window.dispatchEvent(new CustomEvent('ky:storage', { detail: { key: COLLECTIONS_KEY } }))
      } catch {
        /* corrupt local — server data will be used on next read */
      }
    })

    // Hydrate goals.
    hydrate(GOALS_KEY, '/api/goals/sync', (server) => {
      try {
        const serverGoals = server as { goals?: unknown[]; milestones?: unknown[] } | null
        if (!serverGoals) return
        // Server returns { goals, milestones } — merge into localStorage,
        // preserving any local-only goals not yet synced.
        const raw = localStorage.getItem(GOALS_KEY)
        const local = raw ? JSON.parse(raw) : { goals: [], milestones: [] }
        const merged = {
          goals: [...(local.goals ?? []), ...(serverGoals.goals ?? [])],
          milestones: [...(local.milestones ?? []), ...(serverGoals.milestones ?? [])],
        }
        localStorage.setItem(GOALS_KEY, JSON.stringify(merged))
        window.dispatchEvent(new CustomEvent('ky:storage', { detail: { key: GOALS_KEY } }))
      } catch {
        /* ignore */
      }
    })

    // Hydrate reading history.
    hydrate(HISTORY_KEY, '/api/reading/history/sync', (server) => {
      try {
        const serverHistory = (server as Array<{ bookSlug: string; [k: string]: unknown }>) ?? []
        if (serverHistory.length === 0) return
        const raw = localStorage.getItem(HISTORY_KEY)
        const local: Array<{ bookSlug: string; [k: string]: unknown }> = raw ? JSON.parse(raw) : []
        const bySlug = new Map<string, { bookSlug: string; [k: string]: unknown }>()
        for (const h of local) bySlug.set(h.bookSlug, h)
        for (const h of serverHistory) bySlug.set(h.bookSlug, h)
        localStorage.setItem(HISTORY_KEY, JSON.stringify([...bySlug.values()]))
        window.dispatchEvent(new CustomEvent('ky:storage', { detail: { key: HISTORY_KEY } }))
      } catch {
        /* ignore */
      }
    })
  }, [status, session])
}
