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
        const { email, password, full_name } = body

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: full_name || 'Test User'
            }
        })

        if (authError) {
            throw authError
        }

        // Update profile to test_user role
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                role: 'test_user',
                full_name: full_name || 'Test User'
            })
            .eq('id', authData.user.id)

        if (profileError) {
            throw profileError
        }

        return NextResponse.json({
            success: true,
            user: authData.user,
            message: 'کاربر تستی با موفقیت ایجاد شد / Test user created successfully'
        }, { status: 201 })
    } catch (error) {
        console.error('Error creating test user:', error)
        return NextResponse.json(
            { error: 'Failed to create test user', details: (error as Error).message },
            { status: 500 }
        )
    }
}
