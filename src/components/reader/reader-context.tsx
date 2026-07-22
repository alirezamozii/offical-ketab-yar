'use client'

/**
 * Reader context — split into multiple slice contexts so consumers can
 * subscribe to only the slice they need (audit 03 §4.1 "single Context
 * anti-pattern").
 *
 * Previously this was one Context carrying the entire ~70-field return
 * object of `useReaderState`. Because that object was recreated every
 * render, every consumer (Toolbar, Content, BottomBar, Overlays) re-rendered
 * on every `scrollPercent` tick — even ones that only read, say,
 * `showSettings`. This file splits the bag into 6 memoized slice contexts:
 *
 *   • ReaderScrollContext        — scroll position, paragraph, page-derived
 *   • ReaderPanelsContext        — panel visibility + focus mode
 *   • ReaderSelectionContext     — text-selection menu + share + vocab
 *   • ReaderHighlightsContext    — highlights + bookmarks
 *   • ReaderChatContext          — AI chat panel visibility
 *   • ReaderDictionaryContext    — dictionary popup state
 *   • ReaderCoreContext          — book + prefs + theme + session + chromeVisible
 *
 * Each slice's value is memoized with `useMemo` keyed on its own fields,
 * so e.g. toggling `showSettings` only invalidates the Panels slice; the
 * Scroll slice stays referentially stable and its consumers don't re-render.
 *
 * The legacy `useReader()` hook still works — it reads from all 7 slices
 * and reconstructs the full bag. This is the SAME behaviour as before for
 * any consumer that hasn't been migrated to a slice hook yet (i.e. all
 * current consumers). The new slice hooks (`useReaderScroll()`,
 * `useReaderPanels()`, etc.) are available for future migration — when a
 * consumer switches to `useReaderPanels()`, it stops re-rendering on
 * `scrollPercent` changes.
 *
 * IMPORTANT: this file is the only place outside `src/hooks/reader/` that
 * the R2-H refactor touches. The full-bag `useReader()` hook is preserved
 * verbatim so `reader-toolbar.tsx`, `reader-content.tsx`,
 * `reader-bottom-bar.tsx`, `reader-overlays.tsx`,
 * `professional-reader.tsx`, `reader-audio-controls.tsx`, and
 * `audio-player-bar.tsx` keep working without changes.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { useReaderState } from '@/hooks/reader/use-reader-state'

/** The full bag of state + handlers produced by `useReaderState`. */
export type ReaderState = ReturnType<typeof useReaderState>

// ---------------------------------------------------------------------------
// Slice types — pick the fields each slice owns. Picking (rather than
// re-declaring) keeps the slice types in sync with the god-hook's return
// shape automatically.
// ---------------------------------------------------------------------------

export type ReaderScrollSlice = Pick<
  ReaderState,
  | 'scrollRef'
  | 'paragraphRefs'
  | 'currentParagraph'
  | 'scrollPercent'
  | 'displayPercent'
  | 'remainingParagraphs'
  | 'remainingMinutes'
  | 'isLastPage'
  | 'showPositionChip'
  | 'isMobile'
  | 'scrollToParagraph'
  | 'handleScroll'
  | 'pageDown'
  | 'pageUp'
>

export type ReaderPanelsSlice = Pick<
  ReaderState,
  | 'showControls'
  | 'setShowControls'
  | 'showSettings'
  | 'setShowSettings'
  | 'showHighlights'
  | 'setShowHighlights'
  | 'showChapters'
  | 'setShowChapters'
  | 'isFocusMode'
  | 'setIsFocusMode'
  | 'showFocusHint'
  | 'toggleFocusMode'
  | 'chromeVisible'
>

export type ReaderSelectionSlice = Pick<
  ReaderState,
  | 'selectedText'
  | 'showTextMenu'
  | 'setShowTextMenu'
  | 'menuPosition'
  | 'handleTextSelection'
  | 'handleShowDictionary'
  | 'handleAddToVocab'
  | 'handleCopy'
  | 'handleShare'
  | 'currentParagraphPlainText'
>

