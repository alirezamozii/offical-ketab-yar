import { createClient } from '@/lib/supabase/client'

export async function checkDraftAccess(bookSanityId: string): Promise<boolean> {
    try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return false

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role === 'admin') return true

        if (profile?.role === 'test_user') {
            const { data: access } = await supabase
                .from('draft_access')
                .select('*')
                .eq('user_id', user.id)
                .eq('book_sanity_id', bookSanityId)
                .single()

            return !!access
        }

        return false
    } catch (error) {
        console.error('Error checking draft access:', error)
        return false
    }
}
