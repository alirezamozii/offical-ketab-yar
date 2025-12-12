/**
 * Unified Offline Operations
 * Agent 2 (Performance): High-level API for all offline operations
 * Agent 3 (Psychology): Simple, intuitive interface
 * 
 * This is the ONLY file other components should import for offline operations
 */

import { decryptBookContent, encryptBookContent, generateKeyId, isCryptoAvailable } from '../security/crypto-manager'
import { autoCleanupIfNeeded, estimateBookSize, hasEnoughSpace } from './quota-manager'
import { getDB } from './unified-offline-db'
import { forceSyncNow, getSyncStatus, onSyncProgress, type SyncProgress } from './unified-sync-manager'

// Re-export types
export type { SyncProgress }

/**
 * ============================================
 * LIKED BOOKS OPERATIONS
 * ============================================
 */

export async function likeBook(book: {
    book_id: string
    book_slug: string
    book_title: string
    book_cover: string | null
}) {
    const db = await getDB()
    await db.put('liked_books', {
        ...book,
        liked_at: Date.now(),
        synced: false,
    })

    // Add to sync queue
    await db.add('sync_queue', {
        action: 'create',
        table: 'liked_books',
        data: book,
        created_at: Date.now(),
        retry_count: 0,
        last_error: null,
    })
}

export async function unlikeBook(bookId: string) {
    const db = await getDB()
    await db.delete('liked_books', bookId)

    // Add to sync queue
    await db.add('sync_queue', {
        action: 'delete',
        table: 'liked_books',
        data: { book_id: bookId },
        created_at: Date.now(),
        retry_count: 0,
        last_error: null,
    })
}

export async function isBookLiked(bookId: string): Promise<boolean> {
    const db = await getDB()
    const book = await db.get('liked_books', bookId)
    return !!book
}

export async function getAllLikedBooks() {
    const db = await getDB()
    return db.getAll('liked_books')
}

/**
 * ============================================
 * READING PROGRESS OPERATIONS
 * ============================================
 */

export async function saveReadingProgress(progress: {
    book_id: string
    book_slug: string
    current_page: number
    current_chapter: number
    total_pages: number
    progress_percentage: number
    total_time_spent?: number
}) {
    const db = await getDB()
    await db.put('reading_progress', {
        ...progress,
        total_time_spent: progress.total_time_spent || 0,
        last_read_at: Date.now(),
        synced: false,
    })
}

export async function getReadingProgress(bookId: string) {
    const db = await getDB()
    return db.get('reading_progress', bookId)
}

export async function getAllReadingProgress() {
    const db = await getDB()
    return db.getAllFromIndex('reading_progress', 'by-last-read')
}

/**
 * ============================================
 * VOCABULARY OPERATIONS
 * ============================================
 */

export async function addVocabularyWord(word: {
    word: string
    definition?: string
    translation?: string
    context?: string
    book_id?: string
    book_title?: string
    page_number?: number
}) {
    const db = await getDB()
    const id = `vocab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const vocabItem = {
        id,
        word: word.word,
        definition: word.definition || null,
        translation: word.translation || null,
        context: word.context || null,
        book_id: word.book_id || null,
        book_title: word.book_title || null,
        page_number: word.page_number || null,
        mastery_level: 0,
        created_at: Date.now(),
        updated_at: Date.now(),
        synced: false,
    }

    await db.put('vocabulary', vocabItem)
    return vocabItem
}

export async function getAllVocabulary() {
    const db = await getDB()
    return db.getAll('vocabulary')
}

export async function getVocabularyByBook(bookId: string) {
    const db = await getDB()
    return db.getAllFromIndex('vocabulary', 'by-book', bookId)
}

export async function updateVocabularyMastery(wordId: string, masteryLevel: number) {
    const db = await getDB()
    const word = await db.get('vocabulary', wordId)
    if (word) {
        word.mastery_level = masteryLevel
        word.updated_at = Date.now()
        word.synced = false
        await db.put('vocabulary', word)
    }
}

export async function deleteVocabularyWord(wordId: string) {
    const db = await getDB()
    await db.delete('vocabulary', wordId)

    await db.add('sync_queue', {
        action: 'delete',
        table: 'vocabulary',
        data: { id: wordId },
        created_at: Date.now(),
        retry_count: 0,
        last_error: null,
    })
}

/**
 * ============================================
 * HIGHLIGHTS OPERATIONS
 * ============================================
 */

export async function addHighlight(highlight: {
    book_id: string
    page_number: number
    chapter_number: number
    text: string
    color: string
    note?: string
}) {
    const db = await getDB()
    const id = `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const highlightItem = {
        id,
        ...highlight,
        note: highlight.note || null,
        created_at: Date.now(),
        synced: false,
    }

    await db.put('highlights', highlightItem)
    return highlightItem
}

export async function getHighlightsByBook(bookId: string) {
    const db = await getDB()
    return db.getAllFromIndex('highlights', 'by-book', bookId)
}

export async function deleteHighlight(highlightId: string) {
    const db = await getDB()
    await db.delete('highlights', highlightId)

    await db.add('sync_queue', {
        action: 'delete',
        table: 'highlights',
        data: { id: highlightId },
        created_at: Date.now(),
        retry_count: 0,
        last_error: null,
    })
}

