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
        <section className={`py-16 px-4 md:px-6 lg:px-8 ${bgClass}`}>
            <div className="container mx-auto overflow-visible">
                {/* Header - Fixed Text Overflow */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 px-2"
                >
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
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
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 bg-clip-text text-transparent leading-tight">
                                {title}
                            </h2>
                        </div>
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{description}</p>
                    </div>

                    <Button
                        variant="outline"
                        className="group border-2 border-gold-600/30 hover:border-gold-600 hover:bg-gold-600/10 hover:text-gold-900 dark:hover:text-gold-100 dark:hover:bg-gold-500/10 transition-all duration-300 whitespace-nowrap flex-shrink-0"
                        asChild
                    >
                        <Link href={viewAllLink}>
                            <span className="ml-2">{viewAllText}</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                                className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 hidden md:block"
                            >
                                <Button
                                    onClick={scrollPrev}
                                    size="icon"
                                    className="h-12 w-12 rounded-full bg-background/95 backdrop-blur-md border-2 border-gold-500/20 hover:border-gold-500/50 hover:bg-gold-500/10 shadow-xl hover:shadow-2xl transition-all duration-300"
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
                                className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 hidden md:block"
                            >
                                <Button
                                    onClick={scrollNext}
                                    size="icon"
                                    className="h-12 w-12 rounded-full bg-background/95 backdrop-blur-md border-2 border-gold-500/20 hover:border-gold-500/50 hover:bg-gold-500/10 shadow-xl hover:shadow-2xl transition-all duration-300"
                                    aria-label="بعدی"
                                >
                                    <ArrowRight className="h-5 w-5 text-gold-600" />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Carousel - Fixed Hover Clipping */}
                    <div className="overflow-x-hidden overflow-y-visible -mx-2" ref={emblaRef}>
                        <div className="flex gap-4 md:gap-6 touch-pan-y px-2 py-8">
                            {books.map((book, index) => (
                                <motion.div
                                    key={book.id || `book-${index}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="flex-[0_0_240px] sm:flex-[0_0_260px] md:flex-[0_0_280px] lg:flex-[0_0_300px] min-w-0 relative"
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
                    <div className="flex justify-center gap-2 mt-6">
                        {Array.from({ length: Math.ceil(books.length / 4) }).map((_, index) => (
                            <button
                                key={`dot-${index}`}
                                onClick={() => emblaApi?.scrollTo(index * 4)}
                                className={`h-2 rounded-full transition-all duration-300 ${Math.floor(selectedIndex / 4) === index
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
                    className="md:hidden text-center mt-4 text-sm text-muted-foreground"
                >
                    <span className="inline-flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        برای مشاهده بیشتر بکشید
                        <ArrowRight className="w-4 h-4" />
                    </span>
                </motion.div>
            </div>
        </section>
    )
}
