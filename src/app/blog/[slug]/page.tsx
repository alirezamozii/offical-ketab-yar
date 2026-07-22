/**
 * /blog/[slug] — public blog post detail page.
 *
 * Server component. Fetches the post directly from the DB (skipping the
 * `/api/blog/[slug]` HTTP hop) so generateMetadata + render share one
 * query. Only renders posts where:
 *   • published = true
 *   • publishedAt <= now()
 *
 * SEO:
 *   • `generateMetadata` — title, description, canonical, OG, Twitter
 *   • JSON-LD `Article` schema via `safeJsonLd` (XSS-safe)
 *   • `generateStaticParams` pre-renders the 50 most recent slugs at
 *     build time; the rest are rendered on-demand and ISR'd.
 *
 * Body:
 *   • Rendered with `react-markdown` (re-installed for this feature).
 *   • Gold-palette prose styling via Tailwind utility classes.
 *
 * UX:
 *   • Breadcrumb + back-to-blog link.
 *   • Author chip (Avatar), Jalali publish date, reading time, views.
 *   • Share button (Web Share API + popover fallback).
 *   • Tags as gold chips.
 */

import ReactMarkdown from 'react-markdown'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowRight,
  Calendar,
  Clock,
  Eye,
  Sparkles,
  Tag,
  ArrowLeft,
} from 'lucide-react'

import { db } from '@/lib/db'
import { SITE } from '@/lib/site'
import { safeJsonLd } from '@/lib/json-ld'
import { formatPersianDate, toPersianDigits, formatPersianNumber } from '@/lib/typography'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BlogShareButton } from '@/components/blog/blog-share-button'
import { BlogCover } from '@/components/blog/blog-cover'
import { BlogReadingProgress } from '@/components/blog/blog-reading-progress'

const SITE_URL = SITE.url

interface PageProps {
  params: Promise<{ slug: string }>
}

/** Parse the JSON-encoded `tags` column safely. */
function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === 'string') : []
  } catch {
    return []
  }
}

/** Cheap reading-time heuristic — ~250 wpm for mixed Persian/English. */
function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length
  if (words === 0) return 1
  return Math.max(1, Math.round(words / 250))
}

/** Initials for the author avatar fallback. */
function authorInitials(name?: string | null, username?: string | null): string {
  const base = (name || username || 'KY').trim()
  const parts = base.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'KY'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/**
 * Build the SEO metadata for a blog post. Returns a no-index placeholder
 * when the post is missing / unpublished / future-dated so we never leak
 * unpublished content into the index.
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await db.blogPost.findUnique({
    where: { slug },
    select: {
      title: true,
      excerpt: true,
      coverUrl: true,
      published: true,
      publishedAt: true,
      author: { select: { name: true, username: true } },
    },
  })

  if (
    !post ||
    !post.published ||
    !post.publishedAt ||
    post.publishedAt.getTime() > Date.now()
  ) {
    return {
      title: 'مقاله یافت نشد',
      robots: { index: false, follow: false },
    }
  }

  const canonical = `${SITE_URL}/blog/${slug}`
  const description =
    post.excerpt?.trim() ||
    `${post.title} — مقاله‌ای در بلاگ کتاب‌یار درباره یادگیری زبان با کتاب و مطالعه دوزبانه.`

  const ogImage = post.coverUrl || `/api/og?title=${encodeURIComponent(post.title)}`
  const authorName = post.author.name || post.author.username || 'کتاب‌یار'

  return {
    title: `${post.title} | بلاگ کتاب‌یار`,
    description,
    keywords: [
      post.title,
      'بلاگ کتاب‌یار',
      'یادگیری زبان انگلیسی',
      'مطالعه دوزبانه',
      'کتاب کلاسیک',
    ],
    alternates: { canonical },
    openGraph: {
      type: 'article',
      locale: 'fa_IR',
      url: canonical,
      title: post.title,
      description,
      siteName: 'کتاب‌یار',
      publishedTime: post.publishedAt.toISOString(),
      authors: [authorName],
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
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
 * Pre-render the 50 most-recent published posts at build time. Older
 * posts are rendered on-demand and ISR'd via the route segment config
 * below. Returns `[]` if the DB is unavailable so the build never hard
 * fails on a missing DB.
 */
export async function generateStaticParams() {
  try {
    const posts = await db.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      take: 50,
      select: { slug: true },
    })
    return posts.map((p) => ({ slug: p.slug }))
  } catch {
    return []
  }
}

