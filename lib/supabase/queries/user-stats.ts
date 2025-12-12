/**
 * User Statistics Queries
 * Aggregated real data from database
 */

import { createClient } from '@/lib/supabase/client'
import { calculateLevel } from '@/lib/utils/gamification'

export interface UserStats {
    // Gamification
    xp: number
    level: number
    currentStreak: number
    longestStreak: number
    lastReadAt: Date | null

    // Reading Stats
    totalBooksRead: number
    booksInProgress: number
    totalPagesRead: number
    totalReadingTime: number // minutes

    // Learning Stats
    vocabularyCount: number
    vocabularyMastered: number
    highlightsCount: number
    bookmarksCount: number

    // Achievements
    achievementsEarned: number
    totalAchievements: number
}

/**
 * Get comprehensive user statistics
 */
/**
 * Get comprehensive user statistics
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
    try {
        const supabase = createClient()

        // Execute all queries in parallel
        const results = await Promise.all([
            // 1. Profile data
            supabase
                .from('profiles')
                .select('xp, current_streak, longest_streak, last_read_at')
                .eq('id', userId)
                .single(),

            // 2. Books read
            supabase
                .from('user_library')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('status', 'completed'),

            // 3. Books in progress
            supabase
                .from('user_library')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('status', 'reading'),

            // 4. Reading sessions/pages
            supabase
                .from('reading_sessions')
                .select('pages_read, duration_minutes')
                .eq('user_id', userId),

            // 5. Vocabulary total
            supabase
                .from('vocabulary')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId),

            // 6. Vocabulary mastered
            supabase
                .from('vocabulary')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('status', 'mastered'),

            // 7. Highlights
            supabase
                .from('highlights')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId),

            // 8. Bookmarks
            supabase
                .from('bookmarks')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId),

            // 9. Achievements earned
            supabase
                .from('user_achievements')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId),

            // 10. Total achievements
            supabase
                .from('achievements')
                .select('*', { count: 'exact', head: true })
        ])

        const profile = results[0].data as any
        const booksCompleted = results[1].count
        const booksReading = results[2].count
        const sessions = results[3].data as any[] | null
        const vocabTotal = results[4].count
        const vocabMastered = results[5].count
        const highlightsTotal = results[6].count
        const bookmarksTotal = results[7].count
        const achievementsEarned = results[8].count
        const totalAchievements = results[9].count

        if (!profile) return null

        const totalPages = sessions?.reduce((sum, s) => sum + (s.pages_read || 0), 0) || 0
        const totalTime = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0

        return {
            xp: profile.xp || 0,
            level: calculateLevel(profile.xp || 0),
            currentStreak: profile.current_streak || 0,
            longestStreak: profile.longest_streak || 0,
            lastReadAt: profile.last_read_at ? new Date(profile.last_read_at) : null,
            totalBooksRead: booksCompleted || 0,
            booksInProgress: booksReading || 0,
            totalPagesRead: totalPages,
            totalReadingTime: totalTime,
            vocabularyCount: vocabTotal || 0,
            vocabularyMastered: vocabMastered || 0,
            highlightsCount: highlightsTotal || 0,
            bookmarksCount: bookmarksTotal || 0,
            achievementsEarned: achievementsEarned || 0,
            totalAchievements: totalAchievements || 0,
        }
    } catch (error) {
        console.error('Error fetching user stats:', error)
        return null
    }
}

/**
 * Get user's earned achievements with details
 */
export async function getUserAchievements(userId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('user_achievements')
        .select(`
      earned_at,
      achievements (
        id,
        name,
        description,
        icon,
        points
      )
    `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })

    if (error) {
        console.error('Error fetching achievements:', error)
        return []
    }

    return data || []
}

/**
 * Get reading history (recent sessions)
 */
export async function getReadingHistory(userId: string, limit = 10) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('reading_sessions')
        .select(`
      id,
      pages_read,
      duration_minutes,
      xp_earned,
      created_at,
      books (
        id,
        title,
        slug,
        cover_url,
        author
      )
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching reading history:', error)
        return []
    }

    return data || []
}
