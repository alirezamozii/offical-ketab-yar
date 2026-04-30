import type { Database } from '@/types/database.types'
import { createClient } from '@/lib/supabase/server'

// Map Supabase types to our internal types
export type Book = Database['public']['Tables']['books']['Row']
export type Author = Database['public']['Tables']['authors']['Row']
export type Review = Database['public']['Tables']['reviews']['Row'] & {
    profiles?: {
        full_name: string | null
        avatar_url: string | null
    }
}

export type BookListItem = Pick<Book, 'id' | 'title' | 'slug' | 'cover_url' | 'author' | 'rating' | 'review_count' | 'genres' | 'is_premium' | 'level' | 'publication_year'>

/**
 * Get all published books from Supabase
 */
export async function getBooks(): Promise<BookListItem[]> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('books')
            .select('id, title, slug, cover_url, author, rating, review_count, genres, is_premium, level, publication_year')
            .eq('status', 'published')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Failed to fetch books from Supabase:', error)
        return []
    }
}

/**
 * Get book by slug from Supabase
 */
export async function getBookBySlug(slug: string): Promise<Book | null> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .eq('slug', slug)
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Failed to fetch book from Supabase:', error)
        return null
    }
}

/**
 * Get book by ID from Supabase
 */
export async function getBookById(id: string): Promise<Book | null> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Failed to fetch book from Supabase:', error)
        return null
    }
}

/**
 * Get recently added books from Supabase
 */
export async function getRecentlyAddedBooks(limit: number = 12): Promise<BookListItem[]> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('books')
            .select('id, title, slug, cover_url, author, rating, review_count, genres, is_premium, level, publication_year')
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Failed to fetch recently added books from Supabase:', error)
        return []
    }
}

/**
 * Get highest rated books from Supabase
 */
export async function getHighestRatedBooks(limit: number = 12): Promise<BookListItem[]> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('books')
            .select('id, title, slug, cover_url, author, rating, review_count, genres, is_premium, level, publication_year')
            .eq('status', 'published')
            .order('rating', { ascending: false })
            .limit(limit)

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Failed to fetch highest rated books from Supabase:', error)
        return []
    }
}

/**
 * Get most read books from Supabase
 */
export async function getMostReadBooks(limit: number = 12): Promise<BookListItem[]> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('books')
            .select('id, title, slug, cover_url, author, rating, review_count, genres, is_premium, level, publication_year')
            .eq('status', 'published')
            .order('view_count', { ascending: false })
            .limit(limit)

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Failed to fetch most read books from Supabase:', error)
        return []
    }
}

/**
 * Get related books by genre from Supabase
 */
export async function getRelatedBooks(bookId: string, genres: string[], limit: number = 4): Promise<BookListItem[]> {
    try {
        if (!genres || genres.length === 0) return []
        
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('books')
            .select('id, title, slug, cover_url, author, rating, review_count, genres, is_premium, level, publication_year')
            .neq('id', bookId)
            .contains('genres', [genres[0]])
            .limit(limit)

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Failed to fetch related books from Supabase:', error)
        return []
    }
}

/**
 * Get author by ID from Supabase
 */
export async function getAuthorById(id: string): Promise<Author | null> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('authors')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Failed to fetch author from Supabase:', error)
        return null
    }
}

/**
 * Get trending/popular books from Supabase
 */
export async function getTrendingBooks(limit: number = 12): Promise<BookListItem[]> {
    return getMostReadBooks(limit)
}

/**
 * Get reviews by book ID from Supabase
 */
export async function getReviewsByBookId(bookId: string): Promise<Review[]> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                profiles:user_id (
                    full_name,
                    avatar_url
                )
            `)
            .eq('book_id', bookId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return (data as any) || []
    } catch (error) {
        console.error('Failed to fetch reviews from Supabase:', error)
        return []
    }
}

/**
 * Get all categories/genres from Supabase
 */
export async function getCategories(): Promise<Database['public']['Tables']['categories']['Row'][]> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name')

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Failed to fetch categories from Supabase:', error)
        return []
    }
}

