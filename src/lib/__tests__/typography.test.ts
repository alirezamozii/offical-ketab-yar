/**
 * Typography + RTL utility tests.
 *
 * Covers the canonical Persian typography primitives in `src/lib/typography.ts`:
 *   - toPersianDigits / toEnglishDigits round-trips
 *   - formatPersianDate (Jalali via Intl.DateTimeFormat)
 *   - formatRelativeTime (Persian "time ago" / "time from now")
 *   - isRTL / fixDirection (Unicode Bidirectional Algorithm P2–P3 first-strong)
 *   - dateKey / hashString (canonical helpers re-exported to gamification.ts)
 *
 * All assertions exercise real behaviour — no filler.
 */
import { describe, expect, it } from 'vitest'
import {
  toPersianDigits,
  toEnglishDigits,
  formatPersianNumber,
  formatPersianDate,
  formatPersianTime,
  formatRelativeTime,
  isRTL,
  fixDirection,
  dateKey,
  hashString,
} from '@/lib/typography'

describe('toPersianDigits', () => {
  it('converts English digits in a string to Persian digits', () => {
    expect(toPersianDigits('page 5/10')).toBe('page ۵/۱۰')
    expect(toPersianDigits('1234')).toBe('۱۲۳۴')
  })

  it('accepts numbers by stringifying first', () => {
    expect(toPersianDigits(1234)).toBe('۱۲۳۴')
    expect(toPersianDigits(0)).toBe('۰')
  })

  it('returns the input unchanged when there are no English digits', () => {
    expect(toPersianDigits('سلام')).toBe('سلام')
    expect(toPersianDigits('۱۲۳۴')).toBe('۱۲۳۴')
  })

  it('returns the empty string for empty input (no throw)', () => {
    expect(toPersianDigits('')).toBe('')
  })

  it('does NOT touch Persian digits that are already Persian', () => {
    // Persian digits ۰..۹ should round-trip unchanged.
    expect(toPersianDigits('۱۲۳۴')).toBe('۱۲۳۴')
  })

  it('handles mixed-script strings (Persian + digits + Latin)', () => {
    expect(toPersianDigits('Chapter 2 — صفحه 5')).toBe('Chapter ۲ — صفحه ۵')
  })
})

describe('toEnglishDigits', () => {
  it('converts Persian digits back to English', () => {
    expect(toEnglishDigits('۱۲۳۴')).toBe('1234')
  })

  it('converts Arabic-Indic digits (the other code block)', () => {
    // Arabic-Indic digits U+0660..U+0669 (Persian uses U+06F0..U+06F9)
    expect(toEnglishDigits('٤٥٦')).toBe('456')
  })

  it('normalises Persian separators', () => {
    // Persian decimal separator U+066B → '.', thousands U+066C → ','
    expect(toEnglishDigits('۱٬۲۳۴٫۵')).toBe('1,234.5')
  })

  it('is a no-op when no Persian/Arabic digits are present', () => {
    expect(toEnglishDigits('abc123')).toBe('abc123')
  })
})

describe('formatPersianNumber', () => {
  it('inserts the Persian thousands separator (U+066C)', () => {
    expect(formatPersianNumber(1_234_567)).toBe('۱٬۲۳۴٬۵۶۷')
  })

  it('uses Persian digits + Persian decimal separator (U+066B)', () => {
    expect(formatPersianNumber(42.5)).toBe('۴۲٫۵')
  })

  it('supports explicit decimals parameter', () => {
    expect(formatPersianNumber(3.14159, { decimals: 2 })).toBe('۳٫۱۴')
  })

  it('handles zero', () => {
    expect(formatPersianNumber(0)).toBe('۰')
  })

  it('handles negatives with a real minus sign', () => {
    expect(formatPersianNumber(-42.5)).toBe('−۴۲٫۵')
  })

  it('renders NaN as "نامشخص"', () => {
    expect(formatPersianNumber(NaN)).toBe('نامشخص')
  })

  it('renders Infinity as "بی‌نهایت"', () => {
    expect(formatPersianNumber(Infinity)).toBe('بی‌نهایت')
    expect(formatPersianNumber(-Infinity)).toBe('−بی‌نهایت')
  })
})

