'use client'

import { LikeButton } from '@/components/books/like-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { BookOpen, Eye, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

interface BookCardProps {
  book: {
    id?: string
    _id?: string
    slug: string
    title: string | { en: string; fa: string }
    author?: string | { name: string; slug: string }
    author_id?: string
    authors?: { name: string }
    cover_image?: string | null
    coverImage?: string | null
    rating?: number | null
    genre?: string[]
    genres?: string[]
    read_count?: number
  }
  showReadCount?: boolean
  showProgress?: boolean
  progress?: number
}

export function BookCard({ book, showReadCount, progress }: BookCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Data should already be transformed by parent component
  const coverImage = book.cover_image || book.coverImage || '/placeholder-book.jpg'
  const bookRating = book.rating || 0
  const bookGenre = book.genres || book.genre || []
  const bookId = book.id || book._id || book.slug

  // Handle title (Farsi priority)
  const bookTitle = typeof book.title === 'string' ? book.title : (book.title?.fa || book.title?.en || 'Untitled')

  // Handle author
  const bookAuthor = typeof book.author === 'string' ? book.author : (book.author?.name || 'Unknown Author')

  // Agent 2 (Performance): Simplified 3D effect - only on desktop, GPU-optimized
  const [enable3D, setEnable3D] = useState(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"])

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
      style={enable3D ? {
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      } : {}}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={enable3D ? "perspective-1000" : ""}
    >
      <Link href={`/books/${book.slug}`}>
        <Card className="group relative overflow-hidden hover:shadow-2xl hover:shadow-gold-500/20 transition-all duration-500 border-2 border-warm hover:border-gold-500/50 cursor-pointer h-full bg-card dark:bg-card/50 dark:border-gold-500/20 dark:hover:border-gold-500/40 backdrop-blur-sm shadow-md hover:shadow-xl">
          {/* Shine effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] translate-y-[-100%] group-hover:translate-x-[100%] group-hover:translate-y-[100%] transition-transform duration-1000" />
          </div>

          {/* Like button (Agent 3: Collection Psychology) */}
          <div
            className="absolute top-3 left-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300"
            onClick={(e) => e.preventDefault()}
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
              className="w-9 h-9 rounded-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border border-white/20 hover:bg-white hover:dark:bg-gray-900"
            />
          </div>

          <CardContent className="p-0">
            <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-warm-100 via-warm-50 to-card dark:from-gray-800 dark:via-gray-850 dark:to-gray-900">
              <Image
                src={coverImage}
                alt={bookTitle}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

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
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10"
                >
                  <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                  <span className="text-sm font-bold text-white">{bookRating.toFixed(1)}</span>
                </motion.div>
              )}

              {/* Quick stats - shown on hover */}
              <div className="absolute top-14 right-3 space-y-2 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100">
                {showReadCount && book.read_count && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs text-white">
                    <Eye className="h-3 w-3" />
                    <span>{book.read_count}</span>
                  </div>
                )}
                {progress !== undefined && progress > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs text-white">
                    <BookOpen className="h-3 w-3" />
                    <span>{Math.round(progress)}%</span>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
                <Button
                  className="w-full bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 hover:from-gold-700 hover:via-gold-600 hover:to-gold-700 text-white shadow-xl shadow-gold-500/30 border-0 h-10 font-semibold"
                  size="sm"
                  onClick={(e) => e.preventDefault()}
                >
                  <BookOpen className="ml-2 h-4 w-4" />
                  مشاهده جزئیات
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col items-start p-4 gap-2.5 bg-gradient-to-b from-card to-warm-50 dark:from-card dark:to-card/80 border-t-2 border-warm dark:border-border/50">
            <h3 className="font-bold text-base line-clamp-2 text-warm-foreground group-hover:text-gold-600 dark:text-foreground transition-colors leading-snug">
              {bookTitle}
            </h3>
            <p className="text-sm text-warm-muted dark:text-muted-foreground line-clamp-1 font-medium">{bookAuthor}</p>
            {bookGenre.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {bookGenre.slice(0, 2).map((g) => {
                  const genreName = typeof g === 'string' ? g : (g?.name || g?.nameFa || 'Unknown')
                  const genreKey = typeof g === 'string' ? g : (g?._id || genreName)
                  return (
                    <Badge
                      key={genreKey}
                      variant="secondary"
                      className="text-xs px-2.5 py-0.5 bg-gold-500/15 text-gold-800 dark:text-gold-400 border-2 border-gold-500/30 hover:bg-gold-500/25 transition-colors font-semibold"
                    >
                      {genreName}
                    </Badge>
                  )
                })}
                {bookGenre.length > 2 && (
                  <Badge
                    variant="secondary"
                    className="text-xs px-2 py-0.5 bg-muted text-muted-foreground border border-border"
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
