import { BookCover } from '@/components/books/book-cover'
import { safeJsonLd } from '@/lib/json-ld'
import { BookCarousel } from '@/components/books/book-carousel'
import { CefrLevelIndicator } from '@/components/books/cefr-level-indicator'
import { ReadingInsights } from '@/components/books/reading-insights'
import { TrendingBadge } from '@/components/books/trending-badge'
import { BookToc } from '@/components/books/book-toc'
import { ReadingProgressCard } from '@/components/books/reading-progress-card'
import {
  BookDetailActions,
  StickyReadingBar,
} from '@/components/books/book-detail-actions'
import { AddToCollectionButton } from '@/components/books/add-to-collection-button'
import { FavoriteButton } from '@/components/books/favorite-button'
import { DownloadBookButton } from '@/components/books/download-book-button'
import { ReviewsSection } from '@/components/books/reviews-list'
import { ReviewFormWrapper } from '@/components/books/review-form-wrapper'
import { ShareButton } from '@/components/books/share-button'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  getBookBySlug,
  getHighestRatedBooks,
  getRelatedBooks,
} from '@/lib/data'
import { toPersianDigits } from '@/lib/typography'
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  Clock,
  Eye,
  FileText,
  Globe,
  Hash,
  Layers,
  MessageSquare,
  Quote,
  Star,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { BookListItem } from '@/lib/data'
import { SITE } from '@/lib/site'

interface PageProps {
  params: Promise<{ slug: string }>
}

