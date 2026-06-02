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
import {
  deletePlaylist,
  followPlaylist,
  unfollowPlaylist,
  type PlaylistWithBooks,
} from '@/lib/supabase/queries/playlists'
import { motion } from 'framer-motion'
import { Eye, Globe, Heart, List, Loader2, Lock, Trash2, Users } from 'lucide-react'
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
      <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
        <div className="from-gold/20 via-gold/10 to-gold/5 relative flex aspect-video items-center justify-center bg-gradient-to-br">
          <List className="text-gold/50 h-16 w-16" />
          <div className="absolute right-2 top-2">
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

        <CardContent className="flex-1 p-4">
          <h3 className="mb-2 line-clamp-1 text-lg font-bold">{playlist.name}</h3>

          {playlist.description && (
            <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
              {playlist.description}
            </p>
          )}

          <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
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

        <CardFooter className="gap-2 p-4 pt-0">
          <Button asChild className="flex-1">
            <Link href={`/playlists/${playlist.id}`}>مشاهده</Link>
          </Button>

          {!isOwner && playlist.is_public && (
            <Button
              variant={isFollowing ? 'outline' : 'default'}
              size="icon"
              onClick={handleFollow}
              disabled={loading}
              aria-label={
                isFollowing ? `لغو دنبال کردن ${playlist.name}` : `دنبال کردن ${playlist.name}`
              }
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={`h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
              )}
            </Button>
          )}

          {isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" aria-label={`حذف پلی‌لیست ${playlist.name}`}>
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
                  <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}
