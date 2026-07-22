'use client'

/**
 * MonthlyStreakCalendar — a proper monthly calendar view showing which days
 * the user read. Complements the existing ReadingHeatmap (which shows a
 * GitHub-style contribution grid for the last ~6 months) by giving a
 * focused, current-month view with day numbers + Persian day names.
 *
 * Features:
 *   • Current month calendar grid (Sat–Fri Persian week)
 *   • Active reading days highlighted with gold gradient + checkmark
 *   • Today highlighted with a ring
 *   • Previous/next month navigation
 *   • Active-day count + streak summary at the top
 *   • SSR-safe (skeleton during SSR, data loads on mount)
 *   • Respects useReducedMotion
 */

import { motion, useReducedMotion } from 'framer-motion'
import { CalendarDays, Check, ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useReadingStreak } from '@/hooks/reader/use-reading-streak'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { cn } from '@/lib/utils'
import {
  formatJalaliMonth,
  formatJalaliDay,
  getJalaliMonthDays,
  getPersianWeekDay,
  toGregorianKey,
  addMonths,
  subMonths,
} from '@/lib/jalali'


const PERSIAN_DAY_INITIALS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] // Sat–Fri

interface DayCell {
  date: Date
  key: string
  isCurrentMonth: boolean
  isToday: boolean
  isActive: boolean
}

function buildMonthGrid(viewDate: Date, activeDays: Set<string>): DayCell[] {
  const days = getJalaliMonthDays(viewDate)
  const today = new Date()
  const todayKey = toGregorianKey(today)

  // 1. Leading days from the previous month
  const leadingDays: DayCell[] = []
  if (days.length > 0) {
    const startIdx = getPersianWeekDay(days[0])
    for (let i = startIdx; i > 0; i--) {
      const d = new Date(days[0])
      d.setDate(d.getDate() - i)
      leadingDays.push({
        date: d,
        key: toGregorianKey(d),
        isCurrentMonth: false,
        isToday: toGregorianKey(d) === todayKey,
        isActive: activeDays.has(toGregorianKey(d)),
      })
    }
  }

  // 2. Current month days
  const currentDays = days.map((d) => ({
    date: d,
    key: toGregorianKey(d),
    isCurrentMonth: true,
    isToday: toGregorianKey(d) === todayKey,
    isActive: activeDays.has(toGregorianKey(d)),
  }))

  const cells = [...leadingDays, ...currentDays]

  // 3. Trailing days to fill the final week row
  if (days.length > 0) {
    const lastDay = days[days.length - 1]
    const trailingCount = (7 - (cells.length % 7)) % 7
    for (let i = 1; i <= trailingCount; i++) {
      const d = new Date(lastDay)
      d.setDate(d.getDate() + i)
      cells.push({
        date: d,
        key: toGregorianKey(d),
        isCurrentMonth: false,
        isToday: toGregorianKey(d) === todayKey,
        isActive: activeDays.has(toGregorianKey(d)),
      })
    }
  }

  return cells
}

export function MonthlyStreakCalendar() {
  const { data, heatmap } = useReadingStreak()
  const { toPersianDigits } = usePersianLocale()
  const reduceMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  const [viewDate, setViewDate] = useState<Date | null>(null)

  useEffect(() => {
    setViewDate(new Date())
    setMounted(true)
  }, [])

  // Build the activeDays set from the streak data (flattened from the heatmap).
  const activeDaysSet = new Set<string>()
  if (mounted && heatmap) {
    for (const week of heatmap) {
      for (const day of week) {
        if (day.active) {
          const y = day.date.getFullYear()
          const m = String(day.date.getMonth() + 1).padStart(2, '0')
          const d = String(day.date.getDate()).padStart(2, '0')
          activeDaysSet.add(`${y}-${m}-${d}`)
        }
      }
    }
  }

  const cells = mounted && viewDate ? buildMonthGrid(viewDate, activeDaysSet) : []
  const activeThisMonth = cells.filter((c) => c.isCurrentMonth && c.isActive).length

  const goToPrevMonth = useCallback(() => {
    setViewDate((prev) => (prev ? subMonths(prev, 1) : null))
  }, [])

  const goToNextMonth = useCallback(() => {
    setViewDate((prev) => (prev ? addMonths(prev, 1) : null))
  }, [])

  if (!mounted || !viewDate) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/50 p-5">
        <div className="mb-4 h-6 w-40 animate-pulse rounded bg-muted/50" />
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/15 text-gold-600 dark:text-gold-400">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              تقویم مطالعه
            </h3>
            <p className="text-xs text-muted-foreground">
              {activeThisMonth > 0
                ? `${toPersianDigits(activeThisMonth)} روز مطالعه این ماه`
                : 'این ماه هنوز مطالعه‌ای ثبت نشده'}
            </p>
          </div>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-1" dir="ltr">
          <button
            onClick={goToPrevMonth}
            aria-label="ماه قبل"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[100px] text-center text-xs font-semibold text-foreground">
            {formatJalaliMonth(viewDate)}
          </span>
          <button
            onClick={goToNextMonth}
            aria-label="ماه بعد"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day-of-week header (Persian: Sat–Fri) */}
      <div className="mb-2 grid grid-cols-7 gap-1.5">
        {PERSIAN_DAY_INITIALS.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[10px] font-bold text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, i) => {
          const dayNumberString = formatJalaliDay(cell.date)
          return (

            <motion.div
              key={cell.key}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: reduceMotion ? 0 : Math.min(i * 0.01, 0.3) }}
              className={cn(
                'relative flex aspect-square items-center justify-center rounded-lg text-xs transition-colors',
                !cell.isCurrentMonth && 'text-muted-foreground/40',
                cell.isCurrentMonth && !cell.isActive && 'bg-muted/30 text-muted-foreground',
                cell.isActive && 'bg-gradient-to-br from-gold-400 to-gold-600 font-bold text-white shadow-sm shadow-gold-500/30',
                cell.isToday && !cell.isActive && 'ring-2 ring-gold-500/50',
                cell.isToday && cell.isActive && 'ring-2 ring-gold-300',
              )}
            >
              {toPersianDigits(dayNumberString)}
              {cell.isActive && (
                <Check className="absolute top-0.5 right-0.5 h-2.5 w-2.5 text-white/80" aria-hidden="true" />
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Footer summary */}
      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Flame className="h-3.5 w-3.5 text-gold-500" />
          زنجیره فعلی: {toPersianDigits(data.currentStreak)} روز
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Check className="h-3.5 w-3.5 text-gold-600 dark:text-gold-400" />
          کل روزهای مطالعه: {toPersianDigits(data.totalReadingDays)}
        </span>
      </div>
    </div>
  )
}
