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

        const author = await sanityAdminClient.fetch(
            `*[_type == "author" && _id == $id][0]`,
            { id: params.id }
        )

        if (!author) {
            return NextResponse.json({ error: 'Author not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, author })
    } catch (error) {
        console.error('Error fetching author:', error)
        return NextResponse.json(
            { error: 'Failed to fetch author', details: (error as Error).message },
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

        if (body.name !== undefined) updates.name = body.name
        if (body.bio !== undefined) updates.bio = body.bio
        if (body.nationality !== undefined) updates.nationality = body.nationality

        if (body.photoAssetId) {
            updates.photo = {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: body.photoAssetId
                }
            }
        }

        const updatedAuthor = await sanityAdminClient
            .patch(params.id)
            .set(updates)
            .commit()

        return NextResponse.json({
            success: true,
            author: updatedAuthor,
            message: 'نویسنده با موفقیت به‌روزرسانی شد / Author updated successfully'
        })
    } catch (error) {
        console.error('Error updating author:', error)
        return NextResponse.json(
            { error: 'Failed to update author', details: (error as Error).message },
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
            message: 'نویسنده با موفقیت حذف شد / Author deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting author:', error)
        return NextResponse.json(
            { error: 'Failed to delete author', details: (error as Error).message },
            { status: 500 }
        )
    }
}
