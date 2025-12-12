'use client'

/**
 * Leaderboard Tabs Component
 * Shows rankings for Today, Week, Month, Year, All-Time
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { getRankColor, getRankEmoji } from '@/lib/utils/gamification'
import { motion } from 'framer-motion'
import { Crown, TrendingUp, Trophy, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

interface LeaderboardEntry {
    rank: number
    user_id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
    xp_gained: number
    pages_read: number
    total_xp: number
    level: number
}

interface UserRank {
    rank: number
    xp_gained: number
    pages_read: number
    total_users: number
}

export function LeaderboardTabs({ userId }: { userId: string }) {
    const [activeTab, setActiveTab] = useState('weekly')
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [userRank, setUserRank] = useState<UserRank | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadLeaderboard(activeTab)
    }, [activeTab, userId])

    const loadLeaderboard = async (period: string) => {
        setLoading(true)
        try {
            const supabase = createClient()

            // Get leaderboard data
            const { data: leaderboardData, error: leaderboardError } = await supabase
                .rpc('get_leaderboard', {
                    p_period_type: period,
                    p_limit: 100
                })

            if (leaderboardError) throw leaderboardError

            // Get user's rank
            const { data: rankData, error: rankError } = await supabase
                .rpc('get_user_rank', {
                    p_user_id: userId,
                    p_period_type: period
                })

            if (rankError) console.error('Rank error:', rankError)

            setLeaderboard(leaderboardData || [])
            setUserRank(rankData?.[0] || null)
        } catch (error) {
            console.error('Failed to load leaderboard:', error)
        } finally {
            setLoading(false)
        }
    }

    const getPeriodLabel = (period: string) => {
        switch (period) {
            case 'daily': return 'امروز'
            case 'weekly': return 'این هفته'
            case 'monthly': return 'این ماه'
            case 'yearly': return 'امسال'
            case 'alltime': return 'همه زمان‌ها'
            default: return period
        }
    }

    return (
        <div className="space-y-6">
            {/* User's Current Rank */}
            {userRank && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="border-2 border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/10 to-transparent">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`text-4xl font-bold ${getRankColor(userRank.rank)}`}>
                                        {getRankEmoji(userRank.rank)}
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">رتبه شما</p>
                                        <p className="text-2xl font-bold">
                                            {userRank.rank} از {userRank.total_users}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right space-y-1">
                                    <div className="flex items-center gap-2 justify-end">
                                        <span className="font-bold text-[#D4AF37]">
                                            {userRank.xp_gained.toLocaleString('fa-IR')} XP
                                        </span>
                                        <Zap className="h-4 w-4 text-[#D4AF37]" />
                                    </div>
                                    <div className="flex items-center gap-2 justify-end text-sm text-muted-foreground">
                                        <span>{userRank.pages_read.toLocaleString('fa-IR')} صفحه</span>
                                        <TrendingUp className="h-3 w-3" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Leaderboard Tabs */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-[#D4AF37]" />
                        لیدربورد
                    </CardTitle>
                    <CardDescription>
                        رتبه‌بندی برترین خوانندگان
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="daily">امروز</TabsTrigger>
                            <TabsTrigger value="weekly">هفته</TabsTrigger>
                            <TabsTrigger value="monthly">ماه</TabsTrigger>
                            <TabsTrigger value="yearly">سال</TabsTrigger>
                            <TabsTrigger value="alltime">همیشه</TabsTrigger>
                        </TabsList>

                        {['daily', 'weekly', 'monthly', 'yearly', 'alltime'].map((period) => (
                            <TabsContent key={period} value={period} className="space-y-4 mt-6">
                                {loading ? (
                                    <div className="space-y-3">
                                        {[...Array(10)].map((_, i) => (
                                            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                                        ))}
                                    </div>
                                ) : leaderboard.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>هنوز کسی در این بازه فعالیتی نداشته</p>
                                        <p className="text-sm mt-2">اولین نفر باش!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {leaderboard.map((entry, index) => (
                                            <LeaderboardEntry
                                                key={entry.user_id}
                                                entry={entry}
                                                isCurrentUser={entry.user_id === userId}
                                                delay={index * 0.05}
                                            />
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}

function LeaderboardEntry({
    entry,
    isCurrentUser,
    delay
}: {
    entry: LeaderboardEntry
    isCurrentUser: boolean
    delay: number
}) {
    const isTopThree = entry.rank <= 3

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            className={`
                relative overflow-hidden rounded-lg border p-4
                ${isCurrentUser ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-border'}
                ${isTopThree ? 'bg-gradient-to-r from-muted/50 to-transparent' : ''}
                hover:shadow-md transition-all
            `}
        >
            {/* Top 3 Crown Effect */}
            {isTopThree && (
                <div className="absolute top-0 right-0 p-2">
                    <Crown className={`h-5 w-5 ${getRankColor(entry.rank)}`} />
                </div>
            )}

            <div className="flex items-center gap-4">
                {/* Rank */}
                <div className={`text-3xl font-bold ${getRankColor(entry.rank)} min-w-[60px] text-center`}>
                    {getRankEmoji(entry.rank)}
                </div>

                {/* Avatar */}
                <Avatar className={`h-12 w-12 ${isTopThree ? 'ring-2 ring-[#D4AF37]' : ''}`}>
                    <AvatarImage src={entry.avatar_url || undefined} />
                    <AvatarFallback>
                        {entry.full_name?.[0] || entry.username?.[0] || '?'}
                    </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">
                            {entry.full_name || entry.username || 'کاربر ناشناس'}
                        </p>
                        {isCurrentUser && (
                            <Badge variant="outline" className="text-[#D4AF37]">شما</Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        سطح {entry.level}
                    </p>
                </div>

                {/* Stats */}
                <div className="text-right space-y-1">
                    <div className="flex items-center gap-2 justify-end">
                        <span className="font-bold text-[#D4AF37]">
                            {entry.xp_gained.toLocaleString('fa-IR')}
                        </span>
                        <Zap className="h-4 w-4 text-[#D4AF37]" />
                    </div>
                    <div className="flex items-center gap-2 justify-end text-sm text-muted-foreground">
                        <span>{entry.pages_read.toLocaleString('fa-IR')} صفحه</span>
                        <TrendingUp className="h-3 w-3" />
                    </div>
                </div>
            </div>

            {/* Special Animation for Top 3 */}
            {isTopThree && (
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <div className={`h-full w-full bg-gradient-to-r ${entry.rank === 1 ? 'from-yellow-500/20' :
                            entry.rank === 2 ? 'from-gray-400/20' :
                                'from-orange-600/20'
                        } to-transparent`} />
                </motion.div>
            )}
        </motion.div>
    )
}
