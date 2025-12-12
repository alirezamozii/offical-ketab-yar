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
        const { name, nameFa, description, color } = body

        if (!name) {
            return NextResponse.json(
                { error: 'Genre name is required' },
                { status: 400 }
            )
        }

        const newGenre = await sanityAdminClient.create({
            _type: 'genre',
            name,
            nameFa: nameFa || name,
            description: description || '',
            color: color || '#D4AF37'
        })

        return NextResponse.json({
            success: true,
            genre: newGenre,
            message: 'ژانر با موفقیت ایجاد شد / Genre created successfully'
        }, { status: 201 })
    } catch (error) {
        console.error('Error creating genre:', error)
        return NextResponse.json(
            { error: 'Failed to create genre', details: (error as Error).message },
            { status: 500 }
        )
    }
}
