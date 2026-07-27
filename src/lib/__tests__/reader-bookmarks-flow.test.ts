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

describe('Deep Persian Typography & RTL Robustness Test Suite', () => {
  describe('toPersianDigits & toEnglishDigits symmetry', () => {
    it('converts English digits to Persian digits accurately', () => {
      expect(toPersianDigits(0)).toBe('۰')
      expect(toPersianDigits(1234567890)).toBe('۱۲۳۴۵۶۷۸۹۰')
      expect(toPersianDigits('Page 42 of 100')).toBe('Page ۴۲ of ۱۰۰')
    })

    it('converts Persian digits back to English digits accurately', () => {
      expect(toEnglishDigits('۱۲۳۴۵۶۷۸۹۰')).toBe('1234567890')
      expect(toEnglishDigits('۴٫۵')).toBe('4.5')
      expect(toEnglishDigits('۱٬۰۰۰')).toBe('1,000')
    })

    it('is a lossless round-trip for numeric strings', () => {
      const original = '9876543210'
      const persian = toPersianDigits(original)
      const english = toEnglishDigits(persian)
      expect(english).toBe(original)
    })
  })

  describe('formatPersianNumber edge cases', () => {
    it('handles zero, negative numbers, and floating point decimals', () => {
      expect(formatPersianNumber(0)).toBe('۰')
      expect(formatPersianNumber(-1500)).toBe('−۱٬۵۰۰')
      expect(formatPersianNumber(12.345, { decimals: 2 })).toBe('۱۲٫۳۵')
    })

    it('handles non-finite numbers safely', () => {
      expect(formatPersianNumber(NaN)).toBe('نامشخص')
      expect(formatPersianNumber(Infinity)).toBe('بی‌نهایت')
      expect(formatPersianNumber(-Infinity)).toBe('−بی‌نهایت')
    })
  })

  describe('formatRelativeTime future and past dates', () => {
    const base = new Date('2024-06-01T12:00:00Z')

    it('returns "همین الان" for deltas < 45s', () => {
      const recent = new Date(base.getTime() - 10_000)
      expect(formatRelativeTime(recent, base)).toBe('همین الان')
    })

    it('returns Persian past relative time strings correctly', () => {
      const threeHoursAgo = new Date(base.getTime() - 3 * 3600_000)
      expect(formatRelativeTime(threeHoursAgo, base)).toBe('۳ ساعت پیش')

      const twoDaysAgo = new Date(base.getTime() - 48 * 3600_000)
      expect(formatRelativeTime(twoDaysAgo, base)).toBe('۲ روز پیش')
    })

    it('returns Persian future relative time strings correctly', () => {
      const fiveMinsFuture = new Date(base.getTime() + 5 * 60_000)
      expect(formatRelativeTime(fiveMinsFuture, base)).toBe('۵ دقیقه بعد')
    })
  })

  describe('Unicode First-Strong Bidirectional (RTL/LTR) Detection', () => {
    it('detects Persian / Arabic text as RTL', () => {
      expect(isRTL('سلام دنیا')).toBe(true)
      expect(fixDirection('سلام')).toBe('rtl')
    })

    it('detects English text as LTR', () => {
      expect(isRTL('Hello world')).toBe(false)
      expect(fixDirection('Hello')).toBe('ltr')
    })

    it('follows first-strong character rule for mixed text', () => {
      expect(isRTL('Persian سلام')).toBe(false) // First strong 'P' -> LTR
      expect(isRTL('سلام Persian')).toBe(true)  // First strong 'س' -> RTL
    })

    it('treats empty or neutral-only strings safely', () => {
      expect(isRTL('')).toBe(false)
      expect(isRTL('12345 !@#$%')).toBe(false)
    })
  })

  describe('Deterministic Date & djb2 Hashing', () => {
    it('generates YYYY-MM-DD date key in local time', () => {
      const d = new Date(2025, 4, 15) // May 15, 2025
      expect(dateKey(d)).toBe('2025-05-15')
    })

    it('produces stable djb2 non-negative hashes for keys', () => {
      const hash1 = hashString('ky_daily|2026-07-27')
      const hash2 = hashString('ky_daily|2026-07-27')
      expect(hash1).toBe(hash2)
      expect(hash1).toBeGreaterThanOrEqual(0)
    })
  })
})
