/**
 * src/lib/reader/progress.ts
 * Unified Reading Progress Engine
 *
 * Single source of truth for all reading progress calculations, formatting,
 * and state derivations across the entire application (reader, dashboard,
 * cards, library, stats, and profile).
 */

import { toPersianDigits } from '@/lib/typography'

export interface ProgressCalculationParams {
  currentPage: number
  totalPages: number
  scrollPercent?: number
  isCompleted?: boolean
}

export type ReadingProgressState = 'unread' | 'in-progress' | 'completed'

/**
 * Calculates the canonical reading percentage (0 to 100).
 *
 * Rules:
 *  1. If marked completed or reached the end: 100.
 *  2. If continuous scrollPercent is available:
 *     - At top (scrollPercent <= 0 && currentPage <= 0): 0.
 *     - At bottom (scrollPercent >= 99.5): 100.
 *     - In between: strictly clamped to [0, 100], rounded to whole integer.
 *  3. Fallback when scrollPercent is not available (e.g. discrete page progress):
 *     - totalPages <= 1: 0 (or 100 if completed/currentPage > 0).
 *     - Page 0 is 0% (user just opened the first page/paragraph).
 *     - Last page (currentPage >= totalPages - 1): 100%.
 *     - In between: (currentPage / (totalPages - 1)) * 100.
 */
export function calculateReadingPercent({
  currentPage,
  totalPages,
  scrollPercent,
  isCompleted,
}: ProgressCalculationParams): number {
  if (isCompleted) return 100
  if (totalPages <= 0) return 0

  // Continuous scroll is the most accurate representation of reading position
  if (typeof scrollPercent === 'number' && !Number.isNaN(scrollPercent)) {
    if (scrollPercent >= 99.5) return 100
    if (scrollPercent <= 0.5 && currentPage <= 0) return 0
    return Math.min(100, Math.max(0, Math.round(scrollPercent)))
  }

  // Discrete page/paragraph fallback
  if (totalPages <= 1) {
    return currentPage > 0 ? 100 : 0
  }

  const p = Math.min(Math.max(0, currentPage), totalPages - 1)
  if (p === 0) return 0
  if (p >= totalPages - 1) return 100

  return Math.min(99, Math.max(1, Math.round((p / (totalPages - 1)) * 100)))
}

/**
 * Formats a percentage number into Persian digits with percent sign (e.g. "۲۵٪").
 */
export function formatReadingPercent(percent: number): string {
  const safe = Math.min(100, Math.max(0, Math.round(percent)))
  return `${toPersianDigits(safe)}٪`
}

/**
 * Formats a fraction label (e.g. "صفحه ۳ از ۱۰" or "بخش ۳ از ۱۰").
 */
export function formatReadingFraction(
  currentPage: number,
  totalPages: number,
  unit: 'صفحه' | 'بخش' = 'صفحه',
): string {
  const current = toPersianDigits(Math.max(1, currentPage + 1))
  const total = toPersianDigits(Math.max(1, totalPages))
  return `${unit} ${current} از ${total}`
}

/**
 * Derives the reading state ('unread' | 'in-progress' | 'completed') from percent.
 */
export function getReadingState(percent: number): ReadingProgressState {
  if (percent >= 100) return 'completed'
  if (percent > 0) return 'in-progress'
  return 'unread'
}

/**
 * Calculates SVG stroke-dashoffset for circular progress rings.
 */
export function calculateRingDashOffset(
  percent: number,
  radius: number,
): { circumference: number; strokeOffset: number } {
  const circumference = 2 * Math.PI * radius
  const safePercent = Math.min(100, Math.max(0, percent))
  const strokeOffset = circumference - (safePercent / 100) * circumference
  return { circumference, strokeOffset }
}

/**
 * Calculates progress bar width style percentage (e.g. "45%").
 */
export function calculateProgressBarWidth(percent: number): string {
  const safePercent = Math.min(100, Math.max(0, percent))
  return `${safePercent}%`
}

/**
 * Rough reading time estimate in minutes based on remaining paragraphs/pages.
 */
export function estimateRemainingMinutes(
  remainingPages: number,
  minutesPerPage = 0.5,
): number {
  if (remainingPages <= 0) return 0
  return Math.max(1, Math.round(remainingPages * minutesPerPage))
}
