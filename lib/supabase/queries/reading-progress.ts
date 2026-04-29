/**
 * Reading Progress Queries
 */

import { createClient } from '../server'

export async function getUserReadingProgress(userId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('user_library')
        .select(`
      *,
      book:books(*)
    `)
        .eq('user_id', userId)
        .eq('status', 'reading')
        .order('updated_at', { ascending: false })

    if (error) {
        console.error('Error fetching reading progress:', error)
        return []
    }

    return data
}

async function updateReadingProgress(
    userId: string,
    bookId: string,
    progress: {
        current_page?: number
        progress_percentage?: number
        status?: 'want_to_read' | 'reading' | 'completed'
    }
) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('user_library')
        .upsert({
            user_id: userId,
            book_id: bookId,
            ...progress,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single()

    if (error) {
        console.error('Error updating reading progress:', error)
        throw error
    }

    return data
}
