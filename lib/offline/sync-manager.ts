/**
 * KETAB-YAR: Offline Sync Manager
 * 
 * Manages synchronization between IndexedDB and Supabase
 * Handles offline operations and background sync
 */

import { createClient } from '@/lib/supabase/client'
import {
    addToSyncQueue,
    clearOldSyncedOperations,
    getUnsyncedOperations,
    markAsSynced,
} from './indexeddb'

/**
 * Check if online
 */
function isOnline(): boolean {
    return navigator.onLine
}

/**
 * Sync all pending operations
 */
async function syncPendingOperations(): Promise<{
    success: number
    failed: number
    errors: string[]
}> {
    if (!isOnline()) {
        return { success: 0, failed: 0, errors: ['Device is offline'] }
    }

    const supabase = createClient()
    const operations = await getUnsyncedOperations()

    let success = 0
    let failed = 0
    const errors: string[] = []

    for (const op of operations) {
        try {
            switch (op.operation) {
                case 'INSERT':
                    await supabase.from(op.tableName as any).insert(op.data)
                    break
                case 'UPDATE':
                    await supabase
                        .from(op.tableName as any)
                        .update(op.data)
                        .eq('id', op.recordId)
                    break
                case 'DELETE':
                    await supabase
                        .from(op.tableName as any)
                        .delete()
                        .eq('id', op.recordId)
                    break
            }

            await markAsSynced(op.id!)
            success++
        } catch (error) {
            failed++
            errors.push(`Failed to sync ${op.operation} on ${op.tableName}: ${error}`)
            console.error('Sync error:', error)
        }
    }

    // Clean up old synced operations
    await clearOldSyncedOperations()

    return { success, failed, errors }
}

/**
 * Setup automatic sync when coming back online
 */
function setupAutoSync() {
    if (typeof window === 'undefined') return

    // Sync when coming back online
    window.addEventListener('online', async () => {
        console.log('🌐 Back online! Syncing pending operations...')
        const result = await syncPendingOperations()
        console.log('✅ Sync complete:', result)
    })

    // Periodic sync every 5 minutes (if online)
    setInterval(async () => {
        if (isOnline()) {
            await syncPendingOperations()
        }
    }, 5 * 60 * 1000)
}

/**
 * Queue operation for sync
 */
async function queueOperation(
    tableName: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    recordId: string,
    data: Record<string, unknown>
) {
    await addToSyncQueue(tableName, operation, recordId, data)

    // Try to sync immediately if online
    if (isOnline()) {
        await syncPendingOperations()
    }
}

/**
 * Get sync status
 */
async function getSyncStatus() {
    const operations = await getUnsyncedOperations()
    return {
        pending: operations.length,
        online: isOnline(),
    }
}
