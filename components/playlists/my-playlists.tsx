'use client'

import { getUserPlaylists } from '@/lib/supabase/queries/playlists'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { List } from 'lucide-react'
import { PlaylistCard } from './playlist-card'

interface MyPlaylistsProps {
    userId: string
}

export function MyPlaylists({ userId }: MyPlaylistsProps) {
    const queryClient = useQueryClient()

    // ⚡ Bolt: Use React Query to cache playlists data. Since this component is unmounted when switching tabs,
    // caching the result prevents unnecessary refetching and improves UI responsiveness.
    const { data: playlists = [], isLoading, refetch } = useQuery({
        queryKey: ['my-playlists', userId],
        queryFn: () => getUserPlaylists(userId),
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    if (isLoading) {
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
                <List className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">هنوز پلی‌لیستی ندارید</h3>
                <p className="text-muted-foreground">
                    اولین پلی‌لیست خود را بسازید و کتاب‌های مورد علاقه‌تان را سازماندهی کنید
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
                    isOwner={true}
                    onUpdate={() => {
                        refetch()
                        // Invalidate discover and followed queries in case data changed
                        queryClient.invalidateQueries({ queryKey: ['discover-playlists', userId] })
                        queryClient.invalidateQueries({ queryKey: ['followed-playlists', userId] })
                    }}
                />
            ))}
        </div>
    )
}
