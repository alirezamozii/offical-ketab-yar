import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: Update User Profile
 * POST /api/profile/update
 * 
 * Updates user profile information including username, avatar, birthday, gender
 */

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'غیرمجاز - لطفاً وارد شوید' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const {
            username,
            firstName,
            lastName,
            birthDate,
            birthDateJalali,
            gender,
            avatar,
            bio,
            website,
        } = body

        // Prepare update data
        const updateData: any = {
            updated_at: new Date().toISOString(),
        }

        // Username update (with validation)
        if (username !== undefined) {
            const cleanUsername = username.toLowerCase().trim()

            // Validate format
            const usernameRegex = /^[a-z0-9_]{3,20}$/
            if (!usernameRegex.test(cleanUsername)) {
                return NextResponse.json(
                    { error: 'نام کاربری باید ۳ تا ۲۰ کاراکتر و فقط شامل حروف انگلیسی، اعداد و _ باشد' },
                    { status: 400 }
                )
            }

            // Check if username is taken by another user
            const { data: existingUser } = await supabase
                .from('profiles')
                .select('id')
                .ilike('username', cleanUsername)
                .neq('id', user.id)
                .single()

            if (existingUser) {
                return NextResponse.json(
                    { error: 'این نام کاربری قبلاً گرفته شده است' },
                    { status: 400 }
                )
            }

            updateData.username = cleanUsername
        }

        // Name updates
        if (firstName !== undefined) updateData.first_name = firstName
        if (lastName !== undefined) updateData.last_name = lastName
        if (firstName || lastName) {
            updateData.full_name = `${firstName || ''} ${lastName || ''}`.trim()
        }

        // Birthday updates
        if (birthDate !== undefined) {
            updateData.birth_date = birthDate
            updateData.birth_date_jalali = birthDateJalali || null
        }

        // Gender update
        if (gender !== undefined) {
            if (gender && !['male', 'female', 'prefer_not_to_say'].includes(gender)) {
                return NextResponse.json(
                    { error: 'مقدار جنسیت نامعتبر است' },
                    { status: 400 }
                )
            }
            updateData.gender = gender || null
        }

        // Avatar update
        if (avatar !== undefined) {
            updateData.avatar_type = avatar.type
            updateData.avatar_preset_id = avatar.presetId || null
            updateData.avatar_custom_url = avatar.customUrl || null
        }

        // Bio and website
        if (bio !== undefined) updateData.bio = bio
        if (website !== undefined) updateData.website = website

        // Update profile
        const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id)
            .select()
            .single()

        if (updateError) {
            console.error('Error updating profile:', updateError)
            return NextResponse.json(
                { error: 'خطا در به‌روزرسانی پروفایل' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            profile: updatedProfile,
            message: 'پروفایل با موفقیت به‌روزرسانی شد',
        })

    } catch (error) {
        console.error('Error in profile update API:', error)
        return NextResponse.json(
            { error: 'خطای سرور' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/profile/update
 * Get current user profile
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'غیرمجاز - لطفاً وارد شوید' },
                { status: 401 }
            )
        }

        // Get profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (profileError) {
            console.error('Error fetching profile:', profileError)
            return NextResponse.json(
                { error: 'خطا در دریافت پروفایل' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            profile,
        })

    } catch (error) {
        console.error('Error in profile GET API:', error)
        return NextResponse.json(
            { error: 'خطای سرور' },
            { status: 500 }
        )
    }
}
