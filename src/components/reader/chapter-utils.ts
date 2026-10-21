import type { ReaderBook } from '@/lib/reader/types';

export interface ChapterSegment {
  id: string;
  title: string;
  titleFa?: string;
  slug: string;
  order: number;
  startPage: number;
  /** Index in book.pages where this chapter starts (resolved from startPage). */
  pageIndex: number;
}

/**
 * Resolve a chapter's printed `startPage` to the index of the page whose
 * pageNumber is the first at-or-after it (content pages can start above 1).
 */
function chapterStartIndex(book: ReaderBook, startPage: number): number {
  const idx = book.pages.findIndex((p) => p.pageNumber >= startPage);
  return idx === -1 ? Math.max(book.pages.length - 1, 0) : idx;
}

/** Chapters sorted by `order`, each with its resolved page index. */
export function chapterSegments(book: ReaderBook): ChapterSegment[] {
  if (!book.chapters?.length) return [];
  return book.chapters
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((ch) => ({ ...ch, pageIndex: chapterStartIndex(book, ch.startPage) }));
}

/** Index of the chapter currently being read (last chapter whose start ≤ current). */
export function currentChapterIndex(chapters: ChapterSegment[], currentParagraph: number): number {
  let cur = -1;
  for (let i = 0; i < chapters.length; i++) {
    if (currentParagraph >= chapters[i].pageIndex) cur = i;
  }
  return cur;
}
