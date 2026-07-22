/**
 * src/lib/quotes.ts — types + UI constants for the quotes gallery.
 *
 * This module is the spiritual successor to the legacy
 * `src/lib/the legacy quotes module` (which also shipped the hardcoded
 * `CURATED_QUOTES` array). The data array now lives in the `Quote` Prisma
 * model — seeded from `prisma/seed-content.ts` and editable via the admin
 * CMS at `/admin/quotes`. Runtime consumers should fetch via
 * `src/lib/cms.ts` (`getActiveQuotes`, `getQuoteOfTheDayFromDB`) on the
 * server, or hit `/api/quotes` on the client.
 *
 * What remains here:
 *   • The TypeScript types (`CuratedQuote`, `QuoteTheme`, `QuoteLength`)
 *     used by both server and client.
 *   • The small UI-constant arrays (`QUOTE_THEMES`, `QUOTE_LENGTHS`) that
 *     drive the filter-chip rows in the gallery — these are Persian label
 *     constants, not data, so they stay in code (changing them would
 *     require a UI re-deploy anyway).
 */

/** The 10 curated theme tags shown as filter chips in the gallery. */
export const QUOTE_THEMES = [
  'خوش‌بینی',
  'عشق',
  'ماجراجویی',
  'حکمت',
  'رشد شخصی',
  'طبیعت',
  'دوستی',
  'شجاعت',
  'زمان',
  'خیال',
] as const

export type QuoteTheme = (typeof QUOTE_THEMES)[number]

/** The 3 length buckets — derived from the English word count. */
export const QUOTE_LENGTHS = ['کوتاه', 'متوسط', 'بلند'] as const
export type QuoteLength = (typeof QUOTE_LENGTHS)[number]

export interface CuratedQuote {
  /** Stable slug id, used as React key + saved-quote ref. */
  id: string
  /** The English excerpt (verbatim from the book page). */
  text: string
  /** The Farsi translation (verbatim from the same book page). */
  textFa: string
  /** Book slug — used to resolve the cover thumbnail. */
  bookSlug: string
  /** English book title (denormalised for the card; no join needed). */
  bookTitle: string
  /** English author name (denormalised). */
  bookAuthor: string
  /** Page number the excerpt appears on (1-indexed). */
  pageNumber: number
  /** Themes — array of `QuoteTheme` values for filter chips. */
  theme: QuoteTheme[]
  /** Length bucket — drives the badge + filter. */
  length: QuoteLength
}
