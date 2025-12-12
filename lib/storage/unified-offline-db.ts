/**
 * Unified Offline Database
 * Agent 2 (Performance): Single source of truth for all offline data
 * Agent 3 (Psychology): Seamless offline experience
 * 
 * Features:
 * - All offline data in ONE database
 * - Encrypted book content storage
 * - Comprehensive sync queue
 * - Storage quota management
 * - Works on PC and mobile
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

// Unified database schema
interface UnifiedKetabYarDB extends DBSchema {
    // User-generated content
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
            book_slug: string
            current_page: number
            current_chapter: number
            total_pages: number
            progress_percentage: number
            last_read_at: number
            total_time_spent: number
            synced: boolean
        }
        indexes: { 'by-synced': boolean; 'by-last-read': number }
    }

    vocabulary: {
        key: string // word_id (generated)
        value: {
            id: string
            word: string
            definition: string | null
            translation: string | null
            context: string | null
            book_id: string | null
            book_title: string | null
            page_number: number | null
            mastery_level: number
            created_at: number
            updated_at: number
            synced: boolean
        }
        indexes: { 'by-synced': boolean; 'by-book': string; 'by-mastery': number }
    }

    highlights: {
        key: string // highlight_id (generated)
        value: {
            id: string
            book_id: string
            page_number: number
            chapter_number: number
            text: string
            color: string
            note: string | null
            created_at: number
            synced: boolean
        }
        indexes: { 'by-synced': boolean; 'by-book': string }
    }

    // Book content (encrypted)
    books_metadata: {
        key: string // book_slug
        value: {
            slug: string
            title: { en: string; fa: string }
            author: { name: string; slug: string }
            coverImage: string
            totalChapters: number
            totalPages: number
            downloadedAt: number
            lastAccessedAt: number
            encrypted: boolean
            encryptionKeyId: string | null
        }
        indexes: { 'by-last-accessed': number }
    }

    book_chapters_encrypted: {
        key: [string, number] // [bookSlug, chapterNumber]
        value: {
            bookSlug: string
            chapterNumber: number
            title: { en: string; fa: string }
            encryptedContent: ArrayBuffer // Encrypted chapter data
            iv: Uint8Array // Initialization vector for decryption
            downloadedAt: number
        }
        indexes: { 'by-book': string }
    }

    // User preferences
    user_preferences: {
        key: string // 'global' or user_id
        value: {
            id: string
            theme: 'light' | 'dark' | 'sepia'
            language: 'en' | 'fa'
            autoSync: boolean
            downloadQuality: 'low' | 'medium' | 'high'
            offlineMode: boolean
            updated_at: number
        }
    }

    reader_settings: {
        key: string // book_slug
        value: {
            book_slug: string
            fontSize: number
            lineHeight: number
            letterSpacing: number
            fontFamily: string
            theme: 'light' | 'dark' | 'sepia'
            updated_at: number
        }
    }

    // Sync queue
    sync_queue: {
        key: number // auto-increment
        value: {
            id?: number
            action: 'create' | 'update' | 'delete'
            table: 'liked_books' | 'reading_progress' | 'vocabulary' | 'highlights' | 'user_preferences' | 'reader_settings'
            data: any
            created_at: number
            retry_count: number
            last_error: string | null
        }
        indexes: { 'by-retry': number }
    }

    // Storage metadata
    storage_metadata: {
        key: string // 'quota_info'
        value: {
            id: string
            totalUsage: number
            quotaLimit: number
            lastChecked: number
            bookContentSize: number
            userDataSize: number
        }
    }
}

const DB_NAME = 'ketab-yar-unified'
const DB_VERSION = 1

let dbInstance: IDBPDatabase<UnifiedKetabYarDB> | null = null

/**
 * Initialize unified database
 */
