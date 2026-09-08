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
  /** Optional user or community metadata */
  likes?: number
  dislikes?: number
  isPublic?: boolean
  highlightColor?: string
}

// ---------------------------------------------------------------------------
// Paper & Studio Customization Types
// ---------------------------------------------------------------------------

export type PaperStyle =
  | 'kraft'
  | 'white'
  | 'notebook'
  | 'sepia'
  | 'obsidian'
  | 'minimal'
  | 'kraft-torn'
  | 'white-torn'

export type AspectRatio = 'story' | 'square' | 'banner' | 'auto'

export type HighlightMarker =
  | 'amber'
  | 'emerald'
  | 'rose'
  | 'sky'
  | 'purple'
  | 'none'

export interface PaperStyleConfig {
  id: PaperStyle
  label: string
  description: string
  bgClass: string
  textColor: string
  subTextColor: string
  borderColor: string
  previewColor: string
}

export const PAPER_STYLES: Record<string, PaperStyleConfig> = {
  kraft: {
    id: 'kraft',
    label: 'کاغذ کاهی کرافت',
    description: 'رنگ گرم کاهی با حس کتاب‌های کلاسیک',
    bgClass: 'bg-[#e4cfb2] text-[#2c1810]',
    textColor: '#29170a',
    subTextColor: '#5e432c',
    borderColor: '#ceb492',
    previewColor: '#e4cfb2',
  },
  white: {
    id: 'white',
    label: 'کاغذ سفید ابریشمی',
    description: 'کاغذ سفید روشن و تمیز با وضوح بالا',
    bgClass: 'bg-[#ffffff] text-[#0f172a]',
    textColor: '#0f172a',
    subTextColor: '#475569',
    borderColor: '#e2e8f0',
    previewColor: '#ffffff',
  },
  notebook: {
    id: 'notebook',
    label: 'کاغذ خط‌دار دفتری',
    description: 'خطوط افقی دفتر با خط قرمز حاشیه و سوراخ‌های کلاسیک پانچ',
    bgClass: 'bg-[#ffffff] text-[#1e293b]',
    textColor: '#1e293b',
    subTextColor: '#64748b',
    borderColor: '#cbd5e1',
    previewColor: '#ffffff',
  },
  sepia: {
    id: 'sepia',
    label: 'کاغذ کلاسیک کتابی',
    description: 'رنگ گرم کرم‌رنگ صفحات کتاب با حس نوستالژیک',
    bgClass: 'bg-[#f5eedb] text-[#3d2b1f]',
    textColor: '#3d2b1f',
    subTextColor: '#6b4f3b',
    borderColor: '#ded1b8',
    previewColor: '#f5eedb',
  },
  obsidian: {
    id: 'obsidian',
    label: 'کاغذ تیره شب',
    description: 'کاغذ مخملی تیره با تایپوگرافی طلایی درخشان',
    bgClass: 'bg-[#18181b] text-[#f4f4f5]',
    textColor: '#fafafa',
    subTextColor: '#a1a1aa',
    borderColor: '#3f3f46',
    previewColor: '#18181b',
  },
  minimal: {
    id: 'minimal',
    label: 'مینیمال مدرن',
    description: 'کادر مدرن و ساده با طراحی ظریف و امروزی',
    bgClass: 'bg-[#f8fafc] text-[#0f172a]',
    textColor: '#0f172a',
    subTextColor: '#475569',
    borderColor: '#e2e8f0',
    previewColor: '#f8fafc',
  },
  'kraft-torn': {
    id: 'kraft',
    label: 'کاغذ کاهی کرافت',
    description: 'رنگ گرم کاهی با حس کتاب‌های کلاسیک',
    bgClass: 'bg-[#e4cfb2] text-[#2c1810]',
    textColor: '#29170a',
    subTextColor: '#5e432c',
    borderColor: '#ceb492',
    previewColor: '#e4cfb2',
  },
  'white-torn': {
    id: 'white',
    label: 'کاغذ سفید ابریشمی',
    description: 'کاغذ سفید روشن و تمیز با وضوح بالا',
    bgClass: 'bg-[#ffffff] text-[#0f172a]',
    textColor: '#0f172a',
    subTextColor: '#475569',
    borderColor: '#e2e8f0',
    previewColor: '#ffffff',
  },
}

export const ASPECT_RATIOS: {
  id: AspectRatio
  label: string
  ratioText: string
  iconDesc: string
  widthPx: number
  heightPx: number
}[] = [
  {
    id: 'story',
    label: 'استوری',
    ratioText: '۹:۱۶',
    iconDesc: 'اینستاگرام و تلگرام',
    widthPx: 1080,
    heightPx: 1920,
  },
  {
    id: 'square',
    label: 'پست مربع',
    ratioText: '۱:۱',
    iconDesc: 'اینستاگرام و پینترست',
    widthPx: 1080,
    heightPx: 1080,
  },
  {
    id: 'banner',
    label: 'بنر افقی',
    ratioText: '۱۶:۹',
    iconDesc: 'کانال تلگرام و توییتر',
    widthPx: 1200,
    heightPx: 675,
  },
  {
    id: 'auto',
    label: 'داینامیک',
    ratioText: 'خودکار',
    iconDesc: 'اندازه دقیق طول متن',
    widthPx: 800,
    heightPx: 0,
  },
]

export const HIGHLIGHT_MARKERS: {
  id: HighlightMarker
  label: string
  bg: string
  border: string
}[] = [
  { id: 'amber', label: 'زرد طلایی', bg: 'rgba(245, 158, 11, 0.35)', border: '#f59e0b' },
  { id: 'emerald', label: 'سبز زمردی', bg: 'rgba(16, 185, 129, 0.35)', border: '#10b981' },
  { id: 'rose', label: 'صورتی رز', bg: 'rgba(244, 63, 94, 0.35)', border: '#f43f5e' },
  { id: 'sky', label: 'آبی آسمانی', bg: 'rgba(14, 165, 233, 0.35)', border: '#0ea5e9' },
  { id: 'purple', label: 'بنفش', bg: 'rgba(168, 85, 247, 0.35)', border: '#a855f7' },
  { id: 'none', label: 'بدون هایلایت', bg: 'transparent', border: 'transparent' },
]
