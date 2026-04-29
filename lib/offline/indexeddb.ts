/**
 * KETAB-YAR: IndexedDB Manager
 * 
 * Offline-first storage for PWA
 * Stores encrypted book content and sync queue
 */

import { DBSchema, IDBPDatabase, openDB } from 'idb'

// Database schema
interface KetabYarDB extends DBSchema {
    // Encrypted book content
    books: {
        key: string // book_id
        value: {
            bookId: string
            encryptedContent: ArrayBuffer
            contentHash: string
            downloadedAt: number
            lastAccessedAt: number
            expiresAt?: number
        }
        indexes: { 'by-downloaded': number }
    }

    // Sync queue for offline operations
    syncQueue: {
        key: number // auto-increment
        value: {
            id?: number
            tableName: string
            operation: 'INSERT' | 'UPDATE' | 'DELETE'
            recordId: string
            data: Record<string, unknown>
            createdAt: number
            synced: boolean
        }
        indexes: { 'by-synced': boolean; 'by-created': number }
    }

    // User progress (cached for offline)
    progress: {
        key: string // book_id
        value: {
            bookId: string
            currentPage: number
            progressPercentage: number
            lastReadAt: number
            xpEarned: number
        }
    }

    // Vocabulary (cached for offline)
    vocabulary: {
        key: string // word
        value: {
            word: string
            definition: string
            meaning: string
            context: string
            bookId?: string
            pageNumber?: number
            createdAt: number
        }
    }
}

let dbInstance: IDBPDatabase<KetabYarDB> | null = null

/**
 * Initialize IndexedDB
 */
async function initDB(): Promise<IDBPDatabase<KetabYarDB>> {
    if (dbInstance) return dbInstance

    dbInstance = await openDB<KetabYarDB>('ketab-yar-db', 1, {
        upgrade(db) {
            // Books store
            if (!db.objectStoreNames.contains('books')) {
                const booksStore = db.createObjectStore('books', { keyPath: 'bookId' })
                booksStore.createIndex('by-downloaded', 'downloadedAt')
            }

            // Sync queue store
            if (!db.objectStoreNames.contains('syncQueue')) {
                const syncStore = db.createObjectStore('syncQueue', {
                    keyPath: 'id',
                    autoIncrement: true
                })
                syncStore.createIndex('by-synced', 'synced')
                syncStore.createIndex('by-created', 'createdAt')
            }

            // Progress store
            if (!db.objectStoreNames.contains('progress')) {
                db.createObjectStore('progress', { keyPath: 'bookId' })
            }

            // Vocabulary store
            if (!db.objectStoreNames.contains('vocabulary')) {
                db.createObjectStore('vocabulary', { keyPath: 'word' })
            }
        },
    })

    return dbInstance
}

/**
 * Get database instance
 */
async function getDB(): Promise<IDBPDatabase<KetabYarDB>> {
    if (!dbInstance) {
        return await initDB()
    }
    return dbInstance
}

// ============================================
// BOOK CONTENT OPERATIONS
// ============================================

/**
 * Save encrypted book content
 */
async function saveBookContent(
    bookId: string,
    encryptedContent: ArrayBuffer,
    contentHash: string,
    expiresAt?: number
) {
    const db = await getDB()
    await db.put('books', {
        bookId,
        encryptedContent,
        contentHash,
        downloadedAt: Date.now(),
        lastAccessedAt: Date.now(),
        expiresAt,
    })
}

/**
 * Get encrypted book content
 */
async function getBookContent(bookId: string) {
    const db = await getDB()
    const book = await db.get('books', bookId)

    if (book) {
        // Update last accessed
        book.lastAccessedAt = Date.now()
        await db.put('books', book)
    }

    return book
}

/**
 * Delete book content
 */
async function deleteBookContent(bookId: string) {
    const db = await getDB()
    await db.delete('books', bookId)
}

/**
 * Get all downloaded books
 */
async function getAllDownloadedBooks() {
    const db = await getDB()
    return await db.getAll('books')
}

/**
 * Clear expired books
 */
async function clearExpiredBooks() {
    const db = await getDB()
    const books = await db.getAll('books')
    const now = Date.now()

    for (const book of books) {
        if (book.expiresAt && book.expiresAt < now) {
            await db.delete('books', book.bookId)
        }
    }
}

// ============================================
// SYNC QUEUE OPERATIONS
// ============================================

/**
 * Add operation to sync queue
 */
async function addToSyncQueue(
    tableName: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    recordId: string,
    data: Record<string, unknown>
) {
    const db = await getDB()
    await db.add('syncQueue', {
        tableName,
        operation,
        recordId,
        data,
        createdAt: Date.now(),
        synced: false,
    })
}

/**
 * Get unsynced operations
 */
async function getUnsyncedOperations() {
    const db = await getDB()
    const index = db.transaction('syncQueue').store.index('by-synced')
    return await index.getAll(false)
}

/**
 * Mark operation as synced
 */
async function markAsSynced(id: number) {
    const db = await getDB()
    const item = await db.get('syncQueue', id)
    if (item) {
        item.synced = true
        await db.put('syncQueue', item)
    }
}

/**
 * Clear synced operations older than 7 days
 */
async function clearOldSyncedOperations() {
    const db = await getDB()
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const allItems = await db.getAll('syncQueue')

    for (const item of allItems) {
        if (item.synced && item.createdAt < sevenDaysAgo) {
            await db.delete('syncQueue', item.id!)
        }
    }
}

// ============================================
// PROGRESS OPERATIONS (Offline Cache)
// ============================================

/**
 * Save reading progress offline
 */
async function saveProgressOffline(
    bookId: string,
    currentPage: number,
    progressPercentage: number,
    xpEarned: number
) {
    const db = await getDB()
    await db.put('progress', {
        bookId,
        currentPage,
        progressPercentage,
        lastReadAt: Date.now(),
        xpEarned,
    })
}

/**
 * Get offline progress
 */
async function getProgressOffline(bookId: string) {
    const db = await getDB()
    return await db.get('progress', bookId)
}

// ============================================
// VOCABULARY OPERATIONS (Offline Cache)
// ============================================

/**
 * Save vocabulary word offline
 */
async function saveVocabularyOffline(
    word: string,
    definition: string,
    meaning: string,
    context: string,
    bookId?: string,
    pageNumber?: number
) {
    const db = await getDB()
    await db.put('vocabulary', {
        word,
        definition,
        meaning,
        context,
        bookId,
        pageNumber,
        createdAt: Date.now(),
    })
}

/**
 * Get all offline vocabulary
 */
async function getAllVocabularyOffline() {
    const db = await getDB()
    return await db.getAll('vocabulary')
}

/**
 * Delete vocabulary word offline
 */
async function deleteVocabularyOffline(word: string) {
    const db = await getDB()
    await db.delete('vocabulary', word)
}