export type ReaderHighlightsSlice = Pick<
  ReaderState,
  | 'highlights'
  | 'pageHlCount'
  | 'addHighlight'
  | 'removeHighlight'
  | 'setHighlightNote'
  | 'clearAllHighlights'
  | 'editingHighlightId'
  | 'setEditingHighlightId'
  | 'bookmarks'
  | 'isParagraphBookmarked'
  | 'toggleBookmark'
  | 'removeBookmark'
>

export type ReaderChatSlice = Pick<
  ReaderState,
  'showChat' | 'setShowChat'
>

export type ReaderDictionarySlice = Pick<
  ReaderState,
  'showDictionary' | 'setShowDictionary' | 'dictionaryWord'
>

export type ReaderCoreSlice = Pick<
  ReaderState,
  | 'book'
  | 'prefs'
  | 'update'
  | 'currentLanguage'
  | 'themeStyle'
  | 'totalPages'
  | 'sessionSeconds'
  | 'sessionMinutes'
  | 'columnMaxWidth'
  | 'marginStyle'
  | 'snapClass'
  | 'fontFamilyCss'
  | 'cycleTheme'
  | 'increaseFontSize'
  | 'decreaseFontSize'
  | 'autoScrollActive'
  | 'autoScrollRemaining'
  | 'toggleAutoScroll'
  | 'showHelp'
  | 'setShowHelp'
>

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------

const ReaderScrollContext = createContext<ReaderScrollSlice | null>(null)
const ReaderPanelsContext = createContext<ReaderPanelsSlice | null>(null)
const ReaderSelectionContext = createContext<ReaderSelectionSlice | null>(null)
const ReaderHighlightsContext = createContext<ReaderHighlightsSlice | null>(null)
const ReaderChatContext = createContext<ReaderChatSlice | null>(null)
const ReaderDictionaryContext = createContext<ReaderDictionarySlice | null>(null)
const ReaderCoreContext = createContext<ReaderCoreSlice | null>(null)

// ---------------------------------------------------------------------------
// Provider — splits the bag into memoized slice values, then nests the
// providers. Outermost = most-frequently-changing slice so inner
// components can bail out of re-renders earlier. (In practice the
// ordering doesn't affect correctness — `useContext` only triggers a
// re-render when the consumed slice's value identity changes — but it's
// idiomatic to put the noisiest slice outermost.)
// ---------------------------------------------------------------------------

