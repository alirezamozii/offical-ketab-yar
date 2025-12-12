'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface ChangePasswordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userEmail: string
}

export default function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            toast.error('رمز عبور جدید و تکرار آن یکسان نیستند')
            return
        }

        if (newPassword.length < 6) {
            toast.error('رمز عبور باید حداقل ۶ کاراکتر باشد')
            return
        }

        setIsLoading(true)

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            })

            if (error) throw error

            toast.success('رمز عبور با موفقیت تغییر کرد')
            onOpenChange(false)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (error) {
            console.error('Error changing password:', error)
            toast.error('خطا در تغییر رمز عبور')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>تغییر رمز عبور</DialogTitle>
                    <DialogDescription>
                        رمز عبور جدید خود را وارد کنید
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">رمز عبور فعلی</Label>
                        <div className="relative">
                            <Lock className="absolute right-3 top-3 size-4 text-muted-foreground" />
                            <Input
                                id="current-password"
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="pr-10 pl-10"
                                dir="ltr"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute left-3 top-3 text-muted-foreground hover:text-foreground"
                            >
                                {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="new-password">رمز عبور جدید</Label>
                        <div className="relative">
                            <Lock className="absolute right-3 top-3 size-4 text-muted-foreground" />
                            <Input
                                id="new-password"
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="pr-10 pl-10"
                                dir="ltr"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute left-3 top-3 text-muted-foreground hover:text-foreground"
                            >
                                {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">تکرار رمز عبور جدید</Label>
                        <div className="relative">
                            <Lock className="absolute right-3 top-3 size-4 text-muted-foreground" />
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="pr-10"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            انصراف
                        </Button>
                        <Button type="submit" disabled={isLoading} variant="bronze">
                            {isLoading ? (
                                <>
                                    <Loader2 className="ml-2 size-4 animate-spin" />
                                    در حال تغییر...
                                </>
                            ) : (
                                'تغییر رمز عبور'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
