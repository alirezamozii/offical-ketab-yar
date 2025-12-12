import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: Check Username Availability
 * POST /api/check-username
 * 
 * Checks if a username is available and suggests alternatives if taken
 */

export async function POST(request: NextRequest) {
    try {
        const { username } = await request.json()

        if (!username || typeof username !== 'string') {
            return NextResponse.json(
                { error: 'نام کاربری الزامی است' },
                { status: 400 }
            )
        }

        // Validate format
        const cleanUsername = username.toLowerCase().trim()
        const usernameRegex = /^[a-z0-9_]{3,20}$/

        if (!usernameRegex.test(cleanUsername)) {
            return NextResponse.json(
                {
                    available: false,
                    error: 'نام کاربری باید ۳ تا ۲۰ کاراکتر و فقط شامل حروف انگلیسی، اعداد و _ باشد'
                },
                { status: 400 }
            )
        }

        // Check if username exists
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .ilike('username', cleanUsername)
            .single()

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows returned (username available)
            console.error('Error checking username:', error)
            return NextResponse.json(
                { error: 'خطا در بررسی نام کاربری' },
                { status: 500 }
            )
        }

        const isAvailable = !data

        // If taken, generate suggestions
        let suggestions: string[] = []
        if (!isAvailable) {
            suggestions = await generateUsernameSuggestions(cleanUsername, supabase)
        }

        return NextResponse.json({
            available: isAvailable,
            username: cleanUsername,
            suggestions: isAvailable ? [] : suggestions,
        })

    } catch (error) {
        console.error('Error in check-username API:', error)
        return NextResponse.json(
            { error: 'خطای سرور' },
            { status: 500 }
        )
    }
}

/**
 * Generate username suggestions if the requested one is taken
 */
async function generateUsernameSuggestions(
    baseUsername: string,
    supabase: any
): Promise<string[]> {
    const suggestions: string[] = []

    // Strategy 1: Add numbers
    for (let i = 1; i <= 99; i++) {
        const suggestion = `${baseUsername}${i}`
        const { data } = await supabase
            .from('profiles')
            .select('username')
            .ilike('username', suggestion)
            .single()

        if (!data) {
            suggestions.push(suggestion)
            if (suggestions.length >= 3) break
        }
    }

    // Strategy 2: Add random numbers
    if (suggestions.length < 3) {
        for (let i = 0; i < 3; i++) {
            const randomNum = Math.floor(Math.random() * 1000)
            const suggestion = `${baseUsername}${randomNum}`

            const { data } = await supabase
                .from('profiles')
                .select('username')
                .ilike('username', suggestion)
                .single()

            if (!data && !suggestions.includes(suggestion)) {
                suggestions.push(suggestion)
            }
        }
    }

    // Strategy 3: Add underscore + number
    if (suggestions.length < 3) {
        for (let i = 1; i <= 99; i++) {
            const suggestion = `${baseUsername}_${i}`
            const { data } = await supabase
                .from('profiles')
                .select('username')
                .ilike('username', suggestion)
                .single()

            if (!data) {
                suggestions.push(suggestion)
                if (suggestions.length >= 3) break
            }
        }
    }

    return suggestions.slice(0, 3)
}
