'use client'

/**
 * src/lib/collections-client.tsx
 * ---------------------------------------------------------------
 * Client-side React parts of the collections feature:
 *   • `<CollectionIcon>` — render-on-demand wrapper that resolves a string
 *     icon name to the corresponding lucide component. Declared as a stable
 *     React component so callers don't trip the `react-hooks/static-
 *     components` lint rule.
 *   • `useCollections()` — the React hook that hydrates from localStorage
 *     on mount, syncs across tabs via the `storage` event, syncs in-memory
 *     via custom `ky:storage` events, and triggers background server sync.
 *
 * Re-exports every universal symbol from `@/lib/collections` so client
 * components can import everything from a single module:
 *   import {
 *     COLLECTION_COLORS,
 *     useCollections,
 *     CollectionIcon,
 *     type Collection,
 *   } from '@/lib/collections-client'
 *
 * The universal data (types, constants, pure helpers) lives in
 * `@/lib/collections` (no `'use client'`) so it's safe to import from
 * server components like the `/api/collections` route.
 * ---------------------------------------------------------------
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bookmark,
} from 'lucide-react'
import {
  COLLECTIONS_STORAGE_KEY,
  ICON_MAP,
  _seedDefaults,
  addBookToCollection,
  createCollection,
  deleteCollection,
  readCollections,
  removeBookFromCollection,
  type Collection,
  type CollectionColor,
  type CollectionIconName,
} from '@/lib/collections'

// Re-export everything from the universal module so client components can
// import from a single entry point.
export {
  COLLECTION_COLORS,
  COLLECTION_COLOR_LIST,
  COLLECTION_ICON_LABELS,
  COLLECTION_ICON_LIST,
  DEFAULT_COLLECTIONS,
  addBookToCollection,
  createCollection,
  deleteCollection,
  getBookCollections,
  getCollectionById,
  getCollectionIcon,
  isBookInCollection,
  readCollections,
  removeBookFromCollection,
  renameCollection,
  writeCollections,
  type Collection,
  type CollectionColor,
  type CollectionIconName,
  type ColorTokens,
} from '@/lib/collections'

/**
 * `<CollectionIcon>` — render-on-demand wrapper that resolves a string icon
 * name to the corresponding lucide component.
 */
export function CollectionIcon({
  name,
  className,
}: {
  name: CollectionIconName
  className?: string
}) {
  const Icon = ICON_MAP[name] ?? Bookmark
  return <Icon className={className} />
}

// ---------------------------------------------------------------------------
// React hook — `useCollections`.
// ---------------------------------------------------------------------------

const KEY = COLLECTIONS_STORAGE_KEY

export interface UseCollectionsResult {
  collections: Collection[]
  loaded: boolean
  create: (
    name: string,
    description: string,
    color: CollectionColor,
    icon: CollectionIconName,
  ) => Collection | null
  remove: (id: string) => void
  addBook: (id: string, slug: string) => void
  removeBook: (id: string, slug: string) => void
  isBookIn: (id: string, slug: string) => boolean
  bookCollections: (slug: string) => Collection[]
  refresh: () => void
}

export function useCollections(): UseCollectionsResult {
  const [collections, setCollections] = useState<Collection[]>(() =>
    _seedDefaults(),
  )
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(() => {
    const local = readCollections()
    setCollections(local)
    setLoaded(true)
  }, [])

  const syncBackground = useCallback((cols: Collection[]) => {
    if (typeof window === 'undefined') return
    try {
      fetch('/api/collections/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collections: cols }),
      }).catch(() => {})
    } catch {}
  }, [])

  useEffect(() => {
    refresh()
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) refresh()
    }
    const onLocal = (e: Event) => {
      const ce = e as CustomEvent<{ key: string }>
      if (ce.detail?.key === KEY) refresh()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('ky:storage', onLocal as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('ky:storage', onLocal as EventListener)
    }
  }, [refresh])

  const create = useCallback(
    (
      name: string,
      description: string,
      color: CollectionColor,
      icon: CollectionIconName,
    ): Collection | null => {
      try {
        const c = createCollection(name, description, color, icon)
        const updated = readCollections()
        setCollections(updated)
        syncBackground(updated)
        return c
      } catch {
        return null
      }
    },
    [syncBackground],
  )

  const remove = useCallback(
    (id: string) => {
      deleteCollection(id)
      const updated = readCollections()
      setCollections(updated)
      syncBackground(updated)
    },
    [syncBackground],
  )

  const addBook = useCallback(
    (id: string, slug: string) => {
      addBookToCollection(id, slug)
      const updated = readCollections()
      setCollections(updated)
      syncBackground(updated)
    },
    [syncBackground],
  )

  const removeBook = useCallback(
    (id: string, slug: string) => {
      removeBookFromCollection(id, slug)
      const updated = readCollections()
      setCollections(updated)
      syncBackground(updated)
    },
    [syncBackground],
  )

  const isBookIn = useCallback(
    (id: string, slug: string) => {
      const col = collections.find((c) => c.id === id)
      return Boolean(col?.bookSlugs.includes(slug))
    },
    [collections],
  )

  const bookCollections = useCallback(
    (slug: string) => collections.filter((c) => c.bookSlugs.includes(slug)),
    [collections],
  )

  return useMemo(
    () => ({
      collections,
      loaded,
      create,
      remove,
      addBook,
      removeBook,
      isBookIn,
      bookCollections,
      refresh,
    }),
    [collections, loaded, create, remove, addBook, removeBook, isBookIn, bookCollections, refresh],
  )
}
