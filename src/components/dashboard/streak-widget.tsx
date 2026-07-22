'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, ChevronLeft, ChevronRight, Flame, Trophy } from 'lucide-react'
import { useReadingStreak } from '@/hooks/reader/use-reading-streak'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { cn } from '@/lib/utils'
import { useMemo, useRef, useState } from 'react'

/** Flame size scales with the streak length so longer streaks feel "lit". */
function flameScale(streak: number): number {
  if (streak <= 0) return 0.85
  if (streak <= 2) return 0.95
  if (streak <= 6) return 1.05
  if (streak <= 13) return 1.15
  return 1.25
}

/** Motivational copy, bucketed by streak length. */
function motivationalText(streak: number, longest: number): string {
  if (streak <= 0) return 'امروز یک کتاب باز کن و زنجیره را آغاز کن!'
  if (streak === 1) return 'اولین قدم را برداشتی — همین حالا برای فردا هم بخوان!'
  if (streak <= 3) return 'شروع خوبی داشتی؛ زنجیره را زنده نگه دار.'
  if (streak <= 6) return 'هفته را پررنگ ببند — به رکوردت نزدیک می‌شی!'
  if (streak === 7) return 'یک هفته کامل! عادت مطالعه شکل گرفت.'
  if (streak <= 13) return 'دو هفته استمرار — تپش قلم‌به‌قلم ادامه دارد.'
  if (streak <= 29) return 'رکوردت خارق‌العاده است؛ هر روز یک گام به جلو.'
  if (longest > 0 && streak >= longest) return 'به اوج رکوردت رسیدی! حالا آن را بشکن.'
  return 'استمرار تو حیرت‌انگیز است — پیش روی طلایی!'
}

/**
 * Persian week — Persian week starts on Saturday (شنبه).
 * Index 0..6 → Sat, Sun, Mon, Tue, Wed, Thu, Fri.
 * Returns both the initial (first letter) and the full name.
 */
const PERSIAN_DAYS: { initial: string; full: string }[] = [
  { initial: 'ش', full: 'شنبه' },
  { initial: 'ی', full: 'یکشنبه' },
  { initial: 'د', full: 'دوشنبه' },
  { initial: 'س', full: 'سه‌شنبه' },
  { initial: 'چ', full: 'چهارشنبه' },
  { initial: 'پ', full: 'پنجشنبه' },
  { initial: 'ج', full: 'جمعه' },
]

/** Map JS getDay() (Sun=0..Sat=6) to Persian-day index (Sat=0..Fri=6). */
function jsDayToPersianIndex(jsDay: number): number {
  // JS: Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
  // Persian: Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6
  return (jsDay + 1) % 7
}

const DAY = 24 * 60 * 60 * 1000

/**
 * Streak card — redesigned per user feedback:
 *   • Day dots arranged RTL (oldest on the right, newest on the left)
 *   • Each dot shows the Persian day INITIAL on the icon
 *   • Full Persian day name shown BELOW each dot
 *   • Drag/scroll to navigate between previous/next weeks
 *   • More exciting visuals (bigger flame, gold accents)
 *
 * The drag navigates a sliding window of 7 days at a time, going back
 * up to 8 weeks (56 days) into the past. The "today" indicator stays
 * fixed to the actual current day.
 */
