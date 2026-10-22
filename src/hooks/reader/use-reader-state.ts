'use client';

/**
 * useReaderState — thin orchestrator that composes the reader sub-hooks.
 *
 * Previously this was an 836-line god-hook with 20 `useState`s, 13
 * `useEffect`s, 24 `useCallback`s, and 33 responsibilities. Audit 03
 * (§2) detailed the decomposition. Each concern now lives in its own
 * focused hook under `src/hooks/reader/`:
 *
 *   • use-reader-scroll        — IntersectionObserver + scroll progress
 *   • use-reader-selection     — text-selection menu + vocab POST + share
 *   • use-reader-shortcuts     — keyboard shortcut wiring (wraps the
 *                                existing use-reader-keyboard-shortcuts)
 *   • use-reader-chat          — AI chat panel visibility
 *   • use-reader-dictionary    — dictionary popup state + openWithWord
 *   • use-reader-xp            — session timer + streak tick (visibility
 *                                guarded) + paragraph-change XP/progress
 *   • use-reader-highlights    — highlight + bookmark CRUD + DOM spans
 *   • use-reader-panels        — panel visibility + focus mode + search
 *   • use-reader-events        — decoupled event bus (replaces inline
 *                                `toast.*` calls in business logic)
 *   • use-reader-notifications — the one place sonner is called
 *
 * This file composes them and returns the SAME shape as the old
 * god-hook, so `reader-toolbar.tsx`, `reader-content.tsx`,
 * `reader-bottom-bar.tsx`, `reader-overlays.tsx`, and
 * `professional-reader.tsx` keep working without changes.
 */

import { useReadingPreferences } from '@/hooks/reader/use-reading-preferences';
import { useAutoScroll } from '@/hooks/reader/use-auto-scroll';
import { useReaderChat } from '@/hooks/reader/use-reader-chat';
import { useReaderDictionary } from '@/hooks/reader/use-reader-dictionary';
import { useReaderEventBus } from '@/hooks/reader/use-reader-events';
import { useReaderHighlights } from '@/hooks/reader/use-reader-highlights';
import { useReaderNotifications } from '@/hooks/reader/use-reader-notifications';
import { useReaderPanels } from '@/hooks/reader/use-reader-panels';
import { useReaderScroll } from '@/hooks/reader/use-reader-scroll';
import { useReaderSelection } from '@/hooks/reader/use-reader-selection';
import { useReaderShortcuts } from '@/hooks/reader/use-reader-shortcuts';
import { useReaderXp } from '@/hooks/reader/use-reader-xp';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  COLUMN_WIDTH_PX,
  MARGIN_STYLES,
  READER_FONT_FAMILIES,
  THEME_STYLES,
  type ReaderBook,
  type ReaderTheme,
} from '@/lib/reader/types';

const THEME_CYCLE: ReaderTheme[] = ['light', 'sepia', 'dark', 'high-contrast'];

const FONT_SIZE_MIN = 14;
const FONT_SIZE_MAX = 32;
const FONT_SIZE_STEP = 1;

