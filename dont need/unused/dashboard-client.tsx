'use client'

import { LevelBadge } from '@/components/gamification/level-badge'
import { StreakFlame } from '@/components/gamification/streak-flame'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import CurrentlyReading from './currently-reading-client'
import ReadingStatsClient from './reading-stats-client'
import { RecommendedBooks } from './recommended-books'

interface UserProfile {
    id: string
    full_name: string | null
    xp: number
    level: number
    current_streak: number
    last_read_date: string | null
}

export function DashboardClient() {
    const [user, setUser] = useState<User | null>(null)
    const supabase = createClient()

    // Get current user
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user)
        })
    }, [supabase])

    // Fetch user profile with gamification data
    const { data: profile, isLoading } = useQuery({
        queryKey: ['user-profile', user?.id],
        queryFn: async () => {
            if (!user?.id) return null

            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, xp, level, current_streak, last_read_date')
                .eq('id', user.id)
                .single()

            if (error) throw error
            return data as UserProfile
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes (Agent 2: Performance)
    })

    // Check if streak is in danger (last read was yesterday)
    const isStreakInDanger = () => {
        if (!profile?.last_read_date) return false
        const lastRead = new Date(profile.last_read_date)
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)
        lastRead.setHours(0, 0, 0, 0)
        return lastRead.getTime() === yesterday.getTime()
    }

    if (isLoading || !profile) {
        return <DashboardSkeleton />
    }

    // Personalized greeting (Agent 3: Psychology)
    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'صبح بخیر'
        if (hour < 18) return 'عصر بخیر'
        return 'شب بخیر'
    }

    const userName = profile.full_name || 'کاربر عزیز'

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Personalized Header with Gamification */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            {getGreeting()}، {userName}! 👋
                        </h1>
                        <p className="text-muted-foreground">
                            امروز چه کتابی می‌خوانیم؟
                        </p>
                    </div>

                    {/* Gamification Stats */}
                    <div className="flex items-center gap-6">
                        {/* Streak */}
                        {profile.current_streak > 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <StreakFlame
                                    days={profile.current_streak}
                                    isInDanger={isStreakInDanger()}
                                />
                            </motion.div>
                        )}

                        {/* Level Badge */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <LevelBadge level={profile.level} size="md" />
                        </motion.div>
                    </div>
                </div>

                {/* Streak Warning */}
                {isStreakInDanger() && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-4"
                    >
                        <Card className="border-orange-500 bg-orange-500/10">
                            <CardContent className="p-4">
                                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                    ⚠️ استریک {profile.current_streak} روزه شما در خطر است! امروز حتماً مطالعه کنید.
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </motion.div>

            {/* Dashboard Content */}
            <div className="grid gap-6">
                <ReadingStatsClient profile={profile} />
                <CurrentlyReading userId={user?.id || ''} />
                <div>
                    <h2 className="text-2xl font-bold mb-4">کتاب‌های پیشنهادی</h2>
                    <RecommendedBooks />
                </div>
            </div>
        </div>
    )
}

function DashboardSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="flex gap-6">
                        <Skeleton className="w-16 h-16 rounded-full" />
                        <Skeleton className="w-16 h-16 rounded-full" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <Skeleton className="h-20 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-80" />
                    ))}
                </div>
            </div>
        </div>
    )
}
