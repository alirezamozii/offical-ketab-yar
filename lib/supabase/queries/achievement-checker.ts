/**
 * Achievement Checker
 * Automatically checks and awards achievements
 */

import { createClient } from '@/lib/supabase/client'
import { notifyAchievement } from '@/lib/utils/notification-queue'

interface AchievementCheck {
    requirementType: string
    requirementValue: number
    currentValue: number
}

/**
 * Check and award achievements for a user
 */
export async function checkAndAwardAchievements(userId: string, checks: AchievementCheck[]) {
    const supabase = createClient()

    try {
        // Get all achievements
        const { data: allAchievements } = await supabase
            .from('achievements')
            .select('*')

        if (!allAchievements) return

        // Get user's earned achievements
        const { data: earnedAchievements } = await supabase
            .from('user_achievements')
            .select('achievement_id')
            .eq('user_id', userId)

        const earnedIds = new Set(earnedAchievements?.map(a => a.achievement_id) || [])

        // Check each achievement
        for (const achievement of allAchievements) {
            // Skip if already earned
            if (earnedIds.has(achievement.id)) continue

            // Check if requirement is met
            const check = checks.find(c => c.requirementType === achievement.requirement_type)
            if (!check) continue

            if (check.currentValue >= achievement.requirement_value) {
                // Award achievement
                const { error } = await supabase
                    .from('user_achievements')
                    .insert({
                        user_id: userId,
                        achievement_id: achievement.id
                    })

                if (!error) {
                    // Add XP reward
                    await supabase.rpc('increment_user_xp', {
                        user_id: userId,
                        xp_amount: achievement.points
                    })

                    // Notify user
                    notifyAchievement(
                        achievement.name,
                        achievement.description,
                        achievement.icon || '🏆',
                        achievement.points
                    )
                }
            }
        }
    } catch (error) {
        console.error('Error checking achievements:', error)
    }
}

/**
 * Check achievements after reading session
 */
export async function checkReadingAchievements(userId: string) {
    const supabase = createClient()

    try {
        // Get user stats
        const { data: profile } = await supabase
            .from('profiles')
            .select('xp, current_streak')
            .eq('id', userId)
            .single()

        // Get books read count
        const { count: booksRead } = await supabase
            .from('user_library')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed')

        // Get pages read count
        const { data: sessions } = await supabase
            .from('reading_sessions')
            .select('pages_read')
            .eq('user_id', userId)

        const pagesRead = sessions?.reduce((sum, s) => sum + (s.pages_read || 0), 0) || 0

        // Get vocabulary count
        const { count: wordsCount } = await supabase
            .from('vocabulary')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)

        // Check achievements
        await checkAndAwardAchievements(userId, [
            { requirementType: 'books_read', requirementValue: 0, currentValue: booksRead || 0 },
            { requirementType: 'pages_read', requirementValue: 0, currentValue: pagesRead },
            { requirementType: 'streak_days', requirementValue: 0, currentValue: profile?.current_streak || 0 },
            { requirementType: 'words_saved', requirementValue: 0, currentValue: wordsCount || 0 },
            { requirementType: 'xp_earned', requirementValue: 0, currentValue: profile?.xp || 0 },
        ])
    } catch (error) {
        console.error('Error checking reading achievements:', error)
    }
}

/**
 * Check level achievements
 */
export async function checkLevelAchievements(userId: string, newLevel: number) {
    const supabase = createClient()

    try {
        // Get level achievements
        const { data: levelAchievements } = await supabase
            .from('achievements')
            .select('*')
            .eq('requirement_type', 'level_reached')
            .lte('requirement_value', newLevel)

        if (!levelAchievements) return

        // Get earned achievements
        const { data: earnedAchievements } = await supabase
            .from('user_achievements')
            .select('achievement_id')
            .eq('user_id', userId)

        const earnedIds = new Set(earnedAchievements?.map(a => a.achievement_id) || [])

        // Award unearned level achievements
        for (const achievement of levelAchievements) {
            if (!earnedIds.has(achievement.id)) {
                await supabase
                    .from('user_achievements')
                    .insert({
                        user_id: userId,
                        achievement_id: achievement.id
                    })

                // Add XP reward
                await supabase.rpc('increment_user_xp', {
                    user_id: userId,
                    xp_amount: achievement.points
                })

                // Notify
                notifyAchievement(
                    achievement.name,
                    achievement.description,
                    achievement.icon || '🏆',
                    achievement.points
                )
            }
        }
    } catch (error) {
        console.error('Error checking level achievements:', error)
    }
}
