'use client'

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
    return Array.isArray(parsed) ? parsed.filter((slug): slug is string => typeof slug === 'string') : []
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
export function setBookFullyCached(slug: string, _title: string) {
  if (typeof window === 'undefined') return
  try {
    const cached = getFullyCachedBooks()
    if (!cached.includes(slug)) {
      cached.push(slug)
      localStorage.setItem(CACHED_BOOKS_KEY, JSON.stringify(cached))
    }

  } catch (err) {
    console.error('Failed to mark book as cached:', err)
  }
}

/**
 * Progressive prefetcher that fetches pages in chunks of 20, 
 * cover images, and reader HTML. Offline persistence depends on the active
 * service worker's runtime caching rules; successful fetches alone do not
 * guarantee that the browser retained every resource.
 */
export async function prefetchBook(
  slug: string,
  title: string,
  pageCount: number,
  onProgress?: (progress: number) => void
): Promise<void> {
  if (typeof window === 'undefined') return
  if (!Number.isSafeInteger(pageCount) || pageCount <= 0) {
    throw new Error('Cannot prefetch a book without a valid page count')
  }

  try {
    if (onProgress) onProgress(5)

    // 1. Fetch book details.
    const details = await fetch(`/api/books/${encodeURIComponent(slug)}`)
    if (!details.ok) throw new Error('Failed to prefetch book details')

    // 2. Fetch cover image
    try {
      await fetch(`/api/books/${encodeURIComponent(slug)}/cover`)
    } catch (e) {
      console.warn('Failed to prefetch cover API:', e)
    }

    if (onProgress) onProgress(15)

    // 3. Fetch reader HTML. A fetch is not a navigation request; persistence
    // of this shell is governed separately by the service worker.
    const reader = await fetch(`/books/read/${encodeURIComponent(slug)}`)
    if (!reader.ok) throw new Error('Failed to prefetch reader HTML')

    if (onProgress) onProgress(25)

    // 4. Fetch the book pages in chunks of 20
    const chunkSize = 20
    const totalChunks = Math.ceil(pageCount / chunkSize)
    let completedChunks = 0

    for (let i = 0; i < totalChunks; i++) {
      const from = i * chunkSize + 1
      const to = Math.min((i + 1) * chunkSize, pageCount)
      const url = `/api/books/${encodeURIComponent(slug)}/pages?from=${from}&to=${to}`

      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed to prefetch pages ${from}-${to}`)
      // Wait for the response body as fetch resolves as soon as headers arrive.
      await res.arrayBuffer()
      completedChunks++
      const percent = 25 + Math.round((completedChunks / totalChunks) * 74)
      if (onProgress) onProgress(percent)

      // Small pause to yield main thread and avoid overloading network
      await new Promise((resolve) => setTimeout(resolve, 80))
    }

    // 5. Mark as fully cached
    setBookFullyCached(slug, title)
    if (onProgress) onProgress(100)
  } catch (err) {
    console.error('Prefetch failed:', err)
    throw err
  }
}
