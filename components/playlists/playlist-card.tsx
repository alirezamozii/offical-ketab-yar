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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { deletePlaylist, followPlaylist, unfollowPlaylist, type PlaylistWithBooks } from '@/lib/supabase/queries/playlists'
import { motion } from 'framer-motion'
import { Eye, Globe, Heart, List, Lock, Trash2, Users } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

interface PlaylistCardProps {
    playlist: PlaylistWithBooks
    userId: string
    isOwner: boolean
    onUpdate?: () => void
}

export function PlaylistCard({ playlist, userId, isOwner, onUpdate }: PlaylistCardProps) {
    const [isFollowing, setIsFollowing] = useState(playlist.is_following || false)
    const [loading, setLoading] = useState(false)

    async function handleFollow() {
        setLoading(true)
        try {
            if (isFollowing) {
                await unfollowPlaylist(playlist.id, userId)
                setIsFollowing(false)
                toast.success('دنبال کردن لغو شد')
            } else {
                await followPlaylist(playlist.id, userId)
                setIsFollowing(true)
                toast.success('پلی‌لیست دنبال شد')
            }
            onUpdate?.()
        } catch (error) {
            console.error('Error following playlist:', error)
            toast.error('خطا در عملیات')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        try {
            await deletePlaylist(playlist.id)
            toast.success('پلی‌لیست حذف شد')
            onUpdate?.()
        } catch (error) {
            console.error('Error deleting playlist:', error)
            toast.error('خطا در حذف پلی‌لیست')
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
        >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                <div className="aspect-video bg-gradient-to-br from-gold/20 via-gold/10 to-gold/5 flex items-center justify-center relative">
                    <List className="h-16 w-16 text-gold/50" />
                    <div className="absolute top-2 right-2">
                        {playlist.is_public ? (
                            <Badge variant="secondary" className="gap-1">
                                <Globe className="h-3 w-3" />
                                عمومی
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="gap-1">
                                <Lock className="h-3 w-3" />
                                خصوصی
                            </Badge>
                        )}
                    </div>
                </div>

                <CardContent className="p-4 flex-1">
                    <h3 className="font-bold text-lg mb-2 line-clamp-1">{playlist.name}</h3>

                    {playlist.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {playlist.description}
                        </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                            <List className="h-3 w-3" />
                            {playlist.book_count} کتاب
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {playlist.follower_count} دنبال‌کننده
                        </span>
                        <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {playlist.view_count} بازدید
                        </span>
                    </div>

                    {playlist.creator && (
                        <p className="text-xs text-muted-foreground">
                            توسط {playlist.creator.full_name || playlist.creator.username}
                        </p>
                    )}
                </CardContent>

                <CardFooter className="p-4 pt-0 gap-2">
                    <Button asChild className="flex-1">
                        <Link href={`/playlists/${playlist.id}`}>
                            مشاهده
                        </Link>
                    </Button>

                    {!isOwner && playlist.is_public && (
                        <Button
                            variant={isFollowing ? "outline" : "default"}
                            size="icon"
                            onClick={handleFollow}
                            disabled={loading}
                        >
                            <Heart className={`h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
                        </Button>
                    )}

                    {isOwner && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>حذف پلی‌لیست</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        آیا مطمئن هستید که می‌خواهید این پلی‌لیست را حذف کنید؟ این عمل قابل بازگشت نیست.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>انصراف</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete}>
                                        حذف
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </CardFooter>
            </Card>
        </motion.div>
    )
}
