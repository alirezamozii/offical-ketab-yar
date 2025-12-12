import { createClient } from '@/lib/supabase/server'
import { createClient as createSanityClient } from '@sanity/client'
import { NextRequest, NextResponse } from 'next/server'

const sanityClient = createSanityClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    token: process.env.SANITY_API_TOKEN!,
    apiVersion: '2024-01-01',
    useCdn: false,
})

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer())

        // Upload to Sanity
        const asset = await sanityClient.assets.upload('image', buffer, {
            filename: file.name,
            contentType: file.type,
        })

        return NextResponse.json({
            success: true,
            asset: {
                _id: asset._id,
                url: asset.url,
            },
            message: 'Image uploaded successfully',
        })
    } catch (error: any) {
        console.error('Error uploading image:', error)
        return NextResponse.json(
            { error: 'Failed to upload image', details: error.message },
            { status: 500 }
        )
    }
}
