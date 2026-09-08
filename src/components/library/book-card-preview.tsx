'use client'

import dynamic from 'next/dynamic'
import { BookCard } from '@/components/books/book-card'
import { useEffect, useRef, useState } from 'react'
import type { BookListItem } from '@/lib/data'

const DesktopHoverPreview = dynamic(
  () => import('./desktop-hover-preview').then((m) => m.DesktopHoverPreview),
  { ssr: false },
)

const snippetCache = new Map<string, string>()
const snippetInFlight = new Map<string, Promise<string>>()

async function fetchSnippet(slug: string): Promise<string> {
  if (snippetCache.has(slug)) return snippetCache.get(slug) as string
  if (snippetInFlight.has(slug)) return snippetInFlight.get(slug)!
  const p = fetch(`/api/books/${encodeURIComponent(slug)}/snippet`)
    .then((r) => (r.ok ? r.json() : null))
    .then((data: { snippet?: string } | null) => {
      const s = data?.snippet ?? ''
      snippetCache.set(slug, s)
      snippetInFlight.delete(slug)
      return s
    })
    .catch(() => {
      snippetInFlight.delete(slug)
      return ''
    })
  snippetInFlight.set(slug, p)
  return p
}

export function BookCardWithPreview({
  book,
  progress,
}: {
  book: BookListItem
  progress?: number
}) {
  const [snippet, setSnippet] = useState<string>('')
  const [snippetLoaded, setSnippetLoaded] = useState(false)
  const fetchStartedRef = useRef(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      setIsDesktop(true)
    }
  }, [])

  useEffect(() => {
    if (fetchStartedRef.current) return
    if (snippetCache.has(book.slug)) {
      setSnippet(snippetCache.get(book.slug)!)
      setSnippetLoaded(true)
    }
  }, [book.slug])

  const onHoverStart = () => {
    if (fetchStartedRef.current || snippetLoaded) return
    fetchStartedRef.current = true
    fetchSnippet(book.slug).then((s) => {
      setSnippet(s)
      setSnippetLoaded(true)
    })
  }

  if (!isDesktop) {
    return (
      <div className="block h-full">
        <BookCard book={book} progress={progress} />
      </div>
    )
  }

  return (
    <DesktopHoverPreview
      book={book}
      progress={progress}
      snippet={snippet}
      snippetLoaded={snippetLoaded}
      onHoverStart={onHoverStart}
    >
      <BookCard book={book} progress={progress} />
    </DesktopHoverPreview>
  )
}
