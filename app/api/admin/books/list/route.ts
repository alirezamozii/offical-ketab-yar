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
        const status = searchParams.get('status')
        const genre = searchParams.get('genre')
        const search = searchParams.get('search')

        // Build Sanity query
        let query = '*[_type == "compactBook"'
        const filters = []

        if (status && status !== 'all') {
            filters.push(`status == "${status}"`)
        }

        if (genre && genre !== 'all') {
            filters.push(`"${genre}" in genres`)
        }

        if (search) {
            filters.push(`(title match "${search}*" || author match "${search}*" || titleFa match "${search}*")`)
        }

        if (filters.length > 0) {
            query += ' && (' + filters.join(' && ') + ')'
        }

        query += '] | order(_createdAt desc)'

        const books = await sanityAdminClient.fetch(query)

        // Add cover image URLs
        const booksWithImages = books.map((book: any) => ({
            ...book,
            coverImageUrl: book.coverImage?.asset?._ref
                ? `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${book.coverImage.asset._ref.replace('image-', '').replace('-jpg', '.jpg').replace('-png', '.png')}`
                : null
        }))

        return NextResponse.json({
            success: true,
            books: booksWithImages
        })
    } catch (error) {
        console.error('Error fetching books:', error)
        return NextResponse.json(
            { error: 'Failed to fetch books', details: (error as Error).message },
            { status: 500 }
        )
    }
}
