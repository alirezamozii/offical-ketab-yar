import { BlogPageClient } from '@/components/blog/blog-page-client'
import type { Metadata } from 'next'
import { SITE } from '@/lib/site'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'بلاگ — مقالات و راهنماهای مطالعه دوزبانه | بوکزی',
  description:
    'بلاگ بوکزی — مقالاتی درباره یادگیری زبان انگلیسی با کتاب، معرفی برترین کتاب‌ها و نکات مطالعه دوزبانه.',
  keywords: [
    'بلاگ بوکزی',
    'بوکزی',
    'Bookzi',
    'زیست‌بوم کتاب‌های دوزبانه',
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
    title: 'بلاگ | بوکزی',
    description:
      'مقالاتی درباره یادگیری زبان انگلیسی با کتاب، معرفی برترین کتاب‌ها و نکات مطالعه دوزبانه در بوکزی.',
    siteName: 'بوکزی',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function BlogPage() {
  return <BlogPageClient />
}
