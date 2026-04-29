/**
 * Gamification Types
 * Shared types for XP, levels, streaks, and achievements
 */

export interface UserStats {
    user_id: string
    xp: number
    level: number
    current_streak: number
    longest_streak: number
    last_read_date: string | null
    total_books_completed: number
    total_pages_read: number
    total_reading_time: number // in minutes
    created_at: string
    updated_at: string
}

export interface Achievement {
    id: string
    name: string
    description: string
    icon: string
    xp_reward: number
    requirement_type: 'books_completed' | 'pages_read' | 'streak_days' | 'reading_time'
    requirement_value: number
    tier: 'bronze' | 'silver' | 'gold' | 'platinum'
    created_at: string
}

export interface UserAchievement {
    id: string
    user_id: string
    achievement_id: string
    earned_at: string
    achievement?: Achievement // Joined data
}

export interface AchievementWithProgress extends Achievement {
    earned: boolean
    progress: number
    progress_percentage: number
}

export interface XPGainResult {
    xp_gained: number
    new_total_xp: number
    new_level: number
    level_up: boolean
    level_up_reward?: number
}

export interface StreakInfo {
    current_streak: number
    longest_streak: number
    is_in_danger: boolean
    hours_until_expiry: number
    last_read_date: string | null
}

export interface GamificationUpdate {
    xp_gained?: number
    pages_read?: number
    reading_time?: number // in minutes
    book_completed?: boolean
}

export interface GamificationResult {
    success: boolean
    stats?: UserStats
    xp_result?: XPGainResult
    streak_info?: StreakInfo
    new_achievements?: Achievement[]
    error?: string
}

// XP Calculation Constants
export const XP_REWARDS = {
    PAGE_READ: 2, // Base XP per page
    MINUTE_READ: 1, // XP per minute of reading
    BOOK_COMPLETED: 100, // Bonus XP for completing a book
    CHAPTER_COMPLETED: 20, // Bonus XP for completing a chapter
    STREAK_BONUS_MULTIPLIER: 0.1, // 10% bonus per streak day (max 2x)
    LEVEL_UP_REWARD_MULTIPLIER: 50, // Level * 50 XP reward on level up
} as const

// Level Calculation
function calculateLevel(xp: number): number {
    return Math.floor(xp / 100) + 1
}

export function xpForNextLevel(currentLevel: number): number {
    return currentLevel * 100
}

export function xpProgressInLevel(xp: number, level: number): number {
    const xpInCurrentLevel = xp % xpForNextLevel(level)
    return xpInCurrentLevel
}

export function xpProgressPercentage(xp: number, level: number): number {
    const xpInLevel = xpProgressInLevel(xp, level)
    const xpNeeded = xpForNextLevel(level)
    return (xpInLevel / xpNeeded) * 100
}

// Streak Calculation
export function calculateStreakDanger(lastReadDate: string | null): {
    is_in_danger: boolean
    hours_until_expiry: number
} {
    if (!lastReadDate) {
        return { is_in_danger: false, hours_until_expiry: 24 }
    }

    const now = new Date()
    const lastRead = new Date(lastReadDate)
    const hoursSinceLastRead = (now.getTime() - lastRead.getTime()) / (1000 * 60 * 60)
    const hoursUntilExpiry = Math.max(0, 24 - hoursSinceLastRead)

    return {
        is_in_danger: hoursUntilExpiry > 0 && hoursUntilExpiry < 6,
        hours_until_expiry: Math.floor(hoursUntilExpiry),
    }
}

// XP Calculation with Bonuses
export function calculateXPGain(params: {
    pages_read?: number
    reading_time?: number
    book_completed?: boolean
    chapter_completed?: boolean
    current_streak?: number
}): number {
    let xp = 0

    // Base XP from pages
    if (params.pages_read) {
        xp += params.pages_read * XP_REWARDS.PAGE_READ
    }

    // XP from time
    if (params.reading_time) {
        xp += params.reading_time * XP_REWARDS.MINUTE_READ
    }

    // Completion bonuses
    if (params.book_completed) {
        xp += XP_REWARDS.BOOK_COMPLETED
    }

    if (params.chapter_completed) {
        xp += XP_REWARDS.CHAPTER_COMPLETED
    }

    // Streak bonus (Agent 3 - Psychology: Variable rewards)
    if (params.current_streak && params.current_streak > 0) {
        const streakMultiplier = Math.min(
            1 + params.current_streak * XP_REWARDS.STREAK_BONUS_MULTIPLIER,
            2.0 // Max 2x multiplier
        )
        xp = Math.floor(xp * streakMultiplier)
    }

    // Add random bonus (Agent 3 - Variable rewards psychology)
    const randomBonus = Math.floor(Math.random() * (xp * 0.1)) // 0-10% random bonus
    xp += randomBonus

    return Math.max(1, Math.floor(xp)) // Minimum 1 XP
}

// Achievement Progress Calculation
export function calculateAchievementProgress(
    achievement: Achievement,
    userStats: UserStats
): number {
    switch (achievement.requirement_type) {
        case 'books_completed':
            return userStats.total_books_completed
        case 'pages_read':
            return userStats.total_pages_read
        case 'streak_days':
            return userStats.current_streak
        case 'reading_time':
            return userStats.total_reading_time
        default:
            return 0
    }
}

// Check if achievement is unlocked
export function isAchievementUnlocked(
    achievement: Achievement,
    userStats: UserStats
): boolean {
    const progress = calculateAchievementProgress(achievement, userStats)
    return progress >= achievement.requirement_value
}

// Get tier color
export function getTierColor(tier: Achievement['tier']): string {
    switch (tier) {
        case 'bronze':
            return 'from-amber-700 to-amber-900'
        case 'silver':
            return 'from-gray-400 to-gray-600'
        case 'gold':
            return 'from-[#D4AF37] to-[#B8956A]'
        case 'platinum':
            return 'from-purple-500 to-pink-500'
        default:
            return 'from-gray-400 to-gray-600'
    }
}

// Get tier text
export function getTierText(tier: Achievement['tier']): string {
    switch (tier) {
        case 'bronze':
            return 'برنزی'
        case 'silver':
            return 'نقره‌ای'
        case 'gold':
            return 'طلایی'
        case 'platinum':
            return 'پلاتینیوم'
        default:
            return tier
    }
}