const SITE_URL = SITE.url

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const book = await getBookBySlug(slug)
  if (!book) {
    return {
      title: 'کتاب یافت نشد',
      robots: { index: false, follow: false },
    }
  }
  const canonical = `${SITE_URL}/books/${book.slug}`
  const ogImage = `/api/og?title=${encodeURIComponent(book.title)}&subtitle=${encodeURIComponent(book.author)}`
  return {
    title: `${book.title} — ${book.author}`,
    description: `${book.description} — خلاصه، ترجمه فارسی و مطالعه رایگان دوزبانه در کتاب‌یار.`,
    keywords: [
      book.title,
      book.author,
      'کتاب انگلیسی',
      'مطالعه دوزبانه',
      'ترجمه فارسی',
      'کتاب رایگان',
      'کتاب کلاسیک',
      'یادگیری زبان انگلیسی',
      'دیکشنری هوشمند',
      ...book.genres,
    ],
    alternates: { canonical },
    openGraph: {
      type: 'book',
      locale: 'fa_IR',
      url: canonical,
      title: `${book.title} — ${book.author}`,
      description: book.description,
      siteName: 'کتاب‌یار',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `جلد کتاب ${book.title} — ${book.author}`,
        },
      ],
      authors: [book.author],
      releaseDate: `${book.publishedYear}-01-01`,
      tags: book.genres,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${book.title} — ${book.author}`,
      description: book.description,
      images: [ogImage],
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
}

/**
 * Ensure exactly 6 related books. `getRelatedBooks` returns up to 4 by genre
 * overlap; if it returns fewer (or its results include zero-overlap books),
 * we top up from the highest-rated list, excluding the current book and any
 * already-included slugs. The carousel layout shows 4–6 nicely across
 * breakpoints, so we always pad to at least 4.
 */
async function ensureRelated(
  slug: string,
  genres: string[],
): Promise<BookListItem[]> {
  const related = await getRelatedBooks(slug, genres, 6)
  if (related.length >= 6) return related.slice(0, 6)

  const have = new Set(related.map((b) => b.slug))
  have.add(slug)
  const fill = await getHighestRatedBooks(10)
  for (const b of fill) {
    if (related.length >= 6) break
    if (!have.has(b.slug)) {
      related.push(b)
      have.add(b.slug)
    }
  }
  return related.slice(0, 6)
}

/**
 * Reading-time estimate for an English-language learner reading with
 * bilingual support. Heuristic: ~3 minutes per page (slower than a native
 * reader because of dictionary look-ups + translation scans). Returns a
 * Persian string like «حدود ۵ ساعت و ۲۰ دقیقه» or «حدود ۴۵ دقیقه».
 *
 * Pure server-side helper — uses the typography lib's toPersianDigits.
 */
function readingTimeEstimate(pageCount: number): string {
  const minutes = Math.max(1, Math.round(pageCount * 3))
  if (minutes < 60) {
    return `حدود ${toPersianDigits(minutes)} دقیقه`
  }
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  if (rem === 0) {
    return `حدود ${toPersianDigits(hours)} ساعت`
  }
  return `حدود ${toPersianDigits(hours)} ساعت و ${toPersianDigits(rem)} دقیقه`
}

/** A pure number→Persian-digit helper for inline use in JSX. */
function fa(n: number): string {
  return toPersianDigits(n)
}

export default async function BookDetailPage({ params }: PageProps) {
  const { slug } = await params
  const book = await getBookBySlug(slug)
  if (!book) notFound()

  const related = await ensureRelated(slug, book.genres)

  const avg =
    book.reviews.length > 0
      ? book.reviews.reduce((s, r) => s + r.rating, 0) / book.reviews.length
      : book.rating

  const canonical = `${SITE_URL}/books/${book.slug}`

  // Preview teaser — first ~280 chars of the description, shown when there's
  // enough text to be a meaningful teaser.
  const showPreview = book.description.trim().length >= 120
  const previewText = book.description.trim()

  // Rating distribution buckets — used inline in the hero. The full
  // interactive distribution lives in ReviewsSection; this is just the
  // quick-glance summary in the hero meta card.
  const totalReviews = Math.max(book.reviewCount, book.reviews.length)

  // --- Structured data: Book -------------------------------------------------
  const reviewsLd = book.reviews.slice(0, 5).map((r) => ({
    '@type': 'Review',
    author: { '@type': 'Person', name: r.userName },
    datePublished: r.createdAt.slice(0, 10),
    reviewBody: r.comment,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: r.rating,
      bestRating: 5,
      worstRating: 1,
    },
  }))

  const bookLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': `${canonical}#book`,
    name: book.title,
    description: book.description,
    inLanguage: ['en', 'fa'],
    bookEdition: 'Bilingual',
    bookFormat: 'https://schema.org/EBook',
    url: canonical,
    author: {
      '@type': 'Person',
      '@id': `${SITE_URL}/authors/${encodeURIComponent(book.author)}#author`,
      name: book.author,
    },
    genre: book.genres,
    datePublished: `${book.publishedYear}-01-01`,
    numberOfPages: book.pageCount,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Number(avg.toFixed(2)),
      bestRating: 5,
      worstRating: 1,
      ratingCount: Math.max(book.reviewCount, book.reviews.length),
      reviewCount: book.reviews.length,
    },
    ...(reviewsLd.length > 0 ? { review: reviewsLd } : {}),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'IRR',
      availability: 'https://schema.org/InStock',
      url: canonical,
    },
    publisher: { '@id': `${SITE_URL}/#organization` },
    thumbnailUrl: `${SITE_URL}/logo.svg`,
    isAccessibleForFree: true,
    teaches: 'English language',
    educationalLevel: book.level,
  }

  // --- Structured data: Article (wraps the book description) -----------------
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${canonical}#article`,
    headline: book.title,
    description: book.description,
    inLanguage: ['en', 'fa'],
    datePublished: `${book.publishedYear}-01-01`,
    dateModified: book.reviews[0]?.createdAt?.slice(0, 10) || `${book.publishedYear}-01-01`,
    author: {
      '@type': 'Person',
      name: book.author,
    },
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonical,
    },
    about: { '@id': `${canonical}#book` },
    articleSection: book.genres,
    image: `${SITE_URL}/logo.svg`,
  }

  // --- Structured data: BreadcrumbList --------------------------------------
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'خانه',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'کتابخانه',
        item: `${SITE_URL}/library`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: book.title,
        item: canonical,
      },
    ],
  }

  // Reading-time estimate for the hero.
  const readingTime = readingTimeEstimate(book.pageCount)
  // Quick rating distribution for the hero summary card.
  const ratingBuckets = [5, 4, 3, 2, 1].map((star) => {
    const count = book.reviews.filter((r) => r.rating === star).length
    const pct =
      book.reviews.length > 0
        ? Math.round((count / book.reviews.length) * 100)
        : 0
    return { star, count, pct }
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(bookLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />

      {/* Hero — gradient background tuned to the book's TWO MOST DOMINANT
          cover colors (coverFrom + coverTo). Per user feedback: "اون صحه
          پشتش دوتتا رنگ هست سیتمی بساز اون دوتا رنگ بر اساس دوتا از بیشترن
          رنگ های اون کتاب اناهاب شه". The coverFrom/coverTo pair IS the
          dominant color pair by definition (covers are rendered
          procedurally from these two colors), so we use them directly.
          The accent color sits as a soft blurred blob behind the meta
          panel for a third-layer depth cue. */}
      <section
        className="relative overflow-hidden border-b border-border/60"
        style={
          {
            '--book-from': book.coverFrom,
            '--book-to': book.coverTo,
            '--book-accent': book.coverAccent,
          } as React.CSSProperties
        }
      >
        {/* Ambient color wash — TWO radial halos using the book's two
            dominant colors (coverFrom + coverTo). Positioned so they
            radiate from behind the cover (top-start) and the meta panel
            (bottom-end). The opacity is tuned to be visible but not
            overwhelming — the user wants the book's colors to clearly
            show through as the page background. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 18% 25%, var(--book-from), transparent 65%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse 60% 70% at 85% 75%, var(--book-to), transparent 65%)',
          }}
        />
        {/* Accent color blob — the third color from the cover, used as
            a soft blurred glow near the bottom for depth. */}
        <div
          className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full opacity-30 blur-3xl"
          aria-hidden="true"
          style={{ background: 'var(--book-accent)' }}
        />
        {/* Gilded top hairline */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent"
          aria-hidden="true"
        />

        <article className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-5">
            <BreadcrumbList className="text-xs sm:text-sm">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">خانه</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronLeft className="h-3.5 w-3.5" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/library">کتابخانه</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronLeft className="h-3.5 w-3.5" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage className="max-w-[40vw] truncate sm:max-w-md">
                  {book.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Hero sentinel — observed by the sticky reading bar */}
          <div id="ky-hero-sentinel" aria-hidden className="h-px w-full" />

          {/* Hero grid */}
          <div className="grid gap-8 md:grid-cols-[280px_1fr] lg:gap-12">
            {/* Cover (in RTL, the first grid cell lands on the right) */}
            <div className="mx-auto w-full max-w-[280px]">
              <div className="aspect-[2/3] overflow-hidden rounded-2xl shadow-2xl shadow-gold-500/20 ring-1 ring-border transition-transform duration-500 ease-out-expo hover:-translate-y-1 hover:rotate-1">
                <BookCover
                  title={book.title}
                  author={book.author}
                  from={book.coverFrom}
                  to={book.coverTo}
                  accent={book.coverAccent}
                  size="lg"
                />
              </div>
            </div>

            {/* Meta */}
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {book.genres.map((g) => (
                    <Badge
                      key={g}
                      variant="secondary"
                      className="bg-gold-500/15 text-gold-800 dark:text-gold-300"
                    >
                      {g}
                    </Badge>
                  ))}
                  <CefrLevelIndicator level={book.level} compact />
                  <TrendingBadge viewCount={book.viewCount} />
                  {book.isPremium && (
                    <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950">
                      پریمیوم
                    </Badge>
                  )}
                </div>

                <h1
                  className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl"
                  dir="ltr"
                >
                  {book.title}
                </h1>
                <p className="text-lg text-muted-foreground">{book.author}</p>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <Stat
                  icon={<Star className="h-4 w-4 fill-gold-500 text-gold-500" />}
                  value={avg.toFixed(1)}
                  label={`امتیاز (${fa(totalReviews)} نظر)`}
                />
                <Stat
                  icon={<BookOpen className="h-4 w-4" />}
                  value={fa(book.pageCount)}
                  label="صفحه"
                />
                <Stat
                  icon={<Clock className="h-4 w-4" />}
                  value={readingTime}
                  label="زمان مطالعه"
                />
                <Stat
                  icon={<Eye className="h-4 w-4" />}
                  value={formatN(book.viewCount)}
                  label="بازدید"
                />
                <Stat
                  icon={<Calendar className="h-4 w-4" />}
                  value={fa(book.publishedYear)}
                  label="سال نشر"
                />
              </div>

              <Separator />

              <div>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  معرفی کتاب
                </h2>
                <p className="leading-relaxed text-foreground/90">
                  {book.description}
                </p>
              </div>

              <div className="pt-2">
                <BookDetailActions slug={book.slug} />
              </div>

              {/* Secondary actions: favorite + collection + share + download */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <FavoriteButton
                  book={{
                    slug: book.slug,
                    title: book.title,
                    author: book.author,
                    coverFrom: book.coverFrom,
                    coverTo: book.coverTo,
                    coverAccent: book.coverAccent,
                  }}
                  size="md"
                />
                <DownloadBookButton
                  slug={book.slug}
                  title={book.title}
                  pageCount={book.pageCount}
                />
                <AddToCollectionButton
                  bookSlug={book.slug}
                  bookTitle={book.title}
                  variant="compact"
                />
                <ShareButton bookSlug={book.slug} bookTitle={book.title} />
              </div>
            </div>
          </div>
        </article>
      </section>

      <article className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Reading progress card — shows for books the user has started */}
        <ReadingProgressCard
          bookSlug={book.slug}
          totalPages={book.pageCount}
        />

        {/* Quick-glance book-specs + rating distribution strip */}
        <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
          {/* مشخصات کتاب */}
          <div className="rounded-2xl border border-border/60 bg-card/60 p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              <Layers className="h-4 w-4" />
              مشخصات کتاب
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <SpecRow
                icon={<BookOpen className="h-4 w-4" />}
                label="تعداد صفحات"
                value={`${fa(book.pageCount)} صفحه`}
              />
              <SpecRow
                icon={<Globe className="h-4 w-4" />}
                label="زبان"
                value="انگلیسی · فارسی"
              />
              <SpecRow
                icon={<Calendar className="h-4 w-4" />}
                label="سال نشر"
                value={fa(book.publishedYear)}
              />
              <SpecRow
                icon={<Clock className="h-4 w-4" />}
                label="زمان مطالعه"
                value={readingTime}
              />
              <SpecRow
                icon={<Hash className="h-4 w-4" />}
                label="کد کتاب"
                value={`#${book.slug}`}
              />
            </dl>
            {/* Visual CEFR level indicator — replaces the plain-text level
                SpecRow with a color-coded A1→C2 bar so learners can gauge
                difficulty at a glance. */}
            <div className="mt-4 border-t border-border/50 pt-4">
              <CefrLevelIndicator level={book.level} />
            </div>
            {book.genres.length > 0 && (
              <div className="mt-4 border-t border-border/50 pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  ژانرها
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {book.genres.map((g) => (
                    <Link
                      key={g}
                      href={`/library?genre=${encodeURIComponent(g)}`}
                      className="inline-flex items-center rounded-full border border-gold-500/30 bg-gold-500/10 px-2.5 py-0.5 text-xs font-medium text-gold-800 transition-colors hover:bg-gold-500/20 dark:text-gold-300"
                    >
                      {g}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rating distribution + quick aggregate */}
          <div className="rounded-2xl border border-border/60 bg-card/60 p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              <Star className="h-4 w-4 fill-gold-500 text-gold-500" />
              امتیاز خوانندگان
            </h2>
            <div className="flex items-center gap-5">
              <div className="flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold text-gold-700 dark:text-gold-300">
                  {avg.toFixed(1)}
                </span>
                <div className="mt-1 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={
                        i < Math.round(avg)
                          ? 'h-3.5 w-3.5 fill-gold-500 text-gold-500'
                          : 'h-3.5 w-3.5 text-muted-foreground/40'
                      }
                    />
                  ))}
                </div>
                <span className="mt-1 text-xs text-muted-foreground">
                  از {fa(totalReviews)} نظر
                </span>
              </div>
              <div className="flex-1 space-y-1.5">
                {ratingBuckets.map(({ star, count, pct }) => (
                  <div
                    key={star}
                    className="flex items-center gap-2 text-xs"
                    role="img"
                    aria-label={`${fa(count)} نفر به این کتاب ${fa(star)} ستاره دادند`}
                  >
                    <span className="flex w-8 shrink-0 items-center gap-0.5 font-medium">
                      <span className="tabular-nums">{fa(star)}</span>
                      <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-l from-gold-400 to-gold-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-start text-muted-foreground tabular-nums">
                      {count > 0 ? fa(count) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              برای دیدن نظرات کامل به پایین صفحه بروید.
            </p>
          </div>
        </section>

        {/* Reading insights — quick stats strip (views, time, pages, rating) */}
        <section className="mt-6">
          <ReadingInsights
            viewCount={book.viewCount}
            pageCount={book.pageCount}
            readingTimeMinutes={Math.max(1, Math.round(book.pageCount * 3))}
            reviewCount={totalReviews}
            averageRating={avg}
          />
        </section>

        {/* Preview section */}
        {showPreview && (
          <section className="mt-10">
            <div className="rounded-2xl border border-gold-500/30 bg-gold-500/5 p-5 sm:p-6">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gold-700 dark:text-gold-300">
                <Quote className="h-4 w-4" />
                پیش‌نمایش کتاب
              </h2>
              <p className="leading-relaxed text-foreground/90">
                {previewText}
              </p>
              <Link
                href={`/books/read/${book.slug}`}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-gold-700 hover:underline dark:text-gold-400"
              >
                مطالعه کامل
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}

        {/* Table of Contents — chapter structure preview */}
        {book.chapters && book.chapters.length > 0 && (
          <BookToc bookSlug={book.slug} chapters={book.chapters} />
        )}

        {/* Reviews */}
        <section className="mt-14" id="ky-reviews-anchor">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <MessageSquare className="h-5 w-5 text-gold-600 dark:text-gold-400" />
              نظر خوانندگان
              <span className="rounded-full bg-gold-500/15 px-2 py-0.5 text-sm text-gold-700 dark:text-gold-400">
                {fa(book.reviews.length)}
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <ShareButton bookSlug={book.slug} bookTitle={book.title} />
              <ReviewFormWrapper bookSlug={book.slug} />
            </div>
          </div>

          {book.reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="font-semibold">هنوز نظری ثبت نشده</p>
              <p className="mt-1 text-sm text-muted-foreground">
                اولین نفر باشید که درباره این کتاب نظر می‌دهد.
              </p>
            </div>
          ) : (
            <ReviewsSection reviews={book.reviews} />
          )}
        </section>

        {/* Related — horizontal-scroll carousel of up to 6 books */}
        {related.length > 0 && (
          <section className="mt-14">
            <div className="mb-5 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <BookOpen className="h-5 w-5 text-gold-600 dark:text-gold-400" />
                کتاب‌های مرتبط
              </h2>
              <Link
                href="/library"
                className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                مشاهده همه
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </div>
            <BookCarousel books={related} />
          </section>
        )}
      </article>

      {/* Sticky reading bar — appears after hero scrolls out of view.
          Renders BOTH a mobile bottom bar and a desktop top bar. */}
      <StickyReadingBar
        slug={book.slug}
        title={book.title}
        author={book.author}
      />
    </>
  )
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: React.ReactNode
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/15 text-gold-700 dark:text-gold-400">
        {icon}
      </span>
      <div className="leading-tight">
        <div className="font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}

function SpecRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2 last:border-b-0">
      <dt className="flex items-center gap-2 text-muted-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gold-500/10 text-gold-700 dark:text-gold-400">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}

function formatN(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}
