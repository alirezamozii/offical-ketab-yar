/**
 * Storage Quota Manager
 * Agent 2 (Performance): Monitor and manage browser storage quota
 * Agent 3 (Psychology): Warn users before storage is full
 * 
 * Features:
 * - Check available storage before downloads
 * - Warn at 80% capacity
 * - Auto-cleanup old cached data
 * - Prioritize user-generated content
 * - Show storage usage in settings
 */

import { getDB } from './unified-offline-db'

export interface StorageInfo {
    usage: number // bytes used
    quota: number // bytes available
    percentUsed: number
    available: number // bytes remaining
    formattedUsage: string
    formattedQuota: string
    formattedAvailable: string
}

export interface StorageBreakdown {
    bookContent: number
    userData: number
    cache: number
    total: number
}

/**
 * Get current storage information
 */
export async function getStorageInfo(): Promise<StorageInfo | null> {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
        console.warn('Storage API not available')
        return null
    }

    try {
        const estimate = await navigator.storage.estimate()
        const usage = estimate.usage || 0
        const quota = estimate.quota || 0
        const percentUsed = quota > 0 ? (usage / quota) * 100 : 0
        const available = quota - usage

        return {
            usage,
            quota,
            percentUsed,
            available,
            formattedUsage: formatBytes(usage),
            formattedQuota: formatBytes(quota),
            formattedAvailable: formatBytes(available),
        }
    } catch (error) {
        console.error('Error getting storage info:', error)
        return null
    }
}

/**
 * Get storage breakdown by category
 */
export async function getStorageBreakdown(): Promise<StorageBreakdown> {
    try {
        const db = await getDB()

        // Estimate book content size
        const books = await db.getAll('books_metadata')
        const chapters = await db.getAll('book_chapters_encrypted')

        let bookContentSize = 0
        for (const chapter of chapters) {
            bookContentSize += chapter.encryptedContent.byteLength
        }

        // Estimate user data size
        const likedBooks = await db.getAll('liked_books')
        const progress = await db.getAll('reading_progress')
        const vocabulary = await db.getAll('vocabulary')
        const highlights = await db.getAll('highlights')

        const userDataSize =
            JSON.stringify(likedBooks).length +
            JSON.stringify(progress).length +
            JSON.stringify(vocabulary).length +
            JSON.stringify(highlights).length

        // Cache is everything else
        const storageInfo = await getStorageInfo()
        const total = storageInfo?.usage || 0
        const cache = Math.max(0, total - bookContentSize - userDataSize)

        return {
            bookContent: bookContentSize,
            userData: userDataSize,
            cache,
            total,
        }
    } catch (error) {
        console.error('Error getting storage breakdown:', error)
        return {
            bookContent: 0,
            userData: 0,
            cache: 0,
            total: 0,
        }
    }
}

/**
 * Check if there's enough space for a download
 */
export async function hasEnoughSpace(requiredBytes: number): Promise<boolean> {
    const info = await getStorageInfo()
    if (!info) return true // Assume yes if we can't check

    return info.available >= requiredBytes
}

/**
 * Check if storage is getting full (>80%)
 */
export async function isStorageAlmostFull(): Promise<boolean> {
    const info = await getStorageInfo()
    if (!info) return false

    return info.percentUsed >= 80
}

/**
 * Check if storage is critically full (>95%)
 */
export async function isStorageCriticallyFull(): Promise<boolean> {
    const info = await getStorageInfo()
    if (!info) return false

    return info.percentUsed >= 95
}

/**
 * Get storage warning level
 */
export async function getStorageWarningLevel(): Promise<'safe' | 'warning' | 'critical'> {
    const info = await getStorageInfo()
    if (!info) return 'safe'

    if (info.percentUsed >= 95) return 'critical'
    if (info.percentUsed >= 80) return 'warning'
    return 'safe'
}

/**
 * Clean up old cached data
 * Removes least recently accessed books
 */
