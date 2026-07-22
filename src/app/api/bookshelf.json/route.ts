import { db } from '@/lib/db'
import { SITE } from '@/lib/site'
import { NextResponse } from 'next/server'

/**
 * JSON-LD endpoint exposing all books as a schema.org ItemList.
 *
 * Useful for:
 *  - Bulk submission to search consoles / knowledge-graph feeds.
 *  - Third-party crawlers that prefer a single structured-data feed.
 *  - Future integrations (recommendation engines, library aggregators).
 *
 * Served at /api/bookshelf.json. Returns Content-Type: application/ld+json.
 * Revalidated every hour so newly seeded books appear without a redeploy.
 */

const SITE_URL = SITE.url

export const revalidate = 3600 // 1 hour ISR

function parseGenres(raw: string): string[] {
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.map(String) : []
  } catch {
    return []
  }
}

export async function GET() {
  const books = await db.book
    .findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { name: true } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            userName: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
      },
    })
    .catch(() => [])

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'کتاب‌های کتاب‌یار',
    description:
      'فهرست کامل کتاب‌های انگلیسی دوزبانه کتاب‌یار به همراه امتیاز، ژانر و مترجم.',
    numberOfItems: books.length,
    url: `${SITE_URL}/api/bookshelf.json`,
    itemListElement: books.map((b, i) => {
      const canonical = `${SITE_URL}/books/${b.slug}`
      const genres = parseGenres(b.genres)
      const avg =
        b.reviews.length > 0
          ? b.reviews.reduce((s, r) => s + r.rating, 0) / b.reviews.length
          : b.rating

      const reviewsLd = b.reviews.slice(0, 5).map((r) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.userName },
        datePublished: r.createdAt.toISOString().slice(0, 10),
        reviewBody: r.comment,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1,
        },
      }))

      return {
        '@type': 'ListItem',
        position: i + 1,
        url: canonical,
        item: {
          '@type': 'Book',
          '@id': `${canonical}#book`,
          name: b.title,
          description: b.description,
          inLanguage: 'en',
          url: canonical,
          author: { '@type': 'Person', name: b.author?.name ?? b.authorId },
          genre: genres,
          datePublished: `${b.publishedYear}-01-01`,
          numberOfPages: b.pageCount,
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(avg.toFixed(2)),
            bestRating: 5,
            worstRating: 1,
            ratingCount: Math.max(b.reviewCount, b.reviews.length),
            reviewCount: b.reviews.length,
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
        },
      }
    }),
  }

  return NextResponse.json(itemList, {
    headers: {
      'Content-Type': 'application/ld+json; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
