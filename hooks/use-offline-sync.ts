/**
 * Offline Sync Hook
 * Agent 2 (Performance) - Background sync for XP/streak when back online
 */

'use client'

import { clearSyncQueue, getSyncQueue } from '@/lib/pwa/offline-storage'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface SyncQueueItem {
    type: 'xp' | 'streak' | 'reading_session' | 'vocabulary'
    timestamp: number
    data: Record<string, unknown>
}

export function useOfflineSync() {
    const [isSyncing, setIsSyncing] = useState(false)
    const [queueSize, setQueueSize] = useState(0)
    const supabase = createClient()

    const syncQueue = async () => {
        if (!navigator.onLine || isSyncing) return

        try {
            setIsSyncing(true)
            const queue = (await getSyncQueue()) as SyncQueueItem[]
            setQueueSize(queue.length)

            if (queue.length === 0) return

            // Process each item in queue
            for (const item of queue) {
                try {
                    switch (item.type) {
                        case 'xp':
                            await supabase
                                .from('users')
                                .update({ xp: item.data.xp } as any)
                                .eq('id', item.data.userId)
                            break

                        case 'streak':
                            await supabase
                                .from('users')
                                .update({
                                    current_streak: item.data.streak,
                                    last_read_at: item.data.lastReadAt,
                                } as any)
                                .eq('id', item.data.userId)
                            break

                        case 'reading_session':
                            await supabase.from('reading_sessions').insert({
                                user_id: item.data.userId,
                                book_id: item.data.bookId,
                                pages_read: item.data.pagesRead,
                                duration_minutes: item.data.durationMinutes,
                                created_at: new Date(item.timestamp as any).toISOString(),
                            })
                            break

                        case 'vocabulary':
                            await supabase.from('vocabulary').insert({
                                user_id: item.data.userId,
                                word: item.data.word,
                                definition: item.data.definition,
                                book_id: item.data.bookId,
                                context: item.data.context,
                                created_at: new Date(item.timestamp as any).toISOString(),
                            })
                            break
                    }
                } catch (error) {
                    console.error(`Failed to sync ${item.type}:`, error)
                    // Continue with next item even if one fails
                }
            }

            // Clear queue after successful sync
            await clearSyncQueue()
            setQueueSize(0)
        } catch (error) {
            console.error('Sync failed:', error)
        } finally {
            setIsSyncing(false)
        }
    }

    useEffect(() => {
        // Sync when component mounts (if online)
        syncQueue()

        // Sync when coming back online
        const handleOnline = () => {
            console.log('Back online - syncing queue...')
            syncQueue()
        }

        window.addEventListener('online', handleOnline)

        // Periodic sync check (every 5 minutes)
        const interval = setInterval(() => {
            if (navigator.onLine) {
                syncQueue()
            }
        }, 5 * 60 * 1000)

        return () => {
            window.removeEventListener('online', handleOnline)
            clearInterval(interval)
        }
    }, [])

    return {
        isSyncing,
        queueSize,
        syncNow: syncQueue,
    }
}
