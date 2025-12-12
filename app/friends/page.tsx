import { FriendsContent } from '@/components/friends/friends-content'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
    title: 'دوستان | کتاب‌یار',
    description: 'دوستان خود را مدیریت کنید و فعالیت‌های آن‌ها را ببینید',
    robots: {
        index: false,
        follow: false
    }
}

export default async function FriendsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login?redirect=/friends')
    }

    return <FriendsContent userId={user.id} />
}
