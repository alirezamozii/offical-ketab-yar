import { getDashboardStats, getReadingActivityChartData, getTopBooks, getUserSignupChartData } from '@/lib/admin/analytics'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const [stats, signupChart, activityChart, topBooks] = await Promise.all([
            getDashboardStats(),
            getUserSignupChartData(),
            getReadingActivityChartData(),
            getTopBooks(5),
        ])

        return NextResponse.json({
            success: true,
            stats,
            charts: {
                signups: signupChart,
                activity: activityChart,
            },
            topBooks,
        })
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
