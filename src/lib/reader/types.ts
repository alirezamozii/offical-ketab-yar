export type ReaderTheme =
  | 'light'
  | 'sepia'
  | 'dark'
  | 'high-contrast'

export type ReaderLanguage = 'english' | 'farsi'

/** Horizontal width of the reading column. */
export type ColumnWidth = 'narrow' | 'normal' | 'wide'

/** Density of the breathing room around the text. */
export type MarginDensity = 'compact' | 'normal' | 'comfortable'

/** Whether the scroll column should snap to paragraphs. */
export type ReadingRhythm = 'free' | 'snap'

/** Reading layout: continuous scroll vs. paginated (page-flip). */
export type ReadingLayout = 'continuous' | 'paginated'

/** Font family for the reading column. */
export type ReaderFontFamily = 'vazirmatn' | 'serif' | 'sans'

export interface BilingualItem {
  english: string
  farsi: string
  type: 'text' | 'heading'
}

export interface ReaderPage {
  pageNumber: number
  items: BilingualItem[]
}

export interface ReaderBook {
  slug: string
  title: string
  author: string
  /** Persian name of the author (CMS-managed via the Author table). */
  authorNameFa?: string
  /** Slug of the Author row — used for `/authors/<slug>` links from the reader. */
  authorSlug?: string
  pages: ReaderPage[]
  level?: string
  /** Optional uploaded high-quality cover image (CMS-managed). */
  coverImageUrl?: string
  /** Blur-up placeholder for `coverImageUrl`. */
  coverBlurhash?: string
  /** Total page count — surfaced so the reader UI doesn't have to read pages.length. */
  pageCount?: number
  /** Chapter (چپتر) list — replaces the old per-N-pages "بخش" grouping. */
  chapters?: Array<{
    id: string
    title: string
    titleFa?: string
    slug: string
    order: number
    startPage: number
  }>
}

export interface Highlight {
  id: string
  /**
   * Index of the paragraph this highlight belongs to in `ReaderBook.pages`.
   * (Historically named `page` because the reader used to be page-flip;
   * in the continuous-scroll model it is the paragraph index.)
   */
  page: number
  text: string
  color: 'yellow' | 'orange' | 'gold' | 'green' | 'pink' | 'blue'
  /** Optional user note attached to the highlight. */
  note?: string
  timestamp: number
}

export interface ReaderBookmark {
  id: string
  /** Paragraph index in `ReaderBook.pages`. */
  page: number
  /** Short snippet of the paragraph's first text item, for display. */
  label: string
  timestamp: number
}

export interface ReadingPreferences {
  fontSize: number
  lineHeight: number
  /** Letter-spacing in em (e.g. -0.02 means slightly tightened). */
  letterSpacing: number
  theme: ReaderTheme
  showSubtitles: boolean
  language: ReaderLanguage
  /** seconds between auto-scroll advances (5–60) */
  autoScrollInterval: number
  /** Horizontal width of the reading column. */
  columnWidth: ColumnWidth
  /** Density of the breathing room around the text. */
  margin: MarginDensity
  /** Whether the scroll column should snap to paragraphs. */
  readingRhythm: ReadingRhythm
  /** Continuous vs. paginated layout. */
  layout: ReadingLayout
  /** Font family for the reading column. */
  fontFamily: ReaderFontFamily
  /** Show paragraph numbers in the margin. */
  showParagraphNumbers: boolean
  /** Render the first letter of each paragraph as a drop cap. */
  dropCaps: boolean
}

export const DEFAULT_PREFERENCES: ReadingPreferences = {
  fontSize: 20,
  lineHeight: 1.8,
  letterSpacing: 0,
  theme: 'sepia',
  showSubtitles: true,
  language: 'english',
  autoScrollInterval: 15,
  columnWidth: 'normal',
  margin: 'normal',
  readingRhythm: 'free',
  layout: 'continuous',
  fontFamily: 'vazirmatn',
  showParagraphNumbers: false,
  dropCaps: false,
}

export const HIGHLIGHT_COLORS: Record<Highlight['color'], string> = {
  yellow: 'rgba(251, 209, 32, 0.4)',
  orange: 'rgba(252, 156, 74, 0.4)',
  gold: 'rgba(202, 172, 105, 0.45)',
  green: 'rgba(34, 197, 94, 0.4)',
  pink: 'rgba(244, 114, 182, 0.4)',
  blue: 'rgba(56, 189, 248, 0.4)',
}

