import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: Save word to user's vocabulary
 * POST /api/vocabulary/save
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { word, definition, translation, context, bookId } = await request.json()

        if (!word || !definition) {
            return NextResponse.json(
                { error: 'Word and definition are required' },
                { status: 400 }
            )
        }

        // Check if user is free tier and has reached limit
        const { data: userData } = await supabase
            .from('users')
            .select('subscription_tier')
            .eq('id', user.id)
            .single()

        if (userData?.subscription_tier === 'free') {
            const { count } = await supabase
                .from('vocabulary')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)

            if (count && count >= 20) {
                return NextResponse.json(
                    {
                        error: 'Free tier limit reached',
                        message: 'You have reached the 20-word limit for free users. Upgrade to Premium for unlimited vocabulary.'
                    },
                    { status: 403 }
                )
            }
        }

        // Check if word already exists
        const { data: existing } = await supabase
            .from('vocabulary')
            .select('id')
            .eq('user_id', user.id)
            .eq('word', word.toLowerCase())
            .single()

        if (existing) {
            return NextResponse.json(
                { error: 'Word already in vocabulary' },
                { status: 409 }
            )
        }

        // Extract context parts (before and after the word)
        let contextBefore = ''
        let contextAfter = ''

        if (context) {
            const wordIndex = context.toLowerCase().indexOf(word.toLowerCase())
            if (wordIndex !== -1) {
                // Get 50 characters before and after
                const start = Math.max(0, wordIndex - 50)
                const end = Math.min(context.length, wordIndex + word.length + 50)

                contextBefore = context.substring(start, wordIndex).trim()
                contextAfter = context.substring(wordIndex + word.length, end).trim()
            }
        }

        // Save word with spaced repetition fields
        const now = new Date()
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const { data, error } = await supabase
            .from('vocabulary')
            .insert({
                user_id: user.id,
                word: word.toLowerCase( as any),
                definition,
                translation,
                context,
                context_before: contextBefore,
                context_after: contextAfter,
                book_id: bookId,
                mastery_level: 0,
                last_reviewed_at: now.toISOString(),
                next_review_at: tomorrow.toISOString()
            })
            .select()
            .single()

        if (error) {
            console.error('Error saving vocabulary:', error)
            return NextResponse.json(
                { error: 'Failed to save word' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error('Vocabulary save error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
