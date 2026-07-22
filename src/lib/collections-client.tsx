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
 *     on mount, syncs across tabs via the `storage` event, and exposes
 *     memoized action callbacks.
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
 * name to the corresponding lucide component. Declared as a stable React
 * component so callers don't trip the `react-hooks/static-components` lint
 * rule (which fires when a component is "created during render" by calling
 * a function that returns a component class).
 *
 * Usage:
 *   <CollectionIcon name="Heart" className="h-5 w-5" />
 */
export function CollectionIcon({
  name,
  className,
}: {
  name: CollectionIconName
  className?: string
}) {
  // Look up the icon component from the static ICON_MAP (no function call
  // returning a component — keeps the `react-hooks/static-components` lint
  // rule happy).
  const Icon = ICON_MAP[name] ?? Bookmark
  return <Icon className={className} />
}

// ---------------------------------------------------------------------------
// React hook — `useCollections`. Mirrors the shape of `useFavorites`:
//   • Hydrates from localStorage on mount.
//   • Cross-tab sync via the `storage` event.
//   • Same-tab sync via the synthetic `ky:storage` CustomEvent dispatched
//     by `writeCollections`.
//   • Memoized action callbacks so consumers can use them in deps.
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
    // SSR / first paint: render the defaults so the page isn't empty until
    // hydration. The real localStorage value replaces this on mount.
    _seedDefaults(),
  )
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(() => {
    setCollections(readCollections())
    setLoaded(true)
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
        setCollections(readCollections())
        return c
      } catch {
        return null
      }
    },
    [],
  )

  const remove = useCallback((id: string) => {
    deleteCollection(id)
    setCollections(readCollections())
  }, [])

  const addBook = useCallback((id: string, slug: string) => {
    addBookToCollection(id, slug)
    setCollections(readCollections())
  }, [])

  const removeBook = useCallback((id: string, slug: string) => {
    removeBookFromCollection(id, slug)
    setCollections(readCollections())
  }, [])

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
