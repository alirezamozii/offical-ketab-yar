'use client'

import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { BookOpen, Clock, Flame, TrendingUp } from 'lucide-react'

interface ReadingStatsClientProps {
    profile: {
        xp?: number
        current_streak?: number
    }
}

export default function ReadingStatsClient({ profile }: ReadingStatsClientProps) {
    // Mock stats - will be replaced with real data
    const stats = [
        {
            icon: TrendingUp,
            label: 'امتیاز (XP)',
            value: profile.xp || 0,
            color: 'text-gold',
            bgColor: 'bg-gold/10',
        },
        {
            icon: Flame,
            label: 'استریک روزانه',
            value: `${profile.current_streak || 0} روز`,
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/10',
        },
        {
            icon: BookOpen,
            label: 'کتاب‌های خوانده شده',
            value: 5, // TODO: Get from database
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
        },
        {
            icon: Clock,
            label: 'زمان مطالعه',
            value: '12 ساعت', // TODO: Get from database
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
        },
    ]

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                    <stat.icon className={`size-6 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    )
}
