'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, X, Sparkles, History, List, ChevronLeft, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  DrawerHandle,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  THEME_STYLES,
  toPersianDigits,
  type ReaderBook,
  type ReaderTheme,
} from '@/lib/reader/types';

export interface BookSearchDialogProps {
  book: ReaderBook;
  theme: ReaderTheme;
  isMobile: boolean;
  open: boolean;
  onClose: () => void;
  onJumpToPage: (pageIndex: number) => void;
  initialQuery?: string;
}

interface SearchSegment {
  text: string;
  match: boolean;
}

export interface BookSearchHit {
  pageIndex: number;
  pageNumber: number;
  chapterTitle?: string;
  chapterTitleFa?: string;
  matchType: 'english' | 'farsi' | 'both';
  englishSnippet: string;
  farsiSnippet: string;
  englishSegments: SearchSegment[];
  farsiSegments: SearchSegment[];
  isHeading: boolean;
}

type SearchFilter = 'all' | 'english' | 'farsi';

/**
 * Normalizes Persian characters for search parity (Arabic yeh/kaf -> Persian).
 */
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove arabic tashkeel/diacritics
    .replace(/\u200C/g, ' ') // half-space -> space
    .replace(/[يی]/g, 'ی')
    .replace(/[كک]/g, 'ک')
    .replace(/[ۀه]/g, 'ه')
    .replace(/[آا]/g, 'ا');
}

/**
 * Extracts a snippet around a matched substring with highlighted segments.
 */
export function extractSnippetAndSegments(
  originalText: string,
  rawQuery: string,
  maxLength = 110,
): { snippet: string; segments: SearchSegment[] } {
  if (!originalText || !rawQuery) {
    return {
      snippet: originalText.slice(0, maxLength),
      segments: [{ text: originalText.slice(0, maxLength), match: false }],
    };
  }

  const normText = normalizeForSearch(originalText);
  const normQuery = normalizeForSearch(rawQuery);
  const matchIndex = normText.indexOf(normQuery);

  if (matchIndex === -1) {
    const truncated =
      originalText.length > maxLength ? `${originalText.slice(0, maxLength)}…` : originalText;
    return {
      snippet: truncated,
      segments: [{ text: truncated, match: false }],
    };
  }

  // Calculate snippet window
  const queryLen = rawQuery.length;
  const halfWindow = Math.floor((maxLength - queryLen) / 2);
  let start = Math.max(0, matchIndex - halfWindow);
  let end = Math.min(originalText.length, matchIndex + queryLen + halfWindow);

  // Adjust to nearest whitespace boundary if possible
  if (start > 0) {
    const spaceBefore = originalText.indexOf(' ', start);
    if (spaceBefore !== -1 && spaceBefore < matchIndex) {
      start = spaceBefore + 1;
    }
  }
  if (end < originalText.length) {
    const spaceAfter = originalText.lastIndexOf(' ', end);
    if (spaceAfter !== -1 && spaceAfter > matchIndex + queryLen) {
      end = spaceAfter;
    }
  }

  const prefix = start > 0 ? '…' : '';
  const suffix = end < originalText.length ? '…' : '';

  const beforeText = prefix + originalText.slice(start, matchIndex);
  const matchedText = originalText.slice(matchIndex, matchIndex + queryLen);
  const afterText = originalText.slice(matchIndex + queryLen, end) + suffix;

  const segments: SearchSegment[] = [];
  if (beforeText) segments.push({ text: beforeText, match: false });
  segments.push({ text: matchedText, match: true });
  if (afterText) segments.push({ text: afterText, match: false });

  return {
    snippet: beforeText + matchedText + afterText,
    segments,
  };
}

