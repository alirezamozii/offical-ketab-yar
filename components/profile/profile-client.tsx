'use client'

import { SettingsTabs } from '@/components/settings/settings-tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { getUserAchievements, getUserStats } from '@/lib/supabase/queries/user-stats'
import { xpProgressToNextLevel } from '@/lib/utils/gamification'
import type { User } from '@supabase/supabase-js'
import { motion } from 'framer-motion'
import { AlertCircle, Award, BookOpen, Calendar, Edit, Flame, Mail, Settings, Trophy, Zap } from 'lucide-react'
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

export default function ProfileClient() {
    const router = useRouter()
    const supabase = createClient()
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [stats, setStats] = useState<Awaited<ReturnType<typeof getUserStats>>>(null)
    const [achievements, setAchievements] = useState<Awaited<ReturnType<typeof getUserAchievements>>>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()

                if (userError || !authUser) {
                    router.push('/auth/login')
                    return
                }

                setUser(authUser)

                // Load profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single()

                if (profileError) {
                    console.error('Profile error:', profileError)
                    setError('خطا در بارگذاری پروفایل')
                } else {
                    setProfile(profileData)
                }

                // Load stats and achievements
                const [statsData, achievementsData] = await Promise.all([
                    getUserStats(authUser.id),
                    getUserAchievements(authUser.id)
                ])

                setStats(statsData)
                setAchievements(achievementsData)

            } catch (err) {
                console.error('Error fetching data:', err)
                setError('خطا در بارگذاری اطلاعات')
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [router, supabase])

    if (isLoading) {
        return null
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )
    }

    if (!user || !profile || !stats) {
        return null
    }

    const levelProgress = xpProgressToNextLevel(stats.xp)

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
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
                                <AvatarFallback className="text-2xl">
                                    {profile.full_name?.[0] || profile.username?.[0] || '?'}
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
                                <div className="flex items-center gap-4 justify-center md:justify-start text-sm text-muted-foreground">
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
                            <Button asChild variant="outline">
                                <Link href="#settings">
                                    <Edit className="ml-2 h-4 w-4" />
                                    ویرایش پروفایل
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatsCard
                    icon={<Zap className="h-5 w-5 text-[#D4AF37]" />}
                    label="سطح"
                    value={levelProgress.currentLevel}
                    subtitle={`${stats.xp.toLocaleString('fa-IR')} XP`}
                    delay={0.1}
                />
                <StatsCard
                    icon={<Flame className="h-5 w-5 text-orange-500" />}
                    label="استریک"
                    value={stats.currentStreak}
                    subtitle={`رکورد: ${stats.longestStreak}`}
                    delay={0.2}
                />
                <StatsCard
                    icon={<BookOpen className="h-5 w-5 text-blue-500" />}
                    label="کتاب خوانده"
                    value={stats.totalBooksRead}
                    subtitle={`${stats.totalPagesRead.toLocaleString('fa-IR')} صفحه`}
                    delay={0.3}
                />
                <StatsCard
                    icon={<Trophy className="h-5 w-5 text-[#D4AF37]" />}
                    label="دستاوردها"
                    value={stats.achievementsEarned}
                    subtitle={`از ${stats.totalAchievements}`}
                    delay={0.4}
                />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="achievements" className="space-y-4" id="settings">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="achievements">
                        <Award className="ml-2 h-4 w-4" />
                        دستاوردها
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                        <Settings className="ml-2 h-4 w-4" />
                        تنظیمات
                    </TabsTrigger>
                </TabsList>

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

                <TabsContent value="settings">
                    <SettingsTabs userId={user.id} userEmail={user.email || ''} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function StatsCard({
    icon,
    label,
    value,
    subtitle,
    delay
}: {
    icon: React.ReactNode
    label: string
    value: number
    subtitle: string
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
                    <div className="flex items-center gap-3 mb-2">
                        {icon}
                        <span className="text-sm text-muted-foreground">{label}</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">{value.toLocaleString('fa-IR')}</div>
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                </CardContent>
            </Card>
        </motion.div>
    )
}