/** Re-render published posts at most once per hour (ISR). */
export const revalidate = 3600

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await db.blogPost.findUnique({
    where: { slug },
    include: {
      author: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
  })

  if (
    !post ||
    !post.published ||
    !post.publishedAt ||
    post.publishedAt.getTime() > Date.now()
  ) {
    notFound()
  }

  const tags = parseTags(post.tags)
  const minutes = readingMinutes(post.content)
  const canonical = `${SITE_URL}/blog/${post.slug}`
  const authorName = post.author.name || post.author.username || 'کتاب‌یار'

  // Fetch up to 3 related posts (same tag, excluding current post).
  // Falls back to most-recent posts if no tag match.
  const relatedPosts = await (async () => {
    if (tags.length === 0) return []
    const tagMatch = await db.blogPost.findMany({
      where: {
        published: true,
        publishedAt: { lte: new Date() },
        slug: { not: post.slug },
        OR: tags.map((t) => ({
          tags: { contains: t },
        })),
      },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        tags: true,
        publishedAt: true,
        coverUrl: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    })
    if (tagMatch.length >= 3) return tagMatch
    // Top up with recent posts if we don't have enough tag matches
    const extras = await db.blogPost.findMany({
      where: {
        published: true,
        publishedAt: { lte: new Date() },
        slug: { not: post.slug, notIn: tagMatch.map((p) => p.slug) },
      },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        tags: true,
        publishedAt: true,
        coverUrl: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 3 - tagMatch.length,
    })
    return [...tagMatch, ...extras]
  })()

  // JSON-LD Article schema — XSS-safe via safeJsonLd.
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${canonical}#article`,
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.coverUrl ? [post.coverUrl] : undefined,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    inLanguage: 'fa-IR',
    url: canonical,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonical,
    },
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.svg`,
      },
    },
    ...(tags.length > 0 ? { keywords: tags.join(', ') } : {}),
  }

  return (
    <article className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      {/* JSON-LD Article schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(articleLd) }}
      />

      {/* Breadcrumb + back link */}
      <nav aria-label="مسیر" className="mb-6">
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li>
            <Link href="/blog" className="hover:text-foreground">
              بلاگ
            </Link>
          </li>
          <li aria-hidden="true">
            <ArrowLeft className="h-3 w-3" />
          </li>
          <li className="truncate text-foreground" aria-current="page">
            {post.title}
          </li>
        </ol>
      </nav>

      {/* Reading progress bar — fixed at top, shows scroll progress */}
      <BlogReadingProgress />

      <Button asChild variant="ghost" size="sm" className="mb-6 gap-1.5 px-2">
        <Link href="/blog" aria-label="بازگشت به بلاگ">
          <ArrowRight className="h-4 w-4" />
          بازگشت به بلاگ
        </Link>
      </Button>

      {/* Header */}
      <header className="space-y-5 pb-8">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Badge
                key={t}
                variant="secondary"
                className="gap-1 bg-gold-500/10 text-gold-700 dark:text-gold-300"
              >
                <Tag className="h-3 w-3" aria-hidden="true" />
                {t}
              </Badge>
            ))}
          </div>
        )}

        <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            {post.excerpt}
          </p>
        )}

        {/* Cover image — use uploaded image if available, otherwise procedural cover */}
        {post.coverUrl ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl ring-1 ring-border/60">
            <Image
              src={post.coverUrl}
              alt={`تصویر مقاله ${post.title}`}
              fill
              priority
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
            />
          </div>
        ) : (
          <BlogCover
            tag={tags[0]}
            title={post.title}
            variant="hero"
          />
        )}

        {/* Byline */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border/60 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 ring-2 ring-gold-500/30">
              {post.author.image ? (
                <AvatarImage src={post.author.image} alt={authorName} />
              ) : null}
              <AvatarFallback className="bg-gold-500/15 text-sm font-bold text-gold-700 dark:text-gold-300">
                {authorInitials(post.author.name, post.author.username)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">{authorName}</p>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                  {formatPersianDate(post.publishedAt, 'long')}
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {toPersianDigits(minutes)} دقیقه مطالعه
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" aria-hidden="true" />
                  {formatPersianNumber(post.viewCount)}
                </span>
              </p>
            </div>
          </div>
          <BlogShareButton slug={post.slug} title={post.title} />
        </div>
      </header>

      {/* Markdown body — gold-palette prose */}
      <div
        dir="rtl"
        className="prose prose-stone max-w-none dark:prose-invert
          prose-headings:font-extrabold prose-headings:tracking-tight
          prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
          prose-h2:mt-10 prose-h2:mb-3 prose-h2:border-b prose-h2:border-gold-500/20 prose-h2:pb-2
          prose-p:leading-relaxed prose-p:text-foreground/90
          prose-a:text-gold-700 prose-a:underline-offset-2 hover:prose-a:text-gold-800 dark:prose-a:text-gold-400 dark:hover:prose-a:text-gold-300
          prose-strong:font-bold prose-strong:text-foreground
          prose-blockquote:border-r-4 prose-blockquote:border-gold-500/40 prose-blockquote:bg-gold-500/5 prose-blockquote:py-2 prose-blockquote:pr-4 prose-blockquote:rounded-l-md prose-blockquote:not-italic
          prose-code:rounded prose-code:bg-gold-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-gold-800 prose-code:before:content-none prose-code:after:content-none dark:prose-code:text-gold-300
          prose-pre:bg-card prose-pre:ring-1 prose-pre:ring-border/60
          prose-ul:list-disc prose-ol:list-decimal
          prose-img:rounded-xl prose-img:ring-1 prose-img:ring-border/60
          prose-hr:border-gold-500/20"
      >
        <ReactMarkdown>{post.content || ''}</ReactMarkdown>
      </div>

      {/* Related posts — up to 3, matched by tag */}
      {relatedPosts.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold tracking-tight sm:text-xl">
            <Sparkles className="h-5 w-5 text-gold-600 dark:text-gold-400" aria-hidden="true" />
            مقالات مرتبط
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((rp) => {
              const rpTags = parseTags(rp.tags)
              return (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-[transform,opacity,colors,border-color,background-color] hover:border-gold-500/40 hover:shadow-md"
                >
                  {/* Procedural cover or uploaded image */}
                  {rp.coverUrl ? (
                    <div className="relative aspect-video w-full overflow-hidden">
                      <Image
                        src={rp.coverUrl}
                        alt={`تصویر مقاله ${rp.title}`}
                        fill
                        sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <BlogCover
                      tag={rpTags[0]}
                      title={rp.title}
                      variant="list"
                      className="hidden sm:flex h-32 w-full rounded-none border-b border-border/60"
                    />
                  )}
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    {rpTags[0] && (
                      <span className="w-fit rounded-full bg-gold-500/10 px-2 py-0.5 text-[10px] font-semibold text-gold-700 dark:text-gold-300">
                        {rpTags[0]}
                      </span>
                    )}
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug transition-colors group-hover:text-gold-700 dark:group-hover:text-gold-300">
                      {rp.title}
                    </h3>
                    {rp.excerpt && (
                      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {rp.excerpt}
                      </p>
                    )}
                    <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-semibold text-gold-700 transition-[transform,opacity,colors,border-color,background-color] group-hover:gap-2 dark:text-gold-400">
                      ادامه مطلب
                      <ArrowLeft className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Footer CTA */}
      <footer className="mt-12 rounded-2xl border border-gold-500/20 bg-gradient-to-br from-gold-500/10 via-card to-card p-6 text-center sm:p-8">
        <h2 className="text-lg font-bold tracking-tight sm:text-xl">
          مطالعه را شروع کنید
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          کتاب‌یار پلتفرمی هوشمند برای مطالعه دوزبانه کتاب‌های انگلیسی با دیکشنری،
          ترجمه فارسی و واژگان‌ساز است.
        </p>
        <Button asChild variant="glow" className="mt-5 gap-2">
          <Link href="/library" aria-label="مرور کتابخانه">
            مرور کتاب‌ها
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </footer>
    </article>
  )
}
