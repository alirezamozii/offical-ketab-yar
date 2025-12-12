'use client'

/**
 * Example: How to integrate dictionary into your book reader
 * This shows the complete integration pattern
 */

import { WordPopupDictionary } from '@/components/reader/word-popup-dictionary'
import { useWordSelection } from '@/hooks/use-word-selection'

interface ReaderWithDictionaryProps {
    bookId: string
    content: string
}

export function ReaderWithDictionaryExample({ bookId, content }: ReaderWithDictionaryProps) {
    const { selectedWord, handleTextSelection, clearSelection, saveWord } = useWordSelection(bookId)

    return (
        <div className="relative">
            {/* Book Content - Enable text selection */}
            <div
                onMouseUp={handleTextSelection}
                className="prose prose-lg max-w-none select-text cursor-text p-8"
                style={{
                    // Prevent text selection from interfering with UI
                    userSelect: 'text',
                    WebkitUserSelect: 'text'
                }}
            >
                {/* Your book content here */}
                <p>{content}</p>
            </div>

            {/* Dictionary Popup - Shows when user selects a word */}
            {selectedWord && (
                <WordPopupDictionary
                    word={selectedWord.word}
                    position={selectedWord.position}
                    context={selectedWord.context}
                    onClose={clearSelection}
                    onSaveWord={saveWord}
                />
            )}

            {/* Optional: Click outside to close */}
            {selectedWord && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={clearSelection}
                />
            )}
        </div>
    )
}

/**
 * Usage in your main reader component:
 * 
 * import { ReaderWithDictionaryExample } from '@/components/reader/reader-with-dictionary-example'
 * 
 * <ReaderWithDictionaryExample
 *   bookId={book.id}
 *   content={currentPageContent}
 * />
 */
