import { LeaderboardTabs } from '@/components/leaderboard/leaderboard-tabs'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
    title: 'لیدربورد | کتاب‌یار',
    description: 'رتبه‌بندی برترین خوانندگان - رقابت با دیگران',
    robots: {
        index: false,
        follow: false
    }
}

export default async function LeaderboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login?redirect=/leaderboard')
    }

    return (
        <div className="container py-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">🏆 لیدربورد</h1>
                    <p className="text-muted-foreground text-lg">
                        با بهترین خوانندگان رقابت کن و به صدر جدول برس!
                    </p>
                </div>

                <LeaderboardTabs userId={user.id} />
            </div>
        </div>
    )
}
