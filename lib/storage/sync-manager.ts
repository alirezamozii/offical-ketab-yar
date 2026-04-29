/**
 * Automatic Sync Manager
 * Agent 2 (Performance): Efficient background sync
 * Agent 3 (Psychology): Reassuring sync indicators
 * 
 * Features:
 * - Auto-syncs when online
 * - Syncs on login
 * - Handles conflicts
 * - Retry logic
 * - Progress tracking
 */

'use client'

import { createClient } from '@/lib/supabase/client'
import {
    getSyncQueue,
    getUnsyncedCount,
    highlights,
    likedBooks,
    readingProgress,
    removeSyncQueueItem,
    vocabulary
} from './offline-storage'

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

export interface SyncProgress {
    status: SyncStatus
    total: number
    synced: number
    failed: number
    message: string
}

type SyncCallback = (progress: SyncProgress) => void

let syncInProgress = false
let syncCallbacks: SyncCallback[] = []

/**
 * Register callback for sync progress updates
 */
function onSyncProgress(callback: SyncCallback) {
    syncCallbacks.push(callback)

    // Return unsubscribe function
    return () => {
        syncCallbacks = syncCallbacks.filter(cb => cb !== callback)
    }
}

/**
 * Notify all callbacks of sync progress
 */
function notifyProgress(progress: SyncProgress) {
    syncCallbacks.forEach(cb => cb(progress))
}

/**
 * Main sync function
 */
async function syncOfflineData(userId?: string): Promise<boolean> {
    // Prevent concurrent syncs
    if (syncInProgress) {
        console.log('⏳ Sync already in progress')
        return false
    }

    syncInProgress = true

    try {
        const supabase = createClient()

        // Get user if not provided
        if (!userId) {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                console.log('❌ No user logged in - skipping sync')
                syncInProgress = false
                return false
            }
            userId = user.id
        }

        // Check if online
        if (!navigator.onLine) {
            console.log('📴 Offline - skipping sync')
            syncInProgress = false
            return false
        }

        console.log('🔄 Starting sync...')

        const queue = await getSyncQueue()
        const total = queue.length

        if (total === 0) {
            console.log('✅ Nothing to sync')
            syncInProgress = false
            return true
        }

        notifyProgress({
            status: 'syncing',
            total,
            synced: 0,
            failed: 0,
            message: `Syncing ${total} items...`,
        })

        let synced = 0
        let failed = 0

        // Process queue items
        for (const item of queue) {
            try {
                await syncQueueItem(item, userId, supabase)
                await removeSyncQueueItem(item.id!)
                synced++

                notifyProgress({
                    status: 'syncing',
                    total,
                    synced,
                    failed,
                    message: `Synced ${synced}/${total}...`,
                })
            } catch (error) {
                console.error(`❌ Failed to sync item:`, error)
                failed++

                notifyProgress({
                    status: 'syncing',
                    total,
                    synced,
                    failed,
                    message: `Synced ${synced}/${total} (${failed} failed)...`,
                })
            }
        }

        // Final status
        if (failed === 0) {
            console.log(`✅ Sync complete: ${synced} items synced`)
            notifyProgress({
                status: 'success',
                total,
                synced,
                failed,
                message: `Successfully synced ${synced} items`,
            })
            return true
        } else {
            console.log(`⚠️ Sync complete with errors: ${synced} synced, ${failed} failed`)
            notifyProgress({
                status: 'error',
                total,
                synced,
                failed,
                message: `Synced ${synced} items, ${failed} failed`,
            })
            return false
        }
    } catch (error) {
        console.error('❌ Sync error:', error)
        notifyProgress({
            status: 'error',
            total: 0,
            synced: 0,
            failed: 0,
            message: 'Sync failed',
        })
        return false
    } finally {
        syncInProgress = false
    }
}

/**
 * Sync individual queue item
 */
