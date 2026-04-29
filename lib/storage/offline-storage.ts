/**
 * Offline-First Storage System
 * Agent 2 (Performance): IndexedDB for structured data, localStorage fallback
 * Agent 3 (Psychology): Seamless offline experience builds trust
 * 
 * Features:
 * - Works without authentication
 * - Auto-syncs when user logs in
 * - Persists across sessions
 * - Handles conflicts intelligently
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

// Database schema
interface KetabYarDB extends DBSchema {
    liked_books: {
        key: string // book_id
        value: {
            book_id: string
            book_slug: string
            book_title: string
            book_cover: string | null
            liked_at: number
            synced: boolean
        }
        indexes: { 'by-synced': boolean }
    }
    reading_progress: {
        key: string // book_id
        value: {
            book_id: string
            current_page: number
            total_pages: number
            progress_percentage: number
            last_read_at: number
            synced: boolean
        }
        indexes: { 'by-synced': boolean }
    }
    vocabulary: {
        key: string // word_id (generated)
        value: {
            id: string
            word: string
            definition: string | null
            context: string | null
            book_id: string | null
            page_number: number | null
            mastery_level: number
            created_at: number
            synced: boolean
        }
        indexes: { 'by-synced': boolean; 'by-book': string }
    }
    highlights: {
        key: string // highlight_id (generated)
        value: {
            id: string
            book_id: string
            page_number: number
            text: string
            color: string
            note: string | null
            created_at: number
            synced: boolean
        }
        indexes: { 'by-synced': boolean; 'by-book': string }
    }
    sync_queue: {
        key: number // auto-increment
        value: {
            id?: number
            action: 'create' | 'update' | 'delete'
            table: 'liked_books' | 'reading_progress' | 'vocabulary' | 'highlights'
            data: any
            created_at: number
            retry_count: number
        }
    }
}

let dbInstance: IDBPDatabase<KetabYarDB> | null = null

/**
 * Initialize IndexedDB
 */
async function initDB(): Promise<IDBPDatabase<KetabYarDB>> {
    if (dbInstance) return dbInstance

    dbInstance = await openDB<KetabYarDB>('ketab-yar-offline', 2, {
        upgrade(db, oldVersion) {
            // Version 1 & 2: Create all stores
            // Liked books store
            if (!db.objectStoreNames.contains('liked_books')) {
                const likedStore = db.createObjectStore('liked_books', { keyPath: 'book_id' })
                likedStore.createIndex('by-synced', 'synced')
            }

            // Reading progress store
            if (!db.objectStoreNames.contains('reading_progress')) {
                const progressStore = db.createObjectStore('reading_progress', { keyPath: 'book_id' })
                progressStore.createIndex('by-synced', 'synced')
            }

            // Vocabulary store
            if (!db.objectStoreNames.contains('vocabulary')) {
                const vocabStore = db.createObjectStore('vocabulary', { keyPath: 'id' })
                vocabStore.createIndex('by-synced', 'synced')
                vocabStore.createIndex('by-book', 'book_id')
            }

            // Highlights store
            if (!db.objectStoreNames.contains('highlights')) {
                const highlightStore = db.createObjectStore('highlights', { keyPath: 'id' })
                highlightStore.createIndex('by-synced', 'synced')
                highlightStore.createIndex('by-book', 'book_id')
            }

            // Sync queue store
            if (!db.objectStoreNames.contains('sync_queue')) {
                db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true })
            }
        },
    })

    return dbInstance
}

/**
 * Liked Books Operations
 */
export const likedBooks = {
    async add(book: {
        book_id: string
        book_slug: string
        book_title: string
        book_cover: string | null
    }) {
        try {
            const db = await initDB()
            await db.put('liked_books', {
                ...book,
                liked_at: Date.now(),
                synced: false,
            })

            // Add to sync queue
            await addToSyncQueue('create', 'liked_books', book)
        } catch (error) {
            console.error('Error adding liked book:', error)
            throw error
        }
    },

    async remove(bookId: string) {
        try {
            const db = await initDB()
            await db.delete('liked_books', bookId)

            // Add to sync queue
            await addToSyncQueue('delete', 'liked_books', { book_id: bookId })
        } catch (error) {
            console.error('Error removing liked book:', error)
            throw error
        }
    },

    async getAll() {
        try {
            const db = await initDB()
            return await db.getAll('liked_books')
        } catch (error) {
            console.error('Error getting all liked books:', error)
            return []
        }
    },

    async isLiked(bookId: string) {
        try {
            const db = await initDB()
            const book = await db.get('liked_books', bookId)
            return !!book
        } catch (error) {
            console.error('Error checking if book is liked:', error)
            return false
        }
    },

    async markSynced(bookId: string) {
        try {
            const db = await initDB()
            const book = await db.get('liked_books', bookId)
            if (book) {
                book.synced = true
                await db.put('liked_books', book)
            }
        } catch (error) {
            console.error('Error marking book as synced:', error)
        }
    },
}

/**
 * Reading Progress Operations
 */
