'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Update reading progress for a book
 * Automatically marks book as completed when progress reaches 90%+
 */
async function updateReadingProgress(
    bookId: string,
    currentPage: number,
    totalPages: number
) {
    try {
        const supabase = await createClient()

        // Get current user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'User not authenticated' }
        }

        // Calculate progress percentage
        const progressPercentage = Math.min(
            Math.round((currentPage / totalPages) * 100 * 100) / 100,
            100
        )

        // Upsert reading progress
        const { error: progressError } = await supabase
            .from('reading_progress')
            .upsert(
                {
                    user_id: user.id,
                    book_id: bookId,
                    current_page: currentPage,
                    total_pages: totalPages,
                    progress_percentage: progressPercentage,
                    last_read_at: new Date().toISOString(),
                },
                {
                    onConflict: 'user_id,book_id',
                }
            )

        if (progressError) {
            console.error('Error updating reading progress:', progressError)
            return { success: false, error: progressError.message }
        }

        // The database trigger will automatically handle completion tracking
        // when progress reaches 90%+

        revalidatePath('/dashboard')
        revalidatePath('/books/[slug]', 'page')

        return {
            success: true,
            progress: progressPercentage,
            isCompleted: progressPercentage >= 90,
        }
    } catch (error) {
        console.error('Error in updateReadingProgress:', error)
        return { success: false, error: 'Failed to update reading progress' }
    }
}

/**
 * Start reading a book (creates initial progress entry)
 */
async function startReading(bookId: string, totalPages: number) {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'User not authenticated' }
        }

        // Check if already started
        const { data: existing } = await supabase
            .from('reading_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('book_id', bookId)
            .single()

        if (existing) {
            return { success: true, alreadyStarted: true, progress: existing }
        }

        // Create initial progress
        const { data, error } = await supabase
            .from('reading_progress')
            .insert({
                user_id: user.id,
                book_id: bookId,
                current_page: 1,
                total_pages: totalPages,
                progress_percentage: 0,
                last_read_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (error) {
            console.error('Error starting reading:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/dashboard')
        revalidatePath('/')

        return { success: true, progress: data }
    } catch (error) {
        console.error('Error in startReading:', error)
        return { success: false, error: 'Failed to start reading' }
    }
}

/**
 * Get reading progress for a specific book
 */
async function getReadingProgress(bookId: string) {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'User not authenticated' }
        }

        const { data, error } = await supabase
            .from('reading_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('book_id', bookId)
            .single()

        if (error && error.code !== 'PGRST116') {
            // PGRST116 is "not found" error
            console.error('Error getting reading progress:', error)
            return { success: false, error: error.message }
        }

        return { success: true, progress: data || null }
    } catch (error) {
        console.error('Error in getReadingProgress:', error)
        return { success: false, error: 'Failed to get reading progress' }
    }
}

/**
 * Get all books user is currently reading
 */
async function getCurrentlyReading() {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'User not authenticated' }
        }

        const { data, error } = await supabase
            .from('reading_progress')
            .select(
                `
        *,
        books (*)
      `
            )
            .eq('user_id', user.id)
            .lt('progress_percentage', 100)
            .order('last_read_at', { ascending: false })

        if (error) {
            console.error('Error getting currently reading:', error)
            return { success: false, error: error.message }
        }

        return { success: true, books: data }
    } catch (error) {
        console.error('Error in getCurrentlyReading:', error)
        return { success: false, error: 'Failed to get currently reading books' }
    }
}

/**
 * Get completed books for a user
 */
async function getCompletedBooks() {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'User not authenticated' }
        }

        const { data, error } = await supabase
            .from('book_completions')
            .select(
                `
        *,
        books (*)
      `
            )
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false })

        if (error) {
            console.error('Error getting completed books:', error)
            return { success: false, error: error.message }
        }

        return { success: true, books: data }
    } catch (error) {
        console.error('Error in getCompletedBooks:', error)
        return { success: false, error: 'Failed to get completed books' }
    }
}

/**
 * Check if user has completed a book
 */
async function hasCompletedBook(bookId: string) {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'User not authenticated' }
        }

        const { data, error } = await supabase
            .from('book_completions')
            .select('id')
            .eq('user_id', user.id)
            .eq('book_id', bookId)
            .single()

        if (error && error.code !== 'PGRST116') {
            console.error('Error checking completion:', error)
            return { success: false, error: error.message }
        }

        return { success: true, completed: !!data }
    } catch (error) {
        console.error('Error in hasCompletedBook:', error)
        return { success: false, error: 'Failed to check completion status' }
    }
}

/**
 * Get reading statistics for a user
 */
async function getUserReadingStats() {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'User not authenticated' }
        }

        // Get completed books count
        const { count: completedCount } = await supabase
            .from('book_completions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

        // Get currently reading count
        const { count: readingCount } = await supabase
            .from('reading_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .lt('progress_percentage', 100)

        // Get total pages read (sum of all progress)
        const { data: progressData } = await supabase
            .from('reading_progress')
            .select('current_page')
            .eq('user_id', user.id)

        const totalPagesRead = progressData?.reduce(
            (sum: number, p: { current_page: number | null }) => sum + (p.current_page || 0),
            0
        ) || 0

        // Get reading streak (days with reading activity)
        const { data: recentActivity } = await supabase
            .from('reading_progress')
            .select('last_read_at')
            .eq('user_id', user.id)
            .order('last_read_at', { ascending: false })
            .limit(30)

        let streak = 0
        if (recentActivity && recentActivity.length > 0) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const currentDate = new Date(today)
            const activityDates = new Set(
                recentActivity.map((a: { last_read_at: string }) => {
                    const date = new Date(a.last_read_at)
                    date.setHours(0, 0, 0, 0)
                    return date.getTime()
                })
            )

            while (activityDates.has(currentDate.getTime())) {
                streak++
                currentDate.setDate(currentDate.getDate() - 1)
            }
        }

        return {
            success: true,
            stats: {
                booksCompleted: completedCount || 0,
                booksReading: readingCount || 0,
                totalPagesRead,
                readingStreak: streak,
            },
        }
    } catch (error) {
        console.error('Error in getUserReadingStats:', error)
        return { success: false, error: 'Failed to get reading statistics' }
    }
}

/**
 * Increment book view count (when user clicks "Read" and opens reader page)
 */
async function incrementBookView(bookId: string) {
    try {
        const supabase = await createClient()

        // Get user if authenticated
        const {
            data: { user },
        } = await supabase.auth.getUser()

        // Track detailed view with user info
        const { error } = await supabase.rpc('track_book_view', {
            p_book_id: bookId,
            p_user_id: user?.id || null,
            p_session_id: null,
        })

        if (error) {
            console.error('Error incrementing book view:', error)
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error('Error in incrementBookView:', error)
        return { success: false, error: 'Failed to increment book view' }
    }
}

/**
 * Get book view count and statistics
 */
async function getBookViewStats(bookId: string) {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('books')
            .select('views_count, read_count')
            .eq('id', bookId)
            .single()

        if (error) {
            console.error('Error getting book view stats:', error)
            return { success: false, error: error.message }
        }

        return {
            success: true,
            views: data.views_count || 0,
            reads: data.read_count || 0,
        }
    } catch (error) {
        console.error('Error in getBookViewStats:', error)
        return { success: false, error: 'Failed to get book view stats' }
    }
}
