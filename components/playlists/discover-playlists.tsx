'use client'

import { getPublicPlaylists, type PlaylistWithBooks } from '@/lib/supabase/queries/playlists'
import { Compass } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PlaylistCard } from './playlist-card'

interface DiscoverPlaylistsProps {
    userId: string
}

export function DiscoverPlaylists({ userId }: DiscoverPlaylistsProps) {
    const [playlists, setPlaylists] = useState<PlaylistWithBooks[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadPlaylists()
    }, [userId])

    async function loadPlaylists() {
        try {
            const data = await getPublicPlaylists(50, userId)
            setPlaylists(data)
        } catch (error) {
            console.error('Error loading public playlists:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
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
                    onUpdate={loadPlaylists}
                />
            ))}
        </div>
    )
}
