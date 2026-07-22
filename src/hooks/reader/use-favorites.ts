'use client'

import { useCallback, useEffect, useState } from 'react'
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

function read(): FavoriteMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const v = JSON.parse(raw)
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

function write(m: FavoriteMap) {
  try {
    localStorage.setItem(KEY, JSON.stringify(m))
  } catch {}
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteMap>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setFavorites(read())
    setLoaded(true)
    // Cross-tab sync: when another tab writes to `ky_favorites`, re-read.
    // (The browser only fires `storage` in *other* tabs, not the writer.)
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setFavorites(read())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const isFavorite = useCallback(
    (slug: string) => Boolean(favorites[slug]),
    [favorites],
  )

  const toggle = useCallback(
    (book: Omit<FavoriteBook, 'addedAt'>) => {
      setFavorites((prev) => {
        const next = { ...prev }
        if (next[book.slug]) {
          delete next[book.slug]
        } else {
          next[book.slug] = { ...book, addedAt: Date.now() }
        }
        write(next)
        return next
      })
    },
    [],
  )

  const list = Object.values(favorites).sort((a, b) => b.addedAt - a.addedAt)

  return { favorites, list, isFavorite, toggle, loaded }
}
