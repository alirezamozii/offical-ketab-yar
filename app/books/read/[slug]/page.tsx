'use client'

import { ProfessionalReader } from '@/components/reader/professional-reader'
import { Skeleton } from '@/components/ui/skeleton'
import { notFound } from 'next/navigation'
import { use, useEffect, useRef, useState } from 'react'
import { getBookBySlug } from '@/lib/data'
import { loadBookContent } from '@/lib/supabase/book-content'

interface ReaderPageProps {
  params: Promise<{
    slug: string
  }>
}

interface BilingualItem {
  english: string
  farsi: string
  type: 'text' | 'heading'
}

interface ReaderPageContent {
  pageNumber: number
  items: BilingualItem[]
}

interface BookData {
  pages: ReaderPageContent[]
  title: string
  slug: string
  author: string
}

export default function ReaderPage({ params }: ReaderPageProps) {
  const { slug } = use(params)
  const [book, setBook] = useState<BookData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    async function loadBook() {
      try {
        console.log('🔍 Loading book with slug:', slug)
        setLoading(true)

        // 1. Fetch book metadata from Supabase
        const bookMetadata = await getBookBySlug(slug)

        if (!bookMetadata) {
          console.error('❌ Book metadata not found in Supabase')
          setError(true)
          return
        }

        // 2. Load book content from Supabase Storage
        // For now, we'll try to load the English content as the primary
        const content = await loadBookContent(bookMetadata.id, 'en')

        if (!content || !content.pages) {
          console.error('❌ Book content not found in Storage')
          setError(true)
          return
        }

        // 3. Convert Storage format to Reader format
        // Storage format: { pages: { english: string, farsi: string }[] }
        // Reader format: { pages: { pageNumber: number, items: BilingualItem[] }[] }
        const readerPages: ReaderPageContent[] = content.pages.map((page, index) => ({
          pageNumber: index,
          items: [
            {
              english: page.english,
              farsi: page.farsi,
              type: 'text'
            }
          ]
        }))

        const convertedBook: BookData = {
          pages: readerPages,
          title: bookMetadata.title || 'Untitled',
          slug: bookMetadata.slug,
          author: bookMetadata.author || 'Unknown Author',
        }

        console.log('✅ Book ready:', {
          title: convertedBook.title,
          author: convertedBook.author,
          pageCount: convertedBook.pages.length,
        })

        if (isMountedRef.current) {
          setBook(convertedBook)
        }
      } catch (err) {
        console.error('❌ Error loading book:', err)
        if (isMountedRef.current) {
          setError(true)
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    loadBook()

    return () => {
      isMountedRef.current = false
    }
  }, [slug])

  if (error) {
    notFound()
  }

  if (loading || !book) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="container max-w-4xl mx-auto px-4 space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <ProfessionalReader book={book} />
    </>
  )
}
