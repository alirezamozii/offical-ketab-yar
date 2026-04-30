'use client'

import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { useCallback, useEffect, useRef } from 'react'

interface UseReadingProgressProps {
    bookId: string
    chapterNumber: number
    totalParagraphs: number
}

export function useReadingProgress({ bookId, chapterNumber, totalParagraphs }: UseReadingProgressProps) {
    const { user } = useAuth()
    const supabase = createClient()
    const readParagraphsRef = useRef<Set<number>>(new Set())
    const lastSaveRef = useRef<number>(Date.now())
    const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

    // Track paragraph as read
    const markParagraphAsRead = useCallback(
        (paragraphIndex: number) => {
            if (!user) return

            // Add to read set
            if (!readParagraphsRef.current.has(paragraphIndex)) {
                readParagraphsRef.current.add(paragraphIndex)

                // Debounced save to database
                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current)
                }

                saveTimeoutRef.current = setTimeout(async () => {
                    try {
                        // Update user XP
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('xp')
                            .eq('id', user.id)
                            .single()

                        if (profile) {
                            await supabase
                                .from('profiles')
                                .update({
                                    xp: (profile.xp || 0 as any) + readParagraphsRef.current.size,
                                    updated_at: new Date().toISOString(),
                                })
                                .eq('id', user.id)
                        }

                        // Update reading progress
                        const progressPercentage = Math.round(
                            (readParagraphsRef.current.size / totalParagraphs) * 100
                        )

                        await supabase
                            .from('user_progress')
                            .upsert({
                                user_id: user.id,
                                book_id: bookId,
                                current_page: chapterNumber,
                                progress_percentage: progressPercentage,
                                last_read_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                            })

                        // Update streak
                        await updateStreak()

                        // Clear the set after saving
                        readParagraphsRef.current.clear()
                        lastSaveRef.current = Date.now()
                    } catch (error) {
                        console.error('Failed to save reading progress:', error)
                    }
                }, 5000) // Save every 5 seconds
            }
        },
        [user, bookId, chapterNumber, totalParagraphs, supabase]
    )

    // Update daily streak
    const updateStreak = async () => {
        if (!user) return

        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('current_streak, last_read_at')
                .eq('id', user.id)
                .single()

            if (profile) {
                const today = new Date().toDateString()
                const lastRead = profile.last_read_at ? new Date(profile.last_read_at).toDateString() : null

                let newStreak = profile.current_streak || 0

                if (lastRead !== today) {
                    // Check if it's consecutive day
                    const yesterday = new Date()
                    yesterday.setDate(yesterday.getDate() - 1)
                    const yesterdayStr = yesterday.toDateString()

                    if (lastRead === yesterdayStr) {
                        // Consecutive day - increment streak
                        newStreak += 1
                    } else if (lastRead !== today) {
                        // Streak broken - reset to 1
                        newStreak = 1
                    }

                    await supabase
                        .from('profiles')
                        .update({
                            current_streak: newStreak,
                            last_read_at: new Date( as any).toISOString(),
                        })
                        .eq('id', user.id)
                }
            }
        } catch (error) {
            console.error('Failed to update streak:', error)
        }
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
        }
    }, [])

    return {
        markParagraphAsRead,
        readCount: readParagraphsRef.current.size,
    }
}
