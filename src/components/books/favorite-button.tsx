'use client'

import { Heart } from 'lucide-react'
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
      {fav ? (
        <span key="filled" className="inline-flex">
          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
        </span>
      ) : (
        <span key="outline" className="inline-flex">
          <Heart className="h-4 w-4" />
        </span>
      )}
    </button>
  )
}
