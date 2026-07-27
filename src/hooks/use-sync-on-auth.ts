/**
 * useSyncOnAuth — hydrate all server-side data when a user signs in.
 *
 * This hook is the heart of the Universal Sync Engine. When a user logs in,
 * it pulls down *all* their data (Settings, Progress, Vocabularies, History,
 * Goals, Collections) in a single request and populates the local IndexedDB.
 * 
 * This ensures cross-device parity (a user signing in on their phone instantly
 * gets their laptop's settings and reading progress).
 */

'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { get, set } from 'idb-keyval'

const KEYS = {
  COLLECTIONS: 'ky_collections',
  GOALS: 'ky_goals',
  HISTORY: 'ky_reading_history',
  SETTINGS: 'ky_reader_settings',
  PROGRESS: 'ky_progress',
  VOCABULARY: 'ky_vocabulary_list', // Assuming we have a local key for this
}

export function useSyncOnAuth() {
  const { data: session, status } = useSession()
  const hydrated = useRef(false)

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return
    if (hydrated.current) return // only once per session
    hydrated.current = true

    async function runUniversalSync() {
      try {
        const res = await fetch('/api/sync/full', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!data) return

        // 1. Hydrate Collections (Merge by slug)
        if (data.collections?.length > 0) {
          const raw = await get(KEYS.COLLECTIONS)
          const local: any[] = raw ? JSON.parse(raw) : []
          const bySlug = new Map<string, any>()
          for (const c of local) bySlug.set(c.slug, c)
          for (const c of data.collections) bySlug.set(c.slug, c)
          await set(KEYS.COLLECTIONS, JSON.stringify([...bySlug.values()]))
          window.dispatchEvent(new CustomEvent('ky:storage', { detail: { key: KEYS.COLLECTIONS } }))
        }

        // 2. Hydrate Goals (Merge keys)
        if (data.goals && Object.keys(data.goals).length > 0) {
          const raw = await get(KEYS.GOALS)
          const local = raw ? JSON.parse(raw) : {}
          const merged = { ...local, ...data.goals }
          await set(KEYS.GOALS, JSON.stringify(merged))
          window.dispatchEvent(new CustomEvent('ky:storage', { detail: { key: KEYS.GOALS } }))
        }

        // 3. Hydrate History (Merge by bookSlug)
        if (data.history?.length > 0) {
          const raw = await get(KEYS.HISTORY)
          const local: any[] = raw ? JSON.parse(raw) : []
          const bySlug = new Map<string, any>()
          for (const h of local) bySlug.set(h.bookSlug, h)
          for (const h of data.history) bySlug.set(h.bookSlug, h)
          await set(KEYS.HISTORY, JSON.stringify([...bySlug.values()]))
          window.dispatchEvent(new CustomEvent('ky:storage', { detail: { key: KEYS.HISTORY } }))
        }

        // 4. Hydrate Settings (Server wins on explicit cross-device sync)
        if (data.settings) {
          let parsedSettings = data.settings
          if (typeof parsedSettings === 'string') {
            try { parsedSettings = JSON.parse(parsedSettings) } catch { /* ignore */ }
          }
          await set(KEYS.SETTINGS, JSON.stringify({ state: parsedSettings, version: 1 }))
          window.dispatchEvent(new CustomEvent('ky:storage', { detail: { key: KEYS.SETTINGS } }))
        }

        // 5. Hydrate Reading Progress (Merge by bookSlug)
        if (data.progress?.length > 0) {
          const raw = await get(KEYS.PROGRESS)
          const local: any[] = raw ? JSON.parse(raw) : []
          const bySlug = new Map<string, any>()
          for (const p of local) bySlug.set(p.bookSlug, p)
          for (const p of data.progress) bySlug.set(p.bookSlug, p)
          await set(KEYS.PROGRESS, JSON.stringify([...bySlug.values()]))
          window.dispatchEvent(new CustomEvent('ky:storage', { detail: { key: KEYS.PROGRESS } }))
        }

      } catch (err) {
        console.error('[UniversalSync] Hydration failed. Operating in full offline mode.', err)
      }
    }

    runUniversalSync()
  }, [status, session])
}