describe('formatPersianDate (Jalali)', () => {
  it('formats a known Gregorian date as a Jalali (Persian calendar) string', () => {
    // 2024-06-04 in the Gregorian calendar = 14 Khordad 1403 in the Jalali
    // calendar. The Persian digit form of "14" is "۱۴".
    const out = formatPersianDate(new Date('2024-06-04T00:00:00Z'))
    expect(out).toContain('۱۴۰۳')
    expect(out).toContain('۱۴')
    expect(out).toMatch(/خرداد/)
  })

  it('short style produces a slash-separated numeric date', () => {
    const out = formatPersianDate(new Date('2024-06-04T00:00:00Z'), 'short')
    // Should be 1403/03/14 in Persian digits — three numeric groups separated by /
    expect(out).toMatch(/[۱۴۰۳۰-۹]+\/[۰-۹]+\/[۰-۹]+/)
  })

  it('returns "" for an invalid date (no throw)', () => {
    expect(formatPersianDate(new Date('invalid'))).toBe('')
    expect(formatPersianDate('not-a-date')).toBe('')
  })
})

describe('formatPersianTime', () => {
  it('formats the time portion as HH:MM in Persian digits', () => {
    // Use a fixed UTC instant to avoid TZ flakiness.
    const out = formatPersianTime(new Date('2024-06-04T14:32:00Z'))
    expect(out).toMatch(/[۰-۹]+:[۰-۹]+/)
  })

  it('returns "" for an invalid date', () => {
    expect(formatPersianTime('not-a-date')).toBe('')
  })
})

describe('formatRelativeTime', () => {
  // Use the explicit `now` parameter so tests are deterministic.
  const now = new Date('2024-06-04T12:00:00Z')

  it('returns "همین الان" for events < 45 s ago', () => {
    expect(formatRelativeTime(new Date(now.getTime() - 10_000), now)).toBe('همین الان')
  })

  it('returns "N دقیقه پیش" for minutes-ago deltas', () => {
    expect(formatRelativeTime(new Date(now.getTime() - 5 * 60_000), now)).toBe('۵ دقیقه پیش')
  })

  it('returns "N ساعت پیش" for hours-ago deltas', () => {
    expect(formatRelativeTime(new Date(now.getTime() - 3 * 3_600_000), now)).toBe('۳ ساعت پیش')
  })

  it('returns "دیروز" for ~1 day ago', () => {
    expect(formatRelativeTime(new Date(now.getTime() - 25 * 3_600_000), now)).toBe('دیروز')
  })

  it('returns "N روز پیش" for multi-day deltas < 7', () => {
    expect(formatRelativeTime(new Date(now.getTime() - 3 * 86_400_000), now)).toBe('۳ روز پیش')
  })

  it('returns "N ماه پیش" for ~30 day deltas', () => {
    expect(formatRelativeTime(new Date(now.getTime() - 60 * 86_400_000), now)).toBe('۲ ماه پیش')
  })

  it('uses "بعد" suffix for future dates', () => {
    expect(formatRelativeTime(new Date(now.getTime() + 5 * 60_000), now)).toBe('۵ دقیقه بعد')
  })

  it('returns "" for invalid date input', () => {
    expect(formatRelativeTime('not-a-date', now)).toBe('')
  })
})

describe('isRTL / fixDirection', () => {
  it('detects Persian text as RTL', () => {
    expect(isRTL('سلام دنیا')).toBe(true)
  })

  it('detects English text as LTR', () => {
    expect(isRTL('Hello world')).toBe(false)
  })

  it('uses first-strong-char rule: digits are neutral', () => {
    expect(isRTL('123')).toBe(false)
  })

  it('uses first-strong-char rule: Persian after Latin → LTR', () => {
    expect(isRTL('Hello سلام')).toBe(false)
  })

  it('uses first-strong-char rule: Persian first → RTL', () => {
    expect(isRTL('سلام Hello')).toBe(true)
  })

  it('returns false for empty / whitespace-only input', () => {
    expect(isRTL('')).toBe(false)
    expect(isRTL('   ')).toBe(false)
  })

  it('returns false for emoji-only input (no strong char)', () => {
    expect(isRTL('🚀')).toBe(false)
  })

  it('fixDirection returns the literal "rtl" or "ltr"', () => {
    expect(fixDirection('سلام')).toBe('rtl')
    expect(fixDirection('Hello')).toBe('ltr')
  })
})

describe('dateKey', () => {
  it('formats a Date as YYYY-MM-DD in local time', () => {
    expect(dateKey(new Date('2024-06-04T03:00:00'))).toBe('2024-06-04')
  })

  it('zero-pads single-digit months and days', () => {
    expect(dateKey(new Date(2024, 0, 5))).toBe('2024-01-05')
  })
})

describe('hashString (djb2)', () => {
  it('returns a deterministic non-negative 32-bit integer', () => {
    const h1 = hashString('ky_daily|2024-06-04')
    const h2 = hashString('ky_daily|2024-06-04')
    expect(h1).toBe(h2)
    expect(h1).toBeGreaterThan(0)
    expect(Number.isInteger(h1)).toBe(true)
  })

  it('produces different hashes for different inputs', () => {
    expect(hashString('a')).not.toBe(hashString('b'))
  })
})
