'use client'

/**
 * Simplified Vocabulary Client Component
 * Full gamification integration with XP rewards, stats, and SM-2 spaced repetition
 */

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Target, TrendingUp, Trophy } from 'lucide-react'
import { VocabularyManager } from './vocabulary-manager'

interface VocabularyClientProps {
    userId: string
}

export function VocabularyClient({ userId }: VocabularyClientProps) {
    const supabase = createClient()

    // Fetch stats
    const { data: stats, isLoading } = useQuery({
        queryKey: ['vocabulary-stats', userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('user_words')
                .select('status, review_count, correct_count, incorrect_count')
                .eq('user_id', userId)

            if (error) throw error

            return {
                total: data.length,
                new: data.filter(w => w.status === 'new').length,
                learning: data.filter(w => w.status === 'learning').length,
                reviewing: data.filter(w => w.status === 'reviewing').length,
                mastered: data.filter(w => w.status === 'mastered').length,
                totalReviews: data.reduce((sum, w) => sum + w.review_count, 0),
                averageAccuracy: data.length > 0
                    ? Math.round(
                        (data.reduce((sum, w) => sum + (w.correct_count / Math.max(w.review_count, 1)), 0) / data.length) * 100
                    )
                    : 0,
            }
        },
        staleTime: 1000 * 60 * 5,
    })

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
                <Skeleton className="h-96" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">کل واژگان</p>
                                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                            </div>
                            <BookOpen className="w-8 h-8 text-[#D4AF37]" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">تسلط یافته</p>
                                <p className="text-2xl font-bold">{stats?.mastered || 0}</p>
                            </div>
                            <Trophy className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">مرورها</p>
                                <p className="text-2xl font-bold">{stats?.totalReviews || 0}</p>
                            </div>
                            <Target className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">دقت</p>
                                <p className="text-2xl font-bold">{stats?.averageAccuracy || 0}%</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Progress to Milestone */}
            {stats && stats.total > 0 && (
                <Card className="bg-gradient-to-r from-[#D4AF37]/10 to-[#C9A961]/10 border-[#D4AF37]/30">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">پیشرفت تا نشان بعدی</span>
                            <span className="text-sm text-muted-foreground">
                                {stats.total} / {stats.total < 50 ? 50 : stats.total < 100 ? 100 : 500}
                            </span>
                        </div>
                        <Progress
                            value={(stats.total / (stats.total < 50 ? 50 : stats.total < 100 ? 100 : 500)) * 100}
                            className="h-2"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            {stats.total < 50 ? `${50 - stats.total} کلمه تا نشان "سازنده واژگان"` :
                                stats.total < 100 ? `${100 - stats.total} کلمه تا نشان "استاد واژگان"` :
                                    `${500 - stats.total} کلمه تا نشان "افسانه واژگان"`}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Vocabulary Manager */}
            <VocabularyManager userId={userId} />
        </div>
    )
}
