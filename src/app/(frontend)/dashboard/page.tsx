import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { StatsExport } from '@/components/dashboard/stats-export'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'


import { SITE } from '@/lib/site'
import { QueryProvider } from '@/components/providers/query-provider'
import { DeferredProviders } from '@/components/providers/deferred-providers'

export const metadata: Metadata = {
  title: 'داشبورد',
  description: 'پیشرفت مطالعه، آمار و واژگان شما در یک نگاه.',
  alternates: { canonical: `${SITE.url}/dashboard` },
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
            <Link href="/settings">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">تنظیمات و حساب</span>
              <span className="sm:hidden">تنظیمات</span>
            </Link>
          </Button>
          <StatsExport />
        </div>
      </header>
      <DeferredProviders>
        <QueryProvider>
          <DashboardClient />
        </QueryProvider>
      </DeferredProviders>
    </div>
  )
}
