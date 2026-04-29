/**
 * Gamification Queries
 * Agent 2 (Performance): Optimized queries with minimal database load
 * Agent 3 (Psychology): Complete feature support
 */

import { createClient } from '@/lib/supabase/client'
import type {
    Achievement,
    AchievementWithProgress,
    GamificationResult,
    GamificationUpdate,
    StreakInfo,
    UserAchievement,
    UserStats,
    XPGainResult,
} from '@/types/gamification'
import {
    calculateAchievementProgress,
    calculateStreakDanger,
    calculateXPGain,
    isAchievementUnlocked,
    XP_REWARDS
} from '@/types/gamification'

/**
 * Get user stats (XP, level, streak)
 */
export async function getUserStats(userId?: string): Promise<{
    success: boolean
    stats?: UserStats
    error?: string
}> {
    try {
        const supabase = createClient()

        // Get current user if not provided
        if (!userId) {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) {
                return { success: false, error: 'Not authenticated' }
            }
            userId = user.id
        }

        const { data, error } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error) {
            // If user stats don't exist, create them
            if (error.code === 'PGRST116') {
                const { data: newStats, error: insertError } = await supabase
                    .from('user_stats')
                    .insert({ user_id: userId })
                    .select()
                    .single()

                if (insertError) {
                    return { success: false, error: insertError.message }
                }

                return { success: true, stats: newStats }
            }

            return { success: false, error: error.message }
        }

        return { success: true, stats: data }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

/**
 * Update user stats (XP, pages, time, completion)
 * Agent 2: This is called with debouncing from the client
 */
