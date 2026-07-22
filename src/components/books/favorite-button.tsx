'use client'

import { Heart } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { useFavorites } from '@/hooks/reader/use-favorites'
import type { BookListItem } from '@/lib/data'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  book: Pick<
    BookListItem,
    'slug' | 'title' | 'author' | 'coverFrom' | 'coverTo' | 'coverAccent'
  >
  className?: string
  size?: 'sm' | 'md'
}

export function FavoriteButton({ book, className, size = 'md' }: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorites()
  const fav = isFavorite(book.slug)
  const dim = size === 'sm' ? 'h-11 w-11' : 'h-11 w-11'

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(book)
        toast.success(fav ? 'از علاقه‌مندی‌ها حذف شد' : 'به علاقه‌مندی‌ها اضافه شد')
      }}
      aria-label={fav ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی'}
      aria-pressed={fav}
      className={cn(
        'flex items-center justify-center rounded-full border border-white/20 bg-white/95 text-gold-700 shadow-lg backdrop-blur-md transition-colors hover:bg-white dark:bg-gray-900/95 dark:text-gold-400',
        dim,
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {fav ? (
          <motion.span
            key="filled"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
          </motion.span>
        ) : (
          <motion.span
            key="outline"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Heart className="h-4 w-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
