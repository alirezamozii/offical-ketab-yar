/**
 * Reading Tracker Hook
 * Tracks reading progress and awards XP/achievements
 */

import { createClient } from '@/lib/supabase/client'
import { checkLevelAchievements, checkReadingAchievements } from '@/lib/supabase/queries/achievement-checker'
import { getLevelTitle } from '@/lib/utils/gamification'
import { notifyLevelUp, notifyXPGain } from '@/lib/utils/notification-queue'
import { useEffect, useRef, useState } from 'react'

interface ReadingSession {
    bookId: string
    bookLevel: 'beginner' | 'intermediate' | 'advanced'
    startPage: number
    startTime: number
}

export function useReadingTracker(userId: string | undefined) {
    const [session, setSession] = useState<ReadingSession | null>(null)
    const [isTracking, setIsTracking] = useState(false)
    const lastSaveTime = useRef<number>(0)
    const accumulatedPages = useRef<number>(0)
    const supabase = createClient()

    /**
     * Start tracking a reading session
     */
    const startSession = (bookId: string, bookLevel: 'beginner' | 'intermediate' | 'advanced', currentPage: number) => {
        if (!userId) return

        setSession({
            bookId,
            bookLevel,
            startPage: currentPage,
            startTime: Date.now()
        })
        setIsTracking(true)
        accumulatedPages.current = 0
    }

    /**
     * Track page read
     */
    const trackPageRead = async (currentPage: number) => {
        if (!userId || !session || !isTracking) return

        accumulatedPages.current++

        // Save every 5 pages or every 2 minutes
        const now = Date.now()
        const timeSinceLastSave = now - lastSaveTime.current
        const shouldSave = accumulatedPages.current >= 5 || timeSinceLastSave >= 120000

        if (shouldSave) {
            await saveProgress(currentPage)
        }
    }

    /**
     * Save reading progress and award XP
     */
    const saveProgress = async (currentPage: number) => {
        if (!userId || !session || accumulatedPages.current === 0) return

        try {
            const pagesRead = accumulatedPages.current
            const durationMinutes = Math.floor((Date.now() - session.startTime) / 60000)

            // Award XP using database function
            const { data: xpResult, error: xpError } = await supabase.rpc('award_reading_xp', {
                p_user_id: userId,
                p_pages_read: pagesRead,
                p_book_level: session.bookLevel,
                p_completed_book: false
            })

            if (xpError) {
                console.error('Error awarding XP:', xpError)
                return
            }

            // Create reading session record
            await supabase.from('reading_sessions').insert({
                user_id: userId,
                book_id: session.bookId,
                pages_read: pagesRead,
                duration_minutes: durationMinutes,
                xp_earned: xpResult[0]?.total_xp || 0
            })

            // Update last_read_at in profiles (triggers streak update)
            const { data: profileBefore } = await supabase
                .from('profiles')
                .select('current_streak')
                .eq('id', userId)
                .single()

            await supabase
                .from('profiles')
                .update({
                    last_read_at: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
                })
                .eq('id', userId)

            // Check if streak increased
            const { data: profileAfter } = await supabase
                .from('profiles')
                .select('current_streak')
                .eq('id', userId)
                .single()

            if (profileAfter && profileBefore && profileAfter.current_streak > profileBefore.current_streak) {
                // Streak increased! Notify user
                const { notifyStreak } = await import('@/lib/utils/notification-queue')
                notifyStreak(profileAfter.current_streak)
            }

            // Update user library progress
            await supabase
                .from('user_library')
                .upsert({
                    user_id: userId,
                    book_id: session.bookId,
                    current_page: currentPage,
                    status: 'reading',
                    last_read_at: new Date().toISOString()
                })

            // Notify XP gain (will be queued if in reading mode)
            if (xpResult && xpResult[0]) {
                const result = xpResult[0]

                // Build description with bonuses
                let description = `${pagesRead} صفحه`
                if (result.streak_bonus > 0) {
                    description += ` + بونوس استریک`
                }
                if (result.difficulty_bonus > 0) {
                    description += ` + بونوس سختی`
                }

                notifyXPGain(result.total_xp, description)

                // Check for level up
                if (result.level_up) {
                    const levelTitle = getLevelTitle(result.new_level)
                    notifyLevelUp(result.new_level, levelTitle)

                    // Check level achievements
                    await checkLevelAchievements(userId, result.new_level)
                }
            }

            // Check achievements
            await checkReadingAchievements(userId)

            // Reset counters
            accumulatedPages.current = 0
            lastSaveTime.current = Date.now()
            session.startTime = Date.now()

        } catch (error) {
            console.error('Error saving reading progress:', error)
        }
    }

    /**
     * End reading session
     */
    const endSession = async (currentPage: number) => {
        if (!userId || !session) return

        // Save final progress
        await saveProgress(currentPage)

        setSession(null)
        setIsTracking(false)
    }

    /**
     * Mark book as completed
     */
    const completeBook = async (bookId: string, totalPages: number) => {
        if (!userId) return

        try {
            // Award completion bonus
            const { data: xpResult } = await supabase.rpc('award_reading_xp', {
                p_user_id: userId,
                p_pages_read: 0,
                p_book_level: session?.bookLevel || 'intermediate',
                p_completed_book: true
            })

            // Update user library
            await supabase
                .from('user_library')
                .upsert({
                    user_id: userId,
                    book_id: bookId,
                    status: 'completed',
                    current_page: totalPages,
                    progress_percentage: 100,
                    completed_at: new Date().toISOString()
                })

            // Notify
            if (xpResult && xpResult[0]) {
                notifyXPGain(xpResult[0].completion_bonus, 'تکمیل کتاب! 🎉')

                if (xpResult[0].level_up) {
                    const levelTitle = getLevelTitle(xpResult[0].new_level)
                    notifyLevelUp(xpResult[0].new_level, levelTitle)
                }
            }

            // Check achievements
            await checkReadingAchievements(userId)

        } catch (error) {
            console.error('Error completing book:', error)
        }
    }

    /**
     * Auto-save on unmount
     */
    useEffect(() => {
        return () => {
            if (session && accumulatedPages.current > 0) {
                saveProgress(session.startPage + accumulatedPages.current)
            }
        }
    }, [session])

    return {
        startSession,
        trackPageRead,
        saveProgress,
        endSession,
        completeBook,
        isTracking,
        pagesRead: accumulatedPages.current
    }
}
