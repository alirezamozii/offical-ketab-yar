'use client'

import { STORAGE_KEYS } from './storage-keys'

const CACHED_BOOKS_KEY = 'ky_fully_cached_books'

/**
 * Returns a list of slugs of books that are fully cached for offline use.
 */
export function getFullyCachedBooks(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CACHED_BOOKS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Checks if a specific book is fully cached offline.
 */
export function isBookFullyCached(slug: string): boolean {
  return getFullyCachedBooks().includes(slug)
}

/**
 * Marks a book as fully cached offline.
 */
export function setBookFullyCached(slug: string, title: string) {
  if (typeof window === 'undefined') return
  try {
    const cached = getFullyCachedBooks()
    if (!cached.includes(slug)) {
      cached.push(slug)
      localStorage.setItem(CACHED_BOOKS_KEY, JSON.stringify(cached))
    }

    // Also add to readerSessionHistory so it shows up in "در دسترس آفلاین" on the /offline page
    const rawHistory = localStorage.getItem(STORAGE_KEYS.readerSessionHistory)
    const history = rawHistory ? JSON.parse(rawHistory) : []
    if (Array.isArray(history)) {
      const exists = history.some((h: any) => h.bookSlug === slug)
      if (!exists) {
        history.push({
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
          seconds: 1, // small dummy value
          bookSlug: slug,
          bookTitle: title,
        })
        localStorage.setItem(STORAGE_KEYS.readerSessionHistory, JSON.stringify(history))
      }
    }
  } catch (err) {
    console.error('Failed to mark book as cached:', err)
  }
}

/**
 * Progressive prefetcher that fetches pages in chunks of 20, 
 * cover images, and reader HTML page. Everything gets cached 
 * automatically by the Service Worker's runtime caching strategies.
 */
export async function prefetchBook(
  slug: string,
  title: string,
  pageCount: number,
  onProgress?: (progress: number) => void
): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    if (onProgress) onProgress(5)

    // 1. Fetch the book details API so it is cached
    try {
      await fetch(`/api/books/${slug}`)
    } catch (e) {
      console.warn('Failed to prefetch book details API:', e)
    }

    // 2. Fetch cover image
    try {
      await fetch(`/api/books/${slug}/cover`)
    } catch (e) {
      console.warn('Failed to prefetch cover API:', e)
    }

    if (onProgress) onProgress(15)

    // 3. Fetch the main reader page HTML so it is cached in the navigate cache (ketab-pages)
    // The updated SW NAVIGATE_MATCHER matches any URL starting with /books/read/
    try {
      await fetch(`/books/read/${slug}`)
    } catch (e) {
      console.warn('Failed to prefetch reader HTML:', e)
    }

    if (onProgress) onProgress(25)

    // 4. Fetch the book pages in chunks of 20
    const chunkSize = 20
    const totalChunks = Math.ceil(pageCount / chunkSize)
    let completedChunks = 0

    for (let i = 0; i < totalChunks; i++) {
      const from = i * chunkSize + 1
      const to = Math.min((i + 1) * chunkSize, pageCount)
      const url = `/api/books/${slug}/pages?from=${from}&to=${to}`

      try {
        const res = await fetch(url)
        if (res.ok) {
          completedChunks++
          const percent = 25 + Math.round((completedChunks / totalChunks) * 75)
          if (onProgress) onProgress(percent)
        }
      } catch (err) {
        console.warn(`Failed to prefetch chunk ${from}-${to}:`, err)
      }

      // Small pause to yield main thread and avoid overloading network
      await new Promise((resolve) => setTimeout(resolve, 80))
    }

    // 5. Mark as fully cached
    setBookFullyCached(slug, title)
    if (onProgress) onProgress(100)
  } catch (err) {
    console.error('Prefetch failed:', err)
  }
}
