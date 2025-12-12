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
        const {
            title,
            titleFa,
            author,
            summary,
            summaryFa,
            genres,
            level,
            bookData,
            coverImageAssetId,
            status,
            featured
        } = body

        // Validate required fields
        if (!title || !titleFa) {
            return NextResponse.json(
                { error: 'Title (English and Farsi) is required' },
                { status: 400 }
            )
        }

        // Generate slug
        const slug = generateSlug(title)

        // Create book document in Sanity
        const newBook = await sanityAdminClient.create({
            _type: 'compactBook',
            title,
            titleFa,
            slug: {
                _type: 'slug',
                current: slug
            },
            author: author || 'Unknown Author',
            summary: summary || '',
            summaryFa: summaryFa || summary || '',
            genres: genres || [],
            level: level || 'intermediate',
            bookData: bookData || '',
            status: status || 'draft',
            featured: featured || false,
            ...(coverImageAssetId && {
                coverImage: {
                    _type: 'image',
                    asset: {
                        _type: 'reference',
                        _ref: coverImageAssetId
                    }
                }
            })
        })

        return NextResponse.json({
            success: true,
            book: newBook,
            message: 'کتاب با موفقیت ایجاد شد / Book created successfully'
        }, { status: 201 })
    } catch (error) {
        console.error('Error creating book:', error)
        return NextResponse.json(
            { error: 'Failed to create book', details: (error as Error).message },
            { status: 500 }
        )
    }
}
