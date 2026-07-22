import { SearchClient } from '@/components/search/search-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'جستجو در کتاب‌ها',
  description: 'جستجوی تمام‌متن در محتوای انگلیسی و فارسی کتاب‌ها.',
  robots: {
    index: false,
    follow: false,
  },
}

interface PageProps {
  searchParams: Promise<{
    q?: string
    lang?: string
    genre?: string
    level?: string
    minRating?: string
  }>
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const q = sp.q ?? ''
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          جستجو در کتاب‌ها
        </h1>
        <p className="text-muted-foreground">
          در متن کامل کتاب‌های انگلیسی و ترجمه فارسی آن‌ها جستجو کنید. با تایپ
          کردن، نتایج به‌صورت آنی نمایش داده می‌شوند.
        </p>
      </header>
      <SearchClient
        initialQuery={q}
        initialFilters={{
          lang: (sp.lang as 'all' | 'en' | 'fa') || 'all',
          genres: sp.genre ? sp.genre.split(',').filter(Boolean) : [],
          levels: sp.level ? sp.level.split(',').filter(Boolean) : [],
          minRating: Number(sp.minRating) || 0,
        }}
      />
    </div>
  )
}
