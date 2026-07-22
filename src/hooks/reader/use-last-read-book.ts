'use client'

import { useEffect, useState } from 'react'
import { getLocalProgress } from '@/hooks/reader/use-local-progress'
import type { BookListItem } from '@/lib/data'

/**
 * useLastReadBook — returns the most recently read book (based on local
 * progress entries) WITH its cover colors so the bottom-nav FAB can render
 * a colored orb using the book's dominant colors.
 *
 * Returns `null` if no book has been started yet (so the FAB can be hidden).
 *
 * The book metadata is fetched from /api/books?slugs=... — we only need
 * the cover colors (coverFrom, coverTo, coverAccent) plus the title for
 * the aria-label.
 */
export interface LastReadBook {
  slug: string
  title: string
  author: string
  coverFrom: string
  coverTo: string
  coverAccent: string
  /** Optional uploaded cover image URL (when the admin has uploaded a
   *  real cover image). The orb still shows the GRADIENT (not the image)
   *  per user feedback, but this field is available for future use. */
  coverImage?: string | null
  percent: number
  lastReadAt: number
}

export function useLastReadBook(): {
  book: LastReadBook | null
  loading: boolean
} {
  const [book, setBook] = useState<LastReadBook | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const map = getLocalProgress()
        const entries = Object.entries(map).filter(
          ([, v]) => v && v.percent > 0 && (v.lastReadAt ?? v.ts ?? 0) > 0,
        )
        if (entries.length === 0) {
          if (!cancelled) {
            setBook(null)
            setLoading(false)
          }
          return
        }
        // Sort by lastReadAt desc (most recent first).
        entries.sort((a, b) => (b[1].lastReadAt ?? b[1].ts ?? 0) - (a[1].lastReadAt ?? a[1].ts ?? 0))
        const [slug, progress] = entries[0]

        // Fetch book metadata to get cover colors.
        const res = await fetch(
          `/api/books?slugs=${encodeURIComponent(slug)}`,
        )
        const books: BookListItem[] = res.ok ? await res.json() : []
        const found = books.find((b) => b.slug === slug)
        if (!found) {
          if (!cancelled) {
            setBook(null)
            setLoading(false)
          }
          return
        }
        if (!cancelled) {
          setBook({
            slug: found.slug,
            title: found.title,
            author: found.author,
            coverFrom: found.coverFrom,
            coverTo: found.coverTo,
            coverAccent: found.coverAccent,
            coverImage: found.coverImage,
            percent: progress.percent,
            lastReadAt: progress.lastReadAt ?? progress.ts ?? 0,
          })
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setBook(null)
          setLoading(false)
        }
      }
    }

    load()

    // Re-check when the user navigates back to a tab (visibilitychange)
    // so the orb updates after they finish a reading session.
    const onVis = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onVis)
    // Re-check when local progress changes (storage event from other tabs).
    window.addEventListener('storage', load)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('storage', load)
    }
  }, [])

  return { book, loading }
}
