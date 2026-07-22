'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_PREFERENCES,
  type ReadingPreferences,
  type ReaderTheme,
  type ReaderLanguage,
} from '@/lib/reader/types'
import { STORAGE_KEYS } from '@/lib/storage-keys'

const KEY = STORAGE_KEYS.readerPrefs

export function useReadingPreferences() {
  const [prefs, setPrefs] = useState<ReadingPreferences>(DEFAULT_PREFERENCES)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        setPrefs({ ...DEFAULT_PREFERENCES, ...JSON.parse(raw) })
      }
    } catch {
    } finally {
      setLoaded(true)
    }
    // Cross-tab sync: when another tab updates reader prefs, re-read so the
    // user's theme/font choices stay consistent across open tabs.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return
      try {
        const raw = e.newValue
        setPrefs(
          raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_PREFERENCES,
        )
      } catch {
        /* ignore corrupt writes */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const update = useCallback(
    <K extends keyof ReadingPreferences>(key: K, value: ReadingPreferences[K]) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value }
        try {
          localStorage.setItem(KEY, JSON.stringify(next))
        } catch {}
        return next
      })
    },
    [],
  )

  const setTheme = useCallback(
    (t: ReaderTheme) => update('theme', t),
    [update],
  )
  const setLanguage = useCallback(
    (l: ReaderLanguage) => update('language', l),
    [update],
  )

  return { prefs, update, setTheme, setLanguage, loaded }
}