export function ReaderProvider({
  value,
  children,
}: {
  value: ReaderState
  children: ReactNode
}) {
  // Noisiest first (changes on every scroll tick).
  const scrollSlice = useMemo<ReaderScrollSlice>(
    () => ({
      scrollRef: value.scrollRef,
      paragraphRefs: value.paragraphRefs,
      currentParagraph: value.currentParagraph,
      scrollPercent: value.scrollPercent,
      displayPercent: value.displayPercent,
      remainingParagraphs: value.remainingParagraphs,
      remainingMinutes: value.remainingMinutes,
      isLastPage: value.isLastPage,
      showPositionChip: value.showPositionChip,
      isMobile: value.isMobile,
      scrollToParagraph: value.scrollToParagraph,
      handleScroll: value.handleScroll,
      pageDown: value.pageDown,
      pageUp: value.pageUp,
    }),
    [
      value.scrollRef,
      value.paragraphRefs,
      value.currentParagraph,
      value.scrollPercent,
      value.displayPercent,
      value.remainingParagraphs,
      value.remainingMinutes,
      value.isLastPage,
      value.showPositionChip,
      value.isMobile,
      value.scrollToParagraph,
      value.handleScroll,
      value.pageDown,
      value.pageUp,
    ],
  )

  const selectionSlice = useMemo<ReaderSelectionSlice>(
    () => ({
      selectedText: value.selectedText,
      showTextMenu: value.showTextMenu,
      setShowTextMenu: value.setShowTextMenu,
      menuPosition: value.menuPosition,
      handleTextSelection: value.handleTextSelection,
      handleShowDictionary: value.handleShowDictionary,
      handleAddToVocab: value.handleAddToVocab,
      handleCopy: value.handleCopy,
      handleShare: value.handleShare,
      currentParagraphPlainText: value.currentParagraphPlainText,
    }),
    [
      value.selectedText,
      value.showTextMenu,
      value.setShowTextMenu,
      value.menuPosition,
      value.handleTextSelection,
      value.handleShowDictionary,
      value.handleAddToVocab,
      value.handleCopy,
      value.handleShare,
      value.currentParagraphPlainText,
    ],
  )

  const panelsSlice = useMemo<ReaderPanelsSlice>(
    () => ({
      showControls: value.showControls,
      setShowControls: value.setShowControls,
      showSettings: value.showSettings,
      setShowSettings: value.setShowSettings,
      showHighlights: value.showHighlights,
      setShowHighlights: value.setShowHighlights,
      showChapters: value.showChapters,
      setShowChapters: value.setShowChapters,
      isFocusMode: value.isFocusMode,
      setIsFocusMode: value.setIsFocusMode,
      showFocusHint: value.showFocusHint,
      toggleFocusMode: value.toggleFocusMode,
      chromeVisible: value.chromeVisible,
    }),
    [
      value.showControls,
      value.setShowControls,
      value.showSettings,
      value.setShowSettings,
      value.showHighlights,
      value.setShowHighlights,
      value.showChapters,
      value.setShowChapters,
      value.isFocusMode,
      value.setIsFocusMode,
      value.showFocusHint,
      value.toggleFocusMode,
      value.chromeVisible,
    ],
  )

  const highlightsSlice = useMemo<ReaderHighlightsSlice>(
    () => ({
      highlights: value.highlights,
      pageHlCount: value.pageHlCount,
      addHighlight: value.addHighlight,
      removeHighlight: value.removeHighlight,
      setHighlightNote: value.setHighlightNote,
      clearAllHighlights: value.clearAllHighlights,
      editingHighlightId: value.editingHighlightId,
      setEditingHighlightId: value.setEditingHighlightId,
      bookmarks: value.bookmarks,
      isParagraphBookmarked: value.isParagraphBookmarked,
      toggleBookmark: value.toggleBookmark,
      removeBookmark: value.removeBookmark,
    }),
    [
      value.highlights,
      value.pageHlCount,
      value.addHighlight,
      value.removeHighlight,
      value.setHighlightNote,
      value.clearAllHighlights,
      value.editingHighlightId,
      value.setEditingHighlightId,
      value.bookmarks,
      value.isParagraphBookmarked,
      value.toggleBookmark,
      value.removeBookmark,
    ],
  )

  const chatSlice = useMemo<ReaderChatSlice>(
    () => ({
      showChat: value.showChat,
      setShowChat: value.setShowChat,
    }),
    [value.showChat, value.setShowChat],
  )

  const dictionarySlice = useMemo<ReaderDictionarySlice>(
    () => ({
      showDictionary: value.showDictionary,
      setShowDictionary: value.setShowDictionary,
      dictionaryWord: value.dictionaryWord,
    }),
    [value.showDictionary, value.setShowDictionary, value.dictionaryWord],
  )

  const coreSlice = useMemo<ReaderCoreSlice>(
    () => ({
      book: value.book,
      prefs: value.prefs,
      update: value.update,
      currentLanguage: value.currentLanguage,
      themeStyle: value.themeStyle,
      totalPages: value.totalPages,
      sessionSeconds: value.sessionSeconds,
      sessionMinutes: value.sessionMinutes,
      columnMaxWidth: value.columnMaxWidth,
      marginStyle: value.marginStyle,
      snapClass: value.snapClass,
      fontFamilyCss: value.fontFamilyCss,
      cycleTheme: value.cycleTheme,
      increaseFontSize: value.increaseFontSize,
      decreaseFontSize: value.decreaseFontSize,
      autoScrollActive: value.autoScrollActive,
      autoScrollRemaining: value.autoScrollRemaining,
      toggleAutoScroll: value.toggleAutoScroll,
      showHelp: value.showHelp,
      setShowHelp: value.setShowHelp,
    }),
    [
      value.book,
      value.prefs,
      value.update,
      value.currentLanguage,
      value.themeStyle,
      value.totalPages,
      value.sessionSeconds,
      value.sessionMinutes,
      value.columnMaxWidth,
      value.marginStyle,
      value.snapClass,
      value.fontFamilyCss,
      value.cycleTheme,
      value.increaseFontSize,
      value.decreaseFontSize,
      value.autoScrollActive,
      value.autoScrollRemaining,
      value.toggleAutoScroll,
      value.showHelp,
      value.setShowHelp,
    ],
  )

  return (
    <ReaderCoreContext.Provider value={coreSlice}>
      <ReaderScrollContext.Provider value={scrollSlice}>
        <ReaderSelectionContext.Provider value={selectionSlice}>
          <ReaderPanelsContext.Provider value={panelsSlice}>
            <ReaderHighlightsContext.Provider value={highlightsSlice}>
              <ReaderChatContext.Provider value={chatSlice}>
                <ReaderDictionaryContext.Provider value={dictionarySlice}>
                  {children}
                </ReaderDictionaryContext.Provider>
              </ReaderChatContext.Provider>
            </ReaderHighlightsContext.Provider>
          </ReaderPanelsContext.Provider>
        </ReaderSelectionContext.Provider>
      </ReaderScrollContext.Provider>
    </ReaderCoreContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Slice hooks — opt-in finer-grained subscriptions. Future migration: a
// consumer that only reads `currentParagraph` can switch from
// `useReader()` to `useReaderScroll()` and stop re-rendering on
// `showSettings` toggles.
// ---------------------------------------------------------------------------

export function useReaderScrollSlice(): ReaderScrollSlice {
  const ctx = useContext(ReaderScrollContext)
  if (!ctx) {
    throw new Error('useReaderScrollSlice must be used within a ReaderProvider')
  }
  return ctx
}

export function useReaderPanelsSlice(): ReaderPanelsSlice {
  const ctx = useContext(ReaderPanelsContext)
  if (!ctx) {
    throw new Error('useReaderPanelsSlice must be used within a ReaderProvider')
  }
  return ctx
}

export function useReaderSelectionSlice(): ReaderSelectionSlice {
  const ctx = useContext(ReaderSelectionContext)
  if (!ctx) {
    throw new Error('useReaderSelectionSlice must be used within a ReaderProvider')
  }
  return ctx
}

export function useReaderHighlightsSlice(): ReaderHighlightsSlice {
  const ctx = useContext(ReaderHighlightsContext)
  if (!ctx) {
    throw new Error('useReaderHighlightsSlice must be used within a ReaderProvider')
  }
  return ctx
}

export function useReaderChatSlice(): ReaderChatSlice {
  const ctx = useContext(ReaderChatContext)
  if (!ctx) {
    throw new Error('useReaderChatSlice must be used within a ReaderProvider')
  }
  return ctx
}

export function useReaderDictionarySlice(): ReaderDictionarySlice {
  const ctx = useContext(ReaderDictionaryContext)
  if (!ctx) {
    throw new Error('useReaderDictionarySlice must be used within a ReaderProvider')
  }
  return ctx
}

export function useReaderCoreSlice(): ReaderCoreSlice {
  const ctx = useContext(ReaderCoreContext)
  if (!ctx) {
    throw new Error('useReaderCoreSlice must be used within a ReaderProvider')
  }
  return ctx
}

// ---------------------------------------------------------------------------
// Legacy full-bag hook — reconstructs the god-hook's return object by
// reading from all 7 slice contexts. Consumers that haven't been migrated
// to a slice hook keep using this. They re-render on every state change
// (same as before the refactor) — but the slice infrastructure is now in
// place for incremental migration.
//
// Reading 7 contexts in one hook is by design: it preserves the exact
// pre-refactor behaviour for unmigrated consumers.
// ---------------------------------------------------------------------------

export function useReader(): ReaderState {
  const core = useContext(ReaderCoreContext)
  const scroll = useContext(ReaderScrollContext)
  const selection = useContext(ReaderSelectionContext)
  const panels = useContext(ReaderPanelsContext)
  const highlights = useContext(ReaderHighlightsContext)
  const chat = useContext(ReaderChatContext)
  const dictionary = useContext(ReaderDictionaryContext)
  if (
    !core ||
    !scroll ||
    !selection ||
    !panels ||
    !highlights ||
    !chat ||
    !dictionary
  ) {
    throw new Error('useReader must be used within a ReaderProvider')
  }
  return {
    ...core,
    ...scroll,
    ...selection,
    ...panels,
    ...highlights,
    ...chat,
    ...dictionary,
  } as ReaderState
}
