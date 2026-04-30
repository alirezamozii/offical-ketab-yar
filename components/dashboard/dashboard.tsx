'use client'

/**
 * Enhanced Dashboard - Merged Profile + Dashboard + Settings
 * Agent 3 (Psychology) + Agent 4 (Master)
 */

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSupabaseAuth } from '@/hooks/use-supabase-auth'
import { createClient } from '@/lib/supabase/client'
import { getReadingHistory, getUserAchievements, getUserStats } from '@/lib/supabase/queries/user-stats'
import { motion } from 'framer-motion'
import {
    AlertCircle,
    Award,
    BookMarked,
    BookOpen,
    Calendar,
    ChevronRight,
    Clock,
    Edit,
    Flame,
    Mail,
    Target,
    TrendingUp,
    Trophy,
    Zap
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Profile {
    id: string
    username?: string
    full_name?: string
    avatar_url?: string
    bio?: string
    website?: string
    created_at: string
}

interface DashboardData {
    profile: Profile
    stats: Awaited<ReturnType<typeof getUserStats>>
    achievements: Awaited<ReturnType<typeof getUserAchievements>>
    recentSessions: Awaited<ReturnType<typeof getReadingHistory>>
    booksInProgress: any[]
}

export function Dashboard() {
    const router = useRouter()
    const { user, isLoading: authLoading } = useSupabaseAuth()
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState('overview')

    useEffect(() => {
        if (!authLoading) {
            if (user) {
                loadDashboardData()
            } else {
                router.push('/auth/login?redirect=/dashboard')
            }
        }
    }, [user, authLoading, router])



    const loadDashboardData = async () => {
        try {
            const supabase = createClient()

            // Load all data in parallel
            const [profile, stats, achievements, recentSessions, booksInProgress] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user!.id)
                    .single()
                    .then(res => res.data),
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

            if (!profile || !stats) {
                setError('خطا در بارگذاری اطلاعات')
                return
            }

            setData({
                profile,
                stats,
                achievements,
                recentSessions,
                booksInProgress
            })
        } catch (error) {
            console.error('Failed to load dashboard data:', error)
            setError('خطا در بارگذاری اطلاعات')
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

    if (error || !user || !data) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{error || 'خطا در بارگذاری اطلاعات'}</AlertDescription>
                </Alert>
            </div>
        )
    }

    const { profile, stats: rawStats, achievements, booksInProgress } = data
    const stats = rawStats!
    const levelProgress = {
        levelTitle: 'مطالعه کننده',
        currentLevel: 1,
        xpForNextLevel: 100,
        progressPercentage: 0,
        nextLevel: 2
    }

    return (
        <div className="container py-8 space-y-6">
            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card className="border-2 border-[#D4AF37]/20">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            {/* Avatar */}
                            <Avatar className="h-24 w-24 ring-4 ring-[#D4AF37]/20">
                                <AvatarImage src={profile.avatar_url || undefined} />
                                <AvatarFallback className="text-2xl bg-gradient-to-br from-gold-500 to-gold-600 text-white">
                                    {profile.full_name?.[0] || profile.username?.[0] || user.email?.[0].toUpperCase() || '?'}
                                </AvatarFallback>
                            </Avatar>

                            {/* User Info */}
                            <div className="flex-1 text-center md:text-right">
                                <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                                    <h1 className="text-3xl font-bold">
                                        {profile.full_name || profile.username || 'کاربر'}
                                    </h1>
                                    <Badge variant="outline" className="text-[#D4AF37]">
                                        {levelProgress.levelTitle}
                                    </Badge>
                                </div>
                                {profile.username && (
                                    <p className="text-muted-foreground mb-2">@{profile.username}</p>
                                )}
                                {profile.bio && (
                                    <p className="text-sm text-muted-foreground mb-3">{profile.bio}</p>
                                )}
                                <div className="flex items-center gap-4 justify-center md:justify-start text-sm text-muted-foreground flex-wrap">
                                    <div className="flex items-center gap-1">
                                        <Mail className="h-4 w-4" />
                                        {user.email}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        عضو از {new Date(profile.created_at).toLocaleDateString('fa-IR')}
                                    </div>
                                </div>
                            </div>

                            {/* Edit Button */}
                            <Link href="/settings">
                                <Button variant="outline">
                                    <Edit className="ml-2 h-4 w-4" />
                                    ویرایش پروفایل
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">
                        <Zap className="ml-2 h-4 w-4" />
                        نمای کلی
                    </TabsTrigger>
                    <TabsTrigger value="achievements">
                        <Award className="ml-2 h-4 w-4" />
                        دستاوردها
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
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
                                    <Flame className="h-12 w-12 text-orange-500 mb-2" />
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
                        <StatsCard
                            icon={<BookOpen className="h-6 w-6 text-blue-500" />}
                            label="کتاب خوانده شده"
                            value={stats.totalBooksRead}
                            delay={0.4}
                        />
                        <StatsCard
                            icon={<TrendingUp className="h-6 w-6 text-green-500" />}
                            label="صفحه خوانده شده"
                            value={stats.totalPagesRead}
                            delay={0.5}
                        />
                        <StatsCard
                            icon={<Clock className="h-6 w-6 text-purple-500" />}
                            label="ساعت مطالعه"
                            value={`${Math.floor(stats.totalReadingTime / 60)}:${(stats.totalReadingTime % 60).toString().padStart(2, '0')}`}
                            isTime
                            delay={0.6}
                        />
                        <StatsCard
                            icon={<BookMarked className="h-6 w-6 text-pink-500" />}
                            label="لغت ذخیره شده"
                            value={stats.vocabularyCount}
                            delay={0.7}
                        />
                    </div>

                    {/* Continue Reading Section */}
                    {booksInProgress.length > 0 && (
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
                    )}

                    {/* Daily Goal */}
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
                </TabsContent>

                {/* Achievements Tab */}
                <TabsContent value="achievements">
                    <Card>
                        <CardHeader>
                            <CardTitle>دستاوردهای کسب شده</CardTitle>
                            <CardDescription>
                                {stats.achievementsEarned} از {stats.totalAchievements} دستاورد را کسب کرده‌اید
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {achievements.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>هنوز دستاوردی کسب نکرده‌اید</p>
                                    <p className="text-sm mt-2">شروع به خواندن کنید تا اولین دستاورد خود را بگیرید!</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {achievements.map((item: any, index: number) => (
                                        <motion.div
                                            key={item.achievements.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="p-4 rounded-lg border bg-gradient-to-br from-[#D4AF37]/5 to-transparent hover:shadow-md transition-all"
                                        >
                                            <div className="text-4xl mb-2">{item.achievements.icon}</div>
                                            <h3 className="font-semibold mb-1">{item.achievements.name}</h3>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                {item.achievements.description}
                                            </p>
                                            <div className="flex items-center justify-between">
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
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    )
}

function StatsCard({
    icon,
    label,
    value,
    isTime = false,
    delay
}: {
    icon: React.ReactNode
    label: string
    value: number | string
    isTime?: boolean
    delay: number
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-muted">
                            {icon}
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {isTime ? value : typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
                            </p>
                            <p className="text-sm text-muted-foreground">{label}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
