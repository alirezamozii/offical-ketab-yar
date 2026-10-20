'use client'

import { ErrorBoundary } from '@/components/error-boundary'
import { useReader } from '@/components/reader/reader-context'
import { lazy, Suspense, useEffect } from 'react'

const TextSelectionMenu = lazy(() => import('@/components/reader/text-selection-menu').then((m) => ({ default: m.TextSelectionMenu })))
const WordPopupDictionary = lazy(() => import('@/components/reader/word-popup-dictionary').then((m) => ({ default: m.WordPopupDictionary })))
const SettingsPanel = lazy(() => import('@/components/reader/settings-panel').then((m) => ({ default: m.SettingsPanel })))
const ChaptersPanel = lazy(() => import('@/components/reader/chapters-panel').then((m) => ({ default: m.ChaptersPanel })))
const HighlightsPanel = lazy(() => import('@/components/reader/highlights-panel').then((m) => ({ default: m.HighlightsPanel })))
const AIChatPanel = lazy(() => import('@/components/reader/ai-chat-panel').then((m) => ({ default: m.AIChatPanel })))
const ShortcutsHelpOverlay = lazy(() => import('@/components/reader/shortcuts-help-overlay').then((m) => ({ default: m.ShortcutsHelpOverlay })))

/**
 * Renders all the AnimatePresence-gated overlays:
 *  - TextSelectionMenu (appears on text selection — works in focus mode too)
 *  - WordPopupDictionary (works in focus mode too)
 *  - SettingsPanel (chrome-gated)
 *  - ChaptersPanel (chrome-gated)
 *  - HighlightsPanel (chrome-gated)
 *  - AIChatPanel (chrome-gated)
 *  - ShortcutsHelpOverlay (? key — always available)
 *
 * The text-selection menu and dictionary are NOT gated on `chromeVisible`
 * so they still work in focus mode. The settings/chapters/highlights/chat
 * panels are gated because they're toolbar-triggered and the toolbar is
 * hidden in focus mode.
 *
 * The four reader panels are now controlled sheets/dialogs (Radix-based)
 * — they get `role="dialog"`, `aria-modal`, focus trap, focus restore,
 * Escape-to-close, click-outside-to-close, and scroll lock for free.
 */
export function ReaderOverlays() {
  const {
    book,
    prefs,
    isMobile,
    chromeVisible,
    // text selection
    showTextMenu,
    setShowTextMenu,
    menuPosition,
    selectedText,
    addHighlight,
    handleShowDictionary,
    handleAddToVocab,
    handleCopy,
    setShowChat,
    // dictionary
    showDictionary,
    setShowDictionary,
    dictionaryWord,
    currentParagraphPlainText,
    // settings
    showSettings,
    setShowSettings,
    update,
    // chapters
    showChapters,
    setShowChapters,
    scrollToParagraph,
    currentParagraph,
    // bookmarks
    bookmarks,
    toggleBookmark,
    // highlights
    showHighlights,
    setShowHighlights,
    highlights,
    removeHighlight,
    setHighlightNote,
    clearAllHighlights,
    editingHighlightId,
    setEditingHighlightId,
    // chat
    showChat,
    // help
    showHelp,
    setShowHelp,
  } = useReader()

  useEffect(() => {
    if (!chromeVisible) {
      setShowSettings(false)
      setShowChapters(false)
      setShowHighlights(false)
      setShowChat(false)
    }
  }, [chromeVisible, setShowSettings, setShowChapters, setShowHighlights, setShowChat])

  return (
    <>
      {/* ---- Text selection menu ---- */}
      <Suspense fallback={null}>
        {showTextMenu && (
          <TextSelectionMenu
            position={menuPosition}
            theme={prefs.theme}
            selectedText={selectedText}
            onHighlight={addHighlight}
            onShowDictionary={handleShowDictionary}
            onAddToVocabulary={handleAddToVocab}
            onCopy={handleCopy}
            onAIChat={() => {
              setShowChat(true)
              setShowTextMenu(false)
            }}
            onClose={() => setShowTextMenu(false)}
          />
        )}
      </Suspense>

      {/* ---- Word popup dictionary (centered modal — Radix Dialog) ---- */}
      {showDictionary && (
        <ErrorBoundary>
          <Suspense fallback={null}><WordPopupDictionary
            open={showDictionary}
            word={dictionaryWord}
            context={currentParagraphPlainText().slice(0, 200)}
            theme={prefs.theme}
            bookSlug={book.slug}
            onClose={() => setShowDictionary(false)}
          /></Suspense>
        </ErrorBoundary>
      )}

      {showSettings && (
        <ErrorBoundary>
          <Suspense fallback={null}><SettingsPanel
            prefs={prefs}
            onChange={update}
            theme={prefs.theme}
            open={showSettings}
            onClose={() => setShowSettings(false)}
          /></Suspense>
        </ErrorBoundary>
      )}

      {showChapters && (
        <ErrorBoundary>
          <Suspense fallback={null}><ChaptersPanel
            book={book}
            currentPage={currentParagraph}
            bookmarks={bookmarks}
            theme={prefs.theme}
            open={showChapters}
            onClose={() => setShowChapters(false)}
            onJumpToPage={(p) => {
              scrollToParagraph(p)
              setShowChapters(false)
            }}
            onToggleBookmark={toggleBookmark}
          /></Suspense>
        </ErrorBoundary>
      )}

      {showHighlights && (
        <ErrorBoundary>
          <Suspense fallback={null}><HighlightsPanel
            highlights={highlights}
            currentPage={currentParagraph}
            theme={prefs.theme}
            bookTitle={book.title}
            bookAuthor={book.author}
            bookSlug={book.slug}
            pageNumbers={book.pages.map((p) => p.pageNumber)}
            editingHighlightId={editingHighlightId}
            onEditNote={setEditingHighlightId}
            onSaveNote={setHighlightNote}
            open={showHighlights}
            onClose={() => setShowHighlights(false)}
            onDelete={removeHighlight}
            onClearAll={clearAllHighlights}
            onCopy={(t) => {
              navigator.clipboard.writeText(t)
              void import('sonner').then(({ toast }) => toast.success('کپی شد'))
            }}
            onJumpToPage={(p) => {
              scrollToParagraph(p)
              setShowHighlights(false)
            }}
          /></Suspense>
        </ErrorBoundary>
      )}

      {showChat && (
        <ErrorBoundary>
          <Suspense fallback={null}><AIChatPanel
            bookTitle={book.title}
            bookAuthor={book.author}
            bookSlug={book.slug}
            bookContext={currentParagraphPlainText()}
            selectedText={selectedText}
            theme={prefs.theme}
            isMobile={isMobile}
            open={showChat}
            onClose={() => setShowChat(false)}
          /></Suspense>
        </ErrorBoundary>
      )}

      {/* ---- Shortcuts help overlay (? key) ---- */}
      <Suspense fallback={null}>
        {showHelp && (
          <ShortcutsHelpOverlay
            theme={prefs.theme}
            onClose={() => setShowHelp(false)}
          />
        )}
      </Suspense>
    </>
  )
}
