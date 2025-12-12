/**
 * Gamification Notifications Hook
 * Smart notifications that respect user context
 */

import { calculateLevel, getLevelTitle } from '@/lib/utils/gamification'
import { notificationQueue, notifyAchievement, notifyLevelUp, notifyStreak, notifyXPGain } from '@/lib/utils/notification-queue'
import { useEffect, useRef } from 'react'

export function useGamificationNotifications() {
    const previousLevel = useRef<number>(1)
    const previousXP = useRef<number>(0)

    /**
     * Enable reading mode (suppress notifications)
     */
    const enableReadingMode = () => {
        notificationQueue.setReadingMode(true)
    }

    /**
     * Disable reading mode (show queued notifications)
     */
    const disableReadingMode = () => {
        notificationQueue.setReadingMode(false)
    }

    /**
     * Handle XP gain with level-up detection
     */
    const handleXPGain = (newXP: number, oldXP: number, source?: string) => {
        const xpGained = newXP - oldXP
        if (xpGained <= 0) return

        const oldLevel = calculateLevel(oldXP)
        const newLevel = calculateLevel(newXP)

        // Check for level up
        if (newLevel > oldLevel) {
            const levelTitle = getLevelTitle(newLevel)
            notifyLevelUp(newLevel, levelTitle)
            previousLevel.current = newLevel
        } else {
            // Regular XP gain
            notifyXPGain(xpGained, source)
        }

        previousXP.current = newXP
    }

    /**
     * Handle achievement unlock
     */
    const handleAchievement = (name: string, description: string, icon: string, points: number) => {
        notifyAchievement(name, description, icon, points)
    }

    /**
     * Handle streak milestone
     */
    const handleStreak = (days: number) => {
        // Only notify on milestone days
        const milestones = [3, 7, 14, 30, 60, 100, 365]
        if (milestones.includes(days)) {
            notifyStreak(days)
        }
    }

    /**
     * Clear all notifications
     */
    const clearNotifications = () => {
        notificationQueue.clear()
    }

    return {
        enableReadingMode,
        disableReadingMode,
        handleXPGain,
        handleAchievement,
        handleStreak,
        clearNotifications,
        getQueueSize: () => notificationQueue.getQueueSize()
    }
}

/**
 * Hook for reader page - automatically manages reading mode
 */
export function useReaderNotifications() {
    const { enableReadingMode, disableReadingMode } = useGamificationNotifications()

    useEffect(() => {
        // Enable reading mode when component mounts
        enableReadingMode()

        // Disable when component unmounts
        return () => {
            disableReadingMode()
        }
    }, [])

    return {
        enableReadingMode,
        disableReadingMode
    }
}
