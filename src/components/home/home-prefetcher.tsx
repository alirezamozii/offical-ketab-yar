'use client'

import { useEffect } from 'react'
import { isBookFullyCached } from '@/lib/book-prefetcher'

interface HomePrefetcherProps {
  books: Array<{ slug: string; title: string; pageCount: number }>
}

export function HomePrefetcher({ books }: HomePrefetcherProps) {
  useEffect(() => {
    // Only run prefetch on first load when browser is idle and online
    if (typeof window === 'undefined' || !navigator.onLine) return

    const runPrefetch = async () => {
      // Prefetch details and first chapter (pages 1-20) for the top 3 books
      for (const book of books.slice(0, 3)) {
        if (isBookFullyCached(book.slug)) continue

        try {
          // 1. Prefetch book details API
          await fetch(`/api/books/${book.slug}`)
          
          // 2. Prefetch cover image API
          await fetch(`/api/books/${book.slug}/cover`)
          
          // 3. Prefetch reader HTML page (caches the shell)
          await fetch(`/books/read/${book.slug}`)
          
          // 4. Prefetch first chunk (pages 1-20) so they can start reading offline instantly
          await fetch(`/api/books/${book.slug}/pages?from=1&to=20`)
        } catch (e) {
          console.warn('Failed to background prefetch book:', book.slug, e)
        }
        
        // Brief pause between books
        await new Promise((resolve) => setTimeout(resolve, 1500))
      }
    }

    let timer: NodeJS.Timeout | undefined
    // Wait until browser is completely loaded and idle
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => runPrefetch())
    } else {
      timer = setTimeout(runPrefetch, 5000)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [books])

  return null
}
