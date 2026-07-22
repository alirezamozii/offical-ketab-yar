/**
 * src/lib/typography.ts
 * ---------------------------------------------------------------
 * Persian typography + RTL utilities for ketab-yar.
 *
 * Pure functions only — no React, no DOM. Server-safe: usable in
 * Server Components, route handlers, and client components alike.
 *
 * Owner: typography-rtl-specialist (A17).
 * ---------------------------------------------------------------
 */

/** Persian digit lookup table. */
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const

/** English digit lookup table (for reverse mapping). */
const ENGLISH_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

/** Persian thousands separator (U+066C ARABIC THOUSANDS SEPARATOR). */
const PERSIAN_THOUSANDS_SEP = '٬'

/** Persian decimal separator (U+066B ARABIC DECIMAL SEPARATOR). */
const PERSIAN_DECIMAL_SEP = '٫'

/** English digit regex. */
const ENGLISH_DIGIT_REGEX = /[0-9]/g

/**
 * Convert every English digit (0-9) in the input to Persian digits (۰-۹).
 * Accepts strings or numbers (numbers are stringified first).
 *
 * @example
 *   toPersianDigits(1234)        // → '۱۲۳۴'
 *   toPersianDigits('page 5/10') // → 'page ۵/۱۰'
 */
export function toPersianDigits(input: string | number): string {
  const str = typeof input === 'number' ? String(input) : input
  if (!str) return str
  return str.replace(ENGLISH_DIGIT_REGEX, (d) => PERSIAN_DIGITS[Number(d)] ?? d)
}

/**
 * Convert every Persian/Arabic-Indic digit in the input to English digits.
 * Useful for normalizing user input (vocabulary words, search queries, XP
 * awards) before passing to APIs or DB queries.
 *
 * @example
 *   toEnglishDigits('۱۲۳۴')       // → '1234'
 *   toEnglishDigits('۴٫۵')        // → '4.5'
 */
export function toEnglishDigits(input: string): string {
  if (!input) return input
  return input
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/\u066B/g, '.') // Persian decimal sep → English
    .replace(/\u066C/g, ',') // Persian thousands sep → English
}

/**
 * Format a number with Persian digits and the Persian thousands separator.
 * Handles negatives, decimals, Infinity, NaN, and non-finite values gracefully.
 *
 * @example
 *   formatPersianNumber(1234567)      // → '۱٬۲۳۴٬۵۶۷'
 *   formatPersianNumber(-42.5)        // → '−۴۲٫۵'
 *   formatPersianNumber(0)            // → '۰'
 */
export function formatPersianNumber(n: number, options?: { decimals?: number }): string {
  if (!Number.isFinite(n)) {
    if (Number.isNaN(n)) return 'نامشخص'
    return n > 0 ? 'بی‌نهایت' : '−بی‌نهایت'
  }

  const decimals = options?.decimals
  const neg = n < 0
  const abs = Math.abs(n)

  let intPart: string
  let fracPart = ''
  if (decimals != null) {
    const fixed = abs.toFixed(decimals)
    const [i, f] = fixed.split('.')
    intPart = i
    fracPart = f ?? ''
  } else {
    const str = String(abs)
    const [i, f] = str.split('.')
    intPart = i
    fracPart = f ?? ''
  }

  // Insert thousands separator every 3 digits from the right.
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, PERSIAN_THOUSANDS_SEP)

  let result = withThousands
  if (fracPart) {
    result += PERSIAN_DECIMAL_SEP + fracPart
  }
  if (neg) result = '−' + result
  return toPersianDigits(result)
}

/**
 * Format a Date (or ISO string / epoch ms) as a Jalali (Persian-calendar) date.
 * Uses `Intl.DateTimeFormat('fa-IR', …)` which uses the Persian calendar in
 * modern V8 / Node ≥ 14 / Safari ≥ 14 / Firefox ≥ 75.
 *
 * @example
 *   formatPersianDate(new Date('2024-06-04')) // → '۱۴ خرداد ۱۴۰۳'
 *   formatPersianDate(new Date('2024-06-04'), 'short') // → '۱۴۰۳/۰۳/۱۴'
 */
