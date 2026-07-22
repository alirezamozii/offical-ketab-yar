import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { SITE } from '@/lib/site'

export const dynamic = 'force-dynamic'

const CollectionsPageClient = dynamic(
  () => import('@/components/collections/collections-page-client').then((m) => m.CollectionsPageClient),
  {
    loading: () => <Skeleton className="h-[600px] w-full rounded-2xl animate-pulse bg-muted/40" />,
  }
)

export const metadata: Metadata = {
  title: 'پلی‌لیست‌های من | کتاب‌یار',
  description:
    'پلی‌لیست‌های شخصی کتاب‌یار — کتاب‌های خود را در قفسه‌های دلخواه دسته‌بندی کنید: علاقه‌مندی‌ها، بعداً می‌خوانم، در حال مطالعه، تکمیل شده و پلی‌لیست‌های سفارشی شما.',
  alternates: { canonical: `${SITE.url}/collections` },
  openGraph: {
    title: 'پلی‌لیست‌های من | کتاب‌یار',
    description:
      'کتاب‌های خود را در قفسه‌های شخصی دسته‌بندی کنید — علاقه‌مندی‌ها، بعداً می‌خوانم، در حال مطالعه، تکمیل شده و پلی‌لیست‌های دلخواه شما.',
    type: 'website',
    url: `${SITE.url}/collections`,
    locale: 'fa_IR',
    siteName: SITE.name,
    images: [
      {
        url: '/api/og?title=Collections&subtitle=My%20Bookshelves',
        width: 1200,
        height: 630,
        alt: 'پلی‌لیست‌های من | کتاب‌یار',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'پلی‌لیست‌های من | کتاب‌یار',
    description:
      'کتاب‌های خود را در قفسه‌های شخصی دسته‌بندی کنید — علاقه‌مندی‌ها، بعداً می‌خوانم، در حال مطالعه، تکمیل شده و پلی‌لیست‌های دلخواه شما.',
    images: ['/api/og?title=Collections&subtitle=My%20Bookshelves'],
  },
  // Per-user page — should never be indexed.
  robots: { index: false, follow: false },
}

/**
 * /collections — server component shell. The full page is client-side
 * (framer-motion, localStorage-backed collections, dialogs) so we hand off
 * to `CollectionsPageClient` which mounts the `useCollections` hook.
 */
export default function CollectionsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <CollectionsPageClient />
    </div>
  )
}
