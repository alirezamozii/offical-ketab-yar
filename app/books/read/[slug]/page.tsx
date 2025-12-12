'use client'

import { ProfessionalReader } from '@/components/reader/professional-reader'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from 'next-sanity'
import { notFound } from 'next/navigation'
import { use, useEffect, useRef, useState } from 'react'

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

// Convert compact format to reader format (grouped by pages)
function convertCompactToPages(compactData: any): ReaderPageContent[] {
  console.log('🔄 Converting compact format to pages...', {
    hasChapters: !!compactData?.c,
    chapterCount: compactData?.c?.length,
    structure: Object.keys(compactData || {})
  })

  // Handle potential nested 'b' structure or direct 'c' structure
  const chapters = compactData?.c || compactData?.b?.c || []

  if (!Array.isArray(chapters)) {
    console.error('❌ Invalid chapters data:', chapters)
    return []
  }

  const readerPages: ReaderPageContent[] = []
  let globalPageIndex = 0

  // Loop through all chapters
  chapters.forEach((chapter: any, cIdx: number) => {
    if (!chapter.p || !Array.isArray(chapter.p)) return

    // Loop through all pages in chapter
    chapter.p.forEach((page: any, pIdx: number) => {
      const pageItems: BilingualItem[] = []

      if (page.i && Array.isArray(page.i)) {
        // Loop through all items on page
        page.i.forEach((item: any) => {
          // Extract content with safe fallbacks
          if ('h' in item && item.h) {
            // Heading
            pageItems.push({
              english: item.h.e || item.h.en || '',
              farsi: item.h.f || item.h.fa || '',
              type: 'heading'
            })
          } else if ('t' in item && item.t) {
            // Text
            pageItems.push({
              english: item.t.e || item.t.en || '',
              farsi: item.t.f || item.t.fa || '',
              type: 'text'
            })
          }
        })
      }

      // Add page even if empty (to maintain page count accuracy if needed)
      // but warn if completely empty
      if (pageItems.length === 0) {
        console.warn(`⚠️ Page ${cIdx}-${pIdx} is empty`)
      }

      readerPages.push({
        pageNumber: globalPageIndex++,
        items: pageItems
      })
    })
  })

  console.log(`✅ Converted ${readerPages.length} pages. First page items:`, readerPages[0]?.items?.length)
  return readerPages
}

export default function ReaderPage({ params }: ReaderPageProps) {
  const { slug } = use(params)
  const [book, setBook] = useState<BookData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isDraft, setIsDraft] = useState(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    async function loadBook() {
      try {
        console.log('🔍 Loading book with slug:', slug)
        setLoading(true)

        // Fetch book (including drafts)
        const query = `*[_type == "compactBook" && slug.current == $slug][0]{
          _id,
          bookData,
          slug,
          status,
          title,
          titleFa,
          author->{name}
        }`

        const sanityClient = createClient({
          projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
          dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
          apiVersion: '2024-01-01',
          useCdn: false,
        })

        const fetchedBook = await sanityClient.fetch(query, { slug })

        if (!fetchedBook) {
          console.error('❌ Book not found')
          setError(true)
          return
        }

        // Check draft access
        if (fetchedBook.status === 'draft') {
          const { checkDraftAccess } = await import('@/lib/admin/check-draft-access')
          const hasAccess = await checkDraftAccess(fetchedBook._id)

          if (!hasAccess) {
            console.error('❌ No access to draft')
            setError(true)
            return
          }

          setIsDraft(true)
        }

        // Parse compact JSON
        let compactData
        try {
          compactData = typeof fetchedBook.bookData === 'string'
            ? JSON.parse(fetchedBook.bookData)
            : fetchedBook.bookData
        } catch (e) {
          console.error('❌ Failed to parse bookData:', e)
          setError(true)
          return
        }

        // Validate structure (must have chapters 'c')
        // Attempt recovery if 'c' is string (common double-serialization issue)
        if (compactData && typeof compactData.c === 'string') {
          try {
            const parsedC = JSON.parse(compactData.c)
            if (Array.isArray(parsedC)) {
              console.log('⚠️ Fixed: compactData.c was a string, parsed successfully')
              compactData.c = parsedC
            }
          } catch (e) {
            console.error('❌ Error parsing compactData.c string:', e)
          }
        }

        if (!compactData || !Array.isArray(compactData?.c)) {
          console.error('❌ Invalid compact data structure.')
          if (compactData) {
            console.error('Keys:', Object.keys(compactData))
            console.error('Type of c:', typeof compactData.c)
            console.error('Value of c (slice):', typeof compactData.c === 'string' ? compactData.c.slice(0, 50) : compactData.c)
          } else {
            console.error('compactData is null/undefined')
          }
          setError(true)
          return
        }

        console.log('📚 Loaded compact book content with', compactData.c.length, 'chapters')

        // Convert to reader format
        const pages = convertCompactToPages(compactData)

        if (pages.length === 0) {
          console.error('❌ No pages generated')
          setError(true)
          return
        }

        const convertedBook: BookData = {
          pages: pages,
          title: fetchedBook.title || 'Untitled',
          slug: fetchedBook.slug.current,
          author: fetchedBook.author?.name || 'Unknown Author',
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

  // Debug: Check if book has content
  if (!book.pages || book.pages.length === 0) {
    console.error('❌ RENDER ERROR: Book has no content')
    console.error('📋 Book object:', book)
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-4xl">
          <h1 className="text-2xl font-bold text-red-600">⚠️ No Content Found</h1>
          <p className="text-muted-foreground">Book loaded but has no readable content.</p>
          <div className="text-left space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-bold mb-2">Book Info:</h3>
              <p>Title: {book.title}</p>
              <p>Author: {book.author}</p>
              <p>Slug: {book.slug}</p>
              <p>Content Pages: {book.pages?.length || 0}</p>
            </div>
            <details className="bg-muted p-4 rounded-lg">
              <summary className="font-bold cursor-pointer">Full Book Object (click to expand)</summary>
              <pre className="mt-2 text-xs overflow-auto max-h-96">
                {JSON.stringify(book, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    )
  }

  console.log('🎨 RENDERING ProfessionalReader with', book.pages.length, 'pages')
  return (
    <>
      {isDraft && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold shadow-lg">
            🚧 DRAFT - Test Mode
          </div>
        </div>
      )}
      <ProfessionalReader book={book} />
    </>
  )
}
