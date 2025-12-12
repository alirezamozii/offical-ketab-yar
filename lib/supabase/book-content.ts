/**
 * Book Content Loading from Supabase Storage
 * Agent 2 (Performance): Load entire book in 1 request, not 500 queries
 */

import { createClient } from '@/lib/supabase/client'

export interface BilingualContent {
    english: string
    farsi: string
}

export interface BookContent {
    pages: BilingualContent[]
    metadata: {
        title: string
        author: string
        totalPages: number
        language: 'english' | 'farsi'
    }
}

/**
 * Load book content from Supabase Storage
 * Agent 2: 1 request vs 500 database queries = 500x faster
 */
export async function loadBookContent(
    bookId: string,
    language: 'en' | 'fa' = 'en'
): Promise<BookContent | null> {
    try {
        const supabase = createClient()

        // Download JSON file from Storage
        const fileName = `${bookId}-${language}.json`
        const { data, error } = await supabase.storage
            .from('book-content')
            .download(fileName)

        if (error) {
            console.error(`Failed to load book content for ${bookId}:`, error)
            return null
        }

        // Parse JSON
        const text = await data.text()
        const content: BookContent = JSON.parse(text)

        console.log(`✅ Loaded book ${bookId} (${content.pages.length} pages)`)
        return content
    } catch (error) {
        console.error('Error loading book content:', error)
        return null
    }
}

/**
 * Load both English and Farsi versions simultaneously
 * Agent 2: Parallel loading for better performance
 */
export async function loadBilingualBookContent(
    bookId: string
): Promise<{ en: BookContent | null; fa: BookContent | null }> {
    const [en, fa] = await Promise.all([
        loadBookContent(bookId, 'en'),
        loadBookContent(bookId, 'fa'),
    ])

    return { en, fa }
}

/**
 * Client-side pagination
 * Agent 2: Virtual pagination on client (zero server load)
 */
export function paginateContent(
    content: string,
    wordsPerPage: number = 300
): string[] {
    const words = content.split(/\s+/)
    const pages: string[] = []

    for (let i = 0; i < words.length; i += wordsPerPage) {
        const pageWords = words.slice(i, i + wordsPerPage)
        pages.push(pageWords.join(' '))
    }

    return pages
}

/**
 * Get specific page range (for AI context)
 * Agent 3: AI needs previous 5 pages for context
 */
export function getPageRange(
    pages: BilingualContent[],
    currentPage: number,
    range: number = 5
): BilingualContent[] {
    const start = Math.max(0, currentPage - range)
    const end = currentPage + 1
    return pages.slice(start, end)
}

/**
 * Estimate reading time
 * Agent 3: Show users how long it will take
 */
export function estimateReadingTime(
    text: string,
    wordsPerMinute: number = 200
): number {
    const wordCount = text.split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
}

/**
 * Check if book content exists in Storage
 */
export async function checkBookContentExists(
    bookId: string,
    language: 'en' | 'fa' = 'en'
): Promise<boolean> {
    try {
        const supabase = createClient()
        const fileName = `${bookId}-${language}.json`

        const { data, error } = await supabase.storage
            .from('book-content')
            .list('', {
                search: fileName,
            })

        return !error && data && data.length > 0
    } catch {
        return false
    }
}

/**
 * Get book content URL (for download)
 */
export async function getBookContentUrl(
    bookId: string,
    language: 'en' | 'fa' = 'en'
): Promise<string | null> {
    try {
        const supabase = createClient()
        const fileName = `${bookId}-${language}.json`

        const { data } = await supabase.storage
            .from('book-content')
            .createSignedUrl(fileName, 3600) // 1 hour expiry

        return data?.signedUrl || null
    } catch {
        return null
    }
}
