/**
 * Migration Script: Old Storage → Unified Storage
 * Migrates data from fragmented storage systems to unified database
 */

import { openDB } from 'idb'
import { getDB } from './unified-offline-db'

export async function migrateToUnifiedStorage(): Promise<{
    success: boolean
    migrated: {
        likedBooks: number
        progress: number
        vocabulary: number
        highlights: number
        books: number
    }
    errors: string[]
}> {
    const migrated = {
        likedBooks: 0,
        progress: 0,
        vocabulary: 0,
        highlights: 0,
        books: 0,
    }
    const errors: string[] = []

    try {
        console.log('🔄 Starting migration to unified storage...')

        const unifiedDB = await getDB()

        // Migrate from ketab-yar-offline (main storage)
        try {
            const oldDB = await openDB('ketab-yar-offline', 2)

            // Migrate liked books
            if (oldDB.objectStoreNames.contains('liked_books')) {
                const likedBooks = await oldDB.getAll('liked_books')
                for (const book of likedBooks) {
                    await unifiedDB.put('liked_books', book)
                    migrated.likedBooks++
                }
            }

            // Migrate reading progress
            if (oldDB.objectStoreNames.contains('reading_progress')) {
                const progress = await oldDB.getAll('reading_progress')
                for (const item of progress) {
                    // Add missing fields
                    await unifiedDB.put('reading_progress', {
                        ...item,
                        book_slug: item.book_slug || '',
                        current_chapter: 0,
                        total_time_spent: 0,
                    })
                    migrated.progress++
                }
            }

            // Migrate vocabulary
            if (oldDB.objectStoreNames.contains('vocabulary')) {
                const vocabulary = await oldDB.getAll('vocabulary')
                for (const word of vocabulary) {
                    // Add missing fields
                    await unifiedDB.put('vocabulary', {
                        ...word,
                        translation: word.translation || null,
                        book_title: word.book_title || null,
                        updated_at: word.created_at,
                    })
                    migrated.vocabulary++
                }
            }

            // Migrate highlights
            if (oldDB.objectStoreNames.contains('highlights')) {
                const highlights = await oldDB.getAll('highlights')
                for (const highlight of highlights) {
                    // Add missing fields
                    await unifiedDB.put('highlights', {
                        ...highlight,
                        chapter_number: 0,
                    })
                    migrated.highlights++
                }
            }

            oldDB.close()
        } catch (error) {
            errors.push(`Error migrating from ketab-yar-offline: ${error}`)
        }

        // Migrate from ketab_yar_offline (vocabulary storage)
        try {
            const vocabDB = await openDB('ketab_yar_offline', 1)

            if (vocabDB.objectStoreNames.contains('vocabulary')) {
                const vocabulary = await vocabDB.getAll('vocabulary')
                for (const word of vocabulary) {
                    // Check if already exists
                    const existing = await unifiedDB.get('vocabulary', word.id)
                    if (!existing) {
                        await unifiedDB.put('vocabulary', {
                            ...word,
                            translation: word.translation || null,
                            book_title: word.book_title || null,
                            updated_at: word.created_at,
                            synced: false,
                        })
                        migrated.vocabulary++
                    }
                }
            }

            vocabDB.close()
        } catch (error) {
            errors.push(`Error migrating from ketab_yar_offline: ${error}`)
        }

        console.log('✅ Migration complete:', migrated)
        if (errors.length > 0) {
            console.warn('⚠️ Migration errors:', errors)
        }

        return {
            success: errors.length === 0,
            migrated,
            errors,
        }
    } catch (error) {
        console.error('❌ Migration failed:', error)
        return {
            success: false,
            migrated,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
        }
    }
}

/**
 * Delete old databases after successful migration
 */
export async function cleanupOldDatabases(): Promise<void> {
    try {
        await new Promise<void>((resolve) => {
            const req1 = indexedDB.deleteDatabase('ketab-yar-offline')
            req1.onsuccess = () => resolve()
            req1.onerror = () => resolve() // Continue even if fails
        })

        await new Promise<void>((resolve) => {
            const req2 = indexedDB.deleteDatabase('ketab_yar_offline')
            req2.onsuccess = () => resolve()
            req2.onerror = () => resolve()
        })

        console.log('✅ Old databases cleaned up')
    } catch (error) {
        console.error('Error cleaning up old databases:', error)
    }
}
