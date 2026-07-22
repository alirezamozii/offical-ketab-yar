'use client'

import { AIChatPanel } from '@/components/reader/ai-chat-panel'
import { ChaptersPanel } from '@/components/reader/chapters-panel'
import { HighlightsPanel } from '@/components/reader/highlights-panel'
import { SettingsPanel } from '@/components/reader/settings-panel'
import { ShortcutsHelpOverlay } from '@/components/reader/shortcuts-help-overlay'
import { TextSelectionMenu } from '@/components/reader/text-selection-menu'
import { WordPopupDictionary } from '@/components/reader/word-popup-dictionary'
import { ErrorBoundary } from '@/components/error-boundary'
import { useReader } from '@/components/reader/reader-context'
import { AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useEffect } from 'react'

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
      <AnimatePresence>
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
      </AnimatePresence>

      {/* ---- Word popup dictionary (centered modal — Radix Dialog) ---- */}
      <ErrorBoundary>
        <WordPopupDictionary
          open={showDictionary}
          word={dictionaryWord}
          context={currentParagraphPlainText().slice(0, 200)}
          theme={prefs.theme}
          bookSlug={book.slug}
          onClose={() => setShowDictionary(false)}
        />
      </ErrorBoundary>

      <ErrorBoundary>
        <SettingsPanel
          prefs={prefs}
          onChange={update}
          theme={prefs.theme}
          open={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </ErrorBoundary>

      <ErrorBoundary>
        <ChaptersPanel
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
        />
      </ErrorBoundary>

      <ErrorBoundary>
        <HighlightsPanel
          highlights={highlights}
          currentPage={currentParagraph}
          theme={prefs.theme}
          editingHighlightId={editingHighlightId}
          onEditNote={setEditingHighlightId}
          onSaveNote={setHighlightNote}
          open={showHighlights}
          onClose={() => setShowHighlights(false)}
          onDelete={removeHighlight}
          onClearAll={clearAllHighlights}
          onCopy={(t) => {
            navigator.clipboard.writeText(t)
            toast.success('کپی شد')
          }}
          onJumpToPage={(p) => {
            scrollToParagraph(p)
            setShowHighlights(false)
          }}
        />
      </ErrorBoundary>

      <ErrorBoundary>
        <AIChatPanel
          bookTitle={book.title}
          bookAuthor={book.author}
          bookSlug={book.slug}
          bookContext={currentParagraphPlainText()}
          selectedText={selectedText}
          theme={prefs.theme}
          isMobile={isMobile}
          open={showChat}
          onClose={() => setShowChat(false)}
        />
      </ErrorBoundary>

      {/* ---- Shortcuts help overlay (? key) ---- */}
      <AnimatePresence>
        {showHelp && (
          <ShortcutsHelpOverlay
            theme={prefs.theme}
            onClose={() => setShowHelp(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
