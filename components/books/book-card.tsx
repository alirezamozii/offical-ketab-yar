'use client'

import { LikeButton } from '@/components/books/like-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { BookOpen, Eye, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'

interface BookCardProps {
  book: {
    id: string
    slug: string
    title: string
    author: string
    cover_url?: string | null
    rating?: number | null
    genres?: string[] | null
    read_count?: number
  }
  showReadCount?: boolean
  showProgress?: boolean
  progress?: number
}

function BookCardComponent({ book, showReadCount, progress }: BookCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Data is now from Supabase
  const coverImage = book.cover_url || '/placeholder-book.jpg'
  const bookRating = book.rating || 0
  const bookGenre = book.genres || []
  const bookId = book.id || book.slug

  // Handle title (Direct string from Supabase)
  const bookTitle = typeof book.title === 'string' ? book.title : 'Untitled'

  // Handle author (Direct string from Supabase)
  const bookAuthor = typeof book.author === 'string' ? book.author : 'Unknown Author'

  // Agent 2 (Performance): Simplified 3D effect - only on desktop, GPU-optimized
  const [enable3D, setEnable3D] = useState(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['5deg', '-5deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-5deg', '5deg'])

  // Agent 2: Only enable 3D on desktop (performance)
  useEffect(() => {
    setEnable3D(window.innerWidth > 768)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !enable3D) return

    const rect = ref.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5

    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      style={
        enable3D
          ? {
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d',
            }
          : {}
      }
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={enable3D ? 'perspective-1000' : ''}
    >
      <Link href={`/books/${book.slug}`}>
        <Card className="border-warm group relative h-full cursor-pointer overflow-hidden border-2 bg-card shadow-md backdrop-blur-sm transition-all duration-500 hover:border-gold-500/50 hover:shadow-2xl hover:shadow-xl hover:shadow-gold-500/20 dark:border-gold-500/20 dark:bg-card/50 dark:hover:border-gold-500/40">
          {/* Shine effect */}
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <div className="absolute inset-0 translate-x-[-100%] translate-y-[-100%] bg-gradient-to-tr from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%] group-hover:translate-y-[100%]" />
          </div>

          {/* Like button (Agent 3: Collection Psychology) */}
          <div
            className="absolute left-3 top-3 z-20 opacity-0 transition-all duration-300 group-hover:opacity-100"
            onClick={e => e.preventDefault()}
          >
            <LikeButton
              book={{
                id: bookId,
                slug: book.slug,
                title: bookTitle,
                cover_url: coverImage,
              }}
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full border border-white/20 bg-white/95 shadow-lg backdrop-blur-md hover:bg-white dark:bg-gray-900/95 hover:dark:bg-gray-900"
            />
          </div>

          <CardContent className="p-0">
            <div className="dark:via-gray-850 relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-warm-100 via-warm-50 to-card dark:from-gray-800 dark:to-gray-900">
              <Image
                src={coverImage}
                alt={bookTitle}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              {/* Progress bar for continue reading */}
              {progress !== undefined && progress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50 backdrop-blur-sm">
                  <div
                    className="h-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {/* Rating badge */}
              {bookRating > 0 && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 backdrop-blur-md"
                >
                  <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                  <span className="text-sm font-bold text-white">{bookRating.toFixed(1)}</span>
                </motion.div>
              )}

              {/* Quick stats - shown on hover */}
              <div className="absolute right-3 top-14 space-y-2 opacity-0 transition-all delay-100 duration-300 group-hover:opacity-100">
                {showReadCount && book.read_count && (
                  <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-2.5 py-1 text-xs text-white backdrop-blur-md">
                    <Eye className="h-3 w-3" />
                    <span>{book.read_count}</span>
                  </div>
                )}
                {progress !== undefined && progress > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-2.5 py-1 text-xs text-white backdrop-blur-md">
                    <BookOpen className="h-3 w-3" />
                    <span>{Math.round(progress)}%</span>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <div className="absolute bottom-0 left-0 right-0 translate-y-full p-3 transition-transform duration-500 ease-out group-hover:translate-y-0">
                <Button
                  className="h-10 w-full border-0 bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 font-semibold text-white shadow-xl shadow-gold-500/30 hover:from-gold-700 hover:via-gold-600 hover:to-gold-700"
                  size="sm"
                  onClick={e => e.preventDefault()}
                >
                  <BookOpen className="ml-2 h-4 w-4" />
                  مشاهده جزئیات
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-warm flex flex-col items-start gap-2.5 border-t-2 bg-gradient-to-b from-card to-warm-50 p-4 dark:border-border/50 dark:from-card dark:to-card/80">
            <h3 className="text-warm-foreground line-clamp-2 text-base font-bold leading-snug transition-colors group-hover:text-gold-600 dark:text-foreground">
              {bookTitle}
            </h3>
            <p className="text-warm-muted line-clamp-1 text-sm font-medium dark:text-muted-foreground">
              {bookAuthor}
            </p>
            {bookGenre.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {bookGenre.slice(0, 2).map(genreName => {
                  return (
                    <Badge
                      key={genreName}
                      variant="secondary"
                      className="border-2 border-gold-500/30 bg-gold-500/15 px-2.5 py-0.5 text-xs font-semibold text-gold-800 transition-colors hover:bg-gold-500/25 dark:text-gold-400"
                    >
                      {genreName}
                    </Badge>
                  )
                })}
                {bookGenre.length > 2 && (
                  <Badge
                    variant="secondary"
                    className="border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    +{bookGenre.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  )
}

// Agent 2 (Performance): Memoize to prevent unnecessary re-renders in carousels and grids
export const BookCard = React.memo(BookCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.showReadCount === nextProps.showReadCount &&
    prevProps.showProgress === nextProps.showProgress &&
    prevProps.progress === nextProps.progress &&
    prevProps.book.id === nextProps.book.id &&
    prevProps.book.slug === nextProps.book.slug &&
    prevProps.book.title === nextProps.book.title &&
    prevProps.book.author === nextProps.book.author &&
    prevProps.book.cover_url === nextProps.book.cover_url &&
    prevProps.book.rating === nextProps.book.rating &&
    prevProps.book.read_count === nextProps.book.read_count
  )
})
