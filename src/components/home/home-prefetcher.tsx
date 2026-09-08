'use client'

import { useEffect } from 'react'
import { isBookFullyCached } from '@/lib/book-prefetcher'

interface HomePrefetcherProps {
  books: Array<{ slug: string; title: string; pageCount: number }>
}

export function HomePrefetcher({ books }: HomePrefetcherProps) {
  useEffect(() => {
    // Only run prefetch when browser is online
    if (typeof window === 'undefined' || !navigator.onLine) return

    // Respect data-saver mode and slow connections
    const conn = (navigator as { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    if (conn?.saveData || conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g') return

    const runPrefetch = async () => {
      // Only prefetch the first book to minimize network contention
      const book = books[0]
      if (!book || isBookFullyCached(book.slug)) return

      try {
        // Prefetch with low priority so it never delays critical navigation
        await fetch(`/api/books/${book.slug}`, { priority: 'low' } as RequestInit)
      } catch {
        // silent
      }
    }

    let cancelled = false

    // Wait until page is fully loaded + 8s idle delay
    const startPrefetch = () => {
      if (cancelled) return
      const timer = setTimeout(() => {
        if (cancelled) return
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(() => {
            if (!cancelled) runPrefetch()
          }, { timeout: 10000 })
        } else {
          runPrefetch()
        }
      }, 8000)
      return timer
    }

    let timer: ReturnType<typeof setTimeout> | undefined

    if (document.readyState === 'complete') {
      timer = startPrefetch()
    } else {
      const onLoad = () => {
        timer = startPrefetch()
      }
      window.addEventListener('load', onLoad, { once: true })
      return () => {
        cancelled = true
        window.removeEventListener('load', onLoad)
        if (timer) clearTimeout(timer)
      }
    }

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [books])

  return null
}