export function useReaderState(book: ReaderBook) {
  const { prefs, update } = useReadingPreferences();

  const totalPages = book.pages.length;
  const themeStyle = THEME_STYLES[prefs.theme];
  const currentLanguage = prefs.language;

  // ---- Event bus (decouples toasts from business logic) ----
  const { lastEntry, emit } = useReaderEventBus();
  useReaderNotifications(lastEntry);

  // ---- Chat + dictionary panels (owned here so selection can open them) ----
  const chat = useReaderChat();
  const dictionary = useReaderDictionary();

  // ---- Scroll + reading-position model ----
  const scroll = useReaderScroll({ book, totalPages });

  // ---- Text selection + share + vocab POST ----
  const selection = useReaderSelection({
    book,
    currentParagraph: scroll.currentParagraph,
    currentLanguage,
    onShowDictionary: (word) => dictionary.openWithWord(word),
    emit,
  });

  // ---- Highlights + bookmarks ----
  const highlights = useReaderHighlights({
    book,
    totalPages,
    currentParagraph: scroll.currentParagraph,
    currentLanguage,
    prefsShowSubtitles: prefs.showSubtitles,
    scrollRef: scroll.scrollRef,
    restoreHighlightsRef: scroll.restoreHighlightsRef,
    selectedText: selection.selectedText,
    selectedRange: selection.selectedRange,
    emit,
  });

  // ---- Panels (focus mode, settings, highlights list, chapters, search) ----
  const panels = useReaderPanels({
    closeChat: chat.closeChat,
    closeDictionary: dictionary.closeDictionary,
    closeTextMenu: selection.closeTextMenu,
  });

  // Auto-open search if URL has ?search=1 or ?q=...
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const { setShowSearch } = panels;
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (params.get('search') === '1' || q) {
      if (q) setSearchInitialQuery(q);
      setShowSearch(true);
    }
  }, [setShowSearch]);

  // ---- XP / streak / session timer ----
  const xp = useReaderXp({
    book,
    totalPages,
    currentParagraph: scroll.currentParagraph,
    scrollPercent: scroll.scrollPercent,
    restoredRef: scroll.restoredRef,
    lastAwardedParagraphRef: scroll.lastAwardedParagraphRef,
    completionAwardedRef: scroll.completionAwardedRef,
  });

  // ---- Theme cycling (Shift+T shortcut + toolbar theme toggle) ----
  const cycleTheme = useCallback(() => {
    const idx = THEME_CYCLE.indexOf(prefs.theme);
    const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    update('theme', next);
  }, [prefs.theme, update]);

  // ---- Font size quick adjust (toolbar A-/A+ and +/- shortcut) ----
  const increaseFontSize = useCallback(() => {
    update('fontSize', Math.min(FONT_SIZE_MAX, prefs.fontSize + FONT_SIZE_STEP));
  }, [prefs.fontSize, update]);
  const decreaseFontSize = useCallback(() => {
    update('fontSize', Math.max(FONT_SIZE_MIN, prefs.fontSize - FONT_SIZE_STEP));
  }, [prefs.fontSize, update]);

  // ---- Keyboard shortcuts ----
  const { showHelp, setShowHelp } = useReaderShortcuts({
    nextParagraph: () =>
      scroll.scrollToParagraph(Math.min(scroll.currentParagraph + 1, totalPages - 1)),
    prevParagraph: () => scroll.scrollToParagraph(Math.max(scroll.currentParagraph - 1, 0)),
    pageDown: scroll.pageDown,
    pageUp: scroll.pageUp,
    jumpToStart: () => scroll.scrollToParagraph(0),
    jumpToEnd: () => scroll.scrollToParagraph(totalPages - 1),
    toggleFocusMode: panels.toggleFocusMode,
    toggleSearch: () => {
      panels.setShowSearch((v) => !v);
      panels.setShowSettings(false);
      panels.setShowHighlights(false);
      panels.setShowChapters(false);
    },
    toggleSettings: () => {
      panels.setShowSettings((v) => !v);
      panels.setShowHighlights(false);
      panels.setShowChapters(false);
      panels.setShowSearch(false);
    },
    toggleHighlights: () => {
      panels.setShowHighlights((v) => !v);
      panels.setShowSettings(false);
      panels.setShowChapters(false);
      panels.setShowSearch(false);
    },
    toggleChapters: () => {
      panels.setShowChapters((v) => !v);
      panels.setShowSettings(false);
      panels.setShowHighlights(false);
      panels.setShowSearch(false);
    },
    toggleSubtitles: () => update('showSubtitles', !prefs.showSubtitles),
    toggleLanguage: () => update('language', currentLanguage === 'english' ? 'farsi' : 'english'),
    toggleDictionary: () => dictionary.setShowDictionary((v) => !v),
    toggleChat: () => chat.setShowChat((v) => !v),
    cycleTheme,
    increaseFontSize,
    decreaseFontSize,
    closeAll: panels.closeAllPanels,
  });

  // ---- Auto-scroll (continuous, smooth) ----
  const onAutoScrollTick = useCallback(() => {
    const el = scroll.scrollRef.current;
    if (!el) return false;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 6;
    if (atBottom) return false;
    el.scrollBy({ top: el.clientHeight * 0.85, behavior: 'smooth' });
    return true;
  }, [scroll.scrollRef]);

  const {
    active: autoScrollActive,
    remaining: autoScrollRemaining,
    toggle: toggleAutoScroll,
    stop: stopAutoScroll,
  } = useAutoScroll({
    intervalSeconds: prefs.autoScrollInterval,
    onTick: onAutoScrollTick,
  });

  // Stop auto-scroll if we've already reached the bottom
  useEffect(() => {
    if (autoScrollActive && scroll.scrollPercent >= 99.5) stopAutoScroll();
  }, [autoScrollActive, scroll.scrollPercent, stopAutoScroll]);

  // ── Reading progress milestones (25% / 50% / 75%) ────────────────────
  const milestoneFired = useRef<Set<number>>(new Set());
  useEffect(() => {
    const pct = scroll.scrollPercent;
    const milestones = [25, 50, 75];
    for (const m of milestones) {
      if (pct >= m && !milestoneFired.current.has(m)) {
        milestoneFired.current.add(m);
        window.dispatchEvent(
          new CustomEvent('ky:reading-milestone', {
            detail: { milestone: m, bookSlug: book.slug, bookTitle: book.title },
          }),
        );
      }
    }
  }, [scroll.scrollPercent, book.slug, book.title]);

  // ---- Derived layout values ----
  const columnMaxWidth = COLUMN_WIDTH_PX[prefs.columnWidth];
  const marginStyle = MARGIN_STYLES[prefs.margin];
  const fontFamilyCss = READER_FONT_FAMILIES[prefs.fontFamily];
  const chromeVisible = panels.chromeVisible;

  return {
    // book + prefs
    book,
    prefs,
    update,
    currentLanguage,
    themeStyle,
    totalPages,
    sessionSeconds: xp.sessionSeconds,
    sessionMinutes: xp.sessionMinutes,
    // UI state
    isMobile: scroll.isMobile,
    showControls: panels.showControls,
    setShowControls: panels.setShowControls,
    showSettings: panels.showSettings,
    setShowSettings: panels.setShowSettings,
    showSearch: panels.showSearch,
    setShowSearch: panels.setShowSearch,
    searchInitialQuery,
    showChat: chat.showChat,
    setShowChat: chat.setShowChat,
    showHighlights: panels.showHighlights,
    setShowHighlights: panels.setShowHighlights,
    showDictionary: dictionary.showDictionary,
    setShowDictionary: dictionary.setShowDictionary,
    showChapters: panels.showChapters,
    setShowChapters: panels.setShowChapters,
    isFocusMode: panels.isFocusMode,
    setIsFocusMode: panels.setIsFocusMode,
    showFocusHint: panels.showFocusHint,
    showPositionChip: scroll.showPositionChip,
    // reading position
    currentParagraph: scroll.currentParagraph,
    scrollPercent: scroll.scrollPercent,
    displayPercent: scroll.displayPercent,
    remainingParagraphs: scroll.remainingParagraphs,
    remainingMinutes: scroll.remainingMinutes,
    isLastPage: scroll.isLastPage,
    mounted: scroll.mounted,
    // derived layout
    columnMaxWidth,
    marginStyle,
    fontFamilyCss,
    chromeVisible,
    // refs
    scrollRef: scroll.scrollRef,
    paragraphRefs: scroll.paragraphRefs,
    // highlights
    highlights: highlights.highlights,
    pageHlCount: highlights.pageHlCount,
    addHighlight: highlights.addHighlight,
    removeHighlight: highlights.removeHighlight,
    setHighlightNote: highlights.setHighlightNote,
    clearAllHighlights: highlights.clearAllHighlights,
    editingHighlightId: highlights.editingHighlightId,
    setEditingHighlightId: highlights.setEditingHighlightId,
    // bookmarks
    bookmarks: highlights.bookmarks,
    isParagraphBookmarked: highlights.isParagraphBookmarked,
    toggleBookmark: highlights.toggleBookmark,
    removeBookmark: highlights.removeBookmark,
    // text selection
    selectedText: selection.selectedText,
    selectedLocation: selection.selectedLocation,
    clearSelection: selection.clearSelection,
    showTextMenu: selection.showTextMenu,
    setShowTextMenu: selection.setShowTextMenu,
    menuPosition: selection.menuPosition,
    dictionaryWord: dictionary.dictionaryWord,
    handleTextSelection: selection.handleTextSelection,
    handleShowDictionary: selection.handleShowDictionary,
    handleAddToVocab: selection.handleAddToVocab,
    handleCopy: selection.handleCopy,
    handleShare: selection.handleShare,
    currentParagraphPlainText: selection.currentParagraphPlainText,
    // navigation
    scrollToParagraph: scroll.scrollToParagraph,
    handleScroll: scroll.handleScroll,
    pageDown: scroll.pageDown,
    pageUp: scroll.pageUp,
    // focus
    toggleFocusMode: panels.toggleFocusMode,
    // theme + font quick controls
    cycleTheme,
    increaseFontSize,
    decreaseFontSize,
    // auto-scroll
    autoScrollActive,
    autoScrollRemaining,
    toggleAutoScroll,
    // help overlay
    showHelp,
    setShowHelp,
  };
}