export function BookSearchDialog({
  book,
  theme,
  isMobile,
  open,
  onClose,
  onJumpToPage,
  initialQuery = '',
}: BookSearchDialogProps) {
  const s = THEME_STYLES[theme];
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Persistent search history key per book
  const storageKey = `ky_book_search_${book.slug}`;

  // Load recent searches on mount / open
  useEffect(() => {
    if (open) {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setRecentSearches(parsed.slice(0, 6));
        }
      } catch {
        /* ignore */
      }
      // Focus input with slight delay to accommodate transition
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, storageKey]);

  // Save to recent searches
  const saveRecentSearch = useCallback(
    (term: string) => {
      const clean = term.trim();
      if (!clean || clean.length < 2) return;
      try {
        const next = [clean, ...recentSearches.filter((q) => q !== clean)].slice(0, 6);
        setRecentSearches(next);
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [recentSearches, storageKey],
  );

  const clearRecentSearches = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setRecentSearches([]);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  // Pre-index pages with chapter metadata
  const indexedPages = useMemo(() => {
    const chapters = book.chapters || [];
    return book.pages.map((p, pageIndex) => {
      const pageNum = p.pageNumber || pageIndex + 1;
      // Find chapter containing this page
      const ch = [...chapters].reverse().find((c) => (c.startPage ?? 1) <= pageNum);

      const fullEnglish = p.items.map((i) => i.english).join('\n');
      const fullFarsi = p.items.map((i) => i.farsi || '').join('\n');
      const isHeading = p.items.some((i) => i.type === 'heading');

      return {
        pageIndex,
        pageNumber: pageNum,
        chapterTitle: ch?.title,
        chapterTitleFa: ch?.titleFa,
        english: fullEnglish,
        farsi: fullFarsi,
        isHeading,
      };
    });
  }, [book]);

  // Execute instant client-side search across this book's text
  const searchResults = useMemo<BookSearchHit[]>(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return [];

    const normQ = normalizeForSearch(trimmed);
    const hits: BookSearchHit[] = [];

    for (const item of indexedPages) {
      const normEn = normalizeForSearch(item.english);
      const normFa = normalizeForSearch(item.farsi);

      const matchEn = normEn.includes(normQ);
      const matchFa = normFa.includes(normQ);

      if (!matchEn && !matchFa) continue;

      if (filter === 'english' && !matchEn) continue;
      if (filter === 'farsi' && !matchFa) continue;

      const matchType: 'english' | 'farsi' | 'both' =
        matchEn && matchFa ? 'both' : matchEn ? 'english' : 'farsi';

      const enData = extractSnippetAndSegments(item.english, trimmed);
      const faData = extractSnippetAndSegments(item.farsi, trimmed);

      hits.push({
        pageIndex: item.pageIndex,
        pageNumber: item.pageNumber,
        chapterTitle: item.chapterTitle,
        chapterTitleFa: item.chapterTitleFa,
        matchType,
        englishSnippet: enData.snippet,
        farsiSnippet: faData.snippet,
        englishSegments: enData.segments,
        farsiSegments: faData.segments,
        isHeading: item.isHeading,
      });
    }

    // Rank: headings first, then sequential by page
    return hits.sort((a, b) => {
      if (a.isHeading && !b.isHeading) return -1;
      if (!a.isHeading && b.isHeading) return 1;
      return a.pageIndex - b.pageIndex;
    });
  }, [query, filter, indexedPages]);

  // Reset selected index on results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  // Handle jump
  const handleSelectHit = useCallback(
    (hit: BookSearchHit) => {
      saveRecentSearch(query);
      onJumpToPage(hit.pageIndex);
      onClose();
    },
    [onJumpToPage, onClose, query, saveRecentSearch],
  );

  // Keyboard navigation inside search results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        searchResults.length > 0 ? (prev + 1) % searchResults.length : 0,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        searchResults.length > 0 ? (prev - 1 + searchResults.length) % searchResults.length : 0,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        handleSelectHit(searchResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Suggested keywords based on chapters / book metadata
  const suggestedChips = useMemo(() => {
    const list: string[] = [];
    if (book.chapters && book.chapters.length > 0) {
      for (const ch of book.chapters.slice(0, 4)) {
        if (ch.titleFa) list.push(ch.titleFa);
        else if (ch.title) list.push(ch.title);
      }
    }
    // Extract title words
    const titleWords = book.title.split(/\s+/).filter((w) => w.length > 3);
    list.push(...titleWords.slice(0, 2));
    return Array.from(new Set(list)).slice(0, 6);
  }, [book]);

  // Render Highlighted Segment
  const renderSegments = (segments: SearchSegment[]) => {
    return segments.map((seg, idx) =>
      seg.match ? (
        <mark
          key={idx}
          className="rounded px-1 font-bold text-amber-950 dark:text-amber-100 bg-amber-400/35 dark:bg-amber-400/30 ring-1 ring-amber-500/30"
        >
          {seg.text}
        </mark>
      ) : (
        <span key={idx}>{seg.text}</span>
      ),
    );
  };

  // Inner Content for both Dialog (Desktop) and Drawer (Mobile)
  const searchContent = (
    <div
      className="flex flex-col h-full max-h-[85vh] sm:max-h-[78vh] overflow-hidden"
      onKeyDown={handleKeyDown}
      style={{ color: s.text }}
    >
      {/* Top Search Input Bar */}
      <div
        className="relative flex items-center border-b px-4 py-3 shrink-0"
        style={{ borderColor: s.border }}
      >
        <Search
          className="h-5 w-5 shrink-0 opacity-60 me-3"
          style={{ color: s.accent }}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`جستجو در متن «${book.title}» (انگلیسی یا فارسی)...`}
          aria-label="جستجو در متن این کتاب"
          dir="auto"
          className="flex-1 bg-transparent text-sm sm:text-base outline-none placeholder:text-muted-foreground placeholder:text-xs sm:placeholder:text-sm font-medium"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity me-2"
            aria-label="پاک کردن متن جستجو"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 opacity-70 hover:opacity-100 transition-opacity hover:bg-black/5 dark:hover:bg-white/5"
          aria-label="بستن"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Filter Chips + Status Row */}
      <div
        className="flex items-center justify-between border-b px-4 py-2 shrink-0 text-xs gap-2 overflow-x-auto"
        style={{ borderColor: s.border, background: `${s.bg}ee` }}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] opacity-60 font-medium">فیلتر:</span>
          {(
            [
              { id: 'all', label: 'همه' },
              { id: 'english', label: 'فقط انگلیسی' },
              { id: 'farsi', label: 'فقط ترجمه فارسی' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors border',
                filter === item.id
                  ? 'border-transparent font-bold'
                  : 'border-transparent opacity-70 hover:opacity-100',
              )}
              style={
                filter === item.id
                  ? { background: `${s.accent}22`, color: s.accent }
                  : { background: `${s.text}0a`, borderColor: `${s.border}` }
              }
            >
              {item.label}
            </button>
          ))}
        </div>

        {query.trim().length >= 2 && (
          <div className="shrink-0 text-[11px] font-semibold text-muted-foreground">
            {searchResults.length > 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {toPersianDigits(searchResults.length)} نتیجه یافت شد
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">موردی یافت نشد</span>
            )}
          </div>
        )}
      </div>

      {/* Main Body: Suggestions or Results List */}
      <div
        ref={resultsContainerRef}
        className="flex-1 overflow-y-auto scroll-brand p-3 sm:p-4 space-y-2.5"
      >
        {/* State A: Query is empty — show suggestions & history */}
        {query.trim().length < 2 && (
          <div className="space-y-5 py-2">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span className="flex items-center gap-1.5 font-bold">
                    <History className="h-3.5 w-3.5" style={{ color: s.accent }} />
                    جستجوهای اخیر در این کتاب
                  </span>
                  <button
                    type="button"
                    onClick={clearRecentSearches}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/80 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    پاک کردن
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        setQuery(term);
                        inputRef.current?.focus();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all hover:scale-105"
                      style={{
                        borderColor: s.border,
                        background: `${s.accent}0d`,
                      }}
                    >
                      <History className="h-3 w-3 opacity-60" />
                      <span dir="auto">{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Book Chips */}
            {suggestedChips.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-muted-foreground px-1 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" style={{ color: s.accent }} />
                  پیشنهادهای مطالعه این اثر
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setQuery(chip);
                        inputRef.current?.focus();
                      }}
                      className="rounded-xl border px-3 py-1.5 text-xs font-medium transition-all hover:border-gold-500 hover:scale-105"
                      style={{
                        borderColor: s.border,
                        background: `${s.text}05`,
                      }}
                    >
                      <span>{chip}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chapters Fast Jump */}
            {book.chapters && book.chapters.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-muted-foreground px-1 flex items-center gap-1.5">
                  <List className="h-3.5 w-3.5" style={{ color: s.accent }} />
                  پرش سریع به فصل‌ها
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {book.chapters.map((ch, idx) => (
                    <button
                      key={ch.id || idx}
                      type="button"
                      onClick={() => {
                        onJumpToPage(Math.max(0, (ch.startPage ?? 1) - 1));
                        onClose();
                      }}
                      className="flex items-center justify-between rounded-xl border p-2.5 text-xs text-start transition-all hover:border-gold-500 hover:shadow-sm"
                      style={{
                        borderColor: s.border,
                        background: `${s.text}04`,
                      }}
                    >
                      <div className="min-w-0 flex-1 pe-2">
                        <p className="font-bold truncate" dir="auto">
                          {ch.titleFa || ch.title}
                        </p>
                        {ch.titleFa && ch.title && (
                          <p className="text-[10px] text-muted-foreground truncate" dir="ltr">
                            {ch.title}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0 font-mono">
                        ص {toPersianDigits(ch.startPage ?? idx + 1)}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* State B: Results list */}
        {query.trim().length >= 2 && searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((hit, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={`${hit.pageIndex}-${index}`}
                  onClick={() => handleSelectHit(hit)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSelectHit(hit);
                  }}
                  className={cn(
                    'group relative rounded-2xl border p-3 sm:p-4 text-start cursor-pointer transition-all duration-200 outline-none',
                    isSelected
                      ? 'shadow-md -translate-y-0.5'
                      : 'hover:border-gold-500/50 hover:bg-black/5 dark:hover:bg-white/5',
                  )}
                  style={{
                    borderColor: isSelected ? s.accent : s.border,
                    background: isSelected ? `${s.accent}12` : `${s.text}03`,
                  }}
                >
                  {/* Result Header: Chapter & Page badge */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                        style={{
                          background: `${s.accent}20`,
                          color: s.accent,
                        }}
                      >
                        صفحه {toPersianDigits(hit.pageNumber)}
                      </span>
                      {(hit.chapterTitleFa || hit.chapterTitle) && (
                        <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[180px] sm:max-w-xs">
                          {hit.chapterTitleFa || hit.chapterTitle}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {hit.matchType === 'both' ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                        >
                          انگلیسی و فارسی
                        </Badge>
                      ) : hit.matchType === 'english' ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30"
                        >
                          متن انگلیسی
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        >
                          ترجمه فارسی
                        </Badge>
                      )}
                      <ChevronLeft className="h-4 w-4 opacity-40 group-hover:opacity-100 group-hover:-translate-x-0.5 transition-all" />
                    </div>
                  </div>

                  {/* Snippets View */}
                  <div className="space-y-1.5 text-xs sm:text-sm">
                    {/* English excerpt */}
                    <p className="font-serif leading-relaxed text-foreground/90" dir="ltr">
                      {renderSegments(hit.englishSegments)}
                    </p>

                    {/* Farsi counterpart */}
                    <p
                      className="text-[11px] sm:text-xs leading-relaxed text-muted-foreground font-sans pt-1 border-t border-dashed"
                      style={{ borderColor: `${s.border}88` }}
                      dir="rtl"
                    >
                      {renderSegments(hit.farsiSegments)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* State C: No results found */}
        {query.trim().length >= 2 && searchResults.length === 0 && (
          <div className="py-12 text-center space-y-3">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: `${s.accent}15`, color: s.accent }}
            >
              <Search className="h-7 w-7 opacity-75" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm sm:text-base">
                عبارت «{query}» در متن این کتاب یافت نشد
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                املای کلمه را بررسی کنید یا عبارت خلاصه‌تری را به زبان انگلیسی یا فارسی جستجو
                فرمایید.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Shortcuts Help */}
      <div
        className="hidden sm:flex items-center justify-between border-t px-4 py-2.5 text-[11px] text-muted-foreground shrink-0"
        style={{ borderColor: s.border, background: `${s.bg}f5` }}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="rounded border px-1.5 py-0.5 text-[10px] font-mono">↑↓</kbd>
            جابه‌جایی
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border px-1.5 py-0.5 text-[10px] font-mono">Enter</kbd>
            پرش به پاراگراف
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border px-1.5 py-0.5 text-[10px] font-mono">Esc</kbd>
            بستن
          </span>
        </div>
        <div className="font-bold" style={{ color: s.accent }}>
          {book.title}
        </div>
      </div>
    </div>
  );

  // Mobile: Render as Vaul Bottom Drawer for natural thumb gesture UX
  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={(o) => {
          if (!o) onClose();
        }}
      >
        <DrawerContent
          className="gap-0 rounded-t-3xl border-t pb-safe overflow-hidden"
          style={{
            background: s.bg,
            color: s.text,
            borderColor: s.border,
          }}
        >
          <DrawerHandle className="opacity-40" style={{ background: s.accent }} />
          <DrawerTitle className="sr-only">جستجو در متن کتاب {book.title}</DrawerTitle>
          <DrawerDescription className="sr-only">
            جستجوی فوری کلمات و عبارات انگلیسی و ترجمه فارسی در تمامی صفحات این کتاب.
          </DrawerDescription>
          {searchContent}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Render as Spotlight Command Dialog
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent
        className="gap-0 p-0 sm:max-w-2xl rounded-3xl overflow-hidden border-2 shadow-2xl backdrop-blur-xl"
        showCloseButton={false}
        style={{
          background: s.bg,
          color: s.text,
          borderColor: s.border,
        }}
      >
        <DialogTitle className="sr-only">جستجو در متن کتاب {book.title}</DialogTitle>
        <DialogDescription className="sr-only">
          جستجوی فوری کلمات و عبارات انگلیسی و ترجمه فارسی در تمامی صفحات این کتاب.
        </DialogDescription>
        {searchContent}
      </DialogContent>
    </Dialog>
  );
}
