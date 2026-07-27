import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cache, TTL } from '@/lib/cache'
import { BOOK_LIST_SELECT, toListItem } from '@/lib/books-query'

/**
 * GET /api/books/[slug]
 * Fetch a single book's details by slug.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'شناسه کتاب نامعتبر است.' },
        { status: 400 }
      )
    }

    const cacheKey = `book:detail:${slug}`
    const book = await cache.wrap(cacheKey, async () => {
      const row = await db.book.findUnique({
        where: { slug, isPublished: true },
        select: {
          ...BOOK_LIST_SELECT,
          chapters: {
            select: {
              id: true,
              title: true,
              titleFa: true,
              slug: true,
              order: true,
              startPage: true,
            },
            orderBy: { order: 'asc' },
          },
        },
      })
      return row
    }, TTL.BOOKS_LIST)

    if (!book) {
      return NextResponse.json(
        { error: 'کتاب مورد نظر یافت نشد.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...toListItem(book),
      chapters: book.chapters,
    })
  } catch (err) {
    console.error('[/api/books/[slug]] Error:', err)
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات کتاب.' },
      { status: 500 }
    )
  }
}
