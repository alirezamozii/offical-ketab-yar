import { GenreCard } from '@/components/library/genre-card'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { db, safeQuery } from '@/lib/db'
import { parseGenres } from '@/lib/books-query'
import { SITE } from '@/lib/site'

export const dynamic = 'force-dynamic'
import { BookOpen, Flame, Home } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ژانرها — مرور کتاب‌ها بر اساس موضوع',
  description:
    'کتاب‌های انگلیسی دوزبانه را بر اساس ژانر و موضوع مرور کنید. داستان، فانتزی، ماجراجویی، رمان و...',
  keywords: [
    'ژانر کتاب',
    'موضوعات کتاب',
    'کتاب داستانی انگلیسی',
    'ژانرهای کتابخانه',
    'کتاب انگلیسی',
    'کتاب فانتزی',
    'کتاب ماجراجویی',
    'کتاب آموزشی',
    'کتاب درسی انگلیسی',
    'genre filter',
    'English books by genre',
  ],
  alternates: { canonical: `${SITE.url}/library/genres` },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: `${SITE.url}/library/genres`,
    title: 'ژانرهای بوکزی — مرور کتاب‌ها بر اساس موضوع',
    description:
      'کتاب‌های انگلیسی دوزبانه را بر اساس ژانر و موضوع مرور کنید.',
    siteName: 'بوکزی',
    images: [
      {
        url: '/api/og?title=Genres&subtitle=Browse%20books%20by%20topic',
        width: 1200,
        height: 630,
        alt: 'ژانرهای بوکزی',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ژانرهای بوکزی',
    description: 'کتاب‌های انگلیسی دوزبانه را بر اساس ژانر مرور کنید.',
    images: ['/api/og?title=Genres&subtitle=Browse%20books%20by%20topic'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const SORTS = [
  { value: 'views', label: 'محبوب‌ترین', icon: Flame },
  { value: 'count', label: 'بر اساس تعداد', icon: BookOpen },
]

export default async function GenresPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>
}) {
  const sp = await searchParams
  const requestedSort = sp.sort === 'count' ? 'count' : 'views'

  let books = await safeQuery(
    () =>
      db.book.findMany({
        where: { isPublished: true },
        select: { genres: true, viewCount: true },
      }),
    [],
    2500,
  )

  // Direct Payload CMS fallback if Prisma has no rows
  if (!books || books.length === 0) {
    try {
      const { getPayloadClient } = await import('@/lib/payload')
      const payload = await getPayloadClient()
      const payloadBooks = await payload.find({
        collection: 'books',
        where: { isPublished: { equals: true } },
        limit: 100,
      })
      if (payloadBooks?.docs?.length > 0) {
        books = payloadBooks.docs.map((b: any) => ({
          genres: JSON.stringify(parseGenres(b.genres)),
          viewCount: Number(b.viewCount) || 0,
        }))
      }
    } catch {
      // payload fallback optional
    }
  }

  const map = new Map<string, { count: number; views: number }>()
  for (const b of books) {
    for (const g of parseGenres(b.genres)) {
      const cur = map.get(g) || { count: 0, views: 0 }
      cur.count += 1
      cur.views += b.viewCount
      map.set(g, cur)
    }
  }
  const genres = Array.from(map.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) =>
      requestedSort === 'views'
        ? b.views - a.views || b.count - a.count
        : b.count - a.count || b.views - a.views,
    )

  const totalBooks = books.length

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/" className="flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
                خانه
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/library">کتابخانه</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>ژانرها</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mb-6 space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          مرور بر اساس ژانر
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {genres.length.toLocaleString('fa-IR')} موضوع — از میان{' '}
          {totalBooks.toLocaleString('fa-IR')} کتاب، مطابق با سلیقه‌تان انتخاب
          کنید.
        </p>
      </header>

      {/* Sort toggle (server-rendered links) */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">مرتب‌سازی:</span>
        {SORTS.map((s) => {
          const Icon = s.icon
          const active = s.value === requestedSort
          return (
            <Link
              key={s.value}
              href={s.value === 'views' ? '/library/genres' : '/library/genres?sort=count'}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
              }`}
            >
              <Icon className="h-3 w-3" />
              {s.label}
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {genres.map((g, i) => (
          <GenreCard key={g.name} genre={g} index={i} sort={requestedSort} />
        ))}
      </div>

      <div className="mt-10 text-center">
        <Button asChild variant="outline">
          <Link href="/library">مشاهده همه کتاب‌ها</Link>
        </Button>
      </div>
    </div>
  )
}
