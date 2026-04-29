import { createClient } from '@/lib/supabase/client'

type ActivityType =
    | 'book_started'
    | 'book_completed'
    | 'achievement_earned'
    | 'level_up'
    | 'streak_milestone'
    | 'playlist_created'
    | 'playlist_updated'
    | 'book_rated'
    | 'vocabulary_milestone'

export interface FriendActivity {
    activity_id: string
    user_id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
    activity_type: ActivityType
    book_id: string | null
    book_title: string | null
    book_cover: string | null
    achievement_id: string | null
    playlist_id: string | null
    playlist_name: string | null
    metadata: Record<string, any>
    created_at: string
}

/**
 * Create a friend activity
 */
async function createFriendActivity(data: {
    user_id: string
    activity_type: ActivityType
    book_id?: string
    achievement_id?: string
    playlist_id?: string
    metadata?: Record<string, any>
}) {
    const supabase = createClient()

    const { data: activity, error } = await supabase
        .from('friend_activities')
        .insert({
            user_id: data.user_id,
            activity_type: data.activity_type,
            book_id: data.book_id || null,
            achievement_id: data.achievement_id || null,
            playlist_id: data.playlist_id || null,
            metadata: data.metadata || {}
        })
        .select()
        .single()

    if (error) throw error
    return activity
}

/**
 * Get friend activity feed
 */
export async function getFriendActivityFeed(
    userId: string,
    limit = 50
): Promise<FriendActivity[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .rpc('get_friend_activity_feed', {
            p_user_id: userId,
            p_limit: limit
        })

    if (error) throw error
    return data || []
}

/**
 * Get user's own activities
 */
async function getUserActivities(userId: string, limit = 50) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('friend_activities')
        .select(`
      *,
      book:books(id, title, cover_url, slug),
      playlist:book_playlists(id, name)
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) throw error
    return data || []
}

/**
 * Delete an activity
 */
async function deleteActivity(activityId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('friend_activities')
        .delete()
        .eq('id', activityId)

    if (error) throw error
}

/**
 * Helper: Log book started activity
 */
async function logBookStarted(userId: string, bookId: string) {
    return createFriendActivity({
        user_id: userId,
        activity_type: 'book_started',
        book_id: bookId
    })
}

/**
 * Helper: Log book completed activity
 */
async function logBookCompleted(userId: string, bookId: string, xpEarned?: number) {
    return createFriendActivity({
        user_id: userId,
        activity_type: 'book_completed',
        book_id: bookId,
        metadata: xpEarned ? { xp_earned: xpEarned } : {}
    })
}

/**
 * Helper: Log achievement earned activity
 */
async function logAchievementEarned(
    userId: string,
    achievementId: string,
    achievementName: string
) {
    return createFriendActivity({
        user_id: userId,
        activity_type: 'achievement_earned',
        achievement_id: achievementId,
        metadata: { achievement_name: achievementName }
    })
}

/**
 * Helper: Log level up activity
 */
async function logLevelUp(userId: string, newLevel: number, levelTitle: string) {
    return createFriendActivity({
        user_id: userId,
        activity_type: 'level_up',
        metadata: { new_level: newLevel, level_title: levelTitle }
    })
}

/**
 * Helper: Log streak milestone activity
 */
async function logStreakMilestone(userId: string, streakDays: number) {
    return createFriendActivity({
        user_id: userId,
        activity_type: 'streak_milestone',
        metadata: { streak_days: streakDays }
    })
}

/**
 * Helper: Log playlist created activity
 */
export async function logPlaylistCreated(userId: string, playlistId: string) {
    return createFriendActivity({
        user_id: userId,
        activity_type: 'playlist_created',
        playlist_id: playlistId
    })
}

/**
 * Helper: Log vocabulary milestone activity
 */
async function logVocabularyMilestone(userId: string, wordCount: number) {
    return createFriendActivity({
        user_id: userId,
        activity_type: 'vocabulary_milestone',
        metadata: { word_count: wordCount }
    })
}
