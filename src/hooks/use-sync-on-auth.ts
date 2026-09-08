'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getLocalProgress } from '@/hooks/reader/use-local-progress'
import { readCollections, writeCollections, DEFAULT_COLLECTIONS, type Collection } from '@/lib/collections'
import { readReadingHistory, type ReadingHistoryDay } from '@/lib/goals'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { mergeServerProgress, parseStoredArray, type ServerProgress } from '@/lib/sync-data'
import { getQueryClient } from '@/components/providers/query-provider'
import { queryKeys } from '@/lib/api/queries'

interface SyncPayload {
  settings: string | null
  collections: (Omit<Collection, 'bookSlugs'> & { bookSlugs: string })[]
  goals: Record<string, { target: number; unit: string }>
  history: (Omit<ReadingHistoryDay, 'byHour'> & { byHour: string })[]
  progress: ServerProgress[]
  vocabulary: unknown[]
}

function persist(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent('ky:storage', { detail: { key, value } }))
}

/** Hydrate the actual storage used by each feature; cancel stale account fetches. */
export function useSyncOnAuth() {
  const { data: session, status } = useSession()
  const userId = session?.user?.id

  useEffect(() => {
    if (status !== 'authenticated' || !userId) return
    const controller = new AbortController()
    async function sync() {
      try {
        const response = await fetch('/api/sync/full', { cache: 'no-store', signal: controller.signal })
        if (!response.ok) throw new Error('Sync failed: ' + response.status)
        const data: SyncPayload = await response.json()
        if (controller.signal.aborted) return

        const collections = new Map(readCollections().map(c => [c.name, c]))
        for (const row of data.collections) {
          const existing = collections.get(row.name)
          if (existing && Date.parse(existing.updatedAt) > Date.parse(row.updatedAt)) continue
          const defaultCollection = DEFAULT_COLLECTIONS.find(c => c.name === row.name)
          collections.set(row.name, {
            ...row,
            id: defaultCollection?.id ?? row.id,
            isDefault: Boolean(defaultCollection),
            bookSlugs: parseStoredArray<string>(row.bookSlugs),
          })
        }
        writeCollections([...collections.values()])
        persist(STORAGE_KEYS.goals, data.goals)

        const history = new Map(readReadingHistory().map(day => [day.date, day]))
        for (const row of data.history) {
          const local = history.get(row.date)
          const hours = parseStoredArray<number>(row.byHour)
          history.set(row.date, {
            date: row.date,
            pages: Math.max(local?.pages ?? 0, row.pages),
            seconds: Math.max(local?.seconds ?? 0, row.seconds),
            byHour: Array.from({ length: 24 }, (_, hour) => Math.max(local?.byHour?.[hour] ?? 0, Number(hours[hour]) || 0)),
          })
        }
        persist(STORAGE_KEYS.readingHistory, [...history.values()].sort((a, b) => a.date.localeCompare(b.date)))
        if (data.settings) {
          try { persist(STORAGE_KEYS.settings, JSON.parse(data.settings)) } catch { /* retain valid local settings */ }
        }
        persist(STORAGE_KEYS.progress, mergeServerProgress(getLocalProgress(), data.progress))
        getQueryClient().setQueryData(queryKeys.vocabulary, data.vocabulary)
      } catch (error) {
        if (!controller.signal.aborted) console.error('[Sync] Failed; local data retained.', error)
      }
    }
    void sync()
    window.addEventListener('online', sync)
    return () => {
      controller.abort()
      window.removeEventListener('online', sync)
    }
  }, [status, userId])
}
