'use client'

import { getFollowedPlaylists } from '@/lib/supabase/queries/playlists'
import { Heart } from 'lucide-react'
import { PlaylistCard } from './playlist-card'
import { useQuery } from '@tanstack/react-query'

interface FollowedPlaylistsProps {
    userId: string
}

export function FollowedPlaylists({ userId }: FollowedPlaylistsProps) {
    // ⚡ Bolt: Use react-query to cache playlist data and prevent re-fetching on tab switches
    const { data: playlists = [], isLoading: loading, refetch } = useQuery({
        queryKey: ['followed-playlists', userId],
        queryFn: () => getFollowedPlaylists(userId),
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    })

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
                ))}
            </div>
        )
    }

    if (playlists.length === 0) {
        return (
            <div className="text-center py-12">
                <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">هنوز پلی‌لیستی دنبال نمی‌کنید</h3>
                <p className="text-muted-foreground">
                    از بخش کشف کنید، پلی‌لیست‌های جالب را پیدا کنید
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((playlist) => (
                <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    userId={userId}
                    isOwner={false}
                    onUpdate={() => refetch()}
                />
            ))}
        </div>
    )
}
