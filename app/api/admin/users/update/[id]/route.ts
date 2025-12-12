import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function checkAdminAuth() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { authorized: false, error: 'Unauthorized', userId: null }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'admin') {
        return { authorized: false, error: 'Forbidden', userId: null }
    }

    return { authorized: true, userId: user.id }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await checkAdminAuth()
        if (!auth.authorized) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.error === 'Unauthorized' ? 401 : 403 }
            )
        }

        const supabase = await createClient()
        const body = await request.json()
        const updates: Record<string, any> = {}

        // Handle role change
        if (body.role !== undefined) {
            updates.role = body.role

            // Track who made them admin
            if (body.role === 'admin') {
                updates.made_admin_by = auth.userId
                updates.made_admin_at = new Date().toISOString()
            }
        }

        // Handle ban/unban
        if (body.banned !== undefined) {
            updates.is_banned = body.banned

            if (body.banned) {
                updates.banned_at = new Date().toISOString()
                updates.banned_reason = body.reason || 'No reason provided'
            } else {
                updates.banned_at = null
                updates.banned_reason = null
            }
        }

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', params.id)
            .select()
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            user: data,
            message: 'کاربر با موفقیت به‌روزرسانی شد / User updated successfully'
        })
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json(
            { error: 'Failed to update user', details: (error as Error).message },
            { status: 500 }
        )
    }
}
