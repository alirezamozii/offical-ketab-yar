import type { Metadata } from 'next'
import { StatsPageLoader } from '@/components/stats/stats-page-loader'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'آمار مطالعه | کتاب‌یار',
  description:
    'مرور سال شما در کتاب‌ها: صفحات خوانده‌شده، استمرار، ژانرهای محبوب، الگوی زمانی، رشد واژگان و دستاوردها — به سبک Spotify Wrapped.',
  alternates: { canonical: `${SITE.url}/stats` },
  openGraph: {
    title: 'آمار مطالعه | کتاب‌یار',
    description:
      'مرور سال شما در کتاب‌ها — صفحات، استمرار، ژانرها، الگوی زمانی و دستاوردها.',
    type: 'website',
    url: `${SITE.url}/stats`,
  },
  // Per-user page — should never be indexed.
  robots: { index: false, follow: false },
}

/**
 * /stats — server component shell. The Year-in-Review page is fully client
 * (framer-motion, recharts, canvas-based PNG download, localStorage stats
 * override) so we hand off to `StatsPageLoader`, which in turn dynamically
 * imports `StatsPageClient` with `ssr: false` (see stats-page-loader.tsx).
 * This keeps the ~500KB recharts chunk out of the initial JS bundle for
 * users who never visit /stats.
 */
export default function StatsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <StatsPageLoader />
    </div>
  )
}
