import type { Metadata } from 'next'
import { GoalsPageLoader } from '@/components/goals/goals-page-loader'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'اهداف مطالعه | کتاب‌یار',
  description:
    'اهداف روزانه، هفتگی و ماهانه مطالعه خود را تنظیم کنید، پیشرفت خود را در نمودارها و تقویم استمرار دنبال کنید و دستاوردهای مطالعه را ببینید.',
  alternates: { canonical: `${SITE.url}/goals` },
  openGraph: {
    title: 'اهداف مطالعه | کتاب‌یار',
    description:
      'اهداف روزانه، هفتگی و ماهانه مطالعه — نمودار سرعت، تقویم استمرار، توزیع زمانی و دستاوردها.',
    type: 'website',
    url: `${SITE.url}/goals`,
  },
  // Per-user page — should never be indexed.
  robots: { index: false, follow: false },
}

/**
 * /goals — server component shell. The analytics page is fully client
 * (framer-motion, recharts, localStorage stats override, editing state) so
 * we hand off to `GoalsPageLoader`, which in turn dynamically imports
 * `GoalsPageClient` with `ssr: false` (see goals-page-loader.tsx). This
 * keeps the ~500KB recharts chunk out of the initial JS bundle for users
 * who never visit /goals.
 */
export default function GoalsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <GoalsPageLoader />
    </div>
  )
}
