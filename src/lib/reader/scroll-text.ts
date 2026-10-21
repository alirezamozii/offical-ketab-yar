import type { ReaderBook } from './types';

/**
 * Returns the reading text starting from the user's current scroll position.
 * If the user has scrolled partially down a page, it returns text from the
 * first visible paragraph/item onwards, instead of restarting from the top.
 */
export function getVisibleReadingText(
  scrollEl: HTMLElement | null,
  book: ReaderBook,
  currentParagraph: number,
  currentLanguage: 'english' | 'farsi',
): string {
  const langKey = currentLanguage === 'english' ? 'english' : 'farsi';

  if (!book?.pages || book.pages.length === 0) return '';

  if (!scrollEl) {
    const page = book.pages[currentParagraph];
    return (
      page?.items
        ?.map((it) => it[langKey])
        .filter(Boolean)
        .join('\n\n') || ''
    );
  }

  const containerRect = scrollEl.getBoundingClientRect();
  // The reading line is ~100px from the container top (just beneath the toolbar)
  const readingLine = containerRect.top + 100;

  // Query item containers within current page first, falling back to full container
  const currentPageEl = scrollEl.querySelector<HTMLElement>(
    `[data-paragraph-index="${currentParagraph}"]`,
  );
  const itemElements = currentPageEl
    ? Array.from(currentPageEl.querySelectorAll<HTMLElement>('[data-item-index]'))
    : Array.from(scrollEl.querySelectorAll<HTMLElement>('[data-item-index]'));

  let targetPageIndex = currentParagraph;
  let targetItemIndex = 0;

  for (const el of itemElements) {
    const rect = el.getBoundingClientRect();
    // First item whose bottom is at or below reading line is the one the user is currently looking at
    if (rect.bottom >= readingLine) {
      const pageEl = el.closest('[data-paragraph-index]');
      if (pageEl) {
        const pIdx = Number(pageEl.getAttribute('data-paragraph-index'));
        if (!isNaN(pIdx) && pIdx >= 0 && pIdx < book.pages.length) {
          targetPageIndex = pIdx;
        }
      }
      const itIdx = Number(el.getAttribute('data-item-index'));
      if (!isNaN(itIdx) && itIdx >= 0) {
        targetItemIndex = itIdx;
      }
      break;
    }
  }

  const page = book.pages[targetPageIndex];
  if (!page || !page.items || page.items.length === 0) {
    const fallback = book.pages[currentParagraph];
    return (
      fallback?.items
        ?.map((it) => it[langKey])
        .filter(Boolean)
        .join('\n\n') || ''
    );
  }

  // Slice starting from the currently visible item to the end of the page
  const visibleItems = page.items.slice(targetItemIndex);
  const result = visibleItems
    .map((it) => it[langKey])
    .filter(Boolean)
    .join('\n\n');

  return (
    result ||
    page.items
      .map((it) => it[langKey])
      .filter(Boolean)
      .join('\n\n')
  );
}
