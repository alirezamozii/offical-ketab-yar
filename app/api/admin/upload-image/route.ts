import { sanityAdminClient } from '@/lib/sanity.client'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/upload-image
 * Upload image to Sanity
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

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer())

        // Upload to Sanity
        const asset = await sanityAdminClient.assets.upload('image', buffer, {
            filename: file.name,
            contentType: file.type
        })

        return NextResponse.json(
            {
                success: true,
                asset: {
                    _id: asset._id,
                    url: asset.url
                }
            },
            { status: 200 }
        )
    } catch (error: any) {
        console.error('Error uploading image:', error)
        return NextResponse.json(
            { error: 'Failed to upload image', details: error.message },
            { status: 500 }
        )
    }
}
