'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Ban, Download, Plus, Search, Users } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface User {
    id: string
    email: string
    full_name: string
    role: string
    banned: boolean
    xp: number
    current_streak: number
    subscription_status: string
    created_at: string
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [banDialogOpen, setBanDialogOpen] = useState(false)
    const [userToBan, setUserToBan] = useState<User | null>(null)
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [roleFilter])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (roleFilter !== 'all') params.append('role', roleFilter)

            const response = await fetch(`/api/admin/users/list?${params}`)
            const data = await response.json()
            if (data.success) {
                setUsers(data.users)
            }
        } catch (error) {
            toast.error('خطا در بارگذاری کاربران')
        } finally {
            setLoading(false)
        }
    }

    const handleBanToggle = async () => {
        if (!userToBan) return
        try {
            const response = await fetch(`/api/admin/users/update/${userToBan.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ banned: !userToBan.banned }),
            })
            if (response.ok) {
                toast.success(userToBan.banned ? 'کاربر رفع مسدودیت شد' : 'کاربر مسدود شد')
                fetchUsers()
            }
        } catch (error) {
            toast.error('خطا در به‌روزرسانی کاربر')
        } finally {
            setBanDialogOpen(false)
            setUserToBan(null)
        }
    }

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const response = await fetch(`/api/admin/users/update/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            })
            if (response.ok) {
                toast.success('نقش کاربر به‌روزرسانی شد')
                fetchUsers()
            }
        } catch (error) {
            toast.error('خطا در به‌روزرسانی نقش')
        }
    }

    const handleExportCSV = () => {
        setExporting(true)
        try {
            const csvData = [
                ['ایمیل', 'نام', 'نقش', 'وضعیت', 'XP', 'استریک', 'اشتراک', 'تاریخ ثبت‌نام'],
                ...filteredUsers.map(u => [
                    u.email,
                    u.full_name || '-',
                    u.role,
                    u.banned ? 'مسدود' : 'فعال',
                    u.xp.toString(),
                    u.current_streak.toString(),
                    u.subscription_status || 'free',
                    new Date(u.created_at).toLocaleDateString('fa-IR'),
                ])
            ]

            const csv = csvData.map(row => row.join(',')).join('\n')
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `users_${new Date().toISOString().split('T')[0]}.csv`
            link.click()

            toast.success('فایل CSV دانلود شد')
        } catch (error) {
            toast.error('خطا در دانلود فایل')
        } finally {
            setExporting(false)
        }
    }

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="container mx-auto py-8 space-y-8" dir="rtl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">👥 مدیریت کاربران</h1>
                    <p className="text-muted-foreground">مدیریت کاربران و دسترسی‌ها</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportCSV} disabled={exporting}>
                        <Download className="w-4 h-4 ml-2" />
                        {exporting ? 'در حال دانلود...' : 'دانلود CSV'}
                    </Button>
                    <Link href="/admin/users/test-users">
                        <Button size="lg">
                            <Plus className="w-5 h-5 ml-2" />
                            افزودن کاربر تست
                        </Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="جستجو با ایمیل یا نام..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pr-10"
                                dir="rtl"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">همه نقش‌ها</SelectItem>
                                <SelectItem value="user">کاربر عادی</SelectItem>
                                <SelectItem value="test_user">کاربر تست</SelectItem>
                                <SelectItem value="admin">مدیر</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">در حال بارگذاری...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <p>کاربری یافت نشد</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredUsers.map((user) => (
                                <div key={user.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold">{user.full_name || user.email}</h3>
                                            {user.banned && <Badge variant="destructive">مسدود</Badge>}
                                            {user.subscription_status === 'premium' && (
                                                <Badge className="bg-gold-500">پرمیوم</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant="outline">⚡ {user.xp.toLocaleString('fa-IR')} XP</Badge>
                                            <Badge variant="outline">🔥 {user.current_streak.toLocaleString('fa-IR')} روز</Badge>
                                            <Badge variant="outline">
                                                📅 {new Date(user.created_at).toLocaleDateString('fa-IR')}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={user.role}
                                            onValueChange={(value) => handleRoleChange(user.id, value)}
                                        >
                                            <SelectTrigger className="w-[140px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="user">کاربر</SelectItem>
                                                <SelectItem value="test_user">تست</SelectItem>
                                                <SelectItem value="admin">مدیر</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            variant={user.banned ? "outline" : "destructive"}
                                            size="sm"
                                            onClick={() => {
                                                setUserToBan(user)
                                                setBanDialogOpen(true)
                                            }}
                                        >
                                            <Ban className="w-4 h-4 ml-2" />
                                            {user.banned ? 'رفع مسدودیت' : 'مسدود'}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {userToBan?.banned ? 'رفع مسدودیت کاربر؟' : 'مسدود کردن کاربر؟'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {userToBan?.banned
                                ? `دسترسی "${userToBan?.email}" بازگردانده شود؟`
                                : `دسترسی "${userToBan?.email}" به پلتفرم مسدود شود؟`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>انصراف</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBanToggle}>
                            {userToBan?.banned ? 'رفع مسدودیت' : 'مسدود کردن'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