/** Solid swatch colors used by the text-selection menu buttons. */
export const HIGHLIGHT_SWATCHES: Record<
  Highlight['color'],
  { bg: string; border: string }
> = {
  yellow: {
    bg: 'linear-gradient(135deg, rgb(251,209,32), rgb(241,199,22))',
    border: 'rgb(241,199,22)',
  },
  orange: {
    bg: 'linear-gradient(135deg, rgb(252,156,74), rgb(242,146,64))',
    border: 'rgb(242,146,64)',
  },
  gold: {
    bg: 'linear-gradient(135deg, rgb(202,172,105), rgb(192,162,95))',
    border: 'rgb(192,162,95)',
  },
  green: {
    bg: 'linear-gradient(135deg, rgb(34,197,94), rgb(22,163,74))',
    border: 'rgb(22,163,74)',
  },
  pink: {
    bg: 'linear-gradient(135deg, rgb(244,114,182), rgb(219,39,119))',
    border: 'rgb(219,39,119)',
  },
  blue: {
    bg: 'linear-gradient(135deg, rgb(56,189,248), rgb(14,165,233))',
    border: 'rgb(14,165,233)',
  },
}

/** Label + accent for each highlight color, used by the highlights panel. */
export const HIGHLIGHT_LABELS: Record<Highlight['color'], string> = {
  yellow: 'زرد',
  orange: 'نارنجی',
  gold: 'طلایی',
  green: 'سبز',
  pink: 'صورتی',
  blue: 'آبی',
}

export const THEME_STYLES: Record<
  ReaderTheme,
  { bg: string; text: string; accent: string; border: string; muted: string }
> = {
  light: {
    bg: '#faf8f3',
    text: '#2a2a2a',
    accent: '#a67f56',
    border: '#e4dcc8',
    muted: '#6b6354',
  },
  sepia: {
    bg: '#f4ecd8',
    text: '#5f4b32',
    accent: '#8a6a4b',
    border: '#d9c8a6',
    muted: '#7a6650',
  },
  dark: {
    bg: '#1a1814',
    text: '#e8e4dc',
    accent: '#cdb89a',
    border: '#3d3830',
    muted: '#9a948a',
  },
  'high-contrast': {
    bg: '#000000',
    text: '#ffffff',
    accent: '#ffd54a',
    border: '#ffffff',
    muted: '#d4d4d4',
  },
}

/** CSS font-family stack for each `fontFamily` preference. */
export const READER_FONT_FAMILIES: Record<ReaderFontFamily, string> = {
  vazirmatn:
    "'Vazirmatn', 'IRANSansX', 'Segoe UI', Tahoma, system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  sans: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
}

/** Map `columnWidth` preference → CSS max-width value. */
export const COLUMN_WIDTH_PX: Record<ColumnWidth, string> = {
  narrow: '36rem', // 576px — phone-comfortable on desktop
  normal: '48rem', // 768px — the historical max-w-3xl default
  wide: '64rem', // 1024px — for large monitors / dense reading
}

/** Map `margin` preference → horizontal padding + vertical gap between paragraphs. */
export const MARGIN_STYLES: Record<
  MarginDensity,
  { paddingX: string; paragraphGap: string }
> = {
  compact: { paddingX: '1rem', paragraphGap: '1.25rem' },
  normal: { paddingX: '1.5rem', paragraphGap: '1.75rem' },
  comfortable: { paddingX: '2.5rem', paragraphGap: '2.5rem' },
}

/** Tailwind class fragments for `readingRhythm`. */
export const READING_RHYTHM_CLASS: Record<ReadingRhythm, string> = {
  free: '',
  snap: '',
}

/**
 * Rough reading-time estimate: ~0.5 minutes per remaining paragraph.
 * Returns whole minutes, minimum 1 (so the UI never shows "0 دقیقه").
 */
export function estimateReadingMinutes(remainingParagraphs: number): number {
  if (remainingParagraphs <= 0) return 0
  return Math.max(1, Math.round(remainingParagraphs * 0.5))
}

// `toPersianDigits` is re-exported from `@/lib/typography` (the canonical
// implementation) for backward compatibility with reader sub-components
// that historically imported it from this module. The local copy was removed
// — see INVEST-3 item C.5 / W1-C.
export { toPersianDigits } from '@/lib/typography'

/** Empty-state copy shown when a book has no pages. */
export const EMPTY_READER_COPY = {
  title: 'این کتاب هنوز محتوایی ندارد',
  subtitle: 'در حال آماده‌سازی متن دوزبانه هستیم.',
  cta: 'بازگشت به صفحهٔ کتاب',
}