export function formatPersianDate(
  date: Date | string | number,
  style: 'long' | 'short' | 'medium' = 'long',
): string {
  const d = toDate(date)
  if (!d) return ''
  try {
    if (style === 'short') {
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d)
    }
    if (style === 'medium') {
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(d)
    }
    return new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'long',
    }).format(d)
  } catch {
    // Fallback for very old engines — use Gregorian with Persian digits.
    return toPersianDigits(d.toLocaleDateString('en-GB'))
  }
}

/**
 * Format only the time portion of a date in Persian.
 * @example formatPersianTime(new Date('2024-06-04T14:32:00')) // → '۱۴:۳۲'
 */
export function formatPersianTime(date: Date | string | number): string {
  const d = toDate(date)
  if (!d) return ''
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d)
  } catch {
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return toPersianDigits(`${hh}:${mm}`)
  }
}

/**
 * Format a date as a Persian relative-time string.
 * Returns "همین الان" for < 1 min, "N دقیقه پیش" / "N ساعت پیش" /
 * "دیروز" / "N روز پیش" / "N هفته پیش" / "N ماه پیش" / "N سال پیش"
 * for larger deltas. All digits Persian.
 *
 * @example
 *   formatRelativeTime(new Date(Date.now() - 3 * 3600_000)) // → '۳ ساعت پیش'
 *   formatRelativeTime(new Date(Date.now() - 30 * 86_400_000)) // → '۱ ماه پیش'
 */
export function formatRelativeTime(date: Date | string | number, now: Date = new Date()): string {
  const d = toDate(date)
  if (!d) return ''
  const diffMs = now.getTime() - d.getTime()
  const past = diffMs >= 0
  const abs = Math.abs(diffMs)

  const seconds = Math.round(abs / 1000)
  const minutes = Math.round(seconds / 60)
  const hours = Math.round(minutes / 60)
  const days = Math.round(hours / 24)
  const weeks = Math.round(days / 7)
  const months = Math.round(days / 30)
  const years = Math.round(days / 365)

  // For future dates (scheduled notifications etc.), use "بعد" suffix.
  const suffix = past ? 'پیش' : 'بعد'

  if (seconds < 45) return 'همین الان'
  if (minutes < 2) return past ? 'یک دقیقه پیش' : 'یک دقیقه بعد'
  if (minutes < 60) return `${toPersianDigits(minutes)} دقیقه ${suffix}`
  if (hours < 2) return past ? 'یک ساعت پیش' : 'یک ساعت بعد'
  if (hours < 24) return `${toPersianDigits(hours)} ساعت ${suffix}`
  if (days < 2) return past ? 'دیروز' : 'فردا'
  if (days < 7) return `${toPersianDigits(days)} روز ${suffix}`
  if (weeks < 2) return past ? 'یک هفته پیش' : 'یک هفته بعد'
  if (weeks < 5) return `${toPersianDigits(weeks)} هفته ${suffix}`
  if (months < 2) return past ? 'یک ماه پیش' : 'یک ماه بعد'
  if (months < 12) return `${toPersianDigits(months)} ماه ${suffix}`
  if (years < 2) return past ? 'یک سال پیش' : 'یک سال بعد'
  return `${toPersianDigits(years)} سال ${suffix}`
}

/* ----------------------------------------------------------------
 * Bidirectional text helpers
 * ---------------------------------------------------------------- */

/**
 * Unicode RTL character ranges used for first-strong-character detection.
 * Covers Hebrew, Arabic (incl. Persian), Syriac, Arabic Supplement, Thaana,
 * N'Ko, Samaritan, Mandaic, Arabic Extended-A, and the Arabic Presentation
 * Forms blocks. Also includes Arabic math symbols (U+FB50–FDFF, U+FE70–FEFF).
 */
