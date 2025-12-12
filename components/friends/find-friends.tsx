'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { searchUsers, sendFriendRequest } from '@/lib/supabase/queries/friends'
import { Check, Search, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface FindFriendsProps {
    userId: string
}

export function FindFriends({ userId }: FindFriendsProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [sendingTo, setSendingTo] = useState<string | null>(null)

    async function handleSearch() {
        if (!query.trim()) return

        setLoading(true)
        try {
            const users = await searchUsers(query, userId)
            setResults(users)
        } catch (error) {
            console.error('Error searching:', error)
            toast.error('خطا در جستجو')
        } finally {
            setLoading(false)
        }
    }

    async function handleSendRequest(friendId: string) {
        setSendingTo(friendId)
        try {
            await sendFriendRequest(userId, friendId)
            toast.success('درخواست دوستی ارسال شد')
            setResults(results.map(u =>
                u.id === friendId ? { ...u, requestSent: true } : u
            ))
        } catch (error: any) {
            toast.error(error.message || 'خطا در ارسال درخواست')
        } finally {
            setSendingTo(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Input
                    placeholder="نام کاربری یا نام کامل را جستجو کنید..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading}>
                    <Search className="h-4 w-4" />
                </Button>
            </div>

            {results.length > 0 && (
                <div className="space-y-3">
                    {results.map((user) => (
                        <div key={user.id} className="flex items-center gap-4 p-4 border rounded-lg">
                            <Avatar>
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback>{user.full_name?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h3 className="font-semibold">{user.full_name || user.username}</h3>
                                <p className="text-sm text-muted-foreground">@{user.username}</p>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => handleSendRequest(user.id)}
                                disabled={sendingTo === user.id || user.requestSent}
                            >
                                {user.requestSent ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
