'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart3, Download, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState('30')

    useEffect(() => {
        fetchAnalytics()
    }, [timeRange])

    const fetchAnalytics = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/dashboard/stats')
            const result = await response.json()
            if (result.success) {
                setData(result)
            }
        } catch (error) {
            toast.error('خطا در بارگذاری تحلیل‌ها')
        } finally {
            setLoading(false)
        }
    }

    const handleExportSignups = () => {
        try {
            const csvData = [
                ['تاریخ', 'تعداد ثبت‌نام'],
                ...(data?.charts?.signups || []).map((item: any) => [
                    new Date(item.date).toLocaleDateString('fa-IR'),
                    item.value.toString()
                ])
            ]

            const csv = csvData.map(row => row.join(',')).join('\n')
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `signups_${new Date().toISOString().split('T')[0]}.csv`
            link.click()

            toast.success('فایل CSV دانلود شد')
        } catch (error) {
            toast.error('خطا در دانلود فایل')
        }
    }

    const handleExportActivity = () => {
        try {
            const csvData = [
                ['تاریخ', 'صفحات خوانده شده'],
                ...(data?.charts?.activity || []).map((item: any) => [
                    new Date(item.date).toLocaleDateString('fa-IR'),
                    item.value.toString()
                ])
            ]

            const csv = csvData.map(row => row.join(',')).join('\n')
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `activity_${new Date().toISOString().split('T')[0]}.csv`
            link.click()

            toast.success('فایل CSV دانلود شد')
        } catch (error) {
            toast.error('خطا در دانلود فایل')
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto py-8" dir="rtl">
                <div className="text-center py-12">در حال بارگذاری...</div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 space-y-8" dir="rtl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">📊 تحلیل‌ها و گزارش‌ها</h1>
                    <p className="text-muted-foreground">آمار و تحلیل‌های دقیق پلتفرم</p>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">7 روز اخیر</SelectItem>
                        <SelectItem value="30">30 روز اخیر</SelectItem>
                        <SelectItem value="90">90 روز اخیر</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">کل کاربران</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.stats?.users?.total?.toLocaleString('fa-IR') || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            +{data?.stats?.users?.newThisWeek || 0} این هفته
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">کاربران فعال</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.stats?.users?.active?.toLocaleString('fa-IR') || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {((data?.stats?.users?.active / data?.stats?.users?.total) * 100).toFixed(1)}% از کل
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">جلسات خواندن</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.stats?.reading?.totalSessions?.toLocaleString('fa-IR') || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            میانگین {data?.stats?.reading?.avgSessionDuration?.toFixed(1) || 0} دقیقه
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">صفحات خوانده شده</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.stats?.reading?.totalPages?.toLocaleString('fa-IR') || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            کل صفحات
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>ثبت‌نام کاربران</CardTitle>
                                <CardDescription>تعداد کاربران جدید در هر روز</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleExportSignups}>
                                <Download className="w-4 h-4 ml-2" />
                                دانلود CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={data?.charts?.signups || []}>
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(value) => new Date(value).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis />
                                <Tooltip
                                    labelFormatter={(value) => new Date(value).toLocaleDateString('fa-IR')}
                                    formatter={(value: any) => [value.toLocaleString('fa-IR'), 'کاربر جدید']}
                                />
                                <Area type="monotone" dataKey="value" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>فعالیت خواندن</CardTitle>
                                <CardDescription>تعداد صفحات خوانده شده در هر روز</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleExportActivity}>
                                <Download className="w-4 h-4 ml-2" />
                                دانلود CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={data?.charts?.activity || []}>
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(value) => new Date(value).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis />
                                <Tooltip
                                    labelFormatter={(value) => new Date(value).toLocaleDateString('fa-IR')}
                                    formatter={(value: any) => [value.toLocaleString('fa-IR'), 'صفحه']}
                                />
                                <Bar dataKey="value" fill="#D4AF37" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>کتاب‌های برتر</CardTitle>
                        <CardDescription>پرخواننده‌ترین کتاب‌ها</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data?.topBooks?.length > 0 ? (
                                data.topBooks.map((book: any, index: number) => (
                                    <div key={book.book_id} className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gold-100 text-gold-700 font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{book.title}</p>
                                            <p className="text-sm text-muted-foreground">{book.reads.toLocaleString('fa-IR')} بار خوانده شده</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-gold-600">{book.reads}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-8">هنوز داده‌ای وجود ندارد</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
