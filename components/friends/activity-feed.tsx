'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getFriendActivityFeed, type FriendActivity } from '@/lib/supabase/queries/activities'
import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import { BookOpen, Flame, List, Star, Trophy } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface ActivityFeedProps {
    userId: string
}

export function ActivityFeed({ userId }: ActivityFeedProps) {
    const [activities, setActivities] = useState<FriendActivity[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadActivities()
    }, [userId])

    async function loadActivities() {
        try {
            const data = await getFriendActivityFeed(userId)
            setActivities(data)
        } catch (error) {
            console.error('Error loading activities:', error)
        } finally {
            setLoading(false)
        }
    }

    function getActivityIcon(type: string) {
        switch (type) {
            case 'book_completed': return <BookOpen className="h-4 w-4" />
            case 'achievement_earned': return <Trophy className="h-4 w-4" />
            case 'level_up': return <Star className="h-4 w-4" />
            case 'streak_milestone': return <Flame className="h-4 w-4" />
            case 'playlist_created': return <List className="h-4 w-4" />
            default: return <BookOpen className="h-4 w-4" />
        }
    }

    function getActivityText(activity: FriendActivity) {
        const name = activity.full_name || activity.username || 'کاربر'

        switch (activity.activity_type) {
            case 'book_completed':
                return `${name} کتاب "${activity.book_title}" را تمام کرد`
            case 'achievement_earned':
                return `${name} دستاورد "${activity.metadata.achievement_name}" را کسب کرد`
            case 'level_up':
                return `${name} به ${activity.metadata.level_title} رسید`
            case 'streak_milestone':
                return `${name} به ${activity.metadata.streak_days} روز استریک رسید`
            case 'playlist_created':
                return `${name} پلی‌لیست "${activity.playlist_name}" را ساخت`
            default:
                return `${name} فعالیت جدیدی انجام داد`
        }
    }

    if (loading) {
        return <div className="text-center py-8">در حال بارگذاری...</div>
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">هنوز فعالیتی وجود ندارد</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {activities.map((activity, index) => (
                <motion.div
                    key={activity.activity_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                    <Avatar>
                        <AvatarImage src={activity.avatar_url || undefined} />
                        <AvatarFallback>
                            {activity.full_name?.charAt(0) || activity.username?.charAt(0) || '?'}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-2">
                            <Badge variant="outline" className="gap-1">
                                {getActivityIcon(activity.activity_type)}
                                <span className="text-xs">
                                    {activity.activity_type === 'book_completed' && 'کتاب تمام شد'}
                                    {activity.activity_type === 'achievement_earned' && 'دستاورد'}
                                    {activity.activity_type === 'level_up' && 'ارتقا سطح'}
                                    {activity.activity_type === 'streak_milestone' && 'استریک'}
                                    {activity.activity_type === 'playlist_created' && 'پلی‌لیست'}
                                </span>
                            </Badge>
                        </div>

                        <p className="text-sm mb-2">{getActivityText(activity)}</p>

                        {activity.book_id && activity.book_cover && (
                            <Link
                                href={`/books/${activity.book_id}`}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                            >
                                <Image
                                    src={activity.book_cover}
                                    alt={activity.book_title || ''}
                                    width={40}
                                    height={60}
                                    className="rounded object-cover"
                                />
                                <span className="text-sm font-medium">{activity.book_title}</span>
                            </Link>
                        )}

                        <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(activity.created_at), {
                                addSuffix: true,
                                locale: faIR
                            })}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
