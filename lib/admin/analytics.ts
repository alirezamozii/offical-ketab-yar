/**
 * ANALYTICS & STATISTICS
 * Get dashboard stats, charts data, and analytics
 */

import { createClient } from '@/lib/supabase/server'

export interface DashboardStats {
    users: {
        total: number
        active: number
        premium: number
        testUsers: number
        newToday: number
        newThisWeek: number
    }
    books: {
        total: number
        published: number
        draft: number
    }
    reading: {
        totalSessions: number
        totalPages: number
        avgSessionDuration: number
    }
    revenue: {
        total: number
        thisMonth: number
        lastMonth: number
    }
}

export interface ChartData {
    date: string
    value: number
    label?: string
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    const supabase = await createClient()

    // Get user stats
    const { data: users } = await supabase
        .from('profiles')
        .select('id, role, subscription_status, created_at, banned')

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const userStats = {
        total: users?.length || 0,
        active: users?.filter(u => !u.banned).length || 0,
        premium: users?.filter(u => u.subscription_status === 'premium').length || 0,
        testUsers: users?.filter(u => u.role === 'test_user').length || 0,
        newToday: users?.filter(u => new Date(u.created_at) >= today).length || 0,
        newThisWeek: users?.filter(u => new Date(u.created_at) >= weekAgo).length || 0,
    }

    // Get book stats from Sanity (placeholder - you'll need to implement Sanity query)
    const bookStats = {
        total: 0,
        published: 0,
        draft: 0,
    }

    // Get reading stats
    const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('pages_read, duration_minutes')

    const readingStats = {
        totalSessions: sessions?.length || 0,
        totalPages: sessions?.reduce((sum, s) => sum + (s.pages_read || 0), 0) || 0,
        avgSessionDuration: sessions?.length
            ? sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / sessions.length
            : 0,
    }

    // Revenue stats (placeholder)
    const revenueStats = {
        total: 0,
        thisMonth: 0,
        lastMonth: 0,
    }

    return {
        users: userStats,
        books: bookStats,
        reading: readingStats,
        revenue: revenueStats,
    }
}

/**
 * Get user signup chart data (last 30 days)
 */
export async function getUserSignupChartData(): Promise<ChartData[]> {
    const supabase = await createClient()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: users } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())

    // Group by date
    const grouped = new Map<string, number>()

    users?.forEach(user => {
        const date = new Date(user.created_at).toISOString().split('T')[0]
        grouped.set(date, (grouped.get(date) || 0) + 1)
    })

    // Fill in missing dates
    const result: ChartData[] = []
    for (let i = 29; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        result.push({
            date: dateStr,
            value: grouped.get(dateStr) || 0,
        })
    }

    return result
}

/**
 * Get reading activity chart data (last 30 days)
 */
export async function getReadingActivityChartData(): Promise<ChartData[]> {
    const supabase = await createClient()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('created_at, pages_read')
        .gte('created_at', thirtyDaysAgo.toISOString())

    // Group by date
    const grouped = new Map<string, number>()

    sessions?.forEach(session => {
        const date = new Date(session.created_at).toISOString().split('T')[0]
        grouped.set(date, (grouped.get(date) || 0) + (session.pages_read || 0))
    })

    // Fill in missing dates
    const result: ChartData[] = []
    for (let i = 29; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        result.push({
            date: dateStr,
            value: grouped.get(dateStr) || 0,
        })
    }

    return result
}

/**
 * Get top books by reading activity
 */
export async function getTopBooks(limit: number = 10): Promise<Array<{ book_id: string; title: string; reads: number }>> {
    const supabase = await createClient()

    const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('book_id')

    if (!sessions) return []

    // Count reads per book
    const bookCounts = new Map<string, number>()
    sessions.forEach(session => {
        if (session.book_id) {
            bookCounts.set(session.book_id, (bookCounts.get(session.book_id) || 0) + 1)
        }
    })

    // Sort and limit
    const sorted = Array.from(bookCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)

    return sorted.map(([book_id, reads]) => ({
        book_id,
        title: 'Book Title', // TODO: Fetch from Sanity
        reads,
    }))
}

/**
 * Export data to CSV
 */
export function exportToCSV(data: any[], filename: string): string {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    const csv = [
        headers.join(','),
        ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ].join('\n')

    return csv
}