export async function updateUserStats(
    update: GamificationUpdate
): Promise<GamificationResult> {
    try {
        const supabase = createClient()

        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Not authenticated' }
        }

        // Get current stats
        const { stats: currentStats } = await getUserStats(user.id)
        if (!currentStats) {
            return { success: false, error: 'Failed to get user stats' }
        }

        // Calculate XP gain
        const xpGained = calculateXPGain({
            pages_read: update.pages_read,
            reading_time: update.reading_time,
            book_completed: update.book_completed,
            current_streak: currentStats.current_streak,
        })

        // Call database function to update stats
        const { data, error } = await supabase.rpc('update_user_stats', {
            p_user_id: user.id,
            p_xp_gained: xpGained,
            p_pages_read: update.pages_read || 0,
            p_reading_time: update.reading_time || 0,
            p_book_completed: update.book_completed || false,
        })

        if (error) {
            return { success: false, error: error.message }
        }

        const result = data[0]

        // Get updated stats
        const { stats: newStats } = await getUserStats(user.id)

        // Calculate XP result
        const xpResult: XPGainResult = {
            xp_gained: xpGained,
            new_total_xp: result.new_xp,
            new_level: result.new_level,
            level_up: result.level_up,
            level_up_reward: result.level_up
                ? result.new_level * XP_REWARDS.LEVEL_UP_REWARD_MULTIPLIER
                : undefined,
        }

        // Calculate streak info
        const streakDanger = calculateStreakDanger(newStats?.last_read_date || null)
        const streakInfo: StreakInfo = {
            current_streak: result.new_streak,
            longest_streak: newStats?.longest_streak || 0,
            is_in_danger: streakDanger.is_in_danger,
            hours_until_expiry: streakDanger.hours_until_expiry,
            last_read_date: newStats?.last_read_date || null,
        }

        // Check for new achievements
        const newAchievements = await checkNewAchievements(user.id)

        return {
            success: true,
            stats: newStats,
            xp_result: xpResult,
            streak_info: streakInfo,
            new_achievements: newAchievements.length > 0 ? newAchievements : undefined,
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

/**
 * Get all achievements
 */
async function getAchievements(): Promise<{
    success: boolean
    achievements?: Achievement[]
    error?: string
}> {
    try {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('achievements')
            .select('*')
            .order('requirement_value', { ascending: true })

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true, achievements: data }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

/**
 * Get user's earned achievements
 */
async function getUserAchievements(userId?: string): Promise<{
    success: boolean
    achievements?: UserAchievement[]
    error?: string
}> {
    try {
        const supabase = createClient()

        if (!userId) {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) {
                return { success: false, error: 'Not authenticated' }
            }
            userId = user.id
        }

        const { data, error } = await supabase
            .from('user_achievements')
            .select(
                `
                *,
                achievement:achievements(*)
            `
            )
            .eq('user_id', userId)
            .order('earned_at', { ascending: false })

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true, achievements: data }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

/**
 * Get achievements with progress
 */
export async function getAchievementsWithProgress(): Promise<{
    success: boolean
    achievements?: AchievementWithProgress[]
    error?: string
}> {
    try {
        const supabase = createClient()

        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Not authenticated' }
        }

        // Get all achievements
        const { achievements: allAchievements } = await getAchievements()
        if (!allAchievements) {
            return { success: false, error: 'Failed to get achievements' }
        }

        // Get user's earned achievements
        const { achievements: earnedAchievements } = await getUserAchievements(user.id)
        const earnedIds = new Set(
            earnedAchievements?.map((a) => a.achievement_id) || []
        )

        // Get user stats for progress calculation
        const { stats } = await getUserStats(user.id)
        if (!stats) {
            return { success: false, error: 'Failed to get user stats' }
        }

        // Combine data
        const achievementsWithProgress: AchievementWithProgress[] = allAchievements.map(
            (achievement) => {
                const progress = calculateAchievementProgress(achievement, stats)
                const progressPercentage =
                    (progress / achievement.requirement_value) * 100

                return {
                    ...achievement,
                    earned: earnedIds.has(achievement.id),
                    progress,
                    progress_percentage: Math.min(100, progressPercentage),
                }
            }
        )

        return { success: true, achievements: achievementsWithProgress }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

/**
 * Check for newly unlocked achievements
 * Agent 3: This creates surprise moments
 */
async function checkNewAchievements(userId: string): Promise<Achievement[]> {
    try {
        const supabase = createClient()

        // Get user stats
        const { stats } = await getUserStats(userId)
        if (!stats) return []

        // Get all achievements
        const { achievements: allAchievements } = await getAchievements()
        if (!allAchievements) return []

        // Get already earned achievements
        const { achievements: earnedAchievements } = await getUserAchievements(userId)
        const earnedIds = new Set(
            earnedAchievements?.map((a) => a.achievement_id) || []
        )

        // Find newly unlocked achievements
        const newlyUnlocked: Achievement[] = []

        for (const achievement of allAchievements) {
            // Skip if already earned
            if (earnedIds.has(achievement.id)) continue

            // Check if unlocked
            if (isAchievementUnlocked(achievement, stats)) {
                // Award achievement
                const { error } = await supabase.from('user_achievements').insert({
                    user_id: userId,
                    achievement_id: achievement.id,
                })

                if (!error) {
                    newlyUnlocked.push(achievement)

                    // Award XP bonus
                    await supabase.rpc('update_user_stats', {
                        p_user_id: userId,
                        p_xp_gained: achievement.xp_reward,
                        p_pages_read: 0,
                        p_reading_time: 0,
                        p_book_completed: false,
                    })
                }
            }
        }

        return newlyUnlocked
    } catch (error) {
        console.error('Error checking achievements:', error)
        return []
    }
}

/**
 * Get streak info
 */
export async function getStreakInfo(userId?: string): Promise<{
    success: boolean
    streak?: StreakInfo
    error?: string
}> {
    try {
        const { stats } = await getUserStats(userId)
        if (!stats) {
            return { success: false, error: 'Failed to get user stats' }
        }

        const streakDanger = calculateStreakDanger(stats.last_read_date)

        const streakInfo: StreakInfo = {
            current_streak: stats.current_streak,
            longest_streak: stats.longest_streak,
            is_in_danger: streakDanger.is_in_danger,
            hours_until_expiry: streakDanger.hours_until_expiry,
            last_read_date: stats.last_read_date,
        }

        return { success: true, streak: streakInfo }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

/**
 * Get leaderboard (top users by XP)
 * Agent 3: Social competition
 */
async function getLeaderboard(limit: number = 10): Promise<{
    success: boolean
    leaderboard?: Array<UserStats & { rank: number }>
    error?: string
}> {
    try {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('user_stats')
            .select('*')
            .order('xp', { ascending: false })
            .limit(limit)

        if (error) {
            return { success: false, error: error.message }
        }

        const leaderboard = data.map((stats, index) => ({
            ...stats,
            rank: index + 1,
        }))

        return { success: true, leaderboard }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}
