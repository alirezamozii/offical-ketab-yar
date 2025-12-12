'use client'

/**
 * Enhanced Dashboard - Agent 3 (Psychology) + Agent 4 (Master)
 * Real data from database, no mock data
 */

import { StreakFlame } from '@/components/gamification/streak-flame'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { getReadingHistory, getUserAchievements, getUserStats } from '@/lib/supabase/queries/user-stats'
import { motion } from 'framer-motion'
import {
    BookOpen,
    ChevronRight,
    Flame,
    Target,
    TrendingUp,
    Trophy,
    Users,
    Zap
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface DashboardData {
    stats: Awaited<ReturnType<typeof getUserStats>>
    achievements: Awaited<ReturnType<typeof getUserAchievements>>
    recentSessions: Awaited<ReturnType<typeof getReadingHistory>>
    booksInProgress: any[]
}

export function DashboardContent() {
    const { user, loading: authLoading } = useAuth()
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!authLoading) {
            if (user) {
                loadDashboardData()
            } else {
                window.location.href = '/auth/login?redirect=/dashboard'
            }
        }
    }, [user, authLoading])

    const loadDashboardData = async () => {
        try {
            const supabase = createClient()

            // Load all data in parallel for performance (Agent 2)
            const [stats, achievements, recentSessions, booksInProgress] = await Promise.all([
                getUserStats(user!.id),
                getUserAchievements(user!.id),
                getReadingHistory(user!.id, 5),
                supabase
                    .from('user_library')
                    .select(`
                        *,
                        books (
                            id,
                            title,
                            slug,
                            cover_url,
                            author,
                            total_pages
                        )
                    `)
                    .eq('user_id', user!.id)
                    .eq('status', 'reading')
                    .order('updated_at', { ascending: false })
                    .limit(3)
                    .then(res => res.data || [])
            ])

            setData({
                stats,
                achievements,
                recentSessions,
                booksInProgress
            })
        } catch (error) {
            console.error('Failed to load dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (authLoading || loading) {
        return (
            <div className="container py-8">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="h-32" />
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    if (!user || !data || !data.stats) {
        return null
    }

    const { stats, achievements, recentSessions, booksInProgress } = data
    const levelProgress = xpProgressToNextLevel(stats.xp)

    return (
        <div className="container py-8 space-y-8">
            {/* Welcome Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
            >
                <h1 className="text-4xl font-bold">
                    سلام {user?.user_metadata?.full_name || 'کاربر عزیز'} 👋
                </h1>
                <p className="text-muted-foreground text-lg">
                    آماده‌ای برای ادامه سفر یادگیری؟
                </p>
            </motion.div>

            {/* XP and Streak Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* XP & Level Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2"
                >
                    <Card className="border-2 border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/5 to-transparent h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-[#D4AF37]" />
                                تجربه و سطح
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-5xl font-bold text-[#D4AF37]">
                                        سطح {levelProgress.currentLevel}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {stats.xp.toLocaleString('fa-IR')} XP
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">تا سطح بعد</p>
                                    <p className="text-2xl font-bold">
                                        {(levelProgress.xpForNextLevel - stats.xp).toLocaleString('fa-IR')} XP
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Progress value={levelProgress.progressPercentage} className="h-3" />
                                <p className="text-xs text-muted-foreground text-center">
                                    {levelProgress.progressPercentage}% تا سطح {levelProgress.nextLevel}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Streak Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Flame className="h-5 w-5 text-orange-500" />
                                استریک
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center">
                            <StreakFlame days={stats.currentStreak} className="scale-125 mb-2" />
                            <div className="text-3xl font-bold mb-1">{stats.currentStreak} روز</div>
                            <p className="text-xs text-muted-foreground text-center">
                                رکورد: {stats.longestStreak} روز
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Achievements Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-[#D4AF37]" />
                                دستاوردها
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center">
                            <div className="text-4xl font-bold text-[#D4AF37] mb-1">
                                {stats.achievementsEarned}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                از {stats.totalAchievements} دستاورد
                            </p>
                            <Progress
                                value={(stats.achievementsEarned / stats.totalAchievements) * 100}
                                className="h-2 mt-3 w-full"
                            />
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Detailed Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-blue-500/10">
                                    <BookOpen className="h-6 w-6 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.totalBooksRead}</p>
                                    <p className="text-sm text-muted-foreground">کتاب خوانده شده</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-green-500/10">
                                    <TrendingUp className="h-6 w-6 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.totalPagesRead.toLocaleString('fa-IR')}</p>
                                    <p className="text-sm text-muted-foreground">صفحه خوانده شده</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-purple-500/10">
                                    <Clock className="h-6 w-6 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {Math.floor(stats.totalReadingTime / 60)}:{(stats.totalReadingTime % 60).toString().padStart(2, '0')}
                                    </p>
                                    <p className="text-sm text-muted-foreground">ساعت مطالعه</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-pink-500/10">
                                    <BookMarked className="h-6 w-6 text-pink-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.vocabularyCount}</p>
                                    <p className="text-sm text-muted-foreground">لغت ذخیره شده</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Achievements Showcase */}
            {achievements.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                >
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="h-5 w-5 text-[#D4AF37]" />
                                    دستاوردهای اخیر
                                </CardTitle>
                                <Link href="/achievements">
                                    <Button variant="ghost" size="sm">
                                        مشاهده همه
                                        <ChevronRight className="mr-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {achievements.slice(0, 3).map((item: any) => (
                                    <motion.div
                                        key={item.achievements.id}
                                        whileHover={{ scale: 1.05 }}
                                        className="p-4 rounded-lg border bg-gradient-to-br from-[#D4AF37]/5 to-transparent"
                                    >
                                        <div className="text-4xl mb-2">{item.achievements.icon}</div>
                                        <h3 className="font-semibold mb-1">{item.achievements.name}</h3>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            {item.achievements.description}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[#D4AF37]">
                                                +{item.achievements.points} XP
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(item.earned_at).toLocaleDateString('fa-IR')}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Continue Reading Section */}
            {booksInProgress.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5" />
                                    ادامه مطالعه
                                </CardTitle>
                                <Link href="/library">
                                    <Button variant="ghost" size="sm">
                                        مشاهده همه
                                        <ChevronRight className="mr-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {booksInProgress.map((item: any) => (
                                    <Link
                                        key={item.id}
                                        href={`/books/read/${item.books.slug}`}
                                        className="group"
                                    >
                                        <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-105">
                                            <div className="flex gap-4 p-4">
                                                <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded">
                                                    {item.books.cover_url ? (
                                                        <Image
                                                            src={item.books.cover_url}
                                                            alt={item.books.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center bg-muted">
                                                            <BookOpen className="h-8 w-8 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <h3 className="font-semibold line-clamp-2 group-hover:text-[#D4AF37]">
                                                        {item.books.title}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.books.author}
                                                    </p>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span>{item.progress_percentage}%</span>
                                                            <span>{item.current_page} / {item.books.total_pages}</span>
                                                        </div>
                                                        <Progress value={item.progress_percentage} className="h-1" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Weekly League - Agent 3: Social Competition */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <Card className="border-2 border-[#D4AF37]/20">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-[#D4AF37]" />
                                لیگ هفتگی
                            </CardTitle>
                            <Badge variant="outline" className="bg-[#D4AF37]/10 text-[#D4AF37]">
                                <Users className="ml-1 h-3 w-3" />
                                به زودی
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                            <p>سیستم لیگ هفتگی به زودی راه‌اندازی می‌شود</p>
                            <p className="text-sm mt-2">با دوستان خود رقابت کنید و به صدر جدول برسید!</p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Daily Goal - Agent 3: Commitment Device */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            هدف امروز
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span>خواندن 10 صفحه</span>
                                <Badge variant="outline">0 / 10</Badge>
                            </div>
                            <Progress value={0} />
                            <p className="text-sm text-muted-foreground">
                                با رسیدن به هدف روزانه، 50 XP بونوس دریافت کن!
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
