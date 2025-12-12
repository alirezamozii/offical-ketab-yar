'use client'

import { BookCard } from '@/components/books/book-card'
import { LevelBadge } from '@/components/gamification/level-badge'
import { StreakFlame } from '@/components/gamification/streak-flame'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useLikedBooks } from '@/hooks/use-liked-books'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
    AlertCircle,
    BookOpen,
    Calendar,
    Clock,
    Flame,
    Heart,
    Target,
    TrendingUp,
    Trophy,
    Zap
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface DashboardData {
    profile: {
        id: string
        full_name: string | null
        xp: number
        level: number
        current_streak: number
        last_read_date: string | null
    }
    stats: {
        total_books: number
        completed_books: number
        total_pages: number
        total_reading_time: number
        books_this_week: number
        pages_this_week: number
    }
    currentlyReading: Array<{
        id: string
        progress_percentage: number
        current_page: number
        updated_at: string
        books: {
            id: string
            title: string
            slug: string
            cover_image_url: string | null
            total_pages: number
            authors: { name: string } | { name: string }[]
        }
    }>
    recentAchievements: Array<{
        id: string
        name: string
        description: string
        icon: string
        earned_at: string
    }>
}

export function DashboardEnhanced() {
    const [user, setUser] = useState<User | null>(null)
    const [showXPAnimation, setShowXPAnimation] = useState(false)
    const supabase = createClient()
    const { getLikedBooks } = useLikedBooks()
    const [likedBooksData, setLikedBooksData] = useState<any[]>([])

    // Get current user
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user)
        })
    }, [supabase])

    // Load liked books
    useEffect(() => {
        loadLikedBooks()
    }, [])

    async function loadLikedBooks() {
        const liked = await getLikedBooks()
        setLikedBooksData(liked)
    }

    // Single optimized query for ALL dashboard data (Agent 2: Performance)
    const { data, isLoading, error } = useQuery({
        queryKey: ['dashboard-complete', user?.id],
        queryFn: async (): Promise<DashboardData> => {
            if (!user?.id) throw new Error('No user')

            // Parallel queries for maximum speed
            const [profileRes, statsRes, booksRes, achievementsRes] = await Promise.all([
                // Profile with gamification
                supabase
                    .from('profiles')
                    .select('id, full_name, xp, level, current_streak, last_read_date')
                    .eq('id', user.id)
                    .single(),

                // Reading statistics
                supabase.rpc('get_user_reading_stats', { user_id: user.id }),

                // Currently reading books
                supabase
                    .from('user_library')
                    .select(`
                        id,
                        progress_percentage,
                        current_page,
                        updated_at,
                        books!inner (
                            id,
                            title,
                            slug,
                            cover_image_url,
                            total_pages,
                            authors!inner (name)
                        )
                    `)
                    .eq('user_id', user.id)
                    .eq('status', 'reading')
                    .order('updated_at', { ascending: false })
                    .limit(3),

                // Recent achievements
                supabase
                    .from('user_achievements')
                    .select(`
                        id,
                        earned_at,
                        achievements (
                            name,
                            description,
                            icon
                        )
                    `)
                    .eq('user_id', user.id)
                    .order('earned_at', { ascending: false })
                    .limit(3)
            ])

            if (profileRes.error) throw profileRes.error

            return {
                profile: profileRes.data,
                stats: statsRes.data || {
                    total_books: 0,
                    completed_books: 0,
                    total_pages: 0,
                    total_reading_time: 0,
                    books_this_week: 0,
                    pages_this_week: 0
                },
                currentlyReading: (booksRes.data || []).map((item) => {
                    const books = Array.isArray(item.books) ? item.books[0] : item.books
                    const authors = Array.isArray(books.authors) ? books.authors[0] : books.authors

                    return {
                        id: item.id,
                        progress_percentage: item.progress_percentage,
                        current_page: item.current_page,
                        updated_at: item.updated_at,
                        books: {
                            id: books.id,
                            title: books.title,
                            slug: books.slug,
                            cover_image_url: books.cover_image_url,
                            total_pages: books.total_pages,
                            authors
                        }
                    }
                }),
                recentAchievements: achievementsRes.data?.map((a) => {
                    const achievements = Array.isArray(a.achievements) ? a.achievements[0] : a.achievements

                    return {
                        id: a.id,
                        name: achievements.name,
                        description: achievements.description,
                        icon: achievements.icon,
                        earned_at: a.earned_at
                    }
                }) || []
            }
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
        gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
        retry: 2
    })

    // Show XP animation on mount (Agent 3: Psychology - Endowed Progress)
    useEffect(() => {
        if (data?.profile.xp) {
            setTimeout(() => setShowXPAnimation(true), 500)
        }
    }, [data?.profile.xp])

    // Calculate XP to next level
    const getXPToNextLevel = (level: number) => level * 100
    const xpProgress = data?.profile ? (data.profile.xp % getXPToNextLevel(data.profile.level)) : 0
    const xpNeeded = data?.profile ? getXPToNextLevel(data.profile.level) : 100
    const xpPercentage = (xpProgress / xpNeeded) * 100

    // Check if streak is in danger
    const isStreakInDanger = () => {
        if (!data?.profile.last_read_date) return false
        const lastRead = new Date(data.profile.last_read_date)
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)
        lastRead.setHours(0, 0, 0, 0)
        return lastRead.getTime() === yesterday.getTime()
    }

    // Personalized greeting (Agent 3: Psychology)
    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'صبح بخیر'
        if (hour < 18) return 'عصر بخیر'
        return 'شب بخیر'
    }

    // Error state
    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        خطا در بارگذاری داشبورد. لطفاً صفحه را رفرش کنید.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    // Loading state
    if (isLoading || !data) {
        return <DashboardSkeleton />
    }

    const { profile, stats, currentlyReading, recentAchievements } = data
    const userName = profile.full_name || 'کاربر عزیز'

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            {/* Personalized Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#D4AF37]/10 via-[#C9A961]/10 to-[#B8956A]/10 border-2 border-[#D4AF37]/30 p-6 shadow-lg dark:border-[#D4AF37]/20 dark:shadow-none"
            >
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-2">
                            {getGreeting()}، {userName}! 👋
                        </h1>
                        <p className="text-muted-foreground">
                            امروز چه کتابی می‌خوانیم؟
                        </p>

                        {/* XP Progress Bar (Agent 3: Loss Aversion) */}
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    پیشرفت تا سطح {profile.level + 1}
                                </span>
                                <span className="font-bold text-[#D4AF37]">
                                    {xpProgress} / {xpNeeded} XP
                                </span>
                            </div>
                            <Progress value={xpPercentage} className="h-2" />
                        </div>
                    </div>

                    {/* Gamification Badges */}
                    <div className="flex items-center gap-6">
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

                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <LevelBadge level={profile.level} size="md" />
                        </motion.div>
                    </div>
                </div>

                {/* XP Animation (Agent 3: Immediate Feedback) */}
                <AnimatePresence>
                    {showXPAnimation && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.8 }}
                            className="absolute top-4 right-4 bg-gradient-to-r from-[#D4AF37] to-[#C9A961] text-white px-4 py-2 rounded-full font-bold shadow-lg"
                        >
                            <Zap className="inline w-4 h-4 mr-1" />
                            {profile.xp} XP
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Streak Warning (Agent 3: FOMO) */}
            {isStreakInDanger() && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Alert className="border-orange-500 bg-orange-500/10">
                        <Flame className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-600 dark:text-orange-400">
                            ⚠️ استریک {profile.current_streak} روزه شما در خطر است! امروز حتماً مطالعه کنید.
                        </AlertDescription>
                    </Alert>
                </motion.div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={TrendingUp}
                    label="امتیاز کل"
                    value={profile.xp}
                    color="text-[#D4AF37]"
                    bgColor="bg-[#D4AF37]/10"
                    delay={0}
                />
                <StatCard
                    icon={BookOpen}
                    label="کتاب‌های خوانده شده"
                    value={stats.completed_books}
                    subtitle={`از ${stats.total_books} کتاب`}
                    color="text-blue-500"
                    bgColor="bg-blue-500/10"
                    delay={0.1}
                />
                <StatCard
                    icon={Clock}
                    label="زمان مطالعه"
                    value={`${Math.floor(stats.total_reading_time / 60)}h`}
                    subtitle={`${stats.total_reading_time % 60}m`}
                    color="text-green-500"
                    bgColor="bg-green-500/10"
                    delay={0.2}
                />
                <StatCard
                    icon={Calendar}
                    label="این هفته"
                    value={stats.pages_this_week}
                    subtitle={`${stats.books_this_week} کتاب`}
                    color="text-purple-500"
                    bgColor="bg-purple-500/10"
                    delay={0.3}
                />
            </div>

            {/* Currently Reading */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="border-2 shadow-md dark:border-border dark:shadow-none">
                    <CardHeader className="border-b-2 border-gray-100 dark:border-border">
                        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-foreground">
                            <BookOpen className="size-5" />
                            در حال خواندن
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {currentlyReading.length === 0 ? (
                            <EmptyState
                                icon={BookOpen}
                                title="هنوز کتابی شروع نکرده‌اید"
                                description="از کتابخانه ما یک کتاب انتخاب کنید"
                                actionLabel="مشاهده کتابخانه"
                                actionHref="/library"
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {currentlyReading.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <BookCard
                                            book={{
                                                ...item.books,
                                                authors: Array.isArray(item.books.authors)
                                                    ? item.books.authors[0]
                                                    : item.books.authors
                                            }}
                                            progress={item.progress_percentage}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Recent Achievements (Agent 3: Social Proof) */}
            {recentAchievements.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="border-2 shadow-md dark:border-border dark:shadow-none">
                        <CardHeader className="border-b-2 border-gray-100 dark:border-border">
                            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-foreground">
                                <Trophy className="size-5 text-[#D4AF37]" />
                                دستاوردهای اخیر
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {recentAchievements.map((achievement, index) => (
                                    <motion.div
                                        key={achievement.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-br from-[#D4AF37]/10 to-[#C9A961]/10 border border-[#D4AF37]/20"
                                    >
                                        <div className="text-3xl">{achievement.icon}</div>
                                        <div>
                                            <p className="font-bold text-sm">{achievement.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {achievement.description}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Liked Books Section (Agent 3: Collection Psychology) */}
            {likedBooksData.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="border-2 shadow-md dark:border-border dark:shadow-none">
                        <CardHeader className="border-b-2 border-gray-100 dark:border-border">
                            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-foreground">
                                <Heart className="size-5 text-red-500 fill-current" />
                                کتاب‌های مورد علاقه
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {likedBooksData.slice(0, 6).map((book, index) => (
                                    <motion.div
                                        key={book.book_id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Link href={`/books/${book.book_slug}`}>
                                            <div className="group relative aspect-[2/3] rounded-lg overflow-hidden border-2 border-transparent hover:border-gold-500 transition-all">
                                                {book.book_cover ? (
                                                    <img
                                                        src={book.book_cover}
                                                        alt={book.book_title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-gold-500/20 to-gold-600/20 flex items-center justify-center">
                                                        <BookOpen className="w-12 h-12 text-gold-600" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                                    <p className="text-white text-xs font-medium line-clamp-2">
                                                        {book.book_title}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                            {likedBooksData.length > 6 && (
                                <div className="mt-4 text-center">
                                    <Button variant="outline" asChild>
                                        <Link href="/library?filter=liked">
                                            مشاهده همه ({likedBooksData.length} کتاب)
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Daily Goal (Agent 3: Commitment Device) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
            >
                <Card className="border-2 shadow-md dark:border-border dark:shadow-none">
                    <CardHeader className="border-b-2 border-gray-100 dark:border-border">
                        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-foreground">
                            <Target className="size-5 text-green-500" />
                            هدف امروز
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DailyGoal
                            target={20}
                            current={stats.pages_this_week % 20}
                            unit="صفحه"
                        />
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}

// Stat Card Component
interface StatCardProps {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: number | string
    subtitle?: string
    color: string
    bgColor: string
    delay: number
}

function StatCard({ icon: Icon, label, value, subtitle, color, bgColor, delay }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Card className="border-2 shadow-md hover:shadow-lg transition-all duration-200 dark:border-border dark:shadow-none">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${bgColor} border border-current/20`}>
                            <Icon className={`size-6 ${color}`} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">{label}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-foreground">{value}</p>
                            {subtitle && (
                                <p className="text-xs font-medium text-gray-500 dark:text-muted-foreground">{subtitle}</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

// Daily Goal Component (Agent 3: Progress Visualization)
interface DailyGoalProps {
    target: number
    current: number
    unit: string
}

function DailyGoal({ target, current, unit }: DailyGoalProps) {
    const percentage = Math.min((current / target) * 100, 100)
    const remaining = Math.max(target - current, 0)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                    {current} / {target} {unit}
                </span>
                <span className="text-sm font-bold text-green-500">
                    {percentage.toFixed(0)}%
                </span>
            </div>
            <Progress value={percentage} className="h-3" />
            {remaining > 0 ? (
                <p className="text-sm text-muted-foreground text-center">
                    فقط {remaining} {unit} دیگر تا تکمیل هدف امروز! 💪
                </p>
            ) : (
                <p className="text-sm font-bold text-green-500 text-center">
                    🎉 هدف امروز تکمیل شد! عالی بود!
                </p>
            )}
        </div>
    )
}

// Empty State Component
interface EmptyStateProps {
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: string
    actionLabel: string
    actionHref: string
}

function EmptyState({ icon: Icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
                <Icon className="text-muted-foreground size-8" />
            </div>
            <h3 className="mb-2 text-lg font-medium">{title}</h3>
            <p className="text-muted-foreground mb-4">{description}</p>
            <Button asChild>
                <Link href={actionHref}>{actionLabel}</Link>
            </Button>
        </div>
    )
}

// Loading Skeleton
function DashboardSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="space-y-8">
                <Skeleton className="h-40 w-full rounded-2xl" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
    )
}
