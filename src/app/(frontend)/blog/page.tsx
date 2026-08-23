import { BlogPageClient } from '@/components/blog/blog-page-client'
import type { Metadata } from 'next'
import { SITE } from '@/lib/site'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'بلاگ — مقالات و راهنماهای مطالعه دوزبانه',
  description:
    'بلاگ کتاب‌یار — مقالاتی درباره یادگیری زبان انگلیسی با کتاب، معرفی برترین کتاب‌ها و نکات مطالعه دوزبانه.',
  keywords: [
    'بلاگ کتاب‌یار',
    'یادگیری زبان انگلیسی',
    'مطالعه دوزبانه',
    'معرفی کتاب',
    'راهنمای خواندن کتاب انگلیسی',
    'روش‌های یادگیری زبان',
    'کتاب دوزبانه',
  ],
  alternates: { canonical: `${SITE.url}/blog` },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: `${SITE.url}/blog`,
    title: 'بلاگ | کتاب‌یار',
    description:
      'مقالاتی درباره یادگیری زبان انگلیسی با کتاب، معرفی برترین کتاب‌ها و نکات مطالعه دوزبانه.',
    siteName: 'کتاب‌یار',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function BlogPage() {
  return <BlogPageClient />
}