export async function initUnifiedDB(): Promise<IDBPDatabase<UnifiedKetabYarDB>> {
    if (dbInstance) return dbInstance

    dbInstance = await openDB<UnifiedKetabYarDB>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
            console.log(`📦 Upgrading database from v${oldVersion} to v${newVersion}`)

            // Liked books
            if (!db.objectStoreNames.contains('liked_books')) {
                const likedStore = db.createObjectStore('liked_books', { keyPath: 'book_id' })
                likedStore.createIndex('by-synced', 'synced')
            }

            // Reading progress
            if (!db.objectStoreNames.contains('reading_progress')) {
                const progressStore = db.createObjectStore('reading_progress', { keyPath: 'book_id' })
                progressStore.createIndex('by-synced', 'synced')
                progressStore.createIndex('by-last-read', 'last_read_at')
            }

            // Vocabulary
            if (!db.objectStoreNames.contains('vocabulary')) {
                const vocabStore = db.createObjectStore('vocabulary', { keyPath: 'id' })
                vocabStore.createIndex('by-synced', 'synced')
                vocabStore.createIndex('by-book', 'book_id')
                vocabStore.createIndex('by-mastery', 'mastery_level')
            }

            // Highlights
            if (!db.objectStoreNames.contains('highlights')) {
                const highlightStore = db.createObjectStore('highlights', { keyPath: 'id' })
                highlightStore.createIndex('by-synced', 'synced')
                highlightStore.createIndex('by-book', 'book_id')
            }

            // Books metadata
            if (!db.objectStoreNames.contains('books_metadata')) {
                const booksStore = db.createObjectStore('books_metadata', { keyPath: 'slug' })
                booksStore.createIndex('by-last-accessed', 'lastAccessedAt')
            }

            // Book chapters (encrypted)
            if (!db.objectStoreNames.contains('book_chapters_encrypted')) {
                const chaptersStore = db.createObjectStore('book_chapters_encrypted', {
                    keyPath: ['bookSlug', 'chapterNumber'],
                })
                chaptersStore.createIndex('by-book', 'bookSlug')
            }

            // User preferences
            if (!db.objectStoreNames.contains('user_preferences')) {
                db.createObjectStore('user_preferences', { keyPath: 'id' })
            }

            // Reader settings
            if (!db.objectStoreNames.contains('reader_settings')) {
                db.createObjectStore('reader_settings', { keyPath: 'book_slug' })
            }

            // Sync queue
            if (!db.objectStoreNames.contains('sync_queue')) {
                const queueStore = db.createObjectStore('sync_queue', {
                    keyPath: 'id',
                    autoIncrement: true,
                })
                queueStore.createIndex('by-retry', 'retry_count')
            }

            // Storage metadata
            if (!db.objectStoreNames.contains('storage_metadata')) {
                db.createObjectStore('storage_metadata', { keyPath: 'id' })
            }
        },
    })

    console.log('✅ Unified database initialized')
    return dbInstance
}

/**
 * Get database instance (lazy initialization)
 */
export async function getDB(): Promise<IDBPDatabase<UnifiedKetabYarDB>> {
    return initUnifiedDB()
}

/**
 * Close database connection
 */
export function closeDB() {
    if (dbInstance) {
        dbInstance.close()
        dbInstance = null
    }
}

/**
 * Delete and recreate database (for migrations or fixes)
 */
export async function resetUnifiedDB() {
    try {
        closeDB()

        await new Promise<void>((resolve, reject) => {
            const request = indexedDB.deleteDatabase(DB_NAME)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
            request.onblocked = () => {
                console.warn('⚠️ Database deletion blocked. Close all tabs.')
                reject(new Error('Database deletion blocked'))
            }
        })

        console.log('✅ Database deleted')
        await initUnifiedDB()
        console.log('✅ Database recreated')
    } catch (error) {
        console.error('❌ Error resetting database:', error)
        throw error
    }
}

/**
 * Export database for backup
 */
export async function exportDatabase(): Promise<string> {
    const db = await getDB()
    const data: any = {}

    const storeNames = Array.from(db.objectStoreNames)
    for (const storeName of storeNames) {
        data[storeName] = await db.getAll(storeName as any)
    }

    return JSON.stringify(data, null, 2)
}

/**
 * Import database from backup
 */
export async function importDatabase(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData)
    const db = await getDB()

    for (const [storeName, items] of Object.entries(data)) {
        if (db.objectStoreNames.contains(storeName)) {
            const tx = db.transaction(storeName as any, 'readwrite')
            for (const item of items as any[]) {
                await tx.store.put(item)
            }
            await tx.done
        }
    }

    console.log('✅ Database imported successfully')
}
