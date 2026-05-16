'use client'

import { BookCard } from '@/components/books/book-card'
import { Button } from '@/components/ui/button'
import useEmblaCarousel from 'embla-carousel-react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

interface Book {
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
  read_count?: number
  genre?: string[]
  genres?: string[]
}

interface BookCarouselSectionProps {
  title: string
  description: string
  books: Book[]
  icon?: React.ReactNode
  viewAllLink: string
  viewAllText?: string
  showReadCount?: boolean
  progress?: Record<string, number>
  bgClass?: string
  autoScrollDirection?: 'left' | 'right'
}

export function BookCarouselSection({
  title,
  description,
  books,
  icon,
  viewAllLink,
  viewAllText = 'مشاهده همه',
  showReadCount,
  progress,
  bgClass = '',
  autoScrollDirection = 'left',
}: BookCarouselSectionProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    slidesToScroll: 1,
    skipSnaps: false,
    dragFree: true,
    containScroll: 'trimSnaps',
    watchDrag: true,
  })

  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  // Subtle auto-scroll animation (Agent 2 approved: GPU-only)
  useEffect(() => {
    if (!emblaApi || isHovered) return

    const autoScroll = setInterval(() => {
      if (autoScrollDirection === 'left') {
        if (emblaApi.canScrollNext()) {
          emblaApi.scrollNext()
        } else {
          emblaApi.scrollTo(0)
        }
      } else {
        if (emblaApi.canScrollPrev()) {
          emblaApi.scrollPrev()
        } else {
          emblaApi.scrollTo(emblaApi.scrollSnapList().length - 1)
        }
      }
    }, 5000) // Scroll every 5 seconds (subtle)

    return () => clearInterval(autoScroll)
  }, [emblaApi, isHovered, autoScrollDirection])

  if (!books || books.length === 0) {
    return null
  }

  return (
    <section className={`px-4 py-16 md:px-6 lg:px-8 ${bgClass}`}>
      <div className="container mx-auto overflow-visible">
        {/* Header - Fixed Text Overflow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col items-start justify-between gap-4 px-2 md:flex-row md:items-center"
        >
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              {icon && (
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="flex-shrink-0"
                >
                  {icon}
                </motion.div>
              )}
              <h2 className="bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 bg-clip-text text-2xl font-bold leading-tight text-transparent sm:text-3xl md:text-4xl">
                {title}
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              {description}
            </p>
          </div>

          <Button
            variant="outline"
            className="group flex-shrink-0 whitespace-nowrap border-2 border-gold-600/30 transition-all duration-300 hover:border-gold-600 hover:bg-gold-600/10 hover:text-gold-900 dark:hover:bg-gold-500/10 dark:hover:text-gold-100"
            asChild
          >
            <Link href={viewAllLink}>
              <span className="ml-2">{viewAllText}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>

        {/* Carousel Container - Fixed Hover Clipping */}
        <div
          className="relative px-2 py-4"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Navigation Buttons */}
          <AnimatePresence>
            {canScrollPrev && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute -left-2 top-1/2 z-20 hidden -translate-y-1/2 md:block"
              >
                <Button
                  onClick={scrollPrev}
                  size="icon"
                  className="h-12 w-12 rounded-full border-2 border-gold-500/20 bg-background/95 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-gold-500/50 hover:bg-gold-500/10 hover:shadow-2xl"
                  aria-label="قبلی"
                >
                  <ArrowLeft className="h-5 w-5 text-gold-600" />
                </Button>
              </motion.div>
            )}

            {canScrollNext && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute -right-2 top-1/2 z-20 hidden -translate-y-1/2 md:block"
              >
                <Button
                  onClick={scrollNext}
                  size="icon"
                  className="h-12 w-12 rounded-full border-2 border-gold-500/20 bg-background/95 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-gold-500/50 hover:bg-gold-500/10 hover:shadow-2xl"
                  aria-label="بعدی"
                >
                  <ArrowRight className="h-5 w-5 text-gold-600" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Carousel - Fixed Hover Clipping */}
          <div className="-mx-2 overflow-x-hidden overflow-y-visible" ref={emblaRef}>
            <div className="flex touch-pan-y gap-4 px-2 py-8 md:gap-6">
              {books.map((book, index) => (
                <motion.div
                  key={book.id || `book-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative min-w-0 flex-[0_0_240px] sm:flex-[0_0_260px] md:flex-[0_0_280px] lg:flex-[0_0_300px]"
                  style={{ zIndex: 1 }}
                  whileHover={{ zIndex: 10 }}
                >
                  <BookCard
                    book={book}
                    showReadCount={showReadCount}
                    progress={progress?.[book.id || book._id || '']}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Progress Dots */}
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: Math.ceil(books.length / 4) }).map((_, index) => (
              <button
                key={`dot-${index}`}
                onClick={() => emblaApi?.scrollTo(index * 4)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  Math.floor(selectedIndex / 4) === index
                    ? 'w-8 bg-gold-500'
                    : 'w-2 bg-gold-500/30 hover:bg-gold-500/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Mobile Navigation Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-4 text-center text-sm text-muted-foreground md:hidden"
        >
          <span className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            برای مشاهده بیشتر بکشید
            <ArrowRight className="h-4 w-4" />
          </span>
        </motion.div>
      </div>
    </section>
  )
}
