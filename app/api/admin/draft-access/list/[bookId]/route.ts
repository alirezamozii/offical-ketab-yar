import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: { bookId: string } }
) {
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

        const { bookId } = params

        const { data, error } = await supabase
            .from('draft_access')
            .select(`
        *,
        profiles:user_id (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
            .eq('book_sanity_id', bookId)

        if (error) throw error

        return NextResponse.json({ success: true, access: data })
    } catch (error: any) {
        console.error('Error fetching draft access:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
