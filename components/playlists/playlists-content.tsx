'use client'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Compass, Heart, List, Plus } from 'lucide-react'
import { useState } from 'react'
import { CreatePlaylistDialog } from './create-playlist-dialog'
import { DiscoverPlaylists } from './discover-playlists'
import { FollowedPlaylists } from './followed-playlists'
import { MyPlaylists } from './my-playlists'

interface PlaylistsContentProps {
    userId: string
}

export function PlaylistsContent({ userId }: PlaylistsContentProps) {
    const [activeTab, setActiveTab] = useState('my-playlists')
    const [createDialogOpen, setCreateDialogOpen] = useState(false)

    return (
        <div className="container max-w-6xl py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-bold mb-2">پلی‌لیست‌های کتاب</h1>
                    <p className="text-muted-foreground">
                        مجموعه‌های کتاب خود را بسازید و مدیریت کنید
                    </p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)} size="lg">
                    <Plus className="h-5 w-5 ml-2" />
                    پلی‌لیست جدید
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="my-playlists" className="gap-2">
                        <List className="h-4 w-4" />
                        <span className="hidden sm:inline">پلی‌لیست‌های من</span>
                    </TabsTrigger>
                    <TabsTrigger value="following" className="gap-2">
                        <Heart className="h-4 w-4" />
                        <span className="hidden sm:inline">دنبال می‌کنم</span>
                    </TabsTrigger>
                    <TabsTrigger value="discover" className="gap-2">
                        <Compass className="h-4 w-4" />
                        <span className="hidden sm:inline">کشف کنید</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="my-playlists">
                    <MyPlaylists userId={userId} />
                </TabsContent>

                <TabsContent value="following">
                    <FollowedPlaylists userId={userId} />
                </TabsContent>

                <TabsContent value="discover">
                    <DiscoverPlaylists userId={userId} />
                </TabsContent>
            </Tabs>

            <CreatePlaylistDialog
                userId={userId}
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
            />
        </div>
    )
}
