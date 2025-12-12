'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { logPlaylistCreated } from '@/lib/supabase/queries/activities'
import { createPlaylist } from '@/lib/supabase/queries/playlists'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface CreatePlaylistDialogProps {
    userId: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreatePlaylistDialog({ userId, open, onOpenChange }: CreatePlaylistDialogProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [isPublic, setIsPublic] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleCreate() {
        if (!name.trim()) {
            toast.error('نام پلی‌لیست الزامی است')
            return
        }

        setLoading(true)
        try {
            const playlist = await createPlaylist({
                user_id: userId,
                name: name.trim(),
                description: description.trim() || undefined,
                is_public: isPublic
            })

            // Log activity
            await logPlaylistCreated(userId, playlist.id)

            toast.success('پلی‌لیست با موفقیت ساخته شد')

            // Reset form
            setName('')
            setDescription('')
            setIsPublic(false)

            // Close dialog
            onOpenChange(false)

            // Refresh page to show new playlist
            window.location.reload()
        } catch (error) {
            console.error('Error creating playlist:', error)
            toast.error('خطا در ساخت پلی‌لیست')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>پلی‌لیست جدید</DialogTitle>
                    <DialogDescription>
                        یک مجموعه کتاب جدید بسازید و کتاب‌های مورد علاقه‌تان را سازماندهی کنید
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">نام پلی‌لیست *</Label>
                        <Input
                            id="name"
                            placeholder="مثلاً: کتاب‌های علمی تخیلی"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={100}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">توضیحات</Label>
                        <Textarea
                            id="description"
                            placeholder="توضیح کوتاهی درباره این پلی‌لیست..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            maxLength={500}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2 space-x-reverse">
                        <div className="space-y-0.5">
                            <Label htmlFor="public">پلی‌لیست عمومی</Label>
                            <p className="text-sm text-muted-foreground">
                                همه کاربران می‌توانند این پلی‌لیست را ببینند و دنبال کنند
                            </p>
                        </div>
                        <Switch
                            id="public"
                            checked={isPublic}
                            onCheckedChange={setIsPublic}
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1"
                        disabled={loading}
                    >
                        انصراف
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={loading || !name.trim()}
                        className="flex-1"
                    >
                        {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        ساخت پلی‌لیست
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
