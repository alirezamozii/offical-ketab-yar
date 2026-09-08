import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { STORAGE_KEYS } from '@/lib/storage-keys'

const KEY = STORAGE_KEYS.favorites

export type FavoriteBook = {
  slug: string
  title: string
  author: string
  coverFrom: string
  coverTo: string
  coverAccent: string
  addedAt: number
}

type FavoriteMap = Record<string, FavoriteBook>

const emptyMap: FavoriteMap = {}
let cachedMap: FavoriteMap | null = null
const listeners = new Set<() => void>()

function getSnapshot(): FavoriteMap {
  if (typeof window === 'undefined') return emptyMap
  if (cachedMap === null) {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        const v = JSON.parse(raw)
        cachedMap = v && typeof v === 'object' ? v : {}
      } else {
        cachedMap = {}
      }
    } catch {
      cachedMap = {}
    }
  }
  return cachedMap ?? emptyMap
}

function getServerSnapshot(): FavoriteMap {
  return emptyMap
}

function notify() {
  for (const l of listeners) {
    l()
  }
}

let storageListenerAdded = false
function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!storageListenerAdded && typeof window !== 'undefined') {
    storageListenerAdded = true
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === KEY) {
        cachedMap = null
        notify()
      }
    })
  }
  return () => {
    listeners.delete(listener)
  }
}

function write(m: FavoriteMap) {
  cachedMap = m
  try {
    localStorage.setItem(KEY, JSON.stringify(m))
  } catch {}
  notify()
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const isFavorite = useCallback(
    (slug: string) => Boolean(favorites[slug]),
    [favorites],
  )

  const toggle = useCallback(
    (book: Omit<FavoriteBook, 'addedAt'>) => {
      const current = getSnapshot()
      const next = { ...current }
      if (next[book.slug]) {
        delete next[book.slug]
      } else {
        next[book.slug] = { ...book, addedAt: Date.now() }
      }
      write(next)
    },
    [],
  )

  const list = useMemo(
    () => Object.values(favorites).sort((a, b) => b.addedAt - a.addedAt),
    [favorites],
  )

  return useMemo(
    () => ({ favorites, list, isFavorite, toggle, loaded: true }),
    [favorites, list, isFavorite, toggle],
  )
}
