/**
 * SANITY DATA TRANSFORMATION UTILITIES
 * 
 * Transforms Sanity data to display-ready format:
 * - Image URLs with proper sizing
 * - Farsi text prioritization
 * - Genre/author object to string conversion
 */

import { getImageUrl } from './client'

/**
 * Transform Sanity book for display
 * Handles images, text, and nested objects
 */
export function transformBookForDisplay(book: any) {
    if (!book) return null

    // Get image URL with proper sizing
    let coverImage = '/placeholder-book.jpg'

    if (book.coverImage) {
        if (typeof book.coverImage === 'string') {
            coverImage = book.coverImage
        } else {
            coverImage = getImageUrl(book.coverImage, 300, 450)
        }
    }

    // Prioritize Farsi text for UI
    const displayTitle = book.titleFa || book.title
    const displaySubtitle = book.subtitleFa || book.subtitle
    const displaySummary = book.summaryFa || book.summary

    // Transform author (can be string or object)
    const authorName = typeof book.author === 'string'
        ? book.author
        : book.author?.name || 'نویسنده ناشناس'

    // Transform genres (array of objects to array of Farsi names)
    const genres = Array.isArray(book.genres)
        ? book.genres.map((g: any) =>
            typeof g === 'string' ? g : (g?.nameFa || g?.name || 'Unknown')
        )
        : []

    // Get slug (can be string or object)
    const slug = typeof book.slug === 'string' ? book.slug : book.slug?.current

    return {
        ...book,
        // Display-ready fields
        coverImage,
        displayTitle,
        displaySubtitle,
        displaySummary,
        authorName,
        genres,
        slug,
        // Keep originals for reference
        _original: {
            title: book.title,
            titleFa: book.titleFa,
            author: book.author,
        }
    }
}

/**
 * Transform array of books
 */
export function transformBooksForDisplay(books: any[]) {
    if (!books || !Array.isArray(books)) return []
    return books.map(transformBookForDisplay).filter(Boolean)
}

/**
 * Transform author for display
 */
export function transformAuthorForDisplay(author: any) {
    if (!author) return null

    const photo = author.photo
        ? getImageUrl(author.photo, 200, 200)
        : '/placeholder-avatar.jpg'

    return {
        ...author,
        photo,
    }
}

/**
 * Get genre display name (Farsi priority)
 */
export function getGenreDisplayName(genre: any): string {
    if (typeof genre === 'string') return genre
    return genre?.nameFa || genre?.name || 'Unknown'
}

/**
 * Get book title for display (Farsi priority)
 */
export function getBookDisplayTitle(book: any): string {
    return book?.titleFa || book?.title || 'Untitled'
}

/**
 * Get author display name
 */
export function getAuthorDisplayName(author: any): string {
    if (typeof author === 'string') return author
    return author?.name || 'نویسنده ناشناس'
}
