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

export async function POST(request: NextRequest) {
    try {
        const auth = await checkAdminAuth()
        if (!auth.authorized) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.error === 'Unauthorized' ? 401 : 403 }
            )
        }

        const body = await request.json()
        const { name, bio, nationality, photoAssetId } = body

        if (!name) {
            return NextResponse.json(
                { error: 'Author name is required' },
                { status: 400 }
            )
        }

        const newAuthor = await sanityAdminClient.create({
            _type: 'author',
            name,
            bio: bio || '',
            nationality: nationality || '',
            ...(photoAssetId && {
                photo: {
                    _type: 'image',
                    asset: {
                        _type: 'reference',
                        _ref: photoAssetId
                    }
                }
            })
        })

        return NextResponse.json({
            success: true,
            author: newAuthor,
            message: 'نویسنده با موفقیت ایجاد شد / Author created successfully'
        }, { status: 201 })
    } catch (error) {
        console.error('Error creating author:', error)
        return NextResponse.json(
            { error: 'Failed to create author', details: (error as Error).message },
            { status: 500 }
        )
    }
}
