import { convertPlainTextToCompactJSON } from '@/lib/admin/plain-text-converter'
import { sanityAdminClient } from '@/lib/sanity.client'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/books
 * List all books (including drafts)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all books from Sanity
    const books = await sanityAdminClient.fetch(`
      *[_type == "compactBook"] | order(_createdAt desc) {
        _id,
        _createdAt,
        _updatedAt,
        title,
        titleFa,
        slug,
        author,
        coverImage,
        summary,
        summaryFa,
        genres,
        level,
        status,
        featured
      }
    `)

    return NextResponse.json({ books }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching books:', error)
    return NextResponse.json(
      { error: 'Failed to fetch books', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/books
 * Create new book from plain text
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      titleFa,
      author,
      summary,
      summaryFa,
      year,
      genres,
      level,
      content, // Plain text interleaved format
      coverImageUrl,
      status = 'draft',
      featured = false
    } = body

    // Validate required fields
    if (!title || !author || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: title, author, content' },
        { status: 400 }
      )
    }

    // Convert plain text to compact JSON
    const compactJSON = convertPlainTextToCompactJSON({
      title,
      titleFa: titleFa || title,
      author,
      summary: summary || '',
      summaryFa: summaryFa || summary || '',
      year: year || new Date().getFullYear(),
      genres: genres || [],
      level: level || 'intermediate',
      content
    })

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Create book in Sanity
    const newBook = await sanityAdminClient.create({
      _type: 'compactBook',
      title,
      titleFa: titleFa || title,
      slug: {
        _type: 'slug',
        current: slug
      },
      author,
      summary: summary || '',
      summaryFa: summaryFa || summary || '',
      genres: genres || [],
      level: level || 'intermediate',
      status,
      featured,
      bookData: JSON.stringify(compactJSON),
      ...(coverImageUrl && {
        coverImage: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: coverImageUrl
          }
        }
      })
    })

    return NextResponse.json(
      {
        success: true,
        book: newBook,
        message: 'Book created successfully'
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating book:', error)
    return NextResponse.json(
      { error: 'Failed to create book', details: error.message },
      { status: 500 }
    )
  }
}