const RTL_RANGES: Array<[number, number]> = [
  [0x0590, 0x05ff], // Hebrew
  [0x0600, 0x06ff], // Arabic (incl. Persian)
  [0x0700, 0x074f], // Syriac
  [0x0750, 0x077f], // Arabic Supplement
  [0x0780, 0x07bf], // Thaana
  [0x07c0, 0x07ff], // N'Ko
  [0x0800, 0x083f], // Samaritan
  [0x0840, 0x085f], // Mandaic
  [0x08a0, 0x08ff], // Arabic Extended-A
  [0xfb1d, 0xfdff], // Hebrew presentation forms + Arabic Pres. Forms-A
  [0xfe70, 0xfeff], // Arabic Presentation Forms-B
  [0x10800, 0x10fff], // various RTL historic scripts (Aramaic, etc.)
]

/** LTR strong-character ranges (Latin, Cyrillic, Greek, etc.). */
const LTR_RANGES: Array<[number, number]> = [
  [0x0041, 0x005a], // A-Z
  [0x0061, 0x007a], // a-z
  [0x00c0, 0x024f], // Latin Extended
  [0x0400, 0x04ff], // Cyrillic
  [0x0370, 0x03ff], // Greek
]

function inRanges(code: number, ranges: Array<[number, number]>): boolean {
  for (const [lo, hi] of ranges) {
    if (code >= lo && code <= hi) return true
  }
  return false
}

/**
 * Detect whether a text contains RTL characters. Uses the **first strong
 * directional character** rule (Unicode Bidirectional Algorithm P2-P3):
 * the first character that has a definite LTR or RTL direction determines
 * the direction.
 *
 * @example
 *   isRTL('سلام')        // → true
 *   isRTL('Hello')       // → false
 *   isRTL('123')         // → false (digits are neutral)
 *   isRTL('Hello سلام')  // → false (first strong is 'H')
 *   isRTL('سلام Hello')  // → true  (first strong is 'س')
 */
export function isRTL(text: string): boolean {
  if (!text) return false
  for (const ch of text) {
    const code = ch.codePointAt(0)
    if (code === undefined) continue
    if (inRanges(code, RTL_RANGES)) return true
    if (inRanges(code, LTR_RANGES)) return false
    // Skip neutral characters (digits, spaces, punctuation, emoji).
  }
  return false // no strong character found → treat as LTR (HTML default)
}

/**
 * Return the appropriate `dir` attribute value ('rtl' or 'ltr') for the text.
 * Convenience wrapper around `isRTL` for use as `<span dir={fixDirection(text)}>` or
 * with `dir={fixDirection(userInput)}` on form fields where `dir="auto"` is not enough.
 *
 * @example
 *   fixDirection('Hello') // → 'ltr'
 *   fixDirection('سلام')   // → 'rtl'
 */
export function fixDirection(text: string): 'rtl' | 'ltr' {
  return isRTL(text) ? 'rtl' : 'ltr'
}

/* ----------------------------------------------------------------
 * Internal helpers
 * ---------------------------------------------------------------- */

function toDate(input: Date | string | number): Date | null {
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input
  }
  if (typeof input === 'number') {
    const d = new Date(input)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof input === 'string') {
    const d = new Date(input)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

/* ----------------------------------------------------------------
 * Constants exposed for callers that need them
 * ---------------------------------------------------------------- */

export const PERSIAN_LOCALE = 'fa-IR'

export { PERSIAN_DIGITS, ENGLISH_DIGITS }

/* ----------------------------------------------------------------
 * Date + hashing helpers (shared canonical implementations)
 * ---------------------------------------------------------------- */

/**
 * Format a Date as `YYYY-MM-DD` in local time.
 *
 * Canonical home — previously duplicated in `lib/gamification.ts` and
 * (transitively) `app/api/leaderboard/route.ts`. Kept here so any module
 * that needs a stable, locale-independent day key can import it from the
 * same place as the rest of the Persian typography toolkit.
 *
 * @example
 *   dateKey(new Date('2024-06-04T03:00:00')) // → '2024-06-04'
 */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * djb2 string hash → non-negative 32-bit integer.
 *
 * Canonical home — previously duplicated (privately) in both
 * `lib/gamification.ts` and `app/api/leaderboard/route.ts` for
 * deterministic per-period XP / daily-challenge seeding. Centralized
 * here so the algorithm can't drift between callers.
 *
 * @example
 *   hashString('ky_daily|2024-06-04') // → 123456789 (deterministic)
 */
export function hashString(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}
