import { NextResponse } from 'next/server'
import { getAuthors } from '@/lib/data'

/**
 * /api/authors — Author directory endpoint.
 *
 * Returns every author in the catalog with their books, stats, and the
 * biographical profile from the Author table (CMS-managed).
 *
 * Cache strategy: 5 min in-browser, 10 min at the CDN.
 */
const CACHE_CONTROL = 'public, max-age=300, s-maxage=600'

export async function GET() {
  try {
    const authors = await getAuthors()
    // getAuthors() already returns the full author shape including bio fields
    // from the DB (bio, bioFa, nameFa, photoUrl, era, etc.) — no need for the
    // legacy hardcoded getAuthorBio() lookup anymore.
    return NextResponse.json(
      { authors, count: authors.length },
      { headers: { 'Cache-Control': CACHE_CONTROL } },
    )
  } catch (err) {
    console.error('[/api/authors] GET failed:', err)
    return NextResponse.json(
      { error: 'بارگذاری فهرست نویسندگان ناموفق بود.' },
      { status: 500 },
    )
  }
}
