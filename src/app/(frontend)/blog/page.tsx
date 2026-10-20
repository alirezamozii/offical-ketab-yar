import { BlogPageClient } from '@/components/blog/blog-page-client'
import { getPublishedBlogPosts } from '@/lib/cms'
import type { Metadata } from 'next'
import { SITE } from '@/lib/site'

export const revalidate = 0 // always fresh — new CMS content must appear on the next click

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

export default async function BlogPage() {
  const { posts, total, totalPages } = await getPublishedBlogPosts(1, 10)
  return (
    <BlogPageClient
      initialPosts={posts}
      initialTotal={total}
      initialTotalPages={totalPages}
    />
  )
}
