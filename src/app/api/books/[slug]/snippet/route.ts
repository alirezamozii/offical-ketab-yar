import { NextRequest, NextResponse } from 'next/server'
import { getReaderBook } from '@/lib/data'

/**
 * GET /api/books/[slug]/snippet — returns the first-page English snippet for
 * a book, used by the BookCard hover preview to give users a quick taste of
 * the writing style without loading the full reader.
 *
 * Response: { slug, snippet, length }
 *   • snippet — first ~220 chars of the first page's English text, with
 *     ellipsis if truncated. Empty string if the book has no pages.
 *
 * Caching: `public, s-maxage=3600, stale-while-revalidate=86400` — the
 * snippet never changes for a given book so a long TTL is safe.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const book = await getReaderBook(slug)
    if (!book) {
      return NextResponse.json(
        { error: 'کتاب یافت نشد.' },
        { status: 404 },
      )
    }
    const firstPage = book.pages[0]
    let snippet = ''
    if (firstPage) {
      // Concatenate English items on the first page; the reader stores each
      // page as `{ items: BilingualItem[] }` where each item has an
      // `english` + `farsi` string pair. We only want English for the
      // preview.
      const englishText = firstPage.items
        .map((it) => it.english)
        .filter(Boolean)
        .join(' ')
        .trim()
      if (englishText) {
        snippet =
          englishText.length > 220
            ? `${englishText.slice(0, 220).trimEnd()}…`
            : englishText
      }
    }
    return NextResponse.json(
      { slug, snippet, length: snippet.length },
      {
        headers: {
          'Cache-Control':
            'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      },
    )
  } catch (err) {
    console.error('[/api/books/[slug]/snippet] GET failed:', err)
    return NextResponse.json(
      { error: 'بارگذاری پیش‌نمایش کتاب ناموفق بود.' },
      { status: 500 },
    )
  }
}
