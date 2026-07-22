'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { CalendarDays } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useReadingStreak } from '@/hooks/reader/use-reading-streak'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { cn } from '@/lib/utils'

const MONTHS_FA = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
]

interface HoveredDay {
  /** pixel offset from container left (in LTR coords) */
  x: number
  /** pixel offset from container top */
  y: number
  key: string
  active: boolean
  isToday: boolean
}

export function ReadingHeatmap() {
  const { heatmap, data } = useReadingStreak()
  const { formatDate, toPersianDigits } = usePersianLocale()
  const reduceMotion = useReducedMotion()
  const [hovered, setHovered] = useState<HoveredDay | null>(null)

  // Cell geometry — used for both rendering + tooltip positioning.
  const CELL = 14 // px (h-3.5)
  const GAP = 4 // px (gap-1)

  const monthLabels = useMemo(() => {
    const out: { col: number; label: string }[] = []
    let lastMonth = -1
    heatmap.forEach((week, wi) => {
      const firstDay = week.find((d) => d.date.getMonth() !== undefined)
      if (firstDay) {
        const m = firstDay.date.getMonth()
        if (m !== lastMonth) {
          out.push({ col: wi, label: MONTHS_FA[m] })
          lastMonth = m
        }
      }
    })
    return out
  }, [heatmap])

  if (heatmap.length === 0) return null

  const activeCount = heatmap.flat().filter((d) => d.active).length
  const todayMinutes = Math.floor(data.todaySeconds / 60)

  const cellSize = 'h-3.5 w-3.5'
  const gapClass = 'gap-1'

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6"
      aria-label="نقشه فعالیت مطالعه"
    >
      {/* header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2.5 text-lg font-bold sm:text-xl">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/15 text-gold-700 dark:text-gold-400">
            <CalendarDays className="h-5 w-5" />
          </span>
          تاریخچه مطالعه
        </h2>
        <span className="rounded-full bg-gold-500/15 px-3 py-1 text-xs font-bold text-gold-700 dark:text-gold-400">
          {toPersianDigits(activeCount)} روز فعال در ۱۲ هفته گذشته
        </span>
      </div>

      {/* Heatmap grid — weeks as columns (LTR: oldest on left) */}
      <div className="relative overflow-x-auto scroll-warm pb-2">
        <div
          className="relative inline-block min-w-max"
          dir="ltr"
          onMouseLeave={() => setHovered(null)}
        >
          {/* Month labels row */}
          <div className="relative mb-2 h-4 text-[10px] text-muted-foreground">
            {monthLabels.map((m) => (
              <span
                key={`${m.col}-${m.label}`}
                className="absolute whitespace-nowrap font-medium"
                style={{ left: `${m.col * (CELL + GAP)}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Weeks */}
          <div className={cn('flex', gapClass)}>
            {heatmap.map((week, wi) => (
              <div key={wi} className={cn('flex flex-col', gapClass)}>
                {week.map((day, di) => (
                  <motion.div
                    key={day.key}
                    initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: reduceMotion ? 0 : (wi * 7 + di) * 0.003,
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                    }}
                    whileHover={reduceMotion ? undefined : { scale: 1.35 }}
                    style={{ width: CELL, height: CELL }}
                    className={cn(
                      'rounded-[3px] transition-colors',
                      cellSize,
                      /* Per user feedback: colors should be MORE vibrant
                         (was "خیلی کم‌رنگ/محو"). Replaced soft gold with
                         brighter amber→orange→rose progression. */
                      day.active
                        ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-sm shadow-orange-500/40'
                        : 'bg-muted/70',
                      day.isToday && 'ring-1 ring-gold-500 ring-offset-1 ring-offset-card',
                      hovered?.key === day.key && 'ring-2 ring-gold-300',
                    )}
                    role="img"
                    aria-label={`${formatDate(day.date, 'long')} — ${
                      day.active ? 'روز فعال' : 'بدون فعالیت'
                    }`}
                    onMouseEnter={(e) => {
                      const rect = (
                        e.currentTarget.parentElement?.parentElement as HTMLElement
                      )?.getBoundingClientRect()
                      const cellRect = e.currentTarget.getBoundingClientRect()
                      if (!rect) return
                      setHovered({
                        x: cellRect.left - rect.left + CELL / 2,
                        y: cellRect.top - rect.top + CELL + 6,
                        key: day.key,
                        active: day.active,
                        isToday: day.isToday,
                      })
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Floating tooltip */}
          {hovered && (
            <div
              className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-lg backdrop-blur"
              style={{ left: hovered.x, top: hovered.y }}
              role="tooltip"
            >
              <div className="font-bold">
                {formatDate(hovered.key, 'long')}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
                <span
                  className={cn(
                    'inline-block h-2 w-2 rounded-[2px]',
                    hovered.active ? 'bg-gold-500' : 'bg-muted-foreground/40',
                  )}
                />
                {hovered.isToday && hovered.active
                  ? `${toPersianDigits(todayMinutes)} دقیقه مطالعه`
                  : hovered.active
                    ? 'روز فعال'
                    : 'بدون فعالیت'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend — gradient bar */}
      <div className="mt-4 flex items-center justify-between gap-4 text-[11px] text-muted-foreground">
        <span>یادآور: هر سلول یک روز است — از راست به چپ به‌ترتیب زمانی.</span>
        <div className="flex items-center gap-2">
          <span>کمتر</span>
          <span
            className="h-3 w-20 rounded-full"
            style={{
              background:
                'linear-gradient(90deg, hsl(var(--muted)) 0%, #fbbf24 30%, #f97316 60%, #f43f5e 100%)',
            }}
            aria-hidden
          />
          <span>بیشتر</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border/50 pt-4">
        <Stat
          value={toPersianDigits(data.totalReadingDays)}
          label="کل روزهای فعال"
        />
        <Stat
          value={`${toPersianDigits(data.longestStreak)} روز`}
          label="طولانی‌ترین زنجیره"
        />
        <Stat
          value={`${toPersianDigits(todayMinutes)} دقیقه`}
          label="امروز"
        />
      </div>
    </section>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-extrabold text-gold-600 dark:text-gold-400 sm:text-xl">
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  )
}
