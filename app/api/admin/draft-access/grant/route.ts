import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
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

        const body = await request.json()
        const { user_id, book_sanity_id } = body

        const { data, error } = await supabase
            .from('draft_access')
            .insert({
                user_id,
                book_sanity_id,
                granted_by: user.id,
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, access: data })
    } catch (error: any) {
        console.error('Error granting draft access:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
