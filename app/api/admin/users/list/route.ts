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

        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const role = searchParams.get('role')
        const search = searchParams.get('search')

        let query = supabase
            .from('profiles')
            .select('id, email, full_name, role, is_banned, xp, current_streak, created_at')
            .order('created_at', { ascending: false })

        if (role && role !== 'all') {
            query = query.eq('role', role)
        }

        if (search) {
            query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
        }

        const { data: users, error } = await query

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            users: users.map(u => ({
                ...u,
                banned: u.is_banned
            }))
        })
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json(
            { error: 'Failed to fetch users', details: (error as Error).message },
            { status: 500 }
        )
    }
}
