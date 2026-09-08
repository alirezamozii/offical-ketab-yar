import { NextRequest, NextResponse } from 'next/server'
import { getBookBySlug } from '@/lib/data'

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

    const book = await getBookBySlug(slug)

    if (!book) {
      return NextResponse.json(
        { error: 'کتاب مورد نظر یافت نشد.' },
        { status: 404 }
      )
    }

    return NextResponse.json(book, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    })
  } catch (err) {
    console.error('[/api/books/[slug]] Error:', err)
    return NextResponse.json(
      { error: 'کتاب مورد نظر یافت نشد.' },
      { status: 404 }
    )
  }
}
