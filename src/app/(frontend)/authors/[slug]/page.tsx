import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { safeJsonLd } from '@/lib/json-ld'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { BookCard } from '@/components/books/book-card'
import { getAuthors, type AuthorSummary } from '@/lib/data'
import { buildAuthorBio } from '@/lib/cms'
import type { AuthorBio } from '@/lib/authors'
import { SITE } from '@/lib/site'

export const dynamic = 'force-dynamic'
import { toPersianDigits } from '@/lib/typography'
import {
  BookOpen,
  Calendar,
  ExternalLink,
  Feather,
  Globe,
  Library,
  Sparkles,
  Star,
  Tag,
  Users,
} from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function findAuthorBySlug(
  slug: string,
): Promise<{ summary: AuthorSummary; bio: AuthorBio | null; allAuthors: AuthorSummary[] } | null> {
  const authors = await getAuthors()
  const decoded = decodeURIComponent(slug)
  const summary =
    authors.find((a) => a.slug === slug) ??
    authors.find((a) => a.name === decoded) ??
    authors.find((a) => a.name.toLowerCase() === decoded.toLowerCase())
  if (!summary) return null

  return { summary, bio: buildAuthorBio(summary), allAuthors: authors }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const found = await findAuthorBySlug(slug)
  if (!found) {
    return {
      title: 'نویسنده یافت نشد',
      robots: { index: false, follow: false },
    }
  }
  const { summary, bio } = found
  const canonical = `${SITE.url}/authors/${summary.slug}`
  const title = bio?.nameFa
    ? `${bio.nameFa} (${summary.name}) — زندگی‌نامه و کتاب‌ها`
    : `${summary.name} — کتاب‌ها در بوکزی`
  const description = bio?.bioFa
    ? `${bio.bioFa} ${summary.bookCount} کتاب از ${summary.name} در زیست‌بومِ کتاب‌های دوزبانه بوکزی.`
    : `${summary.name} — ${summary.bookCount} کتاب در زیست‌بومِ کتاب‌های دوزبانه بوکزی.`

  const keywords = [
    summary.name,
    bio?.nameFa,
    bio?.nationalityFa,
    bio?.eraFa,
    'بوکزی',
    'Bookzi',
    'زندگی‌نامه نویسنده',
    'کتاب‌های دوزبانه',
    'مطالعه دوزبانه',
    ...(bio?.tags || []),
    summary.books[0]?.title,
  ].filter(Boolean) as string[]

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: 'profile',
      locale: 'fa_IR',
      url: canonical,
      title,
      description,
      siteName: 'بوکزی',
      images: [
        {
          url: (summary as any).photoUrl || `/api/og?title=${encodeURIComponent(summary.name)}&subtitle=${encodeURIComponent(bio?.nameFa || 'Author')}`,
          width: 1200,
          height: 630,
          alt: summary.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${summary.name} — بوکزی`,
      description,
      images: [
        (summary as any).photoUrl || `/api/og?title=${encodeURIComponent(summary.name)}&subtitle=${encodeURIComponent(bio?.nameFa || 'Author')}`,
      ],
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

// fallow-ignore-next-line complexity
export default async function AuthorDetailPage({ params }: PageProps) {
  const { slug } = await params
  const found = await findAuthorBySlug(slug)
  if (!found) notFound()

  const { summary: author, bio, allAuthors } = found
  const canonical = `${SITE.url}/authors/${author.slug}`
  const photoUrl = (author as any).photoUrl || ''

  // Related authors from same era or nationality
  const relatedAuthors = allAuthors
    .filter(
      (a) =>
        a.slug !== author.slug &&
        ((a as any).era === (author as any).era ||
          (a as any).nationality === (author as any).nationality),
    )
    .slice(0, 4)

  // JSON-LD Person schema for SEO.
  const sameAs: string[] = []
  if (bio?.wikipedia) sameAs.push(bio.wikipedia)
  if (bio?.website) sameAs.push(bio.website)

  const personLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${canonical}#author`,
    name: author.name,
    ...(bio?.nameFa ? { alternateName: bio.nameFa } : {}),
    ...(photoUrl ? { image: photoUrl } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(bio?.birthYear
      ? {
          birthDate: `${bio.birthYear}-01-01`,
          ...(bio.deathYear ? { deathDate: `${bio.deathYear}-01-01` } : {}),
        }
      : {}),
    ...(bio?.nationality
      ? { nationality: { '@type': 'Country', name: bio.nationality } }
      : {}),
    jobTitle: 'Author',
    description: bio?.bio || bio?.bioFa || `${author.name} — author in Bookzi.`,
    knowsAbout: [...author.genres, ...(bio?.tags || [])],
    url: canonical,
    worksFor: { '@id': `${SITE.url}/#organization` },
  }

  // JSON-LD ItemList of the author's books
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Books by ${author.name} in Bookzi`,
    itemListElement: author.books.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE.url}/books/${b.slug}`,
      name: b.title,
    })),
  }

  // JSON-LD BreadcrumbList
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'خانه',
        item: SITE.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'نویسندگان',
        item: `${SITE.url}/authors`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: author.name,
        item: canonical,
      },
    ],
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Script
        id="author-person-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(personLd) }}
      />
      <Script
        id="author-itemlist-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListLd) }}
      />
      <Script
        id="author-breadcrumb-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />

      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">خانه</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/authors">نویسندگان</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{author.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ─── Author hero — full-width, premium ─── */}
      <header className="relative overflow-hidden rounded-3xl border border-gold-400/20 bg-gradient-to-br from-card via-card to-gold-500/5 p-6 sm:p-10 shadow-xl">
        {/* Ambient halos */}
        <div
          className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-gold-700/8 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent"
          aria-hidden="true"
        />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar or Photo */}
          {photoUrl ? (
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border-2 border-gold-500/30 shadow-xl shadow-gold-500/20">
              <Image
                src={photoUrl}
                alt={author.name}
                fill
                className="object-cover"
                sizes="128px"
                priority
              />
            </div>
          ) : (
            <div
              aria-hidden="true"
              className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 shadow-xl shadow-gold-500/25 ring-2 ring-gold-500/15"
            >
              <span
                className="font-serif text-4xl font-bold tracking-wide text-white"
                style={{ fontFamily: 'var(--font-display), ui-serif, Georgia, serif' }}
                dir="ltr"
              >
                {getInitials(author.name)}
              </span>
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1
                className="text-3xl font-extrabold tracking-tight sm:text-4xl"
                dir="ltr"
              >
                {author.name}
              </h1>
              {bio?.nameFa && (
                <span className="text-xl font-semibold text-gold-600 dark:text-gold-400">
                  {bio.nameFa}
                </span>
              )}
            </div>

            {/* Info badges */}
            <div className="flex flex-wrap items-center gap-2">
              {bio?.nationalityFa && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium">
                  {bio.flagEmoji && <span aria-hidden="true">{bio.flagEmoji}</span>}
                  <Globe aria-hidden="true" className="h-3 w-3 text-gold-600 dark:text-gold-400" />
                  {bio.nationalityFa}
                </span>
              )}
              {bio?.eraFa && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-700 dark:text-gold-300">
                  <Feather aria-hidden="true" className="h-3 w-3" />
                  {bio.eraFa}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium">
                <BookOpen aria-hidden="true" className="h-3 w-3 text-gold-600 dark:text-gold-400" />
                <span className="tabular-nums">{toPersianDigits(author.bookCount)}</span> کتاب
              </span>
              {author.averageRating > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium">
                  <Star aria-hidden="true" className="h-3 w-3 fill-gold-500 text-gold-500" />
                  <span className="tabular-nums">{toPersianDigits(author.averageRating.toFixed(1))}</span>
                </span>
              )}
              {bio && bio.birthYear > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium">
                  <Calendar aria-hidden="true" className="h-3 w-3 text-gold-600 dark:text-gold-400" />
                  <span className="tabular-nums">
                    {toPersianDigits(bio.birthYear)} — {bio.deathYear ? toPersianDigits(bio.deathYear) : 'اکنون'}
                  </span>
                </span>
              )}
            </div>

            {/* Tags */}
            {bio && bio.tags && bio.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <Tag aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
                {bio.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Short Bio */}
        {(bio?.bioFa || bio?.bio) && (
          <div className="relative mt-6 max-w-3xl space-y-2">
            {bio.bioFa && (
              <p className="text-base leading-relaxed text-foreground/90">
                {bio.bioFa}
              </p>
            )}
            {bio.bio && (!bio.bioFa || bio.bio !== bio.bioFa) && (
              <p className="text-sm leading-relaxed text-muted-foreground font-serif italic" dir="ltr">
                {bio.bio}
              </p>
            )}
          </div>
        )}

        {/* Long-form Biography if present */}
        {(bio?.biographyFa || bio?.biography) && (
          <div className="relative mt-6 rounded-2xl border border-border/50 bg-background/50 p-5 sm:p-6 space-y-3">
            <h3 className="flex items-center gap-2 text-base font-bold text-gold-600 dark:text-gold-400">
              <Sparkles className="h-4 w-4" />
              زندگی‌نامه و بیوگرافی تفصیلی
            </h3>
            {bio.biographyFa && (
              <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-foreground/90">
                {bio.biographyFa}
              </p>
            )}
            {bio.biography && (!bio.biographyFa || bio.biography !== bio.biographyFa) && (
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground pt-2 border-t border-border/30" dir="ltr">
                {bio.biography}
              </p>
            )}
          </div>
        )}

        {/* External links & notable works */}
        <div className="relative mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border/40 pt-4">
          {bio && bio.notableWorks.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">آثار شاخص:</span>
              {bio.notableWorks.map((w) => (
                <span
                  key={w}
                  className="rounded-full bg-muted/60 px-2.5 py-0.5 text-xs text-foreground/80"
                  dir="ltr"
                >
                  {w}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 ms-auto">
            {bio?.wikipedia && (
              <Button asChild variant="outline" size="sm" className="h-8 gap-1 text-xs">
                <a href={bio.wikipedia} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3" />
                  ویکی‌پدیا
                </a>
              </Button>
            )}
            {bio?.website && (
              <Button asChild variant="outline" size="sm" className="h-8 gap-1 text-xs">
                <a href={bio.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-3 w-3" />
                  وبگاه رسمی
                </a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ─── Books ─── */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Library aria-hidden="true" className="h-5 w-5 text-gold-600 dark:text-gold-400" />
            کتاب‌ها در کتابخانه
            <span className="text-sm font-normal text-muted-foreground">
              ({toPersianDigits(author.books.length)})
            </span>
          </h2>
          <Button asChild variant="outline" size="sm">
            <Link
              href={`/library?author=${encodeURIComponent(author.name)}`}
              className="gap-1.5"
              aria-label={`مشاهدهٔ همهٔ کتاب‌های ${author.name} در کتابخانه`}
            >
              <Library aria-hidden="true" className="h-3.5 w-3.5" />
              مشاهدهٔ همه
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {author.books.map((b) => (
            <BookCard key={b.slug} book={b} />
          ))}
        </div>
      </section>

      {/* ─── Related Authors ─── */}
      {relatedAuthors.length > 0 && (
        <section className="mt-12 border-t border-border/60 pt-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Users className="h-5 w-5 text-gold-600 dark:text-gold-400" />
            نویسندگان هم‌دوره و مرتبط
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedAuthors.map((rel) => {
              const relBio = buildAuthorBio(rel)
              return (
                <Link
                  key={rel.slug}
                  href={`/authors/${rel.slug}`}
                  className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:border-gold-500/40 hover:shadow-md"
                >
                  <div
                    aria-hidden="true"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-white font-bold shadow-md"
                  >
                    {getInitials(rel.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-foreground group-hover:text-gold-600 dark:group-hover:text-gold-400">
                      {rel.name}
                    </h3>
                    {relBio?.nameFa && (
                      <p className="truncate text-xs text-muted-foreground">
                        {relBio.nameFa}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="tabular-nums">{toPersianDigits(rel.bookCount)}</span> کتاب
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ─── Back link ─── */}
      <div className="mt-12 text-center">
        <Button asChild variant="ghost">
          <Link href="/authors" className="gap-1.5">
            <Feather aria-hidden="true" className="h-4 w-4" />
            بازگشت به فهرست نویسندگان
          </Link>
        </Button>
      </div>
    </div>
  )
}

function getInitials(name: string): string {
  const SKIP = new Set(['de', 'von', 'van', 'der', 'di', 'le', 'la', 'du'])
  const parts = name
    .split(/\s+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !SKIP.has(p.toLowerCase()))
  if (parts.length === 0) return '?'
  if (parts.length === 1) {
    const w = parts[0].replace(/[^\p{L}]/gu, '')
    return w.slice(0, 2).toUpperCase() || '?'
  }
  const first = parts[0].charAt(0).toUpperCase()
  const last = parts[parts.length - 1].charAt(0).toUpperCase()
  return first + last
}
