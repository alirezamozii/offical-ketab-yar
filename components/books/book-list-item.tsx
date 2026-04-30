'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { BookListItem } from '@/lib/data'
import { motion } from 'framer-motion'
import { BookOpen, Calendar, Star, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface BookListItemProps {
    book: BookListItem
}

/**
 * Book List Item Component
 * Agent 3 (Psychology): Premium list view with all book details
 * Agent 2 (Performance): Optimized images and animations
 */
export function BookListItemComponent({ book }: BookListItemProps) {
    const bookTitleFa = book.title
    const authorName = book.author || 'Unknown Author'
    const coverImage = book.cover_url || '/placeholder-book.png'
    const rating = book.rating || 0
    const genres = Array.isArray(book.genres)
        ? book.genres.filter(Boolean)
        : []

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
        >
            <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-gold-500/30">
                <Link href={`/books/${book.slug}`}>
                    <div className="flex flex-col md:flex-row gap-4 p-4">
                        {/* Book Cover - Desktop */}
                        <div className="hidden md:block relative w-32 flex-shrink-0">
                            <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-lg">
                                <Image
                                    src={coverImage}
                                    alt={bookTitle}
                                    fill
                                    className="object-cover transition-transform duration-300 hover:scale-105"
                                    sizes="128px"
                                />
                            </div>
                        </div>

                        {/* Book Cover - Mobile */}
                        <div className="md:hidden relative w-24 mx-auto flex-shrink-0">
                            <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-lg">
                                <Image
                                    src={coverImage}
                                    alt={bookTitle}
                                    fill
                                    className="object-cover"
                                    sizes="96px"
                                />
                            </div>
                        </div>

                        {/* Book Details */}
                        <div className="flex-1 min-w-0 space-y-3">
                            {/* Title & Author */}
                            <div>
                                <h3 className="text-lg md:text-xl font-bold line-clamp-2 mb-1 hover:text-gold-600 transition-colors">
                                    {bookTitleFa}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span className="line-clamp-1">{authorName}</span>
                                </div>
                            </div>

                            {/* Rating & Year - Desktop */}
                            <div className="hidden md:flex items-center gap-4 text-sm">
                                {rating > 0 && (
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 fill-gold-500 text-gold-500" />
                                        <span className="font-semibold">{rating.toFixed(1)}</span>
                                    </div>
                                )}
                                {book.publication_year && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>{book.publication_year}</span>
                                    </div>
                                )}
                            </div>

                            {/* Rating & Year - Mobile */}
                            <div className="md:hidden flex items-center justify-center gap-3 text-xs">
                                {rating > 0 && (
                                    <div className="flex items-center gap-1">
                                        <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
                                        <span className="font-semibold">{rating.toFixed(1)}</span>
                                    </div>
                                )}
                                {book.publication_year && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        <span>{book.publication_year}</span>
                                    </div>
                                )}
                            </div>

                            {/* Genres - Desktop */}
                            {genres.length > 0 && (
                                <div className="hidden md:flex flex-wrap gap-2">
                                    {genres.slice(0, 3).map((genre, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="bg-gold-500/10 text-gold-700 dark:text-gold-400 border-gold-500/30 text-xs"
                                        >
                                            {genre}
                                        </Badge>
                                    ))}
                                    {genres.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{genres.length - 3}
                                        </Badge>
                                    )}
                                </div>
                            )}

                            {/* Genres - Mobile */}
                            {genres.length > 0 && (
                                <div className="md:hidden flex flex-wrap gap-1 justify-center">
                                    {genres.slice(0, 2).map((genre, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="bg-gold-500/10 text-gold-700 dark:text-gold-400 border-gold-500/30 text-xs"
                                        >
                                            {genre}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {/* Action Button - Desktop */}
                            <div className="hidden md:block pt-2">
                                <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-700 hover:to-gold-600"
                                >
                                    <BookOpen className="ml-2 h-4 w-4" />
                                    مشاهده کتاب
                                </Button>
                            </div>

                            {/* Action Button - Mobile */}
                            <div className="md:hidden pt-2">
                                <Button
                                    size="sm"
                                    className="w-full bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-700 hover:to-gold-600 text-xs"
                                >
                                    <BookOpen className="ml-1 h-3 w-3" />
                                    مشاهده
                                </Button>
                            </div>
                        </div>
                    </div>
                </Link>
            </Card>
        </motion.div>
    )
}
