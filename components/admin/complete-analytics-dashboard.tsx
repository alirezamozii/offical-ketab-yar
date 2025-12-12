'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPlatformStats } from '@/lib/supabase/admin-actions'
import {
    BookOpen,
    Download,
    Shield,
    TrendingUp,
    UserCheck,
    UserX,
    Users
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface PlatformStats {
    totalUsers: number
    adminUsers: number
    testUsers: number
    bannedUsers: number
    premiumUsers: number
    activeUsers: number
}

export function CompleteAnalyticsDashboard() {
    const [stats, setStats] = useState<PlatformStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    async function fetchStats() {
        try {
            setLoading(true)
            const data = await getPlatformStats()
            setStats(data)
        } catch (error) {
            console.error('خطا در بارگذاری آمار:', error)
            toast.error('بارگذاری آمار با خطا مواجه شد')
        } finally {
            setLoading(false)
        }
    }

    async function exportStats() {
        if (!stats) return

        const csvContent = [
            ['معیار', 'مقدار'],
            ['تعداد کل کاربران', stats.totalUsers],
            ['کاربران ادمین', stats.adminUsers],
            ['کاربران تستی', stats.testUsers],
            ['کاربران مسدود', stats.bannedUsers],
            ['کاربران پرمیوم', stats.premiumUsers],
            ['کاربران فعال (30 روز)', stats.activeUsers],
            ['کاربران رایگان', stats.totalUsers - stats.premiumUsers],
            ['نرخ تبدیل به پرمیوم', `${((stats.premiumUsers / stats.totalUsers) * 100).toFixed(2)}%`],
        ]
            .map(row => row.join(','))
            .join('\n')

        // Add BOM for UTF-8 encoding
        const BOM = '\uFEFF'
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `platform-stats-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        toast.success('آمار با موفقیت خروجی گرفته شد')
    }

    if (loading) {
        return <div className="text-center py-8">در حال بارگذاری آمار...</div>
    }

    if (!stats) {
        return <div className="text-center py-8 text-muted-foreground">داده‌ای موجود نیست</div>
    }

    const statCards = [
        {
            title: 'تعداد کل کاربران',
            value: stats.totalUsers.toLocaleString('fa-IR'),
            icon: Users,
            description: 'تمام کاربران ثبت‌نام شده',
            color: 'text-blue-600',
        },
        {
            title: 'کاربران فعال (30 روز)',
            value: stats.activeUsers.toLocaleString('fa-IR'),
            icon: TrendingUp,
            description: 'کاربران فعال در 30 روز اخیر',
            color: 'text-green-600',
        },
        {
            title: 'کاربران پرمیوم',
            value: stats.premiumUsers.toLocaleString('fa-IR'),
            icon: UserCheck,
            description: `${((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1)}% نرخ تبدیل`,
            color: 'text-gold-600',
        },
        {
            title: 'کاربران ادمین',
            value: stats.adminUsers.toLocaleString('fa-IR'),
            icon: Shield,
            description: 'مدیران پلتفرم',
            color: 'text-purple-600',
        },
        {
            title: 'کاربران تستی',
            value: stats.testUsers.toLocaleString('fa-IR'),
            icon: BookOpen,
            description: 'حساب‌های تستی با دسترسی نامحدود',
            color: 'text-orange-600',
        },
        {
            title: 'کاربران مسدود',
            value: stats.bannedUsers.toLocaleString('fa-IR'),
            icon: UserX,
            description: 'حساب‌های معلق شده',
            color: 'text-red-600',
        },
    ]

    return (
        <div className="space-y-6" dir="rtl">
            {/* Export Button */}
            <div className="flex justify-end">
                <Button onClick={exportStats} variant="outline">
                    <Download className="h-4 w-4 ml-2" />
                    خروجی آمار (CSV)
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {statCards.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                <Icon className={`h-5 w-5 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Additional Metrics */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>توزیع کاربران</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">کاربران رایگان</span>
                                <span className="font-bold">{(stats.totalUsers - stats.premiumUsers).toLocaleString('fa-IR')}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">کاربران پرمیوم</span>
                                <span className="font-bold text-gold-600">{stats.premiumUsers.toLocaleString('fa-IR')}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">نرخ تبدیل</span>
                                <span className="font-bold">
                                    {((stats.premiumUsers / stats.totalUsers) * 100).toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>سلامت کاربران</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">کاربران فعال</span>
                                <span className="font-bold text-green-600">{stats.activeUsers.toLocaleString('fa-IR')}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">کاربران غیرفعال</span>
                                <span className="font-bold text-orange-600">
                                    {(stats.totalUsers - stats.activeUsers).toLocaleString('fa-IR')}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">کاربران مسدود</span>
                                <span className="font-bold text-red-600">{stats.bannedUsers.toLocaleString('fa-IR')}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Estimation */}
            {stats.premiumUsers > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>تخمین درآمد</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <p className="text-sm text-muted-foreground">ماهانه (میانگین $9.99)</p>
                                <p className="text-2xl font-bold text-gold-600">
                                    ${(stats.premiumUsers * 9.99).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">سه‌ماهه (میانگین $24.99)</p>
                                <p className="text-2xl font-bold text-gold-600">
                                    ${(stats.premiumUsers * 24.99).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">سالانه (میانگین $89.99)</p>
                                <p className="text-2xl font-bold text-gold-600">
                                    ${(stats.premiumUsers * 89.99).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Info Card */}
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">📊 اطلاعات تحلیلی</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• آمار به صورت لحظه‌ای به‌روزرسانی می‌شود</li>
                        <li>• کاربران فعال = کاربرانی که در 30 روز اخیر وارد شده‌اند</li>
                        <li>• کاربران تستی دسترسی نامحدود به امکانات پرمیوم دارند اما نمی‌توانند به پنل ادمین دسترسی داشته باشند</li>
                        <li>• خروجی CSV را برای تحلیل داده‌ها در اکسل یا گوگل شیت استفاده کنید</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}
