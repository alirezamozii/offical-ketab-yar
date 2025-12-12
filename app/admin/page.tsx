'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, BookOpen, Key, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats')
      const result = await response.json()
      if (result.success) {
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8" dir="rtl">
        <div className="text-center py-12">در حال بارگذاری...</div>
      </div>
    )
  }

  const stats = data?.stats || {}

  return (
    <div className="container mx-auto py-8 space-y-8" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">📊 داشبورد</h1>
        <p className="text-muted-foreground">خوش آمدید به پنل مدیریت کتاب‌یار</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل کاربران</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users?.total?.toLocaleString('fa-IR') || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              {stats.users?.newThisWeek || 0} کاربر این هفته
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کاربران فعال</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users?.active?.toLocaleString('fa-IR') || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.users?.premium || 0} کاربر پرمیوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل کتاب‌ها</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.books?.total?.toLocaleString('fa-IR') || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.books?.published || 0} منتشر شده
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صفحات خوانده شده</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reading?.totalPages?.toLocaleString('fa-IR') || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.reading?.totalSessions || 0} جلسه خواندن
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ثبت‌نام کاربران (30 روز اخیر)</CardTitle>
            <CardDescription>تعداد کاربران جدید در هر روز</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data?.charts?.signups || []}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString('fa-IR')}
                  formatter={(value: any) => [value.toLocaleString('fa-IR'), 'کاربر']}
                />
                <Area type="monotone" dataKey="value" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>فعالیت خواندن (30 روز اخیر)</CardTitle>
            <CardDescription>تعداد صفحات خوانده شده در هر روز</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
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
      </div>

      {/* Quick Actions & Top Books */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>دسترسی سریع</CardTitle>
            <CardDescription>عملیات‌های متداول</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/Studio">
              <Button className="w-full justify-start">
                <BookOpen className="ml-2 h-4 w-4" />
                مدیریت کتاب‌ها (Sanity)
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start">
                <Users className="ml-2 h-4 w-4" />
                مدیریت کاربران
              </Button>
            </Link>
            <Link href="/admin/api-keys">
              <Button variant="outline" className="w-full justify-start">
                <Key className="ml-2 h-4 w-4" />
                مدیریت کلیدهای API
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="outline" className="w-full justify-start">
                <Activity className="ml-2 h-4 w-4" />
                تحلیل‌ها و گزارش‌ها
              </Button>
            </Link>
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
                  <div key={book.book_id} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gold-100 text-gold-700 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{book.title}</p>
                      <p className="text-xs text-muted-foreground">{book.reads} بار خوانده شده</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  هنوز داده‌ای وجود ندارد
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
