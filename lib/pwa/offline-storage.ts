import type { BilingualParagraph, SanityImage } from '@/lib/sanity/types'
import { DBSchema, IDBPDatabase, openDB } from 'idb'

// Database schema
interface KetabYarDB extends DBSchema {
    books: {
        key: string // book slug
        value: {
            slug: string
            title: { en: string; fa: string }
            author: { name: string; slug: string }
            coverImage: string
            totalChapters: number
            downloadedAt: string
        }
    }
    chapters: {
        key: string // `${bookSlug}-${chapterNumber}`
        value: {
            bookSlug: string
            chapterNumber: number
            title: { en: string; fa: string }
            content: (BilingualParagraph | SanityImage)[]
            downloadedAt: string
        }
        indexes: { bookSlug: string }
    }
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

const DB_NAME = 'ketab-yar-offline'
const DB_VERSION = 2 // Bumped to 2 to add new stores

// Initialize database
async function getDB(): Promise<IDBPDatabase<KetabYarDB>> {
    return openDB<KetabYarDB>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
            // Create books store
            if (!db.objectStoreNames.contains('books')) {
                db.createObjectStore('books', { keyPath: 'slug' })
            }

            // Create chapters store with index
            if (!db.objectStoreNames.contains('chapters')) {
                const chapterStore = db.createObjectStore('chapters', {
                    keyPath: ['bookSlug', 'chapterNumber'],
                })
                chapterStore.createIndex('bookSlug', 'bookSlug')
            }

            // Version 2: Add stores from offline-storage.ts
            if (oldVersion < 2) {
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
            }
        },
    })
}

// Book operations
async function saveBookMetadata(book: {
    slug: string
    title: { en: string; fa: string }
    author: { name: string; slug: string }
    coverImage: string
    totalChapters: number
}) {
    const db = await getDB()
    await db.put('books', {
        ...book,
        downloadedAt: new Date().toISOString(),
    })
}

async function getBookMetadata(slug: string) {
    const db = await getDB()
    return db.get('books', slug)
}

export async function getAllDownloadedBooks() {
    const db = await getDB()
    return db.getAll('books')
}

async function deleteBook(slug: string) {
    const db = await getDB()

    // Delete book metadata
    await db.delete('books', slug)

    // Delete all chapters for this book
    const chapters = await db.getAllFromIndex('chapters', 'bookSlug', slug)
    const tx = db.transaction('chapters', 'readwrite')

    for (const chapter of chapters) {
        // Use IDBKeyRange for composite keys
        await tx.store.delete(IDBKeyRange.only([chapter.bookSlug, chapter.chapterNumber]))
    }

    await tx.done
}

// Chapter operations
export async function saveChapter(chapter: {
    bookSlug: string
    chapterNumber: number
    title: { en: string; fa: string }
    content: (BilingualParagraph | SanityImage)[]
}) {
    const db = await getDB()
    await db.put('chapters', {
        ...chapter,
        downloadedAt: new Date().toISOString(),
    })
}

export async function getChapter(bookSlug: string, chapterNumber: number) {
    const db = await getDB()
    return db.get('chapters', IDBKeyRange.only([bookSlug, chapterNumber]))
}

async function getAllChaptersForBook(bookSlug: string) {
    const db = await getDB()
    return db.getAllFromIndex('chapters', 'bookSlug', bookSlug)
}

async function isBookFullyDownloaded(bookSlug: string, totalChapters: number) {
    const chapters = await getAllChaptersForBook(bookSlug)
    return chapters.length === totalChapters
}

// Storage info
async function getStorageInfo() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        return {
            usage: estimate.usage || 0,
            quota: estimate.quota || 0,
            percentUsed: estimate.quota ? ((estimate.usage || 0) / estimate.quota) * 100 : 0,
        }
    }
    return null
}

// Clear all offline data
async function clearAllOfflineData() {
    const db = await getDB()
    await db.clear('books')
    await db.clear('chapters')
}


// Legacy function names for compatibility
export async function isBookOffline(bookSlug: string) {
    const book = await getBookMetadata(bookSlug)
    return !!book
}

export async function deleteBookOffline(bookSlug: string) {
    return deleteBook(bookSlug)
}

export async function saveBookOffline(
    bookSlug: string,
    content: { en: string; fa: string },
    metadata: { title: string; author: string; coverUrl: string },
    _userId: string
) {
    // This is a simplified version - in reality you'd parse the content into chapters
    // For now, we'll just save the metadata
    await saveBookMetadata({
        slug: bookSlug,
        title: { en: metadata.title, fa: metadata.title },
        author: { name: metadata.author, slug: '' },
        coverImage: metadata.coverUrl,
        totalChapters: 1,
    })
}

// Alias exports for compatibility
export const initDB = getDB
export const getOfflineBooks = getAllDownloadedBooks
export const getStorageUsage = getStorageInfo

// Sync queue functions (for offline sync)
export async function getSyncQueue() {
    // TODO: Implement sync queue storage
    return []
}

export async function clearSyncQueue() {
    // TODO: Implement sync queue clearing
    return true
}
