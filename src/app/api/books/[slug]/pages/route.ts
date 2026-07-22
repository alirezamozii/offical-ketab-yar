/**
 * /api/books/[slug]/pages — public, chunked page fetcher for the reader
 *
 * Query params:
 *   from  — 1-indexed start page (default 1)
 *   to    — 1-indexed end page (default from + 19, i.e. 20-page chunks)
 *
 * Returns:
 *   { ok, pages: [{pageNumber, english, farsi, type, meta}], total, book: {title, author, ...} }
 *
 * This enables "YouTube-style" progressive loading: the reader fetches the
 * first 20 pages immediately, then fetches the next 20 as the user
 * approaches the end of the buffer.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const CHUNK_SIZE = 20
// H-12: hard upper cap on a single chunk so a malicious or buggy client
// can't blow up memory / dump the entire book via `?from=1&to=999999`.
const MAX_CHUNK = 100

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const url = new URL(req.url)
  // H-12: coerce NaN → default via `Math.floor(Number(...)) || <default>`
  // so non-numeric junk like `?from=abc` doesn't poison the math.
  const from = Math.max(1, Math.floor(Number(url.searchParams.get('from') || '1')) || 1)
  const rawTo = Math.floor(Number(url.searchParams.get('to') || '0')) || 0
  // If the caller didn't supply `to`, default to CHUNK_SIZE; otherwise honour
  // their value but clamp the range so `to - from + 1 <= MAX_CHUNK`.
  const baseTo = rawTo > 0 ? rawTo : from + CHUNK_SIZE - 1
  const to = Math.min(baseTo, from + MAX_CHUNK - 1)

  const book = await db.book.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      level: true,
      pageCount: true,
      coverImageUrl: true,
      coverBlurhash: true,
      isPublished: true,
      allowDownload: true,
      author: { select: { name: true, nameFa: true, slug: true } },
      chapters: { orderBy: { order: 'asc' }, select: { id: true, title: true, titleFa: true, slug: true, order: true, startPage: true } },
    },
  })

  if (!book || !book.isPublished) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  const [pages, total] = await Promise.all([
    db.bookPage.findMany({
      where: { bookId: book.id, pageNumber: { gte: from, lte: to } },
      orderBy: { pageNumber: 'asc' },
      select: {
        pageNumber: true,
        english: true,
        farsi: true,
        type: true,
        meta: true,
      },
    }),
    db.bookPage.count({ where: { bookId: book.id } }),
  ])

  return NextResponse.json({
    ok: true,
    book: {
      slug: book.slug,
      title: book.title,
      author: book.author.name,
      authorNameFa: book.author.nameFa,
      authorSlug: book.author.slug,
      level: book.level,
      pageCount: book.pageCount || total,
      coverImageUrl: book.coverImageUrl,
      coverBlurhash: book.coverBlurhash,
      allowDownload: book.allowDownload,
      chapters: book.chapters,
    },
    pages: pages.map((p) => ({
      pageNumber: p.pageNumber,
      english: p.english,
      farsi: p.farsi,
      type: p.type,
      meta: p.meta,
    })),
    total,
    from,
    to,
    hasMore: to < total,
  })
}