async function syncQueueItem(item: any, userId: string, supabase: any) {
    const { action, table, data } = item

    switch (table) {
        case 'liked_books':
            await syncLikedBook(action, data, userId, supabase)
            break
        case 'reading_progress':
            await syncReadingProgress(action, data, userId, supabase)
            break
        case 'vocabulary':
            await syncVocabulary(action, data, userId, supabase)
            break
        case 'highlights':
            await syncHighlight(action, data, userId, supabase)
            break
    }
}

/**
 * Sync liked book
 */
async function syncLikedBook(action: string, data: any, userId: string, supabase: any) {
    if (action === 'create') {
        // Check if already exists in Supabase
        const { data: existing } = await supabase
            .from('user_library')
            .select('id')
            .eq('user_id', userId)
            .eq('book_id', data.book_id)
            .eq('status', 'want_to_read')
            .single()

        if (!existing) {
            await supabase.from('user_library').insert({
                user_id: userId,
                book_id: data.book_id,
                status: 'want_to_read',
            })
        }

        await likedBooks.markSynced(data.book_id)
    } else if (action === 'delete') {
        await supabase
            .from('user_library')
            .delete()
            .eq('user_id', userId)
            .eq('book_id', data.book_id)
            .eq('status', 'want_to_read')
    }
}

/**
 * Sync reading progress
 */
async function syncReadingProgress(action: string, data: any, userId: string, supabase: any) {
    if (action === 'create' || action === 'update') {
        // Check if user_library entry exists
        const { data: existing } = await supabase
            .from('user_library')
            .select('id')
            .eq('user_id', userId)
            .eq('book_id', data.book_id)
            .single()

        if (existing) {
            // Update existing
            await supabase
                .from('user_library')
                .update({
                    current_page: data.current_page,
                    progress_percentage: data.progress_percentage,
                    status: 'reading',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id)
        } else {
            // Create new
            await supabase.from('user_library').insert({
                user_id: userId,
                book_id: data.book_id,
                current_page: data.current_page,
                progress_percentage: data.progress_percentage,
                status: 'reading',
            })
        }

        await readingProgress.markSynced(data.book_id)
    }
}

/**
 * Sync vocabulary
 */
async function syncVocabulary(action: string, data: any, userId: string, supabase: any) {
    if (action === 'create') {
        // Check if word already exists
        const { data: existing } = await supabase
            .from('vocabulary')
            .select('id')
            .eq('user_id', userId)
            .eq('word', data.word)
            .eq('book_id', data.book_id)
            .single()

        if (!existing) {
            const { data: inserted } = await supabase
                .from('vocabulary')
                .insert({
                    user_id: userId,
                    word: data.word,
                    definition: data.definition,
                    context: data.context,
                    book_id: data.book_id,
                    page_number: data.page_number,
                    mastery_level: data.mastery_level || 0,
                })
                .select('id')
                .single()

            if (inserted) {
                await vocabulary.markSynced(data.id)
            }
        } else {
            await vocabulary.markSynced(data.id)
        }
    }
}

/**
 * Sync highlight
 */
async function syncHighlight(action: string, data: any, userId: string, supabase: any) {
    if (action === 'create') {
        // Check if highlight already exists
        const { data: existing } = await supabase
            .from('highlights')
            .select('id')
            .eq('user_id', userId)
            .eq('book_id', data.book_id)
            .eq('page_number', data.page_number)
            .eq('text', data.text)
            .single()

        if (!existing) {
            const { data: inserted } = await supabase
                .from('highlights')
                .insert({
                    user_id: userId,
                    book_id: data.book_id,
                    page_number: data.page_number,
                    text: data.text,
                    color: data.color,
                    note: data.note,
                })
                .select('id')
                .single()

            if (inserted) {
                await highlights.markSynced(data.id)
            }
        } else {
            await highlights.markSynced(data.id)
        }
    }
}

/**
 * Auto-sync on online event
 */
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        console.log('🌐 Back online - triggering sync')
        setTimeout(() => syncOfflineData(), 1000)
    })
}

/**
 * Get current sync status
 */
async function getSyncStatus(): Promise<{
    unsyncedCount: number
    isOnline: boolean
}> {
    const unsyncedCount = await getUnsyncedCount()
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

    return {
        unsyncedCount,
        isOnline,
    }
}
