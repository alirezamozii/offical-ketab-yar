import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'تنظیمات | کتاب‌یار',
  description:
    'تنظیمات برنامه کتاب‌یار: ظاهر، مطالعه، اعلان‌ها، دسترسی‌پذیری، حریم خصوصی، زبان و مدیریت داده.',
  robots: {
    index: false,
    follow: false,
  },
}

const SettingsPageClient = dynamic(
  () => import('@/components/settings/settings-page-client').then((m) => m.SettingsPageClient),
  {
    loading: () => <Skeleton className="h-[600px] w-full rounded-2xl animate-pulse bg-muted/40" />,
  }
)

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <SettingsPageClient />
    </div>
  )
}
