'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { acceptFriendRequest, getFriendRequests, rejectFriendRequest, type FriendRequest } from '@/lib/supabase/queries/friends'
import { motion } from 'framer-motion'
import { Check, Flame, Trophy, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface FriendRequestsProps {
    userId: string
}

export function FriendRequests({ userId }: FriendRequestsProps) {
    const [requests, setRequests] = useState<FriendRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        loadRequests()
    }, [userId])

    async function loadRequests() {
        try {
            const data = await getFriendRequests(userId)
            setRequests(data)
        } catch (error) {
            console.error('Error loading requests:', error)
            toast.error('خطا در بارگذاری درخواست‌ها')
        } finally {
            setLoading(false)
        }
    }

    async function handleAccept(requestId: string) {
        setProcessingId(requestId)
        try {
            await acceptFriendRequest(requestId)
            setRequests(requests.filter(r => r.request_id !== requestId))
            toast.success('درخواست دوستی پذیرفته شد')
        } catch (error) {
            console.error('Error accepting request:', error)
            toast.error('خطا در پذیرش درخواست')
        } finally {
            setProcessingId(null)
        }
    }

    async function handleReject(requestId: string) {
        setProcessingId(requestId)
        try {
            await rejectFriendRequest(requestId)
            setRequests(requests.filter(r => r.request_id !== requestId))
            toast.success('درخواست دوستی رد شد')
        } catch (error) {
            console.error('Error rejecting request:', error)
            toast.error('خطا در رد درخواست')
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) {
        return <div className="text-center py-8">در حال بارگذاری...</div>
    }

    if (requests.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">درخواست دوستی جدیدی ندارید</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {requests.map((request, index) => (
                <motion.div
                    key={request.request_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                >
                    <Avatar className="h-14 w-14">
                        <AvatarImage src={request.avatar_url || undefined} />
                        <AvatarFallback>
                            {request.full_name?.charAt(0) || request.username?.charAt(0) || '?'}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">
                                {request.full_name || request.username || 'کاربر'}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                                سطح {request.level}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Trophy className="h-3 w-3" />
                                {request.xp.toLocaleString('fa-IR')} XP
                            </span>
                            <span className="flex items-center gap-1">
                                <Flame className="h-3 w-3" />
                                {request.current_streak} روز
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={() => handleAccept(request.request_id)}
                            disabled={processingId === request.request_id}
                        >
                            <Check className="h-4 w-4 ml-1" />
                            قبول
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(request.request_id)}
                            disabled={processingId === request.request_id}
                        >
                            <X className="h-4 w-4 ml-1" />
                            رد
                        </Button>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
