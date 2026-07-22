import { NextResponse } from 'next/server'
import { getActiveQuotes, getQuoteOfTheDayFromDB } from '@/lib/cms'
import type { QuoteTheme } from '@/lib/quotes'

/**
 * GET /api/quotes — curated bilingual quote collection.
 *
 * Quote rows are DB-backed (see `prisma/seed-content.ts` and the admin
 * CMS at `/admin/quotes`). This route applies the same URL filter
 * contract the legacy `filterQuotes()` helper did, but over the DB rows
 * so admin edits appear immediately.
 *
 * Query params (all optional):
 *   • theme    — exact theme tag (e.g. "عشق", "حکمت"). See QUOTE_THEMES.
 *   • bookSlug — book slug to scope quotes to a single book.
 *   • length   — "کوتاه" | "متوسط" | "بلند".
 *   • limit    — positive int, caps the result list.
 *   • random   — "true" | "1" — shuffles the filtered list before limit.
 *
 * Response shape (`QuotesApiResponse`):
 *   {
 *     quotes: CuratedQuote[],
 *     quoteOfTheDay: CuratedQuote,   // deterministic by local date
 *     total: number,                  // size of full curated collection
 *     filtered: number,               // count after filters, before limit
 *   }
 *
 * Caching: 5-minute client / 10-minute CDN — the curated collection only
 * changes when an admin edits the CMS, and quoteOfTheDay only changes
 * once per local midnight, so a short TTL is plenty and keeps the cache
 * lightweight.
 */

const CACHE_CONTROL = 'public, max-age=300, s-maxage=600'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const sp = url.searchParams

    const rawLimit = sp.get('limit')
    const limit =
      rawLimit != null && /^\d+$/.test(rawLimit) ? Number(rawLimit) : undefined
    const random = sp.get('random') === 'true' || sp.get('random') === '1'

    const theme = sp.get('theme') ?? undefined
    const bookSlug = sp.get('bookSlug') ?? undefined
    const length = sp.get('length') ?? undefined

    // Fetch every active quote once; filtering is cheap (≤ a few hundred rows)
    // and lets us random-sample without an extra round-trip.
    const all = await getActiveQuotes()
    const quoteOfTheDay = (await getQuoteOfTheDayFromDB()) ?? all[0] ?? null

    let list = all.slice()

    if (theme) {
      const t = theme.trim()
      list = list.filter((q) => q.theme.includes(t as QuoteTheme))
    }
    if (bookSlug) {
      list = list.filter((q) => q.bookSlug === bookSlug)
    }
    if (length) {
      list = list.filter((q) => q.length === length)
    }

    if (random) {
      // Fisher-Yates in-place shuffle (Math.random is fine — no security need).
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[list[i], list[j]] = [list[j], list[i]]
      }
    }

    const filtered = list.length
    if (typeof limit === 'number' && limit > 0) {
      list = list.slice(0, limit)
    }

    const payload = {
      quotes: list,
      quoteOfTheDay,
      total: all.length,
      filtered,
    }
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': CACHE_CONTROL },
    })
  } catch (err) {
    console.error('[/api/quotes] GET failed:', err)
    return NextResponse.json(
      {
        error:
          'سرویس نقل‌قول‌ها در حال حاضر در دسترس نیست. لطفاً کمی بعد تلاش کنید.',
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