/**
 * ============================================
 * BOOK DOWNLOAD OPERATIONS (ENCRYPTED)
 * ============================================
 */

export async function downloadBookForOffline(
    book: {
        slug: string
        title: { en: string; fa: string }
        author: { name: string; slug: string }
        coverImage: string
        totalChapters: number
        totalPages: number
    },
    chapters: Array<{
        chapterNumber: number
        title: { en: string; fa: string }
        content: string // JSON string of chapter content
    }>,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Check if crypto is available
        if (!isCryptoAvailable()) {
            return { success: false, error: 'Encryption not available in this browser' }
        }

        // Estimate size
        const estimatedSize = estimateBookSize(chapters.length)

        // Check available space
        const hasSpace = await hasEnoughSpace(estimatedSize)
        if (!hasSpace) {
            // Try auto-cleanup
            await autoCleanupIfNeeded()

            // Check again
            const hasSpaceAfterCleanup = await hasEnoughSpace(estimatedSize)
            if (!hasSpaceAfterCleanup) {
                return { success: false, error: 'Not enough storage space' }
            }
        }

        const db = await getDB()

        // Save book metadata
        await db.put('books_metadata', {
            slug: book.slug,
            title: book.title,
            author: book.author,
            coverImage: book.coverImage,
            totalChapters: book.totalChapters,
            totalPages: book.totalPages,
            downloadedAt: Date.now(),
            lastAccessedAt: Date.now(),
            encrypted: true,
            encryptionKeyId: generateKeyId(userId, book.slug),
        })

        // Encrypt and save each chapter
        for (const chapter of chapters) {
            const { encryptedData, iv } = await encryptBookContent(
                chapter.content,
                userId,
                book.slug
            )

            await db.put('book_chapters_encrypted', {
                bookSlug: book.slug,
                chapterNumber: chapter.chapterNumber,
                title: chapter.title,
                encryptedContent: encryptedData,
                iv,
                downloadedAt: Date.now(),
            })
        }

        console.log(`✅ Downloaded ${book.title.en} (${chapters.length} chapters, encrypted)`)
        return { success: true }
    } catch (error) {
        console.error('Error downloading book:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

export async function getOfflineBook(bookSlug: string, userId: string) {
    try {
        const db = await getDB()

        // Get metadata
        const metadata = await db.get('books_metadata', bookSlug)
        if (!metadata) return null

        // Update last accessed
        metadata.lastAccessedAt = Date.now()
        await db.put('books_metadata', metadata)

        // Get all chapters
        const encryptedChapters = await db.getAllFromIndex('book_chapters_encrypted', 'by-book', bookSlug)

        // Decrypt chapters
        const chapters = await Promise.all(
            encryptedChapters.map(async (chapter) => {
                const decryptedContent = await decryptBookContent(
                    chapter.encryptedContent,
                    chapter.iv,
                    userId,
                    bookSlug
                )

                return {
                    chapterNumber: chapter.chapterNumber,
                    title: chapter.title,
                    content: JSON.parse(decryptedContent),
                }
            })
        )

        return {
            metadata,
            chapters: chapters.sort((a, b) => a.chapterNumber - b.chapterNumber),
        }
    } catch (error) {
        console.error('Error getting offline book:', error)
        return null
    }
}

export async function isBookDownloaded(bookSlug: string): Promise<boolean> {
    const db = await getDB()
    const metadata = await db.get('books_metadata', bookSlug)
    return !!metadata
}

export async function getAllDownloadedBooks() {
    const db = await getDB()
    return db.getAll('books_metadata')
}

export async function deleteDownloadedBook(bookSlug: string) {
    const db = await getDB()

    // Delete metadata
    await db.delete('books_metadata', bookSlug)

    // Delete all chapters
    const chapters = await db.getAllFromIndex('book_chapters_encrypted', 'by-book', bookSlug)
    for (const chapter of chapters) {
        await db.delete('book_chapters_encrypted', [chapter.bookSlug, chapter.chapterNumber])
    }

    console.log(`🗑️ Deleted offline book: ${bookSlug}`)
}

/**
 * ============================================
 * SYNC OPERATIONS
 * ============================================
 */

export { forceSyncNow, getSyncStatus, onSyncProgress }

/**
 * ============================================
 * UTILITY OPERATIONS
 * ============================================
 */

export async function clearAllOfflineData() {
    const db = await getDB()
    await db.clear('liked_books')
    await db.clear('reading_progress')
    await db.clear('vocabulary')
    await db.clear('highlights')
    await db.clear('books_metadata')
    await db.clear('book_chapters_encrypted')
    await db.clear('sync_queue')
    console.log('✅ All offline data cleared')
}

export async function getOfflineDataSummary() {
    const db = await getDB()

    const [
        likedBooksCount,
        progressCount,
        vocabularyCount,
        highlightsCount,
        downloadedBooksCount,
        syncQueueCount,
    ] = await Promise.all([
        db.count('liked_books'),
        db.count('reading_progress'),
        db.count('vocabulary'),
        db.count('highlights'),
        db.count('books_metadata'),
        db.count('sync_queue'),
    ])

    return {
        likedBooks: likedBooksCount,
        readingProgress: progressCount,
        vocabulary: vocabularyCount,
        highlights: highlightsCount,
        downloadedBooks: downloadedBooksCount,
        pendingSync: syncQueueCount,
    }
}
