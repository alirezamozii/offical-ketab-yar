import { convertCompactJSONToPlainText, convertPlainTextToCompactJSON } from '@/lib/admin/plain-text-converter'
import { sanityAdminClient } from '@/lib/sanity.client'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function checkAdminAuth() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { authorized: false, error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || (profile as any).role !== 'admin') {
        return { authorized: false, error: 'Forbidden' }
    }

    return { authorized: true }
}

/**
 * GET /api/admin/books/[id]
 * Get single book by ID (for editing)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await checkAdminAuth()
        if (!auth.authorized) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.error === 'Unauthorized' ? 401 : 403 }
            )
        }

        const book = await sanityAdminClient.fetch(
            `*[_type == "compactBook" && _id == $id][0]`,
            { id: params.id }
        )

        if (!book) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 })
        }

        // Convert compact JSON to plain text for editing
        let plainTextContent = ''
        if (book.bookData) {
            try {
                const compactJSON = JSON.parse(book.bookData)
                plainTextContent = convertCompactJSONToPlainText(compactJSON)
            } catch (e) {
                console.error('Error converting to plain text:', e)
            }
        }

        return NextResponse.json({
            ...book,
            plainTextContent
        }, { status: 200 })
    } catch (error) {
        console.error('Error fetching book:', error)
        return NextResponse.json(
            { error: 'Failed to fetch book', details: (error as Error).message },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/admin/books/[id]
 * Update existing book
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await checkAdminAuth()
        if (!auth.authorized) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.error === 'Unauthorized' ? 401 : 403 }
            )
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
            content, // Plain text
            coverImageUrl,
            status,
            featured
        } = body

        // Build update object
        const updates: Record<string, any> = {}

        if (title) updates.title = title
        if (titleFa) updates.titleFa = titleFa
        if (author) updates.author = author
        if (summary !== undefined) updates.summary = summary
        if (summaryFa !== undefined) updates.summaryFa = summaryFa
        if (genres) updates.genres = genres
        if (level) updates.level = level
        if (status) updates.status = status
        if (featured !== undefined) updates.featured = featured

        // Update slug if title changed
        if (title) {
            updates.slug = {
                _type: 'slug',
                current: title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '')
            }
        }

        // Convert plain text to compact JSON if content provided
        if (content) {
            const compactJSON = convertPlainTextToCompactJSON({
                title: title || body.title,
                titleFa: titleFa || title || body.title,
                author: author || body.author,
                summary: summary || '',
                summaryFa: summaryFa || summary || '',
                year: year || new Date().getFullYear(),
                genres: genres || [],
                level: level || 'intermediate',
                content
            })

            updates.bookData = JSON.stringify(compactJSON)
        }

        // Update cover image if provided
        if (coverImageUrl) {
            updates.coverImage = {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: coverImageUrl
                }
            }
        }

        // Update in Sanity
        const updatedBook = await sanityAdminClient
            .patch(params.id)
            .set(updates)
            .commit()

        return NextResponse.json(
            {
                success: true,
                book: updatedBook,
                message: 'Book updated successfully'
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error updating book:', error)
        return NextResponse.json(
            { error: 'Failed to update book', details: (error as Error).message },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/admin/books/[id]
 * Delete book
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await checkAdminAuth()
        if (!auth.authorized) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.error === 'Unauthorized' ? 401 : 403 }
            )
        }

        // Delete from Sanity
        await sanityAdminClient.delete(params.id)

        return NextResponse.json(
            {
                success: true,
                message: 'Book deleted successfully'
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error deleting book:', error)
        return NextResponse.json(
            { error: 'Failed to delete book', details: (error as Error).message },
            { status: 500 }
        )
    }
}
