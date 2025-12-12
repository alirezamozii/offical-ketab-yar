import { PlaylistsContent } from '@/components/playlists/playlists-content'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
    title: 'پلی‌لیست‌های کتاب | کتاب‌یار',
    description: 'پلی‌لیست‌های کتاب خود را بسازید و مدیریت کنید',
    robots: {
        index: false,
        follow: false
    }
}

export default async function PlaylistsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login?redirect=/playlists')
    }

    return <PlaylistsContent userId={user.id} />
}
