/**
 * GET /api/blog — public, paginated list of published blog posts.
 *
 * Returns posts where:
 *   • published = true
 *   • publishedAt <= now()  (so a future-dated post stays hidden)
 *
 * Query params:
 *   • page  — 1-indexed page number (default 1, clamped to >=1)
 *   • limit — items per page (default 10, max 50)
 *
 * Each item in `posts[]` carries the fields the index UI needs:
 * id, slug, title, excerpt, coverUrl, coverBlurhash, publishedAt,
 * viewCount, tags, author { id, name, username, image }, readingMinutes.
 *
 * Cache-Control: public, max-age=60, s-maxage=300 — short browser TTL
 * so a freshly published post shows up on a hard refresh, longer CDN
 * TTL for the static-ish list. `revalidateBlog()` invalidates /blog
 * (the page) on every admin mutation; this API route is invalidated
 * transitively via the same path-key.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const CACHE_CONTROL = 'public, max-age=60, s-maxage=300'

const PAGE_SIZE = 10
const MAX_PAGE_SIZE = 50

/**
 * Cheap reading-time heuristic. Persian/English mixed content averages
 * ~250 wpm; we round up so the estimate is honest rather than optimistic.
 */
function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length
  if (words === 0) return 1
  return Math.max(1, Math.round(words / 250))
}

function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === 'string') : []
  } catch {
    return []
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const pageParam = Number.parseInt(url.searchParams.get('page') || '1', 10)
  const limitParam = Number.parseInt(url.searchParams.get('limit') || String(PAGE_SIZE), 10)

  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  const limit = Number.isFinite(limitParam) && limitParam > 0
    ? Math.min(limitParam, MAX_PAGE_SIZE)
    : PAGE_SIZE

  try {
    const now = new Date()
    const where = {
      published: true,
      publishedAt: { lte: now },
    }

    const [total, rows] = await Promise.all([
      db.blogPost.count({ where }),
      db.blogPost.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverUrl: true,
          coverBlurhash: true,
          tags: true,
          publishedAt: true,
          viewCount: true,
          content: true, // needed for reading-time estimate
          author: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
      }),
    ])

    const posts = rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt,
      coverUrl: r.coverUrl,
      coverBlurhash: r.coverBlurhash,
      tags: parseTags(r.tags),
      publishedAt: r.publishedAt?.toISOString() ?? null,
      viewCount: r.viewCount,
      readingMinutes: readingMinutes(r.content),
      author: r.author,
    }))

    return NextResponse.json(
      {
        ok: true,
        posts,
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      { headers: { 'Cache-Control': CACHE_CONTROL } },
    )
  } catch (err) {
    console.error('[/api/blog] GET failed:', err)
    return NextResponse.json(
      { ok: false, error: 'سرویس بلاگ در حال حاضر در دسترس نیست.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
