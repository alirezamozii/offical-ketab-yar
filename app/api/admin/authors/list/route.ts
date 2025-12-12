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

export async function GET(request: NextRequest) {
    try {
        const auth = await checkAdminAuth()
        if (!auth.authorized) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.error === 'Unauthorized' ? 401 : 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')

        let query = '*[_type == "author"'

        if (search) {
            query += ` && name match "${search}*"`
        }

        query += '] | order(name asc) { _id, _createdAt, name, bio, nationality, photoUrl, "bookCount": count(*[_type == "compactBook" && author == ^.name]) }'

        const authors = await sanityAdminClient.fetch(query)

        return NextResponse.json({
            success: true,
            authors
        })
    } catch (error) {
        console.error('Error fetching authors:', error)
        return NextResponse.json(
            { error: 'Failed to fetch authors', details: (error as Error).message },
            { status: 500 }
        )
    }
}