export async function cleanupOldCache(targetBytes: number): Promise<number> {
    try {
        const db = await getDB()

        // Get all books sorted by last accessed
        const books = await db.getAllFromIndex('books_metadata', 'by-last-accessed')

        let freedBytes = 0

        for (const book of books) {
            if (freedBytes >= targetBytes) break

            // Get all chapters for this book
            const chapters = await db.getAllFromIndex('book_chapters_encrypted', 'by-book', book.slug)

            // Calculate size
            let bookSize = 0
            for (const chapter of chapters) {
                bookSize += chapter.encryptedContent.byteLength
            }

            // Delete book and chapters
            await db.delete('books_metadata', book.slug)
            for (const chapter of chapters) {
                await db.delete('book_chapters_encrypted', [chapter.bookSlug, chapter.chapterNumber])
            }

            freedBytes += bookSize
            console.log(`🗑️ Cleaned up ${book.title.en} (${formatBytes(bookSize)})`)
        }

        console.log(`✅ Freed ${formatBytes(freedBytes)} of storage`)
        return freedBytes
    } catch (error) {
        console.error('Error cleaning up cache:', error)
        return 0
    }
}

/**
 * Request persistent storage (prevents automatic cleanup)
 */
export async function requestPersistentStorage(): Promise<boolean> {
    if (!('storage' in navigator) || !('persist' in navigator.storage)) {
        console.warn('Persistent storage not available')
        return false
    }

    try {
        const isPersisted = await navigator.storage.persisted()
        if (isPersisted) {
            console.log('✅ Storage is already persistent')
            return true
        }

        const granted = await navigator.storage.persist()
        if (granted) {
            console.log('✅ Persistent storage granted')
        } else {
            console.log('❌ Persistent storage denied')
        }
        return granted
    } catch (error) {
        console.error('Error requesting persistent storage:', error)
        return false
    }
}

/**
 * Update storage metadata in database
 */
export async function updateStorageMetadata(): Promise<void> {
    try {
        const db = await getDB()
        const info = await getStorageInfo()
        const breakdown = await getStorageBreakdown()

        if (!info) return

        await db.put('storage_metadata', {
            id: 'quota_info',
            totalUsage: info.usage,
            quotaLimit: info.quota,
            lastChecked: Date.now(),
            bookContentSize: breakdown.bookContent,
            userDataSize: breakdown.userData,
        })
    } catch (error) {
        console.error('Error updating storage metadata:', error)
    }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Estimate book size before download
 */
export function estimateBookSize(chapters: number, avgChapterLength: number = 5000): number {
    // Rough estimate: 5000 chars per chapter * 2 bytes per char * 1.5 for encryption overhead
    return chapters * avgChapterLength * 2 * 1.5
}

/**
 * Auto-cleanup if storage is critically full
 */
export async function autoCleanupIfNeeded(): Promise<void> {
    const level = await getStorageWarningLevel()

    if (level === 'critical') {
        console.warn('⚠️ Storage critically full - auto-cleaning...')
        const info = await getStorageInfo()
        if (info) {
            // Free up 20% of quota
            const targetBytes = info.quota * 0.2
            await cleanupOldCache(targetBytes)
        }
    }
}

/**
 * Monitor storage and warn user
 */
export async function monitorStorage(): Promise<{
    level: 'safe' | 'warning' | 'critical'
    message: string
    action?: string
}> {
    const level = await getStorageWarningLevel()
    const info = await getStorageInfo()

    if (!info) {
        return {
            level: 'safe',
            message: 'Storage monitoring unavailable',
        }
    }

    switch (level) {
        case 'critical':
            return {
                level: 'critical',
                message: `Storage critically full (${Math.round(info.percentUsed)}%). Some features may not work.`,
                action: 'Delete downloaded books to free up space',
            }
        case 'warning':
            return {
                level: 'warning',
                message: `Storage getting full (${Math.round(info.percentUsed)}%). Consider deleting old downloads.`,
                action: 'Manage downloaded books',
            }
        default:
            return {
                level: 'safe',
                message: `${info.formattedAvailable} available`,
            }
    }
}
