/**
 * Mock data types and exports for development
 */

export interface MockBook {
    _id: string
    _type: string
    title: string | { en: string; fa: string }
    slug: { current: string }
    subtitle?: string | { en: string; fa: string }
    authors?: { name: string; slug?: { current: string } }
    author?: { name: string; slug?: { current: string } }
    coverImage?: string
    summary?: string | { en: string; fa: string }
    isbn?: string
    publisher?: string
    genres?: Array<{ _id: string; name: string; slug: { current: string } }>
    level?: string
    freePreviewPages?: number
    isPremium?: boolean
    featured?: boolean
    status?: string
    publishedAt?: string
    content: string[]
    chapters?: Array<{
        _type: string
        _key: string
        title: { en: string; fa: string }
        chapterNumber: number
        content: Array<unknown>
    }>
}

// Re-export from mock-data folder
export { mockAuthor, mockBook, mockBooks, mockGenres } from '@/lib/mock-data/banana-book';

