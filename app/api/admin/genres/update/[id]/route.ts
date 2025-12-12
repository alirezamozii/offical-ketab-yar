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

        const genre = await sanityAdminClient.fetch(
            `*[_type == "genre" && _id == $id][0]`,
            { id: params.id }
        )

        if (!genre) {
            return NextResponse.json({ error: 'Genre not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, genre })
    } catch (error) {
        console.error('Error fetching genre:', error)
        return NextResponse.json(
            { error: 'Failed to fetch genre', details: (error as Error).message },
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
        if (body.nameFa !== undefined) updates.nameFa = body.nameFa
        if (body.description !== undefined) updates.description = body.description
        if (body.color !== undefined) updates.color = body.color

        const updatedGenre = await sanityAdminClient
            .patch(params.id)
            .set(updates)
            .commit()

        return NextResponse.json({
            success: true,
            genre: updatedGenre,
            message: 'ژانر با موفقیت به‌روزرسانی شد / Genre updated successfully'
        })
    } catch (error) {
        console.error('Error updating genre:', error)
        return NextResponse.json(
            { error: 'Failed to update genre', details: (error as Error).message },
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
            message: 'ژانر با موفقیت حذف شد / Genre deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting genre:', error)
        return NextResponse.json(
            { error: 'Failed to delete genre', details: (error as Error).message },
            { status: 500 }
        )
    }
}
