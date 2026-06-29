'use client'

import { getPublicPlaylists } from '@/lib/supabase/queries/playlists'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Compass } from 'lucide-react'
import { PlaylistCard } from './playlist-card'

interface DiscoverPlaylistsProps {
    userId: string
}

export function DiscoverPlaylists({ userId }: DiscoverPlaylistsProps) {
    const queryClient = useQueryClient()

    // ⚡ Bolt: Use React Query to cache playlists data. Since this component is unmounted when switching tabs,
    // caching the result prevents unnecessary refetching and improves UI responsiveness.
    const { data: playlists = [], isLoading, refetch } = useQuery({
        queryKey: ['discover-playlists', userId],
        queryFn: () => getPublicPlaylists(50, userId),
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
                ))}
            </div>
        )
    }

    if (playlists.length === 0) {
        return (
            <div className="text-center py-12">
                <Compass className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">هنوز پلی‌لیست عمومی وجود ندارد</h3>
                <p className="text-muted-foreground">
                    اولین نفری باشید که پلی‌لیست عمومی می‌سازد!
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
                    isOwner={playlist.user_id === userId}
                    onUpdate={() => {
                        refetch()
                        // Invalidate followed queries in case data changed
                        queryClient.invalidateQueries({ queryKey: ['followed-playlists', userId] })
                    }}
                />
            ))}
        </div>
    )
}
