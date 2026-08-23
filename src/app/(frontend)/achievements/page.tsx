import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { SITE } from '@/lib/site'

const AchievementsGalleryClient = dynamic(
  () => import('@/components/achievements/achievements-gallery-client').then((m) => m.AchievementsGalleryClient),
  {
    loading: () => <Skeleton className="h-[600px] w-full rounded-2xl animate-pulse bg-muted/40" />,
  }
)

export const metadata: Metadata = {
  title: 'دستاوردها | کتاب‌یار',
  description:
    'گالری دستاوردهای کتاب‌یار — نشان‌های باز شده، پیشرفت، سطح کمیابی و جشن دستاوردها را اینجا ببینید.',
  alternates: { canonical: `${SITE.url}/achievements` },
  openGraph: {
    title: 'دستاوردها | کتاب‌یار',
    description:
      'گالری دستاوردهای کتاب‌یار — نشان‌های باز شده، پیشرفت، سطح کمیابی و جشن دستاوردها.',
    type: 'website',
    url: `${SITE.url}/achievements`,
  },
  // Per-user page — should never be indexed.
  robots: { index: false, follow: false },
}

/**
 * /achievements — server component shell. The gallery itself is fully client
 * (framer-motion, localStorage stats override, dialog state) so we hand off
 * to `AchievementsGalleryClient` which fetches `/api/achievements` on mount.
 */
export default function AchievementsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <AchievementsGalleryClient />
    </div>
  )
}
