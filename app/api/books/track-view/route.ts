import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Track book views for analytics
 * Agent 1: Important for "trending books" and SEO signals
 */
export async function POST(request: NextRequest) {
    try {
        const { bookId } = await request.json()

        if (!bookId) {
            return NextResponse.json(
                { error: 'Book ID is required' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Get current user (optional)
        const { data: { user } } = await supabase.auth.getUser()

        // Track view in book_analytics
        const { error } = await supabase.rpc('increment_book_views', {
            p_book_id: bookId,
            p_user_id: user?.id || null,
        })

        if (error) {
            console.error('Failed to track view:', error)
            // Don't fail the request if tracking fails
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error tracking book view:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
