'use client'

/**
 * src/hooks/use-persian-locale.ts
 * ---------------------------------------------------------------
 * React hook that exposes a stable bundle of Persian typography
 * utilities (digit conversion, number/date formatting, relative time).
 *
 * Wraps the pure functions from `src/lib/typography.ts` in a stable
 * `useMemo` so consumers can safely use them in `useEffect` deps
 * without retriggering on every render.
 *
 * Owner: typography-rtl-specialist (A17).
 * ---------------------------------------------------------------
 */

import { useMemo, useCallback } from 'react'
import {
  toPersianDigits as _toPersianDigits,
  formatPersianNumber as _formatPersianNumber,
  formatPersianDate as _formatPersianDate,
  formatPersianTime as _formatPersianTime,
  formatRelativeTime as _formatRelativeTime,
  toEnglishDigits as _toEnglishDigits,
  isRTL as _isRTL,
  fixDirection as _fixDirection,
} from '@/lib/typography'

export interface PersianLocale {
  /** Convert English digits in a string/number to Persian digits. */
  toPersianDigits: (input: string | number) => string
  /** Convert Persian digits in a string to English digits. */
  toEnglishDigits: (input: string) => string
  /** Format a number with Persian digits + Persian thousands separator. */
  formatNumber: (n: number, options?: { decimals?: number }) => string
  /** Format a Date / ISO string / epoch ms as a Jalali (Persian-calendar) date. */
  formatDate: (
    date: Date | string | number,
    style?: 'long' | 'short' | 'medium',
  ) => string
  /** Format only the time portion of a date in Persian (HH:MM, 24h). */
  formatTime: (date: Date | string | number) => string
  /** Format a date as a Persian relative-time string ("۲ ساعت پیش", "دیروز"). */
  formatRelativeTime: (date: Date | string | number, now?: Date) => string
  /** Detect if a text's first strong character is RTL (Arabic/Persian/Hebrew…). */
  isRTL: (text: string) => boolean
  /** Return 'rtl' or 'ltr' for use as a `dir` attribute. */
  fixDirection: (text: string) => 'rtl' | 'ltr'
}

/**
 * Persian locale utilities for React consumers.
 *
 * @example
 *   const { toPersianDigits, formatNumber, formatDate, formatRelativeTime } = usePersianLocale()
 *   toPersianDigits(book.viewCount)              // '۱۲۳۴'
 *   formatNumber(1234567)                        // '۱٬۲۳۴٬۵۶۷'
 *   formatDate(new Date(), 'long')               // '۱۴ خرداد ۱۴۰۳'
 *   formatRelativeTime(review.createdAt)         // '۳ ساعت پیش'
 */
export function usePersianLocale(): PersianLocale {
  const toPersianDigits = useCallback((input: string | number) => _toPersianDigits(input), [])
  const toEnglishDigits = useCallback((input: string) => _toEnglishDigits(input), [])
  const formatNumber = useCallback(
    (n: number, options?: { decimals?: number }) => _formatPersianNumber(n, options),
    [],
  )
  const formatDate = useCallback(
    (date: Date | string | number, style: 'long' | 'short' | 'medium' = 'long') =>
      _formatPersianDate(date, style),
    [],
  )
  const formatTime = useCallback((date: Date | string | number) => _formatPersianTime(date), [])
  const formatRelativeTime = useCallback(
    (date: Date | string | number, now?: Date) =>
      _formatRelativeTime(date, now ?? new Date()),
    [],
  )
  const isRTL = useCallback((text: string) => _isRTL(text), [])
  const fixDirection = useCallback((text: string) => _fixDirection(text), [])

  return useMemo(
    () => ({
      toPersianDigits,
      toEnglishDigits,
      formatNumber,
      formatDate,
      formatTime,
      formatRelativeTime,
      isRTL,
      fixDirection,
    }),
    [
      toPersianDigits,
      toEnglishDigits,
      formatNumber,
      formatDate,
      formatTime,
      formatRelativeTime,
      isRTL,
      fixDirection,
    ],
  )
}
