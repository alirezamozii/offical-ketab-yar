'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { BookOpen, Clock, Flame, TrendingUp } from 'lucide-react'

interface ProfileStatsProps {
    userStats: {
        total_books_read: number
        total_pages_read: number
        total_reading_time: number
        longest_streak: number
    }
}

function ProfileStats({ userStats }: ProfileStatsProps) {
    const stats = [
        {
            icon: BookOpen,
            label: 'کتاب‌های خوانده شده',
            value: userStats.total_books_read,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
        },
        {
            icon: TrendingUp,
            label: 'صفحات خوانده شده',
            value: userStats.total_pages_read.toLocaleString('fa-IR'),
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
        },
        {
            icon: Clock,
            label: 'زمان مطالعه',
            value: formatReadingTime(userStats.total_reading_time),
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
        },
        {
            icon: Flame,
            label: 'بیشترین استریک',
            value: `${userStats.longest_streak} روز`,
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/10',
        },
    ]

    function formatReadingTime(minutes: number) {
        if (minutes < 60) {
            return `${minutes} دقیقه`
        }
        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60
        if (remainingMinutes === 0) {
            return `${hours} ساعت`
        }
        return `${hours}:${remainingMinutes.toString().padStart(2, '0')} ساعت`
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <Card className="border-muted hover:border-gold/30 transition-colors">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    'flex items-center justify-center size-12 rounded-full',
                                    stat.bgColor
                                )}>
                                    <stat.icon className={cn('size-6', stat.color)} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground mb-1">
                                        {stat.label}
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {stat.value}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    )
}
