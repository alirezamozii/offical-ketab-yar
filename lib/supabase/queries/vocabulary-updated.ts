'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Updated vocabulary queries using user_words table (from Part 2)
 * Integrates with SM-2 spaced repetition and gamification
 */

// Get user's vocabulary words
export async function getUserVocabulary(userId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('user_words')
        .select(`
      id,
      word,
      definition,
      context,
      book_id,
      page_number,
      status,
      ease_factor,
      interval_days,
      repetitions,
      next_review_at,
      last_reviewed_at,
      level,
      review_count,
      correct_count,
      incorrect_count,
      created_at,
      updated_at,
      books:book_id(id, title, slug, cover_image)
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

// Add word to vocabulary with XP reward
export async function addVocabularyWord(
    userId: string,
    word: string,
    definition: string,
    context?: string,
    bookId?: string,
    pageNumber?: number,
    level?: 'beginner' | 'intermediate' | 'advanced'
) {
    const supabase = await createClient()

    // Check if word already exists
    const { data: existing } = await supabase
        .from('user_words')
        .select('id')
        .eq('user_id', userId)
        .eq('word', word)
        .single()

    if (existing) {
        return { success: false, error: 'Word already exists in your vocabulary' }
    }

    // Add word
    const { data, error } = await supabase
        .from('user_words')
        .insert({
            user_id: userId,
            word,
            definition,
            context,
            book_id: bookId,
            page_number: pageNumber,
            level: level || 'beginner',
            status: 'new',
            next_review_at: new Date( as any).toISOString(),
        })
        .select()
        .single()

    if (error) throw error

    // Add XP reward (5 XP for adding a word)
    await supabase.rpc('add_xp_to_user', {
        user_uuid: userId,
        xp_amount: 5
    })

    return { success: true, data }
}

// Delete word from vocabulary
export async function deleteVocabularyWord(wordId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('user_words')
        .delete()
        .eq('id', wordId)

    if (error) throw error
    return { success: true }
}

// Get vocabulary statistics
export async function getVocabularyStats(userId: string) {
    const supabase = await createClient()

    const { data: words, error } = await supabase
        .from('user_words')
        .select('status, review_count, correct_count, incorrect_count')
        .eq('user_id', userId)

    if (error) throw error

    const stats = {
        total: words.length,
        new: words.filter(w => w.status === 'new').length,
        learning: words.filter(w => w.status === 'learning').length,
        reviewing: words.filter(w => w.status === 'reviewing').length,
        mastered: words.filter(w => w.status === 'mastered').length,
        totalReviews: words.reduce((sum, w) => sum + w.review_count, 0),
        averageAccuracy: words.length > 0
            ? Math.round(
                (words.reduce((sum, w) => sum + (w.correct_count / Math.max(w.review_count, 1)), 0) / words.length) * 100
            )
            : 0,
    }

    return stats
}

// Get words by status
export async function getWordsByStatus(
    userId: string,
    status: 'new' | 'learning' | 'reviewing' | 'mastered'
) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('user_words')
        .select(`
      id,
      word,
      definition,
      context,
      status,
      level,
      review_count,
      correct_count,
      incorrect_count,
      next_review_at,
      books:book_id(title)
    `)
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

// Get words struggling with (< 50% accuracy)
export async function getStrugglingWords(userId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('user_words')
        .select('*')
        .eq('user_id', userId)
        .gt('review_count', 2) // At least 3 reviews
        .order('created_at', { ascending: false })

    if (error) throw error

    // Filter words with < 50% accuracy
    const struggling = data.filter(word => {
        const accuracy = word.correct_count / word.review_count
        return accuracy < 0.5
    })

    return struggling
}

// Search vocabulary
export async function searchVocabulary(userId: string, query: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('user_words')
        .select('*')
        .eq('user_id', userId)
        .or(`word.ilike.%${query}%,definition.ilike.%${query}%`)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

// Get words by book
export async function getVocabularyByBook(userId: string, bookId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('user_words')
        .select(`
      *,
      books:book_id(title, slug, cover_image)
    `)
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .order('page_number', { ascending: true })

    if (error) throw error
    return data
}

// Export vocabulary to CSV
export async function exportVocabularyToCSV(userId: string) {
    const words = await getUserVocabulary(userId)

    const csv = [
        ['Word', 'Definition', 'Context', 'Level', 'Status', 'Review Count', 'Accuracy', 'Book', 'Created At'].join(','),
        ...words.map(word => [
            word.word,
            `"${word.definition.replace(/"/g, '""')}"`,
            word.context ? `"${word.context.replace(/"/g, '""')}"` : '',
            word.level,
            word.status,
            word.review_count,
            word.review_count > 0 ? `${Math.round((word.correct_count / word.review_count) * 100)}%` : '0%',
            (Array.isArray(word.books) ? word.books[0]?.title : (word.books as { title?: string })?.title) || '',
            new Date(word.created_at).toLocaleDateString('fa-IR'),
        ].join(','))
    ].join('\n')

    return csv
}

// Bulk import words
export async function bulkImportWords(
    userId: string,
    words: Array<{ word: string; definition: string; level?: string }>
) {
    const supabase = await createClient()

    const wordsToInsert = words.map(w => ({
        user_id: userId,
        word: w.word,
        definition: w.definition,
        level: (w.level as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
        status: 'new' as const,
        next_review_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase
        .from('user_words')
        .insert(wordsToInsert as any)
        .select()

    if (error) throw error

    // Add XP reward (5 XP per word)
    await supabase.rpc('add_xp_to_user', {
        user_uuid: userId,
        xp_amount: words.length * 5
    })

    return { success: true, count: data.length }
}
