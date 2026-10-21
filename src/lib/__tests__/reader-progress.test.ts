import { describe, expect, it } from 'vitest'
import {
  calculateReadingPercent,
  formatReadingPercent,
  formatReadingFraction,
  getReadingState,
  calculateRingDashOffset,
  calculateProgressBarWidth,
  estimateRemainingMinutes,
} from '@/lib/reader/progress'

describe('Unified Reading Progress Engine', () => {
  describe('calculateReadingPercent', () => {
    it('returns 100 if isCompleted is explicitly true', () => {
      expect(
        calculateReadingPercent({ currentPage: 0, totalPages: 10, isCompleted: true }),
      ).toBe(100)
    })

    it('returns 0 for empty or invalid totalPages', () => {
      expect(calculateReadingPercent({ currentPage: 0, totalPages: 0 })).toBe(0)
      expect(calculateReadingPercent({ currentPage: 5, totalPages: -1 })).toBe(0)
    })

    it('returns 0 at the very start (page 0 and scroll <= 0.5)', () => {
      expect(
        calculateReadingPercent({ currentPage: 0, totalPages: 10, scrollPercent: 0 }),
      ).toBe(0)
      expect(
        calculateReadingPercent({ currentPage: 0, totalPages: 4, scrollPercent: 0.2 }),
      ).toBe(0)
    })

    it('returns continuous percentage based on scrollPercent when provided', () => {
      expect(
        calculateReadingPercent({ currentPage: 2, totalPages: 10, scrollPercent: 24.6 }),
      ).toBe(25)
      expect(
        calculateReadingPercent({ currentPage: 5, totalPages: 10, scrollPercent: 50.1 }),
      ).toBe(50)
      expect(
        calculateReadingPercent({ currentPage: 8, totalPages: 10, scrollPercent: 88.4 }),
      ).toBe(88)
    })

    it('clamps scrollPercent to 100 near the bottom', () => {
      expect(
        calculateReadingPercent({ currentPage: 9, totalPages: 10, scrollPercent: 99.6 }),
      ).toBe(100)
      expect(
        calculateReadingPercent({ currentPage: 9, totalPages: 10, scrollPercent: 100 }),
      ).toBe(100)
    })

    it('handles discrete page fallback correctly without scrollPercent', () => {
      // Page 0 out of 10 pages must be 0% (NOT 10%!)
      expect(calculateReadingPercent({ currentPage: 0, totalPages: 10 })).toBe(0)
      // Page 9 (last page) out of 10 pages must be 100%
      expect(calculateReadingPercent({ currentPage: 9, totalPages: 10 })).toBe(100)
      // Middle pages
      expect(calculateReadingPercent({ currentPage: 1, totalPages: 10 })).toBe(11)
      expect(calculateReadingPercent({ currentPage: 5, totalPages: 10 })).toBe(56)
    })

    it('handles single-page books', () => {
      expect(calculateReadingPercent({ currentPage: 0, totalPages: 1 })).toBe(0)
      expect(
        calculateReadingPercent({ currentPage: 0, totalPages: 1, isCompleted: true }),
      ).toBe(100)
    })
  })

  describe('formatReadingPercent', () => {
    it('formats numbers with Persian digits and percent sign', () => {
      expect(formatReadingPercent(0)).toBe('۰٪')
      expect(formatReadingPercent(25)).toBe('۲۵٪')
      expect(formatReadingPercent(100)).toBe('۱۰۰٪')
    })

    it('clamps negative or >100 values safely', () => {
      expect(formatReadingPercent(-5)).toBe('۰٪')
      expect(formatReadingPercent(150)).toBe('۱۰۰٪')
    })
  })

  describe('formatReadingFraction', () => {
    it('formats 0-indexed page to 1-indexed Persian fraction label', () => {
      expect(formatReadingFraction(0, 10)).toBe('صفحه ۱ از ۱۰')
      expect(formatReadingFraction(4, 10)).toBe('صفحه ۵ از ۱۰')
      expect(formatReadingFraction(2, 5, 'بخش')).toBe('بخش ۳ از ۵')
    })
  })

  describe('getReadingState', () => {
    it('derives accurate reading state', () => {
      expect(getReadingState(0)).toBe('unread')
      expect(getReadingState(1)).toBe('in-progress')
      expect(getReadingState(50)).toBe('in-progress')
      expect(getReadingState(100)).toBe('completed')
    })
  })

  describe('calculateRingDashOffset', () => {
    it('calculates proper circumference and strokeOffset', () => {
      const { circumference, strokeOffset } = calculateRingDashOffset(50, 26)
      const expectedCirc = 2 * Math.PI * 26
      expect(circumference).toBeCloseTo(expectedCirc, 4)
      expect(strokeOffset).toBeCloseTo(expectedCirc * 0.5, 4)
    })

    it('handles 0% and 100%', () => {
      const at0 = calculateRingDashOffset(0, 26)
      expect(at0.strokeOffset).toBeCloseTo(at0.circumference, 4)

      const at100 = calculateRingDashOffset(100, 26)
      expect(at100.strokeOffset).toBeCloseTo(0, 4)
    })
  })

  describe('calculateProgressBarWidth', () => {
    it('returns clamped percentage string', () => {
      expect(calculateProgressBarWidth(0)).toBe('0%')
      expect(calculateProgressBarWidth(42)).toBe('42%')
      expect(calculateProgressBarWidth(120)).toBe('100%')
      expect(calculateProgressBarWidth(-10)).toBe('0%')
    })
  })

  describe('estimateRemainingMinutes', () => {
    it('estimates remaining reading time', () => {
      expect(estimateRemainingMinutes(0)).toBe(0)
      expect(estimateRemainingMinutes(2)).toBe(1)
      expect(estimateRemainingMinutes(10)).toBe(5)
    })
  })
})
