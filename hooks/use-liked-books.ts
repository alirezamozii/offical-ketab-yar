'use client'

import { likedBooks } from '@/lib/storage/offline-storage'
import { createClient } from '@/lib/supabase/client'
import { useCallback, useEffect } from 'react'
import { create } from 'zustand'

interface LikedBook {
  book_id: string
  book_slug: string
  book_title: string
  book_cover: string | null
  liked_at: number
  synced: boolean
}

interface LikedBooksState {
  likedBookIds: Set<string>
  isLoading: boolean
  isInitialized: boolean
  setLikedBookIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  setIsLoading: (loading: boolean) => void
  setIsInitialized: (initialized: boolean) => void
}

const useLikedBooksStore = create<LikedBooksState>(set => ({
  likedBookIds: new Set(),
  isLoading: false,
  isInitialized: false,
  setLikedBookIds: idsOrUpdater =>
    set(state => ({
      likedBookIds:
        typeof idsOrUpdater === 'function' ? idsOrUpdater(state.likedBookIds) : idsOrUpdater,
    })),
  setIsLoading: loading => set({ isLoading: loading }),
  setIsInitialized: initialized => set({ isInitialized: initialized }),
}))

let initPromise: Promise<void> | null = null

export function useLikedBooks() {
  const {
    likedBookIds,
    isLoading,
    isInitialized,
    setLikedBookIds,
    setIsLoading,
    setIsInitialized,
  } = useLikedBooksStore()
  const supabase = createClient()

  // Get all liked books (from IndexedDB + Supabase)
  const getLikedBooks = useCallback(async (): Promise<LikedBook[]> => {
    try {
      setIsLoading(true)

      // Try to get from Supabase first (if logged in)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data, error } = await supabase
          .from('liked_books')
          .select('*')
          .eq('user_id', user.id)
          .order('liked_at', { ascending: false })

        if (!error && data) {
          return data.map(item => ({
            book_id: item.book_id,
            book_slug: item.book_slug || '',
            book_title: item.book_title || '',
            book_cover: item.book_cover,
            liked_at: new Date(item.liked_at).getTime(),
            synced: true,
          }))
        }
      }

      // Fallback to IndexedDB (offline or not logged in)
      const offlineBooks = await likedBooks.getAll()
      return offlineBooks
    } catch (error) {
      console.error('Error getting liked books:', error)
      // Fallback to IndexedDB on error
      try {
        return await likedBooks.getAll()
      } catch {
        return []
      }
    } finally {
      setIsLoading(false)
    }
  }, [supabase, setIsLoading])

  // Load liked books on mount
  useEffect(() => {
    if (isInitialized) return

    if (!initPromise) {
      initPromise = (async () => {
        try {
          setIsLoading(true)
          const books = await getLikedBooks()
          setLikedBookIds(new Set(books.map(b => b.book_id)))
        } catch (error) {
          console.error('Error loading liked books:', error)
        } finally {
          setIsLoading(false)
          setIsInitialized(true)
        }
      })()
    }

    // Let the effect wait for it, but we don't necessarily need to await it
    // since state updates will flow down automatically
    initPromise.catch(console.error)
  }, [isInitialized, setLikedBookIds, setIsLoading, setIsInitialized, getLikedBooks])

  // Check if a book is liked
  const isBookLiked = useCallback(
    async (bookId: string): Promise<boolean> => {
      try {
        // Check Supabase first
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data } = await supabase
            .from('liked_books')
            .select('book_id')
            .eq('user_id', user.id)
            .eq('book_id', bookId)
            .single()

          if (data) return true
        }

        // Check IndexedDB
        return await likedBooks.isLiked(bookId)
      } catch {
        return false
      }
    },
    [supabase]
  )

  // Add a book to liked
  const addLikedBook = useCallback(
    async (book: {
      book_id: string
      book_slug: string
      book_title: string
      book_cover: string | null
    }) => {
      try {
        // Add to IndexedDB first (offline support)
        await likedBooks.add(book)

        // Try to sync to Supabase
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          await supabase.from('liked_books').upsert({
            user_id: user.id,
            book_id: book.book_id,
            book_slug: book.book_slug,
            book_title: book.book_title,
            book_cover: book.book_cover,
            liked_at: new Date().toISOString(),
          })

          // Mark as synced in IndexedDB
          await likedBooks.markSynced(book.book_id)
        }
      } catch (error) {
        console.error('Error adding liked book:', error)
        throw error
      }
    },
    [supabase]
  )

  // Remove a book from liked
  const removeLikedBook = useCallback(
    async (bookId: string) => {
      try {
        // Remove from IndexedDB
        await likedBooks.remove(bookId)

        // Try to remove from Supabase
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          await supabase.from('liked_books').delete().eq('user_id', user.id).eq('book_id', bookId)
        }
      } catch (error) {
        console.error('Error removing liked book:', error)
        throw error
      }
    },
    [supabase]
  )

  // Toggle like status with optimistic update
  const toggleLike = useCallback(
    async (book: {
      book_id: string
      book_slug: string
      book_title: string
      book_cover: string | null
    }) => {
      const wasLiked = likedBookIds.has(book.book_id)

      // Optimistic update
      setLikedBookIds(prev => {
        const next = new Set(prev)
        if (wasLiked) {
          next.delete(book.book_id)
        } else {
          next.add(book.book_id)
        }
        return next
      })

      try {
        if (wasLiked) {
          await removeLikedBook(book.book_id)
        } else {
          await addLikedBook(book)
        }
        return !wasLiked
      } catch (error) {
        // Revert on error
        setLikedBookIds(prev => {
          const next = new Set(prev)
          if (wasLiked) {
            next.add(book.book_id)
          } else {
            next.delete(book.book_id)
          }
          return next
        })
        throw error
      }
    },
    [likedBookIds, addLikedBook, removeLikedBook, setLikedBookIds]
  )

  // Synchronous check function
  const isLiked = useCallback(
    (bookId: string): boolean => {
      return likedBookIds.has(bookId)
    },
    [likedBookIds]
  )

  return {
    getLikedBooks,
    isBookLiked, // Keep for backward compatibility
    isLiked, // New synchronous function
    addLikedBook,
    removeLikedBook,
    toggleLike,
    isLoading,
    likedBookIds,
  }
}
