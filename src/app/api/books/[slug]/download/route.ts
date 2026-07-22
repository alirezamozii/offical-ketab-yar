/**
 * /api/books/[slug]/download — offline book download as JSON
 *
 * Registered users can download the full book as a single JSON file for
 * offline reading. The download is logged in BookDownload for analytics.
 *
 * Auth: required (any logged-in user). Book must have allowDownload=true.
 *
 * Returns: a JSON file attachment with the full book + all pages.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-session'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: 'برای دانلود کتاب باید وارد شوید.' },
      { status: 401 },
    )
  }

  const book = await db.book.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverFrom: true,
      coverTo: true,
      coverAccent: true,
      coverImageUrl: true,
      coverBlurhash: true,
      genres: true,
      level: true,
      language: true,
      publishedYear: true,
      pageCount: true,
      allowDownload: true,
      isPublished: true,
      author: { select: { name: true, nameFa: true, slug: true, bio: true, bioFa: true } },
      chapters: { orderBy: { order: 'asc' } },
      pages: { orderBy: { pageNumber: 'asc' } },
    },
  })

  if (!book || !book.isPublished) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  if (!book.allowDownload) {
    return NextResponse.json(
      { error: 'این کتاب اجازه دانلود ندارد.' },
      { status: 403 },
    )
  }

  // Log the download
  await db.bookDownload.create({
    data: {
      bookId: book.id,
      userId: user.id,
      format: 'json',
    },
  })

  const payload = {
    title: book.title,
    slug: book.slug,
    description: book.description,
    coverFrom: book.coverFrom,
    coverTo: book.coverTo,
    coverAccent: book.coverAccent,
    coverImageUrl: book.coverImageUrl,
    coverBlurhash: book.coverBlurhash,
    genres: JSON.parse(book.genres || '[]'),
    level: book.level,
    language: book.language,
    publishedYear: book.publishedYear,
    pageCount: book.pageCount,
    author: {
      name: book.author.name,
      nameFa: book.author.nameFa,
      slug: book.author.slug,
      bio: book.author.bio,
      bioFa: book.author.bioFa,
    },
    chapters: book.chapters.map((c) => ({
      title: c.title,
      titleFa: c.titleFa,
      slug: c.slug,
      order: c.order,
      startPage: c.startPage,
    })),
    pages: book.pages.map((p) => ({
      pageNumber: p.pageNumber,
      english: p.english,
      farsi: p.farsi,
      type: p.type,
    })),
    downloadedAt: new Date().toISOString(),
    downloadedBy: user.username || user.email || user.id,
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${book.slug}.json"`,
      'Cache-Control': 'private, no-cache',
    },
  })
}
