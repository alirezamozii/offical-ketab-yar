'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { getBooks, type BookListItem } from '@/lib/data'
import { useLibraryStore } from '@/lib/store/library-store'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { BookCard } from './book-card'
import { BookListItemComponent } from './book-list-item'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

// Agent 2 (Performance): TanStack Query for caching and optimistic updates
// Agent 0 (Investigation): Using unified data API (Supabase)
async function fetchBooks(): Promise<BookListItem[]> {
  return await getBooks()
}

export function BookGrid() {
  const viewMode = useLibraryStore((state) => state.viewMode)

  // Agent 2: Cache for 5 minutes, stale-while-revalidate strategy
  const { data: books, isLoading, error } = useQuery({
    queryKey: ['books', 'published'],
    queryFn: fetchBooks,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  })

  // Agent 3 (Psychology): Skeleton loading for better perceived performance
  if (isLoading) {
    if (viewMode === 'list') {
      return (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-40 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[2/3] bg-muted rounded-lg mb-3" />
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  // Agent 3: Helpful error message
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          خطا در بارگذاری کتاب‌ها. لطفاً صفحه را رفرش کنید.
        </AlertDescription>
      </Alert>
    )
  }

  // Agent 3: Empty state
  if (!books || books.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-xl font-semibold mb-2">هنوز کتابی اضافه نشده</h3>
        <p className="text-muted-foreground">به زودی کتاب‌های جدید اضافه می‌شوند</p>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {viewMode === 'list' ? (
        // List View with FAST transition
        <motion.div
          key="list-view"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="space-y-4"
        >
          {books.map((book: BookListItem, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.2,
                delay: index * 0.02,
                ease: [0.25, 0.1, 0.25, 1]
              }}
            >
              <BookListItemComponent book={book} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        // Grid View with FAST transition
        <motion.div
          key="grid-view"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6"
        >
          {books.map((book: BookListItem, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.2,
                delay: index * 0.015,
                ease: [0.25, 0.1, 0.25, 1]
              }}
            >
              <BookCard book={book} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
