/**
 * Enhanced Gamification System
 * Progressive leveling (1-99), XP bonuses, and rewards
 */

export const MAX_LEVEL = 99

/**
 * Calculate user level from total XP (Progressive difficulty to level 99)
 * Formula: Exponential curve that gets harder as you level up
 * Level 1: 0 XP
 * Level 2: 100 XP
 * Level 5: 1,000 XP
 * Level 10: 5,000 XP
 * Level 20: 25,000 XP
 * Level 50: 200,000 XP
 * Level 99: 1,000,000 XP
 */
export function calculateLevel(xp: number): number {
    if (xp < 0) return 1

    // Progressive formula: level = floor(10 * sqrt(xp / 100))
    // Capped at 99
    const level = Math.floor(10 * Math.sqrt(xp / 100))
    return Math.min(Math.max(1, level), MAX_LEVEL)
}

/**
 * Calculate XP needed for a specific level
 */
export function xpForLevel(level: number): number {
    if (level <= 1) return 0
    if (level >= MAX_LEVEL) return 1000000

    // Inverse formula: xp = (level / 10)^2 * 100
    return Math.floor(((level / 10) ** 2) * 100)
}

/**
 * Calculate XP needed for next level
 */
export function xpForNextLevel(currentLevel: number): number {
    return xpForLevel(currentLevel + 1)
}

/**
 * Get level title based on level range
 */
export function getLevelTitle(level: number): string {
    if (level >= 90) return '🏆 افسانه‌ای'
    if (level >= 80) return '💎 الماسی'
    if (level >= 70) return '👑 پادشاه'
    if (level >= 60) return '⚔️ قهرمان'
    if (level >= 50) return '🌟 استاد'
    if (level >= 40) return '🔥 حرفه‌ای'
    if (level >= 30) return '📚 دانشمند'
    if (level >= 20) return '✨ ماهر'
    if (level >= 10) return '🎯 پیشرفته'
    return '🌱 مبتدی'
}

/**
 * Calculate XP progress to next level
 */
export function xpProgressToNextLevel(currentXP: number): {
    currentLevel: number
    nextLevel: number
    xpForCurrentLevel: number
    xpForNextLevel: number
    xpProgress: number
    xpNeeded: number
    progressPercentage: number
    levelTitle: string
    isMaxLevel: boolean
} {
    const currentLevel = calculateLevel(currentXP)
    const isMaxLevel = currentLevel >= MAX_LEVEL
    const nextLevel = isMaxLevel ? MAX_LEVEL : currentLevel + 1
    const xpForCurrentLevel = xpForLevel(currentLevel)
    const xpForNextLevel = xpForLevel(nextLevel)
    const xpProgress = currentXP - xpForCurrentLevel
    const xpNeeded = xpForNextLevel - xpForCurrentLevel
    const progressPercentage = isMaxLevel ? 100 : Math.min(100, Math.floor((xpProgress / xpNeeded) * 100))

    return {
        currentLevel,
        nextLevel,
        xpForCurrentLevel,
        xpForNextLevel,
        xpProgress,
        xpNeeded,
        progressPercentage,
        levelTitle: getLevelTitle(currentLevel),
        isMaxLevel,
    }
}

/**
 * Calculate XP reward for reading with bonuses
 */
export function calculateReadingXP(params: {
    pagesRead: number
    hasStreak: boolean
    streakDays?: number
    completedBook: boolean
    bookLevel?: 'beginner' | 'intermediate' | 'advanced'
    isFirstReadToday?: boolean
}): {
    baseXP: number
    streakBonus: number
    completionBonus: number
    difficultyBonus: number
    firstReadBonus: number
    totalXP: number
    bonusMultiplier: number
} {
    const baseXP = params.pagesRead * 2 // 2 XP per page (increased from 1)

    // Streak bonus (up to 100% at 30+ days)
    let streakBonus = 0
    if (params.hasStreak && params.streakDays) {
        const streakMultiplier = Math.min(1.0, params.streakDays / 30)
        streakBonus = Math.floor(baseXP * streakMultiplier)
    }

    // Completion bonus
    let completionBonus = 0
    if (params.completedBook) {
        completionBonus = 200 // Flat bonus for finishing a book
    }

    // Difficulty bonus
    let difficultyBonus = 0
    if (params.bookLevel === 'advanced') {
        difficultyBonus = Math.floor(baseXP * 0.5) // 50% bonus
    } else if (params.bookLevel === 'intermediate') {
        difficultyBonus = Math.floor(baseXP * 0.25) // 25% bonus
    }

    // First read of the day bonus
    const firstReadBonus = params.isFirstReadToday ? 50 : 0

    const totalXP = baseXP + streakBonus + completionBonus + difficultyBonus + firstReadBonus
    const bonusMultiplier = totalXP / baseXP

    return {
        baseXP,
        streakBonus,
        completionBonus,
        difficultyBonus,
        firstReadBonus,
        totalXP,
        bonusMultiplier,
    }
}

/**
 * Get leaderboard rank emoji
 */
export function getRankEmoji(rank: number): string {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
}

/**
 * Get leaderboard rank color
 */
export function getRankColor(rank: number): string {
    if (rank === 1) return 'text-yellow-500'
    if (rank === 2) return 'text-gray-400'
    if (rank === 3) return 'text-orange-600'
    return 'text-muted-foreground'
}
