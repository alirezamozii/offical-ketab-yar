/**
 * UNIFIED DATA API
 * 
 * This module provides a single interface for data access using Sanity CMS.
 * Agent 1 (SEO) - Optimized for static generation
 * Agent 2 (Performance) - Efficient queries, no mock data overhead
 */

import type { Author, SanityBook, SanityBookListItem } from '@/lib/sanity/types'

// Type exports for compatibility
export type { Author, SanityBook as Book, SanityBookListItem as BookListItem }

/**
 * Get all published books from Sanity CMS
 */
export async function getBooks(): Promise<SanityBookListItem[]> {
    try {
        const { getAllBooks } = await import('@/lib/sanity/queries')
        return await getAllBooks()
    } catch (error) {
        console.error('Failed to fetch books from Sanity:', error)
        return []
    }
}

/**
 * Get book by slug from Sanity CMS
 */
async function getBookBySlug(slug: string): Promise<SanityBook | null> {
    try {
        const { getBookBySlug: getSanityBookBySlug } = await import('@/lib/sanity/queries')
        return await getSanityBookBySlug(slug)
    } catch (error) {
        console.error('Failed to fetch book from Sanity:', error)
        return null
    }
}

/**
 * Get book by ID from Sanity CMS
 */
async function getBookById(id: string): Promise<SanityBook | null> {
    try {
        const { getBookById: getSanityBookById } = await import('@/lib/sanity/queries')
        return await getSanityBookById(id)
    } catch (error) {
        console.error('Failed to fetch book from Sanity:', error)
        return null
    }
}

/**
 * Get recently added books from Sanity CMS
 */
async function getRecentlyAddedBooks(limit: number = 12): Promise<SanityBookListItem[]> {
    try {
        const { getRecentlyAddedBooks: getSanityRecentBooks } = await import('@/lib/sanity/queries')
        return await getSanityRecentBooks(limit)
    } catch (error) {
        console.error('Failed to fetch recently added books from Sanity:', error)
        return []
    }
}

/**
 * Get highest rated books from Sanity CMS
 */
async function getHighestRatedBooks(limit: number = 12): Promise<SanityBookListItem[]> {
    try {
        const { getFeaturedBooks } = await import('@/lib/sanity/queries')
        return await getFeaturedBooks(limit)
    } catch (error) {
        console.error('Failed to fetch highest rated books from Sanity:', error)
        return []
    }
}

/**
 * Get most read books from Sanity CMS
 */
export async function getMostReadBooks(limit: number = 12): Promise<SanityBookListItem[]> {
    try {
        const { getFeaturedBooks } = await import('@/lib/sanity/queries')
        return await getFeaturedBooks(limit)
    } catch (error) {
        console.error('Failed to fetch most read books from Sanity:', error)
        return []
    }
}

/**
 * Get related books by genre from Sanity CMS
 */
async function getRelatedBooks(bookId: string, genres: string[], limit: number = 4): Promise<SanityBookListItem[]> {
    try {
        const { getBooksByGenre } = await import('@/lib/sanity/queries')
        // Get books from first genre
        const books = await getBooksByGenre(genres[0] || '', limit + 1)
        // Filter out current book
        return books.filter((book: SanityBookListItem) => book._id !== bookId).slice(0, limit)
    } catch (error) {
        console.error('Failed to fetch related books from Sanity:', error)
        return []
    }
}

/**
 * Get author by ID from Sanity CMS
 */
async function getAuthorById(id: string): Promise<Author | null> {
    try {
        const { getAuthorById: getSanityAuthorById } = await import('@/lib/sanity/queries')
        return await getSanityAuthorById(id)
    } catch (error) {
        console.error('Failed to fetch author from Sanity:', error)
        return null
    }
}

/**
 * Get trending/popular books from Sanity CMS
 * Used for "Most Read" and "Highest Rated" sections
 */
export async function getTrendingBooks(limit: number = 12): Promise<SanityBookListItem[]> {
    try {
        const { getFeaturedBooks } = await import('@/lib/sanity/queries')
        return await getFeaturedBooks(limit)
    } catch (error) {
        console.error('Failed to fetch trending books from Sanity:', error)
        return []
    }
}

/**
 * Review type definition
 */
export interface Review {
    id: string
    rating: number
    comment: string
    created_at: string
    helpful_count: number
    profiles?: {
        full_name?: string
        avatar_url?: string
    }
}

/**
 * Get reviews by book ID
 * Note: Reviews are stored in Supabase, not Sanity
 */
async function getReviewsByBookId(_bookId: string): Promise<Review[]> {
    try {
        // For now, return empty array since reviews are in Supabase
        // This will be implemented when we integrate Supabase reviews with Sanity books
        return []
    } catch (error) {
        console.error('Failed to fetch reviews:', error)
        return []
    }
}
