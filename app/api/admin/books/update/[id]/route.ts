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

    if (!profile || profile.role !== 'admin') {
        return { authorized: false, error: 'Forbidden' }
    }

    return { authorized: true }
}

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
}

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

        return NextResponse.json({ success: true, book })
    } catch (error) {
        console.error('Error fetching book:', error)
        return NextResponse.json(
            { error: 'Failed to fetch book', details: (error as Error).message },
            { status: 500 }
        )
    }
}

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
        const updates: Record<string, any> = {}

        // Update fields if provided
        if (body.title) {
            updates.title = body.title
            updates.slug = {
                _type: 'slug',
                current: generateSlug(body.title)
            }
        }
        if (body.titleFa !== undefined) updates.titleFa = body.titleFa
        if (body.author !== undefined) updates.author = body.author
        if (body.summary !== undefined) updates.summary = body.summary
        if (body.summaryFa !== undefined) updates.summaryFa = body.summaryFa
        if (body.genres !== undefined) updates.genres = body.genres
        if (body.level !== undefined) updates.level = body.level
        if (body.bookData !== undefined) updates.bookData = body.bookData
        if (body.status !== undefined) updates.status = body.status
        if (body.featured !== undefined) updates.featured = body.featured

        if (body.coverImageAssetId) {
            updates.coverImage = {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: body.coverImageAssetId
                }
            }
        }

        const updatedBook = await sanityAdminClient
            .patch(params.id)
            .set(updates)
            .commit()

        return NextResponse.json({
            success: true,
            book: updatedBook,
            message: 'کتاب با موفقیت به‌روزرسانی شد / Book updated successfully'
        })
    } catch (error) {
        console.error('Error updating book:', error)
        return NextResponse.json(
            { error: 'Failed to update book', details: (error as Error).message },
            { status: 500 }
        )
    }
}

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

        await sanityAdminClient.delete(params.id)

        return NextResponse.json({
            success: true,
            message: 'کتاب با موفقیت حذف شد / Book deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting book:', error)
        return NextResponse.json(
            { error: 'Failed to delete book', details: (error as Error).message },
            { status: 500 }
        )
    }
}
