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
  Feather,
  Globe,
  Library,
  Star,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
}

/**
 * Resolve an author by slug (preferred) or by raw name (legacy fallback).
 *
 * The book-detail JSON-LD currently emits `@id` URLs of the form
 * `/authors/<encodeURIComponent(author)>#author` (e.g.
 * `/authors/Lewis%20Carroll#author`). To keep those URLs resolving to a
 * real page — so search engines don't see a 404 on the structured-data
 * pointer — we first try the canonical slug, then fall back to a raw
 * name match (after Next.js has URL-decoded the route segment).
 *
 * Bio data comes from the Author DB row itself (CMS-managed via
 * /admin/authors). `getAuthors()` attaches the bio fields via
 * `Object.assign`, and `buildAuthorBio()` extracts a typed `AuthorBio`
 * (or `null` when the row has no bio data — the UI renders a fallback
 * card with name + books only).
 */
async function findAuthorBySlug(
  slug: string,
): Promise<{ summary: AuthorSummary; bio: AuthorBio | null } | null> {
  const authors = await getAuthors()
  const decoded = decodeURIComponent(slug)
  const summary =
    authors.find((a) => a.slug === slug) ??
    authors.find((a) => a.name === decoded) ??
    authors.find((a) => a.name.toLowerCase() === decoded.toLowerCase())
  if (!summary) return null

  // `buildAuthorBio` returns null when the Author row has no bio data;
  // the UI renders a fallback card (name + books only) in that case.
  return { summary, bio: buildAuthorBio(summary) }
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
  const title = bio
    ? `${bio.nameFa} (${summary.name}) — زندگی‌نامه و کتاب‌ها`
    : `${summary.name} — کتاب‌ها در کتاب‌یار`
  const description = bio
    ? `${bio.bioFa} ${summary.bookCount} کتاب از ${summary.name} در کتابخانهٔ دوزبانهٔ کتاب‌یار.`
    : `${summary.name} — ${summary.bookCount} کتاب در کتابخانهٔ دوزبانهٔ کتاب‌یار.`
  return {
    title,
    description,
    keywords: [
      summary.name,
      bio?.nameFa,
      bio?.nationalityFa,
      bio?.eraFa,
      'زندگی‌نامه نویسنده',
      'کتاب‌های کلاسیک',
      'مطالعه دوزبانه',
      summary.books[0]?.title,
    ].filter(Boolean) as string[],
    alternates: { canonical },
    openGraph: {
      type: 'profile',
      locale: 'fa_IR',
      url: canonical,
      title,
      description,
      siteName: 'کتاب‌یار',
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(summary.name)}&subtitle=${encodeURIComponent(bio?.nameFa || 'Author')}`,
          width: 1200,
          height: 630,
          alt: summary.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${summary.name} — کتاب‌یار`,
      description,
      images: [
        `/api/og?title=${encodeURIComponent(summary.name)}&subtitle=${encodeURIComponent(bio?.nameFa || 'Author')}`,
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

export default async function AuthorDetailPage({ params }: PageProps) {
  const { slug } = await params
  const found = await findAuthorBySlug(slug)
  if (!found) notFound()

  const { summary: author, bio } = found
  const canonical = `${SITE.url}/authors/${author.slug}`

  // JSON-LD Person schema for SEO. Uses the same `@id` pattern as the
  // book-detail page so structured data stays consistent across routes.
  const personLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${canonical}#author`,
    name: author.name,
    ...(bio?.nameFa ? { alternateName: bio.nameFa } : {}),
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
    description: bio?.bio ?? `${author.name} — author in the Ketab-Yar library.`,
    knowsAbout: author.genres,
    url: canonical,
    worksFor: { '@id': `${SITE.url}/#organization` },
  }

  // JSON-LD ItemList of the author's books — helps search engines connect
  // the author profile to their works in our catalog.
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Books by ${author.name} in Ketab-Yar`,
    itemListElement: author.books.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE.url}/books/${b.slug}`,
      name: b.title,
    })),
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(personLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListLd) }}
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
      <header className="relative overflow-hidden rounded-3xl border border-gold-400/20 bg-gradient-to-br from-card via-card to-gold-500/5 p-8 sm:p-12">
        {/* Ambient halos */}
        <div
          className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-gold-700/8 blur-3xl"
          aria-hidden="true"
        />
        {/* Gilded top hairline */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent"
          aria-hidden="true"
        />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar — large, premium */}
          <div
            aria-hidden="true"
            className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 shadow-xl shadow-gold-500/25 ring-2 ring-gold-500/15"
          >
            <span
              className="font-serif text-4xl font-bold tracking-wide text-white"
              style={{ fontFamily: 'var(--font-display), ui-serif, Georgia, serif' }}
              dir="ltr"
            >
              {getInitials(author.name)}
            </span>
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <h1
              className="text-3xl font-extrabold tracking-tight sm:text-4xl"
              dir="ltr"
            >
              {author.name}
            </h1>
            {bio?.nameFa && (
              <p className="text-lg font-medium text-muted-foreground">
                {bio.nameFa}
              </p>
            )}

            {/* Info badges — clean, minimal */}
            <div className="flex flex-wrap items-center gap-2">
              {bio?.nationalityFa && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium">
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
                <BookOpen aria-hidden="true" className="h-3 w-3" />
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
                  <Calendar aria-hidden="true" className="h-3 w-3" />
                  <span className="tabular-nums">
                    {toPersianDigits(bio.birthYear)} — {bio.deathYear ? toPersianDigits(bio.deathYear) : 'اکنون'}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bio — full width, readable */}
        {bio?.bioFa ? (
          <p className="relative mt-6 max-w-3xl text-base leading-relaxed text-foreground/85">
            {bio.bioFa}
          </p>
        ) : (
          <p className="relative mt-6 rounded-xl border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
            زندگی‌نامهٔ این نویسنده هنوز به فهرست اضافه نشده است. از پنل مدیریت می‌توانید اضافه کنید.
          </p>
        )}

        {/* Notable works — minimal list */}
        {bio && bio.notableWorks.length > 0 && (
          <div className="relative mt-6 flex flex-wrap items-center gap-2">
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
      </header>

      {/* ─── Books ─── */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Library aria-hidden="true" className="h-5 w-5 text-gold-600 dark:text-gold-400" />
            کتاب‌ها
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

      {/* ─── Back link ─── */}
      <div className="mt-10 text-center">
        <Button asChild variant="ghost">
          <Link href="/authors" className="gap-1.5">
            <Feather aria-hidden="true" className="h-4 w-4" />
            بازگشت به نویسندگان
          </Link>
        </Button>
      </div>
    </div>
  )
}

/** Avatar initials — same logic as the client component. */
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
