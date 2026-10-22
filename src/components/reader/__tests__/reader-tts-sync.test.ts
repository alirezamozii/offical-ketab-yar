import { describe, expect, it } from 'vitest';
import { getActiveWordInParagraph } from '../reader-page-view';
import { getVisibleReadingText } from '@/lib/reader/scroll-text';
import type { ReaderBook } from '@/lib/reader/types';

describe('getActiveWordInParagraph', () => {
  it('returns -1 for invalid or empty inputs', () => {
    expect(getActiveWordInParagraph('', 'test', 0)).toBe(-1);
    expect(getActiveWordInParagraph('primary', '', 0)).toBe(-1);
    expect(getActiveWordInParagraph('primary', null, 0)).toBe(-1);
    expect(getActiveWordInParagraph('primary', 'primary', -1)).toBe(-1);
  });

  it('matches exact paragraph reading', () => {
    const text = 'This is a single paragraph test.';
    expect(getActiveWordInParagraph(text, text, 0)).toBe(0);
    expect(getActiveWordInParagraph(text, text, 3)).toBe(3);
    expect(getActiveWordInParagraph(text, text, 10)).toBe(-1); // out of bounds
  });

  it('correctly maps active words when user selects a sentence inside paragraph', () => {
    const paragraph = 'It was quite dark now. Lennie crawled across the floor.';
    const selection = 'Lennie crawled across the floor.';

    // Word 0 of selection ("Lennie") is word 5 of paragraph
    expect(getActiveWordInParagraph(paragraph, selection, 0)).toBe(5);
    // Word 1 of selection ("crawled") is word 6 of paragraph
    expect(getActiveWordInParagraph(paragraph, selection, 1)).toBe(6);
    // Word 4 of selection ("floor.") is word 9 of paragraph
    expect(getActiveWordInParagraph(paragraph, selection, 4)).toBe(9);
    // Out of range index should return -1
    expect(getActiveWordInParagraph(paragraph, selection, 5)).toBe(-1);
  });

  it('returns -1 for completely unrelated paragraph during selection reading', () => {
    const otherParagraph = 'George lay back on the sand and crossed his hands.';
    const selection = 'Lennie crawled across the floor.';
    expect(getActiveWordInParagraph(otherParagraph, selection, 0)).toBe(-1);
  });

  it('correctly aligns words during multi-paragraph or full page playback', () => {
    const p1 = 'First paragraph begins.'; // 3 words (0, 1, 2)
    const p2 = 'Second paragraph begins.'; // 3 words (3, 4, 5)
    const fullChunk = `${p1}\n\n${p2}`;

    // When TTS reads word 0..2 (p1):
    expect(getActiveWordInParagraph(p1, fullChunk, 0)).toBe(0);
    expect(getActiveWordInParagraph(p1, fullChunk, 2)).toBe(2);
    expect(getActiveWordInParagraph(p2, fullChunk, 0)).toBe(-1);

    // When TTS transitions to word 3..5 (p2):
    expect(getActiveWordInParagraph(p1, fullChunk, 3)).toBe(-1);
    expect(getActiveWordInParagraph(p2, fullChunk, 3)).toBe(0); // Word 3 in fullChunk is word 0 in p2
    expect(getActiveWordInParagraph(p2, fullChunk, 5)).toBe(2); // Word 5 in fullChunk is word 2 in p2

    // Out of range word:
    expect(getActiveWordInParagraph(p2, fullChunk, 6)).toBe(-1);
  });

  it('handles irregular whitespace between words cleanly', () => {
    const paragraph = 'Hello    world   with   spaces.';
    const selection = 'world with spaces.';
    expect(getActiveWordInParagraph(paragraph, selection, 0)).toBe(1);
    expect(getActiveWordInParagraph(paragraph, selection, 1)).toBe(2);
  });

  it('does not trigger Case 4 for trivial short paragraphs or headings', () => {
    const heading = 'Chapter 1';
    const longSpokenText = 'In Chapter 1 of the story, we see Lennie and George walking together.';
    // Heading is only 2 words (< 3 words), so it should not match as active paragraph
    expect(getActiveWordInParagraph(heading, longSpokenText, 0)).toBe(-1);
  });
});

describe('getVisibleReadingText', () => {
  const dummyBook: ReaderBook = {
    slug: 'test-book',
    title: 'Test Book',
    author: 'Author',
    pages: [
      {
        pageNumber: 1,
        items: [
          { type: 'text', english: 'Page 1 item 1', farsi: 'صفحه ۱ آیتم ۱' },
          { type: 'text', english: 'Page 1 item 2', farsi: 'صفحه ۱ آیتم ۲' },
        ],
      },
      {
        pageNumber: 2,
        items: [{ type: 'text', english: 'Page 2 item 1', farsi: 'صفحه ۲ آیتم ۱' }],
      },
    ],
  };

  it('returns current paragraph text when scrollEl is null', () => {
    const textEn = getVisibleReadingText(null, dummyBook, 0, 'english');
    expect(textEn).toBe('Page 1 item 1\n\nPage 1 item 2');

    const textFa = getVisibleReadingText(null, dummyBook, 0, 'farsi');
    expect(textFa).toBe('صفحه ۱ آیتم ۱\n\nصفحه ۱ آیتم ۲');
  });

  it('returns fallback text for invalid page indices', () => {
    const text = getVisibleReadingText(null, dummyBook, 99, 'english');
    expect(text).toBe('');
  });
});
