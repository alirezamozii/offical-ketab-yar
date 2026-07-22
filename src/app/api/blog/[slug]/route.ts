/**
 * GET /api/blog/[slug] — public single-post detail.
 *
 * Returns the full post (including markdown content) when:
 *   • slug matches
 *   • published = true
 *   • publishedAt <= now()
 *
 * Returns 404 otherwise — keeps unpublished / future-dated / deleted
 * posts indistinguishable to discourage slug enumeration.
 *
 * Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=86400
 * — short browser TTL for edits, longer CDN TTL with a one-day SWR
 * window so a popular post stays warm even during a DB blip.
 *
 * NOTE: view-count increment is fire-and-forget — we don't `await` it
 * so a slow write can't stall the read. Prisma's `update({ where: { id } })`
 * is safe even if the post was just deleted (it throws P2025 which we
 * swallow).
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const CACHE_CONTROL =
  'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'

function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === 'string') : []
  } catch {
    return []
  }
}

function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length
  if (words === 0) return 1
  return Math.max(1, Math.round(words / 250))
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  try {
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
      return NextResponse.json(
        { ok: false, error: 'مقاله یافت نشد.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    // Fire-and-forget view-count increment.
    db.blogPost
      .update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => {
        /* swallow — view counts are best-effort */
      })

    return NextResponse.json(
      {
        ok: true,
        post: {
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          coverUrl: post.coverUrl,
          coverBlurhash: post.coverBlurhash,
          tags: parseTags(post.tags),
          publishedAt: post.publishedAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          viewCount: post.viewCount,
          readingMinutes: readingMinutes(post.content),
          author: post.author,
        },
      },
      { headers: { 'Cache-Control': CACHE_CONTROL } },
    )
  } catch (err) {
    console.error('[/api/blog/[slug]] GET failed:', err)
    return NextResponse.json(
      { ok: false, error: 'سرویس بلاگ در حال حاضر در دسترس نیست.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
