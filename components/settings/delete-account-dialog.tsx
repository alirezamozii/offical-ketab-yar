'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

interface DeleteAccountDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userEmail: string
}

function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
    const router = useRouter()
    const [confirmText, setConfirmText] = useState('')
    const [confirmCheckbox, setConfirmCheckbox] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const supabase = createClient()

    const handleDelete = async () => {
        if (confirmText !== 'حذف حساب') {
            toast.error('لطفاً عبارت "حذف حساب" را وارد کنید')
            return
        }

        if (!confirmCheckbox) {
            toast.error('لطفاً تأیید کنید که از حذف حساب مطمئن هستید')
            return
        }

        setIsDeleting(true)

        try {
            // TODO: Implement actual account deletion
            // This should:
            // 1. Delete all user data from database
            // 2. Delete user from auth
            // 3. Sign out user

            await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call

            // Sign out
            await supabase.auth.signOut()

            toast.success('حساب کاربری شما حذف شد')
            router.push('/')
        } catch (error) {
            console.error('Error deleting account:', error)
            toast.error('خطا در حذف حساب کاربری')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="size-5 text-destructive" />
                        <DialogTitle className="text-destructive">حذف حساب کاربری</DialogTitle>
                    </div>
                    <DialogDescription>
                        این عمل غیرقابل بازگشت است و تمام داده‌های شما حذف خواهند شد
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <Alert variant="destructive">
                        <AlertTriangle className="size-4" />
                        <AlertDescription>
                            با حذف حساب کاربری، تمام موارد زیر به طور دائم حذف می‌شوند:
                            <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
                                <li>تاریخچه مطالعه شما</li>
                                <li>لغات ذخیره شده</li>
                                <li>دستاوردها و امتیازات</li>
                                <li>تنظیمات شخصی</li>
                                <li>اشتراک فعال (در صورت وجود)</li>
                            </ul>
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                        <Label htmlFor="confirm-text">
                            برای تأیید، عبارت <span className="font-bold text-destructive">"حذف حساب"</span> را وارد کنید:
                        </Label>
                        <Input
                            id="confirm-text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="حذف حساب"
                            className="text-center"
                        />
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                            id="confirm-checkbox"
                            checked={confirmCheckbox}
                            onCheckedChange={(checked) => setConfirmCheckbox(checked as boolean)}
                        />
                        <Label
                            htmlFor="confirm-checkbox"
                            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            من از حذف حساب کاربری خود مطمئن هستم و می‌دانم که این عمل غیرقابل بازگشت است
                        </Label>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        انصراف
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting || confirmText !== 'حذف حساب' || !confirmCheckbox}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="ml-2 size-4 animate-spin" />
                                در حال حذف...
                            </>
                        ) : (
                            <>
                                <Trash2 className="ml-2 size-4" />
                                حذف حساب کاربری
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