export function StreakWidget() {
  const { data } = useReadingStreak()
  const reduceMotion = useReducedMotion()
  const { toPersianDigits } = usePersianLocale()
  const scale = flameScale(data.currentStreak)
  const isOnFire = data.currentStreak > 0

  // Offset in weeks (0 = current week, -1 = last week, ...). Dragging
  // left/right shifts this. Clamped to [-8, 0] so we don't scroll forever.
  const [weekOffset, setWeekOffset] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<{ x: number; offset: number } | null>(null)

  // Build the 7-day window for the current offset.
  const days = useMemo(() => {
    const today = new Date()
    // Start of current Persian week (Saturday on/before today).
    const persianTodayIdx = jsDayToPersianIndex(today.getDay())
    const saturdayThisWeek = new Date(today.getTime() - persianTodayIdx * DAY)
    // Apply week offset.
    const weekStart = new Date(saturdayThisWeek.getTime() + weekOffset * 7 * DAY)
    const out: {
      key: string
      initial: string
      full: string
      active: boolean
      isToday: boolean
      isFuture: boolean
    }[] = []
    const todayStr = today.toISOString().slice(0, 10)
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart.getTime() + i * DAY)
      const key = d.toISOString().slice(0, 10)
      const pIdx = jsDayToPersianIndex(d.getDay())
      out.push({
        key,
        initial: PERSIAN_DAYS[pIdx].initial,
        full: PERSIAN_DAYS[pIdx].full,
        active: data.activeDays.includes(key),
        isToday: key === todayStr,
        isFuture: d.getTime() > today.getTime(),
      })
    }
    return out
  }, [data.activeDays, weekOffset])

  function onPointerDown(e: React.PointerEvent) {
    if (reduceMotion) return
    dragStart.current = { x: e.clientX, offset: weekOffset }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragStart.current) return
    const dx = e.clientX - dragStart.current.x
    // Snap to next week after dragging ~80px. RTL: drag-left → past weeks.
    const weekDelta = Math.round(dx / 80)
    const next = Math.max(-8, Math.min(0, dragStart.current.offset + weekDelta))
    if (next !== weekOffset) setWeekOffset(next)
  }
  function onPointerUp() {
    dragStart.current = null
  }

  function shiftWeek(delta: number) {
    setWeekOffset((w) => Math.max(-8, Math.min(0, w + delta)))
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative h-full overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card to-gold-500/5 p-5 shadow-sm sm:p-6"
      aria-label="وضعیت زنجیره روزانه مطالعه"
    >
      <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-gold-500/10 blur-2xl" />

      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">رکورد روزانه</p>
          <div className="mt-1 flex items-end gap-2">
            <motion.span
              key={data.currentStreak}
              initial={reduceMotion ? false : { scale: 1.4 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="text-5xl font-extrabold leading-none tabular-nums"
            >
              {toPersianDigits(data.currentStreak)}
            </motion.span>
            <span className="mb-1 text-sm font-medium text-muted-foreground">
              روز متوالی
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Trophy className="h-3 w-3 text-gold-500" />
            طولانی‌ترین زنجیره: {toPersianDigits(data.longestStreak)} روز
          </p>
        </div>

        {/* Flame icon — size grows with streak length */}
        <motion.div
          animate={
            isOnFire && !reduceMotion
              ? {
                  scale: [scale, scale * 1.1, scale],
                  rotate: [0, -4, 4, 0],
                }
              : { scale }
          }
          transition={
            isOnFire && !reduceMotion
              ? { duration: 2, repeat: Infinity, repeatDelay: 1 }
              : { duration: 0.4 }
          }
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg',
            isOnFire
              ? 'bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-orange-500/30'
              : 'bg-muted text-muted-foreground',
          )}
          aria-hidden
        >
          <Flame
            className="h-7 w-7"
            style={{
              filter: isOnFire
                ? 'drop-shadow(0 0 6px rgba(251, 146, 60, 0.6))'
                : undefined,
            }}
          />
        </motion.div>
      </div>

      {/* Motivational copy */}
      <motion.p
        key={data.currentStreak}
        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mt-3 rounded-lg bg-gold-500/5 px-3 py-1.5 text-xs font-medium text-foreground/80"
      >
        {motivationalText(data.currentStreak, data.longestStreak)}
      </motion.p>

      {/* Week chain — RTL layout (oldest on right, newest on left).
          Drag-to-scroll navigates between weeks. */}
      <div className="relative mt-5">
        {/* connecting line behind dots — runs right-to-left */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-[18px] mx-4 h-px bg-gradient-to-l from-transparent via-border to-transparent"
          aria-hidden
        />

        {/* Navigation arrows — only show when not at the boundary */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
          {weekOffset < 0 && (
            <button
              type="button"
              onClick={() => shiftWeek(1)}
              aria-label="هفته جدیدتر"
              className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-accent hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
          {weekOffset > -8 && (
            <button
              type="button"
              onClick={() => shiftWeek(-1)}
              aria-label="هفته قدیمی‌تر"
              className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-accent hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        <div
          ref={scrollRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={cn(
            'relative flex items-center justify-between gap-1.5 select-none',
            !reduceMotion && 'cursor-grab active:cursor-grabbing',
          )}
          dir="rtl"
          aria-label="هفته جاری — برای دیدن هفته‌های دیگر بکشید"
        >
          {days.map((d) => (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
              <motion.div
                initial={reduceMotion ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                whileHover={reduceMotion ? undefined : { scale: 1.15 }}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  d.active && !d.isFuture
                    ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-md shadow-gold-500/30'
                    : 'bg-muted text-muted-foreground',
                  d.isFuture && 'opacity-40',
                  d.isToday && !d.active && 'ring-2 ring-gold-400/50',
                  d.isToday && d.active && 'ring-2 ring-gold-300 ring-offset-2 ring-offset-background',
                )}
                aria-label={`${d.full} — ${d.active ? 'فعال' : 'بدون فعالیت'}`}
              >
                {d.active && !d.isFuture ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  d.initial
                )}
              </motion.div>
              {/* Full Persian day name below the dot, per user feedback:
                  "زیر کامل بنویسه برای رو ها" */}
              <span
                className={cn(
                  'text-[10px]',
                  d.isToday
                    ? 'font-bold text-gold-600 dark:text-gold-400'
                    : 'text-muted-foreground',
                )}
              >
                {d.isToday ? 'امروز' : d.full}
              </span>
            </div>
          ))}
        </div>

        {/* Offset indicator — small "x هفته پیش" hint when scrolled back */}
        {weekOffset < 0 && (
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            {toPersianDigits(Math.abs(weekOffset))} هفته پیش
          </p>
        )}
      </div>

      {/* Streak milestone badges — show which thresholds the user has achieved
          (based on longestStreak so badges don't disappear when a streak breaks). */}
      <div className="mt-4 border-t border-border/40 pt-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          نشان‌های زنجیره
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[
            { days: 3, label: '۳', emoji: '🌱' },
            { days: 7, label: '۷', emoji: '🔥' },
            { days: 14, label: '۱۴', emoji: '⚡' },
            { days: 30, label: '۳۰', emoji: '🏆' },
            { days: 60, label: '۶۰', emoji: '💎' },
            { days: 100, label: '۱۰۰', emoji: '👑' },
          ].map((m) => {
            const achieved = data.longestStreak >= m.days
            return (
              <span
                key={m.days}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition-[transform,opacity,colors,border-color,background-color]',
                  achieved
                    ? 'bg-gradient-to-r from-gold-400/30 to-gold-600/20 text-gold-700 ring-1 ring-gold-500/40 dark:text-gold-300'
                    : 'bg-muted/40 text-muted-foreground/50',
                )}
                title={achieved ? `زنجیره ${m.label} روزه` : `هنوز به دست نیاورده`}
              >
                <span className={achieved ? '' : 'opacity-40'}>{m.emoji}</span>
                {m.label}
              </span>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
