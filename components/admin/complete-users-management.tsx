'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
    banUser,
    createTestUser,
    exportUsersToCSV,
    getAllUsers,
    makeUserAdmin,
    removeUserAdmin,
    unbanUser,
    type UserProfile,
} from '@/lib/supabase/admin-actions'
import { Download, Mail, Search, ShieldCheck, ShieldOff, UserCheck, UserPlus, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function CompleteUsersManagement() {
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all')
    const [bannedFilter, setBannedFilter] = useState<string>('all')

    // Dialogs
    const [banDialog, setBanDialog] = useState<{ open: boolean; user: UserProfile | null }>({ open: false, user: null })
    const [banReason, setBanReason] = useState('')
    const [createTestDialog, setCreateTestDialog] = useState(false)
    const [testUserData, setTestUserData] = useState({ email: '', password: '', fullName: '', username: '' })

    useEffect(() => {
        fetchUsers()
    }, [roleFilter, subscriptionFilter, bannedFilter, searchQuery])

    async function fetchUsers() {
        try {
            setLoading(true)
            const filters: Record<string, string | boolean> = {}

            if (roleFilter !== 'all') filters.role = roleFilter
            if (subscriptionFilter !== 'all') filters.subscription = subscriptionFilter
            if (bannedFilter !== 'all') filters.banned = bannedFilter === 'banned'
            if (searchQuery) filters.search = searchQuery

            const data = await getAllUsers(filters)
            setUsers(data)
        } catch (error) {
            console.error('خطا در بارگذاری کاربران:', error)
            toast.error('بارگذاری کاربران با خطا مواجه شد')
        } finally {
            setLoading(false)
        }
    }

    async function handleBanUser() {
        if (!banDialog.user) return

        try {
            await banUser(banDialog.user.id, banReason)
            toast.success(`کاربر ${banDialog.user.email} مسدود شد`)
            setBanDialog({ open: false, user: null })
            setBanReason('')
            fetchUsers()
        } catch (error) {
            console.error('خطا در مسدود کردن کاربر:', error)
            toast.error('مسدود کردن کاربر با خطا مواجه شد')
        }
    }

    async function handleUnbanUser(user: UserProfile) {
        try {
            await unbanUser(user.id)
            toast.success(`مسدودیت کاربر ${user.email} برداشته شد`)
            fetchUsers()
        } catch (error) {
            console.error('خطا در رفع مسدودیت:', error)
            toast.error('رفع مسدودیت با خطا مواجه شد')
        }
    }

    async function handleMakeAdmin(user: UserProfile) {
        if (!confirm(`آیا مطمئن هستید که می‌خواهید ${user.email} را ادمین کنید؟\n\nادمین‌ها دسترسی نامحدود به تمام امکانات پرمیوم دارند.`)) return

        try {
            await makeUserAdmin(user.id)
            toast.success(`${user.email} اکنون ادمین است - دسترسی نامحدود پرمیوم فعال شد`)
            fetchUsers()
        } catch (error) {
            console.error('خطا در تبدیل به ادمین:', error)
            toast.error('تبدیل به ادمین با خطا مواجه شد')
        }
    }

    async function handleRemoveAdmin(user: UserProfile) {
        if (!confirm(`آیا مطمئن هستید که می‌خواهید نقش ادمین را از ${user.email} بردارید؟\n\nدسترسی پرمیوم نامحدود نیز حذف می‌شود.`)) return

        try {
            await removeUserAdmin(user.id)
            toast.success(`نقش ادمین از ${user.email} برداشته شد - به کاربر عادی تبدیل شد`)
            fetchUsers()
        } catch (error) {
            console.error('خطا در حذف نقش ادمین:', error)
            toast.error('حذف نقش ادمین با خطا مواجه شد')
        }
    }

    async function handleCreateTestUser() {
        if (!testUserData.email || !testUserData.password || !testUserData.fullName) {
            toast.error('لطفاً حداقل ایمیل، رمز عبور و نام کامل را پر کنید')
            return
        }

        try {
            await createTestUser(
                testUserData.email,
                testUserData.password,
                testUserData.fullName,
                testUserData.username || undefined
            )
            toast.success('کاربر تستی با موفقیت ایجاد شد - دسترسی نامحدود پرمیوم فعال است')
            setCreateTestDialog(false)
            setTestUserData({ email: '', password: '', fullName: '', username: '' })
            fetchUsers()
        } catch (error) {
            console.error('خطا در ایجاد کاربر تستی:', error)
            toast.error(error instanceof Error ? error.message : 'ایجاد کاربر تستی با خطا مواجه شد')
        }
    }

    async function handleExportCSV() {
        try {
            const csv = await exportUsersToCSV()
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
            a.click()
            toast.success('خروجی CSV با موفقیت دانلود شد')
        } catch (error) {
            console.error('خطا در خروجی CSV:', error)
            toast.error('خروجی CSV با خطا مواجه شد')
        }
    }

    return (
        <div className="space-y-6" dir="rtl">
            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>جستجو و فیلتر کاربران</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        <div className="relative lg:col-span-2">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="جستجو بر اساس ایمیل یا نام..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pr-10"
                            />
