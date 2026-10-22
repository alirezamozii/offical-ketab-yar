'use client';

/**
 * use-reader-scroll — owns the continuous-scroll reading-position model.
 *
 * Responsibilities (split out of the god-hook `use-reader-state.ts`):
 *   • The IntersectionObserver that tracks the paragraph currently at the
 *     reading line (~30% from the top of the viewport, below the toolbar).
 *   • The rAF-throttled `handleScroll` that updates `scrollPercent` and
 *     forces the last paragraph to be "current" when the user reaches the
 *     bottom edge (so completion XP + progress hit 100%).
 *   • The debounced scroll-position save into the shared `ky_progress`
 *     localStorage map (via `mergeLocalProgress`).
 *   • The mobile detection (`window.innerWidth < 768`).
 *   • The transient "بخش X از Y" position chip.
 *   • Smooth-scroll-to-paragraph helper used by the keyboard shortcuts and
 *     the bottom-bar slider.
 *   • Restore on first mount: reads the saved `currentPage` from
 *     `ky_progress` and scrolls to it. Owns `restoredRef` and
 *     `lastAwardedParagraphRef` (consumed by `use-reader-xp.ts`) so XP
 *     isn't double-awarded for the resume paragraph.
 *
 * Refs are owned here and shared with the other sub-hooks via the return
 * value — `restoredRef`, `lastAwardedParagraphRef`, `completionAwardedRef`
 * are read by `use-reader-xp.ts`; `restoreHighlightsRef` is owned by
 * `use-reader-highlights.ts` and passed in here so the scroll handler can
 * schedule a debounced re-restoration of the wrapping spans after each
 * scroll tick.
 */

import { getLocalProgress, mergeLocalProgress } from '@/hooks/reader/use-local-progress';
import { getStorageKey } from '@/lib/storage-keys';
import { calculateReadingPercent } from '@/lib/reader/progress';
import { estimateReadingMinutes, type ReaderBook } from '@/lib/reader/types';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from 'react';

interface UseReaderScrollOptions {
  book: ReaderBook;
  /** Total pages — equals `book.pages.length`. Passed in to avoid recomputation. */
  totalPages: number;
}

interface UseReaderScrollReturn {
  scrollRef: RefObject<HTMLDivElement | null>;
  paragraphRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  /** Ref the highlights hook keeps in sync with its latest `restoreHighlights`
   *  fn — the scroll handler reads this on a 350ms debounce so wrapping
   *  spans survive re-renders / future paragraph virtualization. Owned here,
   *  written by `use-reader-highlights.ts`. */
  restoreHighlightsRef: MutableRefObject<() => void>;
  currentParagraph: number;
  setCurrentParagraph: React.Dispatch<React.SetStateAction<number>>;
  scrollPercent: number;
  showPositionChip: boolean;
  isMobile: boolean;
  scrollToParagraph: (idx: number, behavior?: ScrollBehavior) => void;
  handleScroll: () => void;
  pageDown: () => void;
  pageUp: () => void;
  displayPercent: number;
  remainingParagraphs: number;
  remainingMinutes: number;
  isLastPage: boolean;
  /** Whether the component has completed client hydration. */
  mounted: boolean;
  /** Set to true once the saved scroll position has been restored (avoids XP-on-resume). */
  restoredRef: MutableRefObject<boolean>;
  /** Highest paragraph index we've already awarded XP for. */
  lastAwardedParagraphRef: MutableRefObject<number>;
  /** Whether the completion bonus has already been awarded for this book. */
  completionAwardedRef: MutableRefObject<boolean>;
}

