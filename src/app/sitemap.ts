import { db } from '@/lib/db'
import { SITE } from '@/lib/site'
import type { MetadataRoute } from 'next'

/**
 * Dynamic sitemap for ketab-yar (max-level SEO).
 *
 * Strategy:
 *  - Public, indexable pages (home, library, genres, authors index, quotes,
 *    about, help, support, leaderboard, blog) at fixed priorities.
 *  - All book detail pages at priority 0.9, changeFrequency weekly,
 *    lastModified = book.createdAt.
 *  - All author detail pages at priority 0.7, changeFrequency weekly,
 *    lastModified = author.updatedAt.
 *  - All published blog post detail pages at priority 0.6.
 *  - Genre pages currently exist as `/library?genre=X` query-string variants
 *    of `/library`, not as unique indexable routes — so they are excluded
 *    to avoid duplicate-content noise. `/library/genres` itself is included.
 *  - Private / app-like pages (`/dashboard`, `/profile`, `/vocabulary*`,
 *    `/search`, `/books/read/*`, `/api/*`, `/admin*`, `/onboarding`,
 *    `/settings`, `/goals`, `/stats`, `/achievements`, `/collections`) are
 *    excluded — they are per-user / app-like and shouldn't be indexed.
 *  - Revalidate every hour so newly seeded books appear without a redeploy.
 *
 * Served automatically at /sitemap.xml by Next.js App Router.
 */

const SITE_URL = SITE.url

export const revalidate = 3600 // 1 hour ISR

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Static, indexable pages.
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/library`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/library/genres`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/authors`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/quotes`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/help`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/support`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/leaderboard`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ]

  // Dynamic book detail pages.
  let books: { slug: string; createdAt: Date }[] = []
  try {
    books = await db.book.findMany({
      select: { slug: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    // DB not yet seeded / unavailable — emit a sitemap with static pages only.
    books = []
  }

  const bookPages: MetadataRoute.Sitemap = books.map((b) => ({
    url: `${SITE_URL}/books/${b.slug}`,
    lastModified: b.createdAt,
    changeFrequency: 'weekly',
    priority: 0.9,
  }))

  // Dynamic author detail pages.
  let authors: { slug: string; updatedAt: Date }[] = []
  try {
    authors = await db.author.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { name: 'asc' },
    })
  } catch {
    authors = []
  }

  const authorPages: MetadataRoute.Sitemap = authors.map((a) => ({
    url: `${SITE_URL}/authors/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // Dynamic blog post detail pages — only published posts.
  let blogPosts: { slug: string; publishedAt: Date | null }[] = []
  try {
    blogPosts = await db.blogPost.findMany({
      where: { published: true, publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: 'desc' },
      select: { slug: true, publishedAt: true },
    })
  } catch {
    blogPosts = []
  }

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: p.publishedAt ?? new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticPages, ...bookPages, ...authorPages, ...blogPages]
}