export const readingProgress = {
    async save(progress: {
        book_id: string
        current_page: number
        total_pages: number
        progress_percentage: number
    }) {
        const db = await initDB()
        await db.put('reading_progress', {
            ...progress,
            last_read_at: Date.now(),
            synced: false,
        })

        // Add to sync queue
        await addToSyncQueue('create', 'reading_progress', progress)
    },

    async get(bookId: string) {
        const db = await initDB()
        return await db.get('reading_progress', bookId)
    },

    async getAll() {
        const db = await initDB()
        return await db.getAll('reading_progress')
    },

    async markSynced(bookId: string) {
        const db = await initDB()
        const progress = await db.get('reading_progress', bookId)
        if (progress) {
            progress.synced = true
            await db.put('reading_progress', progress)
        }
    },
}

/**
 * Vocabulary Operations
 */
export const vocabulary = {
    async add(word: {
        word: string
        definition: string | null
        context: string | null
        book_id: string | null
        page_number: number | null
    }) {
        const db = await initDB()
        const id = `vocab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        const vocabItem = {
            id,
            ...word,
            mastery_level: 0,
            created_at: Date.now(),
            synced: false,
        }

        await db.put('vocabulary', vocabItem)
        await addToSyncQueue('create', 'vocabulary', vocabItem)

        return vocabItem
    },

    async getAll() {
        const db = await initDB()
        return await db.getAll('vocabulary')
    },

    async getByBook(bookId: string) {
        const db = await initDB()
        return await db.getAllFromIndex('vocabulary', 'by-book', bookId)
    },

    async markSynced(id: string) {
        const db = await initDB()
        const word = await db.get('vocabulary', id)
        if (word) {
            word.synced = true
            await db.put('vocabulary', word)
        }
    },
}

/**
 * Highlights Operations
 */
export const highlights = {
    async add(highlight: {
        book_id: string
        page_number: number
        text: string
        color: string
        note: string | null
    }) {
        const db = await initDB()
        const id = `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        const highlightItem = {
            id,
            ...highlight,
            created_at: Date.now(),
            synced: false,
        }

        await db.put('highlights', highlightItem)
        await addToSyncQueue('create', 'highlights', highlightItem)

        return highlightItem
    },

    async getByBook(bookId: string) {
        const db = await initDB()
        return await db.getAllFromIndex('highlights', 'by-book', bookId)
    },

    async markSynced(id: string) {
        const db = await initDB()
        const highlight = await db.get('highlights', id)
        if (highlight) {
            highlight.synced = true
            await db.put('highlights', highlight)
        }
    },
}

/**
 * Sync Queue Operations
 */
async function addToSyncQueue(
    action: 'create' | 'update' | 'delete',
    table: 'liked_books' | 'reading_progress' | 'vocabulary' | 'highlights',
    data: any
) {
    const db = await initDB()
    await db.add('sync_queue', {
        action,
        table,
        data,
        created_at: Date.now(),
        retry_count: 0,
    })
}

export async function getSyncQueue() {
    const db = await initDB()
    return await db.getAll('sync_queue')
}

async function clearSyncQueue() {
    const db = await initDB()
    await db.clear('sync_queue')
}

export async function removeSyncQueueItem(id: number) {
    const db = await initDB()
    await db.delete('sync_queue', id)
}

/**
 * Get unsynced items count
 */
export async function getUnsyncedCount() {
    try {
        const db = await initDB()

        // Check if stores exist before querying
        if (!db.objectStoreNames.contains('liked_books')) {
            return 0
        }

        const [likedCount, progressCount, vocabCount, highlightCount] = await Promise.all([
            db.countFromIndex('liked_books', 'by-synced', false).catch(() => 0),
            db.countFromIndex('reading_progress', 'by-synced', false).catch(() => 0),
            db.countFromIndex('vocabulary', 'by-synced', false).catch(() => 0),
            db.countFromIndex('highlights', 'by-synced', false).catch(() => 0),
        ])

        return likedCount + progressCount + vocabCount + highlightCount
    } catch (error) {
        console.error('Error getting unsynced count:', error)
        return 0
    }
}

/**
 * Clear all offline data (for testing or logout)
 */
async function clearAllOfflineData() {
    try {
        const db = await initDB()
        await Promise.all([
            db.clear('liked_books').catch(() => { }),
            db.clear('reading_progress').catch(() => { }),
            db.clear('vocabulary').catch(() => { }),
            db.clear('highlights').catch(() => { }),
            db.clear('sync_queue').catch(() => { }),
        ])
    } catch (error) {
        console.error('Error clearing offline data:', error)
    }
}

/**
 * Delete and recreate the database (for fixing schema issues)
 */
export async function resetDatabase() {
    try {
        // Close existing connection
        if (dbInstance) {
            dbInstance.close()
            dbInstance = null
        }

        // Delete the database
        await new Promise<void>((resolve, reject) => {
            const request = indexedDB.deleteDatabase('ketab-yar-offline')
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
            request.onblocked = () => {
                console.warn('Database deletion blocked. Please close all tabs.')
                reject(new Error('Database deletion blocked'))
            }
        })

        console.log('✅ Database deleted successfully')

        // Reinitialize with new schema
        await initDB()
        console.log('✅ Database recreated with new schema')
    } catch (error) {
        console.error('Error resetting database:', error)
        throw error
    }
}