export function useReaderScroll({
  book,
  totalPages,
}: UseReaderScrollOptions): UseReaderScrollReturn {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Client progress is hydrated in useEffect to guarantee 100% matched SSR hydration
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [showPositionChip, setShowPositionChip] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const paragraphRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Ref the highlights hook keeps in sync with its latest restoreHighlights
  // fn — read by the scroll handler on a 350ms debounce.
  const restoreHighlightsRef = useRef<() => void>(() => {});
  const rafRef = useRef<number | null>(null);
  const restoredRef = useRef(false);
  const lastAwardedParagraphRef = useRef<number>(-1);
  const completionAwardedRef = useRef<boolean>(false);
  // Debounce timer for scroll-triggered highlight restoration.
  const hlRestoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Smooth-scroll to a given paragraph ----
  const scrollToParagraph = useCallback((idx: number, behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current;
    const node = paragraphRefs.current[idx];
    if (!el || !node) return;
    const nodeRect = node.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const targetTop = el.scrollTop + (nodeRect.top - elRect.top) - 80;
    el.scrollTo({ top: Math.max(0, targetTop), behavior });
  }, []);

  // ---- Load saved state + restore scroll ----
  // Reads the saved `currentPage` + `scrollPercent` + `scrollTop` from `ky_progress`.
  // Guarantees layout & fonts are settled before marking restored, preventing
  // premature overwrite with 0.
  useEffect(() => {
    if (!book.slug) return;
    let savedPage = 0;
    let savedScrollPercent = 0;
    let savedScrollTop: number | undefined;
    try {
      const entry = getLocalProgress()[book.slug];
      if (
        entry &&
        typeof entry.currentPage === 'number' &&
        entry.currentPage >= 0 &&
        entry.currentPage < totalPages
      ) {
        savedPage = entry.currentPage;
        setCurrentParagraph(savedPage);
        lastAwardedParagraphRef.current = entry.currentPage;
      }
      if (entry && typeof entry.scrollPercent === 'number') {
        savedScrollPercent = entry.scrollPercent;
        setScrollPercent(savedScrollPercent);
      }
      if (entry && typeof entry.scrollTop === 'number') {
        savedScrollTop = entry.scrollTop;
      }
      const cRaw = localStorage.getItem(getStorageKey('bookComplete', book.slug));
      if (cRaw === '1') completionAwardedRef.current = true;
    } catch {}

    if (savedPage === 0 && savedScrollPercent <= 0.5) {
      restoredRef.current = true;
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 25;

    const performRestore = () => {
      if (cancelled) return;
      const el = scrollRef.current;
      const node = paragraphRefs.current[savedPage];

      // Wait until container has layout and node is mounted
      if (!el || (!node && savedPage > 0)) {
        if (attempts++ < maxAttempts) {
          window.requestAnimationFrame(performRestore);
        } else {
          restoredRef.current = true;
        }
        return;
      }

      if (savedPage >= totalPages - 1 && savedScrollPercent >= 99) {
        el.scrollTo({ top: el.scrollHeight - el.clientHeight, behavior: 'auto' });
      } else if (node) {
        const nodeRect = node.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const targetTop = el.scrollTop + (nodeRect.top - elRect.top) - 80;
        el.scrollTo({ top: Math.max(0, targetTop), behavior: 'auto' });
      } else if (typeof savedScrollTop === 'number' && savedScrollTop > 0) {
        el.scrollTo({ top: savedScrollTop, behavior: 'auto' });
      }

      // Re-verify after web fonts load and text reflows
      if (typeof document !== 'undefined' && 'fonts' in document && document.fonts?.ready) {
        document.fonts.ready
          .then(() => {
            if (cancelled) return;
            const freshEl = scrollRef.current;
            const freshNode = paragraphRefs.current[savedPage];
            if (freshEl && freshNode) {
              const freshNodeRect = freshNode.getBoundingClientRect();
              const freshElRect = freshEl.getBoundingClientRect();
              const freshTarget = freshEl.scrollTop + (freshNodeRect.top - freshElRect.top) - 80;
              freshEl.scrollTo({ top: Math.max(0, freshTarget), behavior: 'auto' });
            }
          })
          .catch(() => {});
      }

      window.requestAnimationFrame(() => {
        if (!cancelled) {
          restoredRef.current = true;
        }
      });
    };

    const timer = window.setTimeout(performRestore, 20);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [book.slug, totalPages]);

  // ---- IntersectionObserver: track current paragraph ----
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!restoredRef.current) return;
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;

        const rootTop = root.getBoundingClientRect().top;
        const readingLine = rootTop + 120;

        let closestIdx = -1;
        let minDistance = Infinity;

        for (const entry of visible) {
          const idx = Number(entry.target.getAttribute('data-paragraph-index') || '0');
          const dist = Math.abs(entry.boundingClientRect.top - readingLine);
          if (dist < minDistance) {
            minDistance = dist;
            closestIdx = idx;
          }
        }

        if (closestIdx >= 0) {
          setCurrentParagraph(closestIdx);
        }
      },
      {
        root,
        rootMargin: '-80px 0px -50% 0px',
        threshold: [0, 0.2, 0.5],
      },
    );
    paragraphRefs.current.forEach((n) => {
      if (n) observer.observe(n);
    });
    return () => observer.disconnect();
  }, [book.pages.length]);

  // ---- Scroll handler: progress percent + bottom-edge override ----
  const handleScroll = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      const el = scrollRef.current;
      if (!el) return;
      const max = el.scrollHeight - el.clientHeight;
      const pct = max > 0 ? Math.min(100, Math.max(0, (el.scrollTop / max) * 100)) : 0;
      setScrollPercent(pct);

      // Force the last paragraph to be "current" when we reach the bottom
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 6) {
        setCurrentParagraph((prev) => (prev === totalPages - 1 ? prev : totalPages - 1));
      }

      // Debounced highlight re-restoration
      if (hlRestoreTimerRef.current) clearTimeout(hlRestoreTimerRef.current);
      hlRestoreTimerRef.current = setTimeout(() => {
        restoreHighlightsRef.current();
      }, 350);
    });
  }, [totalPages, restoreHighlightsRef]);

  // ---- Latest state ref for reliable saves ----
  const latestStateRef = useRef({
    currentParagraph,
    scrollPercent,
    totalPages,
    slug: book.slug,
  });

  useEffect(() => {
    latestStateRef.current = {
      currentParagraph,
      scrollPercent,
      totalPages,
      slug: book.slug,
    };
  }, [currentParagraph, scrollPercent, totalPages, book.slug]);

  // ---- Flush save synchronously to localStorage ----
  const flushSave = useCallback(() => {
    if (!book.slug || !restoredRef.current) return;
    const cur = latestStateRef.current;
    if (!cur || !cur.slug) return;
    const el = scrollRef.current;
    const isAtBottom = el ? el.scrollTop + el.clientHeight >= el.scrollHeight - 6 : false;
    const percent = calculateReadingPercent({
      currentPage: cur.currentParagraph,
      totalPages: cur.totalPages,
      scrollPercent: cur.scrollPercent,
      isCompleted:
        isAtBottom || (cur.currentParagraph >= cur.totalPages - 1 && cur.scrollPercent >= 99),
    });

    mergeLocalProgress(cur.slug, {
      currentPage: cur.currentParagraph,
      totalPages: cur.totalPages,
      percent,
      scrollPercent: cur.scrollPercent,
      scrollTop: el?.scrollTop,
      ts: Date.now(),
      lastReadAt: Date.now(),
    });
  }, [book.slug]);

  // ---- Debounced save during active reading ----
  useEffect(() => {
    if (!book.slug || !restoredRef.current) return;
    const id = window.setTimeout(flushSave, 300);
    return () => window.clearTimeout(id);
  }, [currentParagraph, scrollPercent, book.slug, flushSave]);

  // ---- Guarantee save on page hide / unload / tab close / unmount ----
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushSave();
    };
    const handleBeforeUnload = () => {
      flushSave();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      flushSave();
    };
  }, [flushSave]);

  // ---- Mobile detection ----
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ---- Transient reading-position chip on paragraph change ----
  useEffect(() => {
    if (!restoredRef.current) return;
    setShowPositionChip(true);
    const id = window.setTimeout(() => setShowPositionChip(false), 1600);
    return () => window.clearTimeout(id);
  }, [currentParagraph]);

  // ---- Helpers exposed to keyboard shortcuts ----
  const pageDown = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ top: el.clientHeight * 0.85, behavior: 'smooth' });
  }, []);
  const pageUp = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ top: -el.clientHeight * 0.85, behavior: 'smooth' });
  }, []);

  // ---- Derived presentation values ----
  const isLastPage = currentParagraph >= totalPages - 1;
  const rawDisplayPercent = calculateReadingPercent({
    currentPage: currentParagraph,
    totalPages,
    scrollPercent,
    isCompleted: isLastPage && scrollPercent >= 99,
  });
  const displayPercent = mounted ? rawDisplayPercent : 0;
  const remainingParagraphs = Math.max(0, totalPages - currentParagraph - 1);
  const remainingMinutes = estimateReadingMinutes(remainingParagraphs);

  return {
    scrollRef,
    paragraphRefs,
    restoreHighlightsRef,
    currentParagraph,
    setCurrentParagraph,
    scrollPercent,
    showPositionChip,
    isMobile,
    scrollToParagraph,
    handleScroll,
    pageDown,
    pageUp,
    displayPercent,
    remainingParagraphs,
    remainingMinutes,
    isLastPage,
    mounted,
    restoredRef,
    lastAwardedParagraphRef,
    completionAwardedRef,
  };
}
