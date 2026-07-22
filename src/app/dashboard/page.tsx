import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { StatsExport } from '@/components/dashboard/stats-export'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Settings, User } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'داشبورد',
  description: 'پیشرفت مطالعه، آمار و واژگان شما در یک نگاه.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            داشبورد شما
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            پیشرفت مطالعه، کتاب‌های در حال خواندن و واژگان ذخیره‌شده‌تان را اینجا
            ببینید.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/profile">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">پروفایل من</span>
              <span className="sm:hidden">پروفایل</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/settings">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">تنظیمات</span>
            </Link>
          </Button>
          <StatsExport />
        </div>
      </header>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <DashboardClient />
      </Suspense>
    </div>
  )
}
