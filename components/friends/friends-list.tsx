'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getFriends, removeFriend, type Friend } from '@/lib/supabase/queries/friends'
import { motion } from 'framer-motion'
import { BookOpen, Flame, Trophy, UserMinus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface FriendsListProps {
    userId: string
}

export function FriendsList({ userId }: FriendsListProps) {
    const [friends, setFriends] = useState<Friend[]>([])
    const [loading, setLoading] = useState(true)
    const [removingId, setRemovingId] = useState<string | null>(null)

    useEffect(() => {
        loadFriends()
    }, [userId])

    async function loadFriends() {
        try {
            const data = await getFriends(userId)
            setFriends(data)
        } catch (error) {
            console.error('Error loading friends:', error)
            toast.error('خطا در بارگذاری دوستان')
        } finally {
            setLoading(false)
        }
    }

    async function handleRemoveFriend(friendId: string) {
        setRemovingId(friendId)
        try {
            await removeFriend(userId, friendId)
            setFriends(friends.filter(f => f.friend_id !== friendId))
            toast.success('دوست با موفقیت حذف شد')
        } catch (error) {
            console.error('Error removing friend:', error)
            toast.error('خطا در حذف دوست')
        } finally {
            setRemovingId(null)
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                        <div className="h-16 w-16 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-1/3" />
                            <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (friends.length === 0) {
        return (
            <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">هنوز دوستی ندارید</h3>
                <p className="text-muted-foreground mb-4">
                    از بخش جستجو کاربران جدید را پیدا کنید
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {friends.map((friend, index) => (
                <motion.div
                    key={friend.friend_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={friend.avatar_url || undefined} />
                        <AvatarFallback>
                            {friend.full_name?.charAt(0) || friend.username?.charAt(0) || '?'}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">
                                {friend.full_name || friend.username || 'کاربر'}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                                سطح {friend.level}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Trophy className="h-3 w-3" />
                                <span>{friend.xp.toLocaleString('fa-IR')} XP</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Flame className="h-3 w-3" />
                                <span>{friend.current_streak} روز</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                <span>{friend.books_read} کتاب</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/friends/${friend.username || friend.friend_id}`}>
                                مشاهده پروفایل
                            </Link>
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={removingId === friend.friend_id}
                                >
                                    <UserMinus className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>حذف دوست</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        آیا مطمئن هستید که می‌خواهید {friend.full_name || friend.username} را از لیست دوستان خود حذف کنید؟
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>انصراف</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRemoveFriend(friend.friend_id)}>
                                        حذف
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
