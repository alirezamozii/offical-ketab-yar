'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CalendarDays,
  Check,
  Clock,
  Edit3,
  Flame,
  Lock,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { getLocalProgress } from '@/hooks/reader/use-local-progress'
import { useReadingStreak } from '@/hooks/reader/use-reading-streak'
import {
  DEFAULT_GOALS,
  computeBestHour,
  computeGoalProgress,
  computeMilestones,
  computeTimeDistribution,
  computeVelocity,
  computeWeeklySummary,
  readReadingHistory,
  toISODate,
  type GoalConfig,
  type GoalPeriod,
  type GoalProgress,
  type GoalsConfig,
  type GoalsProgressPayload,
  type MilestoneState,
  type ReadingHistoryDay,
} from '@/lib/goals'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Types & helpers                                                    */
/* ------------------------------------------------------------------ */

interface ApiResponse extends GoalsProgressPayload {
  goals: GoalsConfig
  error?: string
}

const PERIOD_LABELS: Record<GoalPeriod, string> = {
  daily: 'روزانه',
  weekly: 'هفتگی',
  monthly: 'ماهانه',
}

const UNIT_LABELS = {
  pages: 'صفحه',
  minutes: 'دقیقه',
} as const

const MONTHS_FA = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
]

const DAY = 24 * 60 * 60 * 1000

/** Determine the color theme for a goal ring based on progress. */
function ringTheme(progress: GoalProgress): {
  text: string
  ringId: string
  ringStops: { offset: string; color: string }[]
  glow: string
  badge: string
  badgeText: string
} {
  if (progress.reached) {
    return {
      text: 'text-emerald-600 dark:text-emerald-400',
      ringId: 'ring-emerald',
      ringStops: [
        { offset: '0%', color: 'hsl(152 60% 55%)' },
        { offset: '50%', color: 'hsl(160 70% 45%)' },
        { offset: '100%', color: 'hsl(168 75% 38%)' },
      ],
      glow: 'from-emerald-400/30 to-teal-600/10',
      badge: 'bg-emerald-500/15',
      badgeText: 'text-emerald-600 dark:text-emerald-400',
    }
  }
  // Behind pace but progressing → rose when 0%, gold when 1..99%.
  if (progress.pct < 25) {
    return {
      text: 'text-rose-600 dark:text-rose-400',
      ringId: 'ring-rose',
      ringStops: [
        { offset: '0%', color: 'hsl(350 75% 65%)' },
        { offset: '100%', color: 'hsl(352 70% 50%)' },
      ],
      glow: 'from-rose-400/20 to-rose-600/10',
      badge: 'bg-rose-500/15',
      badgeText: 'text-rose-600 dark:text-rose-400',
    }
  }
  return {
    text: 'text-gold-600 dark:text-gold-400',
    ringId: 'ring-gold',
    ringStops: [
      { offset: '0%', color: 'hsl(43 74% 67%)' },
      { offset: '50%', color: 'hsl(35 70% 55%)' },
      { offset: '100%', color: 'hsl(28 60% 42%)' },
    ],
    glow: 'from-gold-400/30 to-amber-600/10',
    badge: 'bg-gold-500/15',
    badgeText: 'text-gold-700 dark:text-gold-400',
  }
}

/* ------------------------------------------------------------------ */
/*  Circular goal ring                                                 */
/* ------------------------------------------------------------------ */

function GoalRing({
  progress,
  size = 132,
  strokeWidth = 10,
  ringId,
  ringStops,
  reduceMotion,
}: {
  progress: GoalProgress
  size?: number
  strokeWidth?: number
  ringId: string
  ringStops: { offset: string; color: string }[]
  reduceMotion: boolean | null
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(100, progress.pct))
  const offset = circumference - (pct / 100) * circumference

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`پیشرفت: ${Math.round(pct)} درصد`}
      className="shrink-0"
    >
      <defs>
        <linearGradient id={ringId} x1="0%" y1="0%" x2="100%" y2="100%">
          {ringStops.map((s, i) => (
            <stop key={i} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
      </defs>
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-border"
      />
      {/* Progress arc */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#${ringId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        initial={reduceMotion ? false : { strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Goal editor inline popover                                         */
/* ------------------------------------------------------------------ */

function GoalEditor({
  goal,
  onSave,
  onCancel,
}: {
  goal: GoalConfig
  onSave: (next: GoalConfig) => void
  onCancel: () => void
}) {
  const { toPersianDigits } = usePersianLocale()
  const [target, setTarget] = useState(goal.target)
  const [unit, setUnit] = useState<GoalConfig['unit']>(goal.unit)

  const adjust = (delta: number) => {
    setTarget((t) => Math.max(1, Math.min(10000, t + delta)))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="absolute inset-x-0 top-full z-30 mt-2 rounded-2xl border border-border bg-popover p-4 shadow-xl"
      role="dialog"
      aria-label="ویرایش هدف"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">ویرایش هدف</span>
        <div className="flex rounded-lg bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setUnit('pages')}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              unit === 'pages'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            صفحه
          </button>
          <button
            type="button"
            onClick={() => setUnit('minutes')}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              unit === 'minutes'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            دقیقه
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => adjust(-5)}
          aria-label="کاهش ۵ واحد"
          className="h-9 w-9 rounded-full"
        >
          <Minus className="h-4 w-4" />
          <span className="sr-only">کاهش ۵</span>
        </Button>
        <input
          type="number"
          min={1}
          max={10000}
          value={target}
          onChange={(e) =>
            setTarget(
              Math.max(1, Math.min(10000, Number(e.target.value) || 1)),
            )
          }
          className="h-12 w-24 rounded-lg border border-border bg-background text-center text-2xl font-extrabold tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="مقدار هدف"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => adjust(5)}
          aria-label="افزایش ۵ واحد"
          className="h-9 w-9 rounded-full"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">افزایش ۵</span>
        </Button>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        واحد: {UNIT_LABELS[unit]} · {toPersianDigits(target)} {UNIT_LABELS[unit]}
      </p>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          انصراف
        </Button>
        <Button
          type="button"
          variant="glow"
          size="sm"
          onClick={() => onSave({ target, unit })}
          className="gap-1.5"
        >
          <Check className="h-3.5 w-3.5" />
          ذخیره
        </Button>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Goal setup card                                                    */
/* ------------------------------------------------------------------ */

function GoalSetupCard({
  period,
  goal,
  progress,
  index,
  onEdit,
  onReset,
}: {
  period: GoalPeriod
  goal: GoalConfig
  progress: GoalProgress
  index: number
  onEdit: (next: GoalConfig) => void
  onReset: () => void
}) {
  const reduceMotion = useReducedMotion()
  const { toPersianDigits } = usePersianLocale()
  const [editing, setEditing] = useState(false)
  const theme = ringTheme(progress)

  const remaining = Math.max(0, progress.target - progress.current)
  const suffix = UNIT_LABELS[goal.unit]

  const enter: Variants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 16, scale: 0.96 },
        visible: { opacity: 1, y: 0, scale: 1 },
      }

  return (
    <motion.div
      variants={enter}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-visible rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6"
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br opacity-30 blur-2xl',
          theme.glow,
        )}
      />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">
            هدف {PERIOD_LABELS[period]}
          </p>
          <p className={cn('mt-0.5 text-xs font-medium', theme.badgeText)}>
            {progress.reached
              ? '🎉 هدف محقق شد!'
              : `${toPersianDigits(remaining)} ${suffix} باقی‌مانده`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="بازنشانی هدف"
            title="بازنشانی به مقدار پیش‌فرض"
            onClick={onReset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="ویرایش هدف"
            title="ویرایش هدف"
            onClick={() => setEditing((v) => !v)}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Ring + center value */}
      <div className="relative mt-4 flex justify-center">
        <div className="relative">
          <GoalRing
            progress={progress}
            ringId={`${theme.ringId}-${period}`}
            ringStops={theme.ringStops}
            reduceMotion={reduceMotion}
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              className={cn(
                'text-2xl font-extrabold tabular-nums leading-none',
                theme.text,
              )}
            >
              {toPersianDigits(progress.current)}
            </span>
            <span className="mt-1 text-[11px] font-medium text-muted-foreground">
              از {toPersianDigits(progress.target)} {suffix}
            </span>
            <span className={cn('mt-0.5 text-[10px] font-bold', theme.badgeText)}>
              {toPersianDigits(progress.pct)}٪
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <GoalEditor
            goal={goal}
            onSave={(next) => {
              onEdit(next)
              setEditing(false)
            }}
            onCancel={() => setEditing(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Velocity chart tooltip                                             */
/* ------------------------------------------------------------------ */

function VelocityTooltip({
  active,
  payload,
  dailyTarget,
}: {
  active?: boolean
  payload?: Array<{ payload?: { date: string; label: string; pages: number; isToday: boolean } }>
  dailyTarget?: number
}) {
  const { formatDate, toPersianDigits } = usePersianLocale()
  if (!active || !payload || !payload.length) return null
  const p = payload[0]?.payload
  if (!p) return null
  return (
    <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <div className="font-bold">{p.isToday ? 'امروز' : formatDate(p.date, 'medium')}</div>
      <div className="mt-0.5 text-muted-foreground">
        {p.pages > 0
          ? `${toPersianDigits(p.pages)} صفحه مطالعه`
          : 'بدون فعالیت'}
      </div>
      <div className="mt-0.5 text-[10px] text-gold-600 dark:text-gold-400">
        هدف روزانه: {toPersianDigits(dailyTarget ?? 0)} صفحه
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 2: Velocity chart                                          */
/* ------------------------------------------------------------------ */

function VelocityChartCard({
  velocity,
  avgPagesPerDay,
  bestDayPages,
  bestDayDate,
  dailyTarget,
}: {
  velocity: GoalsProgressPayload['velocity']
  avgPagesPerDay: number
  bestDayPages: number
  bestDayDate: string
  dailyTarget: number
}) {
  const reduceMotion = useReducedMotion()
  const { formatDate, toPersianDigits } = usePersianLocale()
  const hasData = velocity.some((v) => v.pages > 0)

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6"
      aria-label="نمودار سرعت مطالعه"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/15 text-gold-700 dark:text-gold-400">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold leading-tight sm:text-xl">
              سرعت مطالعه
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              صفحات خوانده‌شده در روز — ۱۴ روز اخیر
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="rounded-full bg-gold-500/15 px-2.5 py-1 font-bold text-gold-700 dark:text-gold-400">
            میانگین: {toPersianDigits(avgPagesPerDay)} صفحه در روز
          </span>
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 font-bold text-emerald-700 dark:text-emerald-400">
            بهترین روز: {toPersianDigits(bestDayPages)} صفحه
          </span>
        </div>
      </div>

      {hasData ? (
        <div className="h-56 w-full sm:h-64" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={velocity}
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="velArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(38 75% 55%)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="hsl(32 70% 45%)" stopOpacity={0.04} />
                </linearGradient>
                <linearGradient id="velStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(38 70% 60%)" />
                  <stop offset="100%" stopColor="hsl(28 75% 50%)" />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                strokeOpacity={0.4}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                dy={6}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <RTooltip
                cursor={{ stroke: 'hsl(38 70% 55%)', strokeWidth: 1, strokeDasharray: '3 3' }}
                content={<VelocityTooltip dailyTarget={dailyTarget} />}
              />
              {dailyTarget > 0 && (
                <ReferenceLine
                  y={dailyTarget}
                  stroke="hsl(152 60% 50%)"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  label={{
                    value: `هدف: ${toPersianDigits(dailyTarget)}`,
                    position: 'insideTopRight',
                    fill: 'hsl(152 60% 40%)',
                    fontSize: 10,
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="pages"
                stroke="url(#velStroke)"
                strokeWidth={2.5}
                fill="url(#velArea)"
                dot={{ r: 3, fill: 'hsl(38 70% 55%)', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: 'hsl(28 75% 50%)', stroke: 'white', strokeWidth: 2 }}
                isAnimationActive={!reduceMotion}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyChartState
          icon={TrendingUp}
          title="هنوز داده‌ای ثبت نشده"
          hint="با خواندن چند صفحه از یک کتاب، نمودار سرعت مطالعه‌تان اینجا ظاهر می‌شود."
        />
      )}

      {bestDayDate && hasData && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          بهترین روز شما: {formatDate(bestDayDate, 'long')} با{' '}
          {toPersianDigits(bestDayPages)} صفحه
        </p>
      )}
    </motion.section>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 3: Streak calendar (12 weeks)                              */
/* ------------------------------------------------------------------ */

function intensityClass(pages: number): string {
  if (pages <= 0) return 'bg-muted'
  if (pages < 6) return 'bg-gold-300/70 dark:bg-gold-300/40'
  if (pages < 16) return 'bg-gold-400/90 dark:bg-gold-400/70'
  return 'bg-gradient-to-br from-gold-500 to-gold-700'
}

function StreakCalendarCard({
  history,
  currentStreak,
  longestStreak,
}: {
  history: ReadingHistoryDay[]
  currentStreak: number
  longestStreak: number
}) {
  const reduceMotion = useReducedMotion()
  const { formatDate, toPersianDigits } = usePersianLocale()
  const [hovered, setHovered] = useState<{
    x: number
    y: number
    date: string
    pages: number
  } | null>(null)

  const CELL = 14
  const GAP = 4
  const totalDays = 84 // 12 weeks

  // Build 12 weeks (each an array of 7 days), oldest → newest, Saturday-aligned.
  const weeks = useMemo(() => {
    const today = new Date()
    const startOffset = totalDays - 1
    const startDate = new Date(today.getTime() - startOffset * DAY)
    const dow = startDate.getDay()
    const daysToSaturday = (dow + 1) % 7
    const alignedStart = new Date(startDate.getTime() - daysToSaturday * DAY)
    const out: { date: string; pages: number; isToday: boolean }[][] = []
    let cursor = new Date(alignedStart)
    const todayStr = toISODate(today)
    let currentWeek: { date: string; pages: number; isToday: boolean }[] = []
    const count = Math.ceil((totalDays + daysToSaturday) / 7) * 7
    for (let i = 0; i < count; i++) {
      const key = toISODate(cursor)
      const entry = history.find((h) => h.date === key)
      currentWeek.push({
        date: key,
        pages: entry?.pages ?? 0,
        isToday: key === todayStr,
      })
      cursor = new Date(cursor.getTime() + DAY)
      if (currentWeek.length === 7) {
        out.push(currentWeek)
        currentWeek = []
      }
    }
    return out
  }, [history])

  // Month labels (Gregorian months → Persian names for display).
  const monthLabels = useMemo(() => {
    const out: { col: number; label: string }[] = []
    let lastMonth = -1
    weeks.forEach((week, wi) => {
      const first = week[0]
      if (!first) return
      const m = new Date(first.date).getMonth()
      if (m !== lastMonth) {
        out.push({ col: wi, label: MONTHS_FA[m] })
        lastMonth = m
      }
    })
    return out
  }, [weeks])

  const activeCount = weeks.flat().filter((d) => d.pages > 0).length

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24, duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6"
      aria-label="تقویم استمرار مطالعه"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/15 text-gold-700 dark:text-gold-400">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold leading-tight sm:text-xl">
              تقویم استمرار
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              ۱۲ هفته اخیر — هر سلول یک روز
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="rounded-full bg-rose-500/15 px-2.5 py-1 font-bold text-rose-700 dark:text-rose-400">
            زنجیره فعلی: {toPersianDigits(currentStreak)} روز
          </span>
          <span className="rounded-full bg-gold-500/15 px-2.5 py-1 font-bold text-gold-700 dark:text-gold-400">
            طولانی‌ترین زنجیره: {toPersianDigits(longestStreak)} روز
          </span>
        </div>
      </div>

      {activeCount > 0 ? (
        <>
          <div className="relative overflow-x-auto pb-2" dir="ltr">
            <div
              className="relative inline-block min-w-max"
              onMouseLeave={() => setHovered(null)}
            >
              {/* Month labels */}
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
              <div className={cn('flex', 'gap-1')}>
                {weeks.map((week, wi) => (
                  <div key={wi} className={cn('flex flex-col', 'gap-1')}>
                    {week.map((day, di) => (
                      <motion.div
                        key={day.date}
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
                          intensityClass(day.pages),
                          day.isToday &&
                            'ring-1 ring-gold-500 ring-offset-1 ring-offset-card',
                          hovered?.date === day.date && 'ring-2 ring-gold-300',
                        )}
                        role="img"
                        aria-label={`${formatDate(day.date, 'long')} — ${
                          day.pages > 0
                            ? `${day.pages} صفحه`
                            : 'بدون فعالیت'
                        }`}
                        onMouseEnter={(e) => {
                          const cellRect = e.currentTarget.getBoundingClientRect()
                          const parent = (
                            e.currentTarget.parentElement?.parentElement as HTMLElement
                          )?.getBoundingClientRect()
                          if (!parent) return
                          setHovered({
                            x: cellRect.left - parent.left + CELL / 2,
                            y: cellRect.top - parent.top + CELL + 6,
                            date: day.date,
                            pages: day.pages,
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
                  <div className="font-bold">{formatDate(hovered.date, 'long')}</div>
                  <div className="mt-0.5 text-muted-foreground">
                    {hovered.pages > 0
                      ? `${toPersianDigits(hovered.pages)} صفحه مطالعه`
                      : 'بدون فعالیت'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-between gap-4 text-[11px] text-muted-foreground">
            <span>هر سلول یک روز است — از راست به چپ به‌ترتیب زمانی.</span>
            <div className="flex items-center gap-2">
              <span>کمتر</span>
              <div className="flex gap-0.5">
                <span className="h-3 w-3 rounded-[2px] bg-muted" aria-hidden />
                <span className="h-3 w-3 rounded-[2px] bg-gold-300/70 dark:bg-gold-300/40" aria-hidden />
                <span className="h-3 w-3 rounded-[2px] bg-gold-400/90 dark:bg-gold-400/70" aria-hidden />
                <span className="h-3 w-3 rounded-[2px] bg-gradient-to-br from-gold-500 to-gold-700" aria-hidden />
              </div>
              <span>بیشتر</span>
            </div>
          </div>
        </>
      ) : (
        <EmptyChartState
          icon={CalendarDays}
          title="زنجیره استمرار شما هنوز شروع نشده"
          hint="اولین روز مطالعه‌تان را ثبت کنید تا زنجیره‌تان اینجا شکل بگیرد."
        />
      )}

      {/* Summary */}
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border/50 pt-4">
        <Stat value={toPersianDigits(activeCount)} label="روز فعال در ۱۲ هفته" />
        <Stat value={`${toPersianDigits(currentStreak)} روز`} label="زنجیره فعلی" />
        <Stat value={`${toPersianDigits(longestStreak)} روز`} label="طولانی‌ترین زنجیره" />
      </div>
    </motion.section>
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

/* ------------------------------------------------------------------ */
/*  Section 4: Time distribution                                       */
/* ------------------------------------------------------------------ */

function TimeDistributionCard({
  distribution,
  bestHour,
}: {
  distribution: GoalsProgressPayload['timeDistribution']
  bestHour: number
}) {
  const reduceMotion = useReducedMotion()
  const { toPersianDigits } = usePersianLocale()
  const hasData = distribution.some((d) => d.minutes > 0)

  // Bucket label for the best-hour insight.
  const timeOfDayLabel = (h: number): string => {
    if (h < 5) return 'اواخر شب / پیش از سپیده‌دم'
    if (h < 12) return 'صبح'
    if (h < 17) return 'بعدازظهر'
    if (h < 21) return 'عصر'
    return 'شب'
  }

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6"
      aria-label="توزیع زمانی مطالعه"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/15 text-gold-700 dark:text-gold-400">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold leading-tight sm:text-xl">
              توزیع زمانی مطالعه
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              ساعت‌های روز که در آن‌ها مطالعه کرده‌اید
            </p>
          </div>
        </div>
        {bestHour >= 0 && (
          <span className="rounded-full bg-gold-500/15 px-2.5 py-1 text-[11px] font-bold text-gold-700 dark:text-gold-400">
            بهترین زمان: {toPersianDigits(bestHour)}:۰۰ — {timeOfDayLabel(bestHour)}
          </span>
        )}
      </div>

      {hasData ? (
        <>
          <div className="h-44 w-full sm:h-52" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={distribution}
                margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="timeBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(38 75% 55%)" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="hsl(28 75% 50%)" stopOpacity={0.85} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.4}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  interval={1}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <RTooltip
                  cursor={{ fill: 'hsl(38 70% 55% / 0.1)' }}
                  content={({ active, payload }: { active?: boolean; payload?: Array<{ payload?: { hour: number; minutes: number } }> }) => {
                    if (!active || !payload || !payload.length) return null
                    const p = payload[0]?.payload
                    if (!p) return null
                    return (
                      <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
                        <div className="font-bold">
                          ساعت {toPersianDigits(p.hour)}:۰۰
                        </div>
                        <div className="mt-0.5 text-muted-foreground">
                          {p.minutes > 0
                            ? `${toPersianDigits(p.minutes)} دقیقه مطالعه`
                            : 'بدون فعالیت'}
                        </div>
                      </div>
                    )
                  }}
                />
                <Bar
                  dataKey="minutes"
                  fill="url(#timeBar)"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={!reduceMotion}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            شما بیشتر در {timeOfDayLabel(bestHour)}‌ها مطالعه می‌کنید — این
            الگو را حفظ کنید تا عادت مطالعه‌تان تثبیت شود.
          </p>
        </>
      ) : (
        <EmptyChartState
          icon={Clock}
          title="هنوز الگوی زمانی ثبت نشده"
          hint="با خواندن کتاب در ساعات مختلف روز، الگوی زمانی مطالعه‌تان اینجا رسم می‌شود."
        />
      )}
    </motion.section>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 5: Milestones timeline                                     */
/* ------------------------------------------------------------------ */

function MilestonesTimelineCard({
  milestones,
  nextMilestone,
}: {
  milestones: MilestoneState[]
  nextMilestone: MilestoneState | null
}) {
  const reduceMotion = useReducedMotion()
  const { toPersianDigits, formatDate } = usePersianLocale()
  const unlockedCount = milestones.filter((m) => m.unlocked).length

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.36, duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6"
      aria-label="نقاط عطف مطالعه"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/15 text-gold-700 dark:text-gold-400">
            <Trophy className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold leading-tight sm:text-xl">
              نقاط عطف
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {toPersianDigits(unlockedCount)} از {toPersianDigits(milestones.length)} دستاورد مطالعه باز شده
            </p>
          </div>
        </div>
        {nextMilestone && (
          <span className="rounded-full bg-gold-500/15 px-2.5 py-1 text-[11px] font-bold text-gold-700 dark:text-gold-400">
            نزدیک‌ترین: {nextMilestone.title}
          </span>
        )}
      </div>

      {/* Next-milestone progress bar */}
      {nextMilestone && (
        <div className="mb-4 rounded-xl bg-gold-500/5 p-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              {nextMilestone.icon} {nextMilestone.title}
            </span>
            <span className="font-bold text-gold-700 dark:text-gold-400">
              {toPersianDigits(nextMilestone.progress)} /{' '}
              {toPersianDigits(nextMilestone.target)} {UNIT_LABEL_STUB(nextMilestone.kind)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600"
              initial={reduceMotion ? false : { width: 0 }}
              animate={{ width: `${nextMilestone.pct}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      )}

      {/* Timeline list */}
      <ol className="relative space-y-1">
        {milestones.map((m, i) => (
          <MilestoneRow
            key={m.id}
            milestone={m}
            index={i}
            reduceMotion={reduceMotion}
            formatDate={formatDate}
            toPersianDigits={toPersianDigits}
          />
        ))}
      </ol>
    </motion.section>
  )
}

function UNIT_LABEL_STUB(kind: MilestoneState['kind']): string {
  switch (kind) {
    case 'pages':
      return 'صفحه'
    case 'booksCompleted':
      return 'کتاب'
    case 'streak':
      return 'روز'
    case 'vocab':
      return 'واژه'
    case 'level':
      return 'سطح'
    case 'readingDays':
      return 'روز'
    default:
      return ''
  }
}

function MilestoneRow({
  milestone,
  index,
  reduceMotion,
  formatDate,
  toPersianDigits,
}: {
  milestone: MilestoneState
  index: number
  reduceMotion: boolean | null
  formatDate: (d: Date | string | number, style?: 'long' | 'short' | 'medium') => string
  toPersianDigits: (input: string | number) => string
}) {
  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.4), duration: 0.3 }}
      className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent/40"
    >
      {/* Icon badge */}
      <div
        className={cn(
          'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg shadow-sm',
          milestone.unlocked
            ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-gold-500/30'
            : 'bg-muted text-muted-foreground grayscale',
        )}
      >
        {milestone.unlocked ? (
          <span aria-hidden>{milestone.icon}</span>
        ) : (
          <Lock className="h-4 w-4" aria-hidden />
        )}
        {milestone.unlocked && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'truncate text-sm font-semibold',
              milestone.unlocked ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {milestone.title}
          </p>
          {milestone.unlocked && milestone.unlockedAt ? (
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {formatDate(milestone.unlockedAt, 'short')}
            </span>
          ) : null}
        </div>
        <p className="truncate text-[11px] text-muted-foreground">
          {milestone.description}
        </p>
        {!milestone.unlocked && milestone.target > 0 && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gold-500/60"
                style={{ width: `${milestone.pct}%` }}
              />
            </div>
            <span className="shrink-0 text-[10px] font-bold text-muted-foreground">
              {toPersianDigits(milestone.progress)}/{toPersianDigits(milestone.target)}
            </span>
          </div>
        )}
      </div>
    </motion.li>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 6: Weekly summary                                          */
/* ------------------------------------------------------------------ */

function WeeklySummaryCard({
  summary,
}: {
  summary: GoalsProgressPayload['weeklySummary']
}) {
  const reduceMotion = useReducedMotion()
  const { toPersianDigits } = usePersianLocale()
  const minutes = Math.floor(summary.secondsRead / 60)
  const hours = Math.floor(minutes / 60)
  const minsRem = minutes % 60
  const timeLabel =
    hours > 0
      ? `${toPersianDigits(hours)} ساعت و ${toPersianDigits(minsRem)} دقیقه`
      : `${toPersianDigits(minutes)} دقیقه`

  const isUp = summary.vsLastWeekPct >= 0
  const pct = Math.abs(summary.vsLastWeekPct)

  // Motivational message
  const motivation =
    summary.pagesRead === 0
      ? 'این هفته هنوز شروعی نکرده‌اید — همین حالا یک کتاب باز کنید!'
      : pct >= 50
        ? 'پیشرفت فوق‌العاده! این هفته را پررنگ ببندید.'
        : isUp
          ? 'خوب پیش می‌روید — همین روند را حفظ کنید.'
          : 'نسبت به هفته قبل کمی کوتاهی کردید؛ امروز یک قدم بردارید.'

  const cards = [
    {
      icon: BookOpen,
      label: 'صفحات این هفته',
      value: toPersianDigits(summary.pagesRead),
      hint: 'صفحه',
      gradient: 'from-gold-400 to-amber-500',
    },
    {
      icon: Clock,
      label: 'زمان مطالعه',
      value: timeLabel,
      hint: 'در ۷ روز اخیر',
      gradient: 'from-emerald-400 to-teal-500',
    },
    {
      icon: BookOpen,
      label: 'کتاب‌های لمس‌شده',
      value: toPersianDigits(summary.booksTouched),
      hint: 'کتاب متفاوت',
      gradient: 'from-rose-400 to-orange-500',
    },
    {
      icon: TrendingUp,
      label: 'میانگین روزانه',
      value: toPersianDigits(summary.avgPagesPerDay),
      hint: 'صفحه در روز',
      gradient: 'from-amber-400 to-yellow-500',
    },
  ]

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.42, duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card to-gold-500/5 p-5 shadow-sm sm:p-6"
      aria-label="خلاصه هفتگی"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/15 text-gold-700 dark:text-gold-400">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold leading-tight sm:text-xl">
              خلاصه این هفته
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              ۷ روز اخیر در برابر هفته قبل
            </p>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold',
            isUp
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
              : 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
          )}
        >
          {isUp ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
          {toPersianDigits(pct)}٪ نسبت به هفته قبل
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c, i) => {
          const Icon = c.icon
          return (
            <motion.div
              key={c.label}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              className="rounded-xl border border-border/50 bg-background/40 p-3"
            >
              <div
                className={cn(
                  'mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm',
                  c.gradient,
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="text-base font-extrabold tabular-nums leading-none sm:text-lg">
                {c.value}
              </div>
              <div className="mt-1 text-[11px] font-medium text-foreground/80">
                {c.label}
              </div>
              <div className="text-[10px] text-muted-foreground">{c.hint}</div>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-4 rounded-xl bg-gold-500/5 px-4 py-2.5 text-center text-xs font-medium text-foreground/80">
        {motivation}
      </div>
    </motion.section>
  )
}

/* ------------------------------------------------------------------ */
/*  Shared empty state                                                 */
/* ------------------------------------------------------------------ */

function EmptyChartState({
  icon: Icon,
  title,
  hint,
}: {
  icon: LucideIcon
  title: string
  hint: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="max-w-md text-xs text-muted-foreground">{hint}</p>
      <Button asChild variant="glow" size="sm" className="mt-3 gap-1.5">
        <Link href="/library">
          <BookOpen className="h-3.5 w-3.5" />
          شروع مطالعه
        </Link>
      </Button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */

function GoalsSkeleton() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-20 w-20 rounded-full" />
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 w-full rounded-2xl" />
      <Skeleton className="h-80 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main page client                                                   */
/* ------------------------------------------------------------------ */

export function GoalsPageClient() {
  const { toPersianDigits } = usePersianLocale()
  const streakHook = useReadingStreak()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [goals, setGoals] = useState<GoalsConfig>(DEFAULT_GOALS)
  const [payload, setPayload] = useState<GoalsProgressPayload | null>(null)
  const [history, setHistory] = useState<ReadingHistoryDay[]>([])
  const [milestoneUnlockedAt, setMilestoneUnlockedAt] = useState<
    Record<string, string>
  >({})
  const initialLoadRef = useRef(true)

  /** Fetch the server-side payload (milestones + stats + initial goals). */
  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch('/api/goals', { cache: 'no-store' })
      if (!res.ok) throw new Error('fetch failed')
      const data = (await res.json()) as ApiResponse
      if (data.error) {
        setError(data.error)
      }
      setGoals(data.goals ?? DEFAULT_GOALS)
      setPayload({
        daily: data.daily,
        weekly: data.weekly,
        monthly: data.monthly,
        velocity: data.velocity,
        avgPagesPerDay: data.avgPagesPerDay,
        bestDayPages: data.bestDayPages,
        bestDayDate: data.bestDayDate,
        timeDistribution: data.timeDistribution,
        bestHour: data.bestHour,
        streak: data.streak,
        milestones: data.milestones,
        weeklySummary: data.weeklySummary,
        stats: data.stats,
      })
    } catch (err) {
      console.error('[goals] fetch failed:', err)
      setError('بارگذاری اهداف ناموفق بود. لطفاً دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * After the server payload arrives, load the localStorage-backed reading
   * history + streak data and re-derive everything the server couldn't see.
   */
  const refreshFromLocal = useCallback(() => {
    if (typeof window === 'undefined') return
    const localHistory = readReadingHistory()
    setHistory(localHistory)

    // Load the per-id milestone unlockedAt map.
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.goalsMilestones)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          setMilestoneUnlockedAt(parsed as Record<string, string>)
        }
      }
    } catch {
      /* ignore */
    }

    setPayload((prev) => {
      if (!prev) return prev
      const progress = computeGoalProgress(goals, localHistory)
      const velocity = computeVelocity(localHistory, 14)
      const last7 = velocity.slice(-7)
      const avgPagesPerDay =
        last7.length > 0
          ? Math.round(last7.reduce((s, v) => s + v.pages, 0) / last7.length)
          : 0
      const bestEntry = velocity.reduce(
        (best, v) => (v.pages > best.pages ? v : best),
        velocity[0] ?? { date: '', label: '', pages: 0, isToday: false },
      )
      const timeDistribution = computeTimeDistribution(localHistory)
      const bestHour = computeBestHour(timeDistribution)
      const streak = {
        current: streakHook.data.currentStreak,
        longest: streakHook.data.longestStreak,
        totalReadingDays: streakHook.data.totalReadingDays,
      }
      // Re-derive milestones with the local stats merged.
      // `computeMilestones` now takes the defs as its first arg (the legacy
      // module-level `MILESTONE_DEFS` constant has been deleted — the DB is
      // the source of truth). We use `prev.milestones` (the API response's
      // `milestones` field, an `MilestoneState[]` extending `MilestoneDef[]`)
      // as the defs source — recomputing against fresh stats will refresh
      // each row's `progress` / `unlocked` / `pct` fields.
      const milestones = computeMilestones(
        prev.milestones,
        {
          pagesRead: Math.max(prev.stats.pagesRead, localHistory.reduce((s, h) => s + h.pages, 0)),
          booksCompleted: prev.stats.booksCompleted,
          streakDays: streak.current,
          longestStreak: streak.longest,
          readingDays: streak.totalReadingDays,
          vocabCount: prev.stats.vocabCount,
          level: prev.stats.level,
          unlockedAtMap: milestoneUnlockedAtRef.current,
        },
      )
      const progressMap = getLocalProgress()
      const weeklySummary = computeWeeklySummary(localHistory, progressMap)
      return {
        ...prev,
        daily: progress.daily,
        weekly: progress.weekly,
        monthly: progress.monthly,
        velocity,
        avgPagesPerDay,
        bestDayPages: bestEntry?.pages ?? 0,
        bestDayDate: bestEntry?.date ?? '',
        timeDistribution,
        bestHour,
        streak,
        milestones,
        weeklySummary,
      }
    })
  }, [goals, streakHook.data])

  // Keep a ref to the milestone map so refreshFromLocal always reads the
  // latest snapshot without re-subscribing.
  const milestoneUnlockedAtRef = useRef(milestoneUnlockedAt)
  useEffect(() => {
    milestoneUnlockedAtRef.current = milestoneUnlockedAt
  }, [milestoneUnlockedAt])

  // Initial fetch.
  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  // After first fetch + on localStorage changes, refresh from local.
  useEffect(() => {
    if (!payload) return
    refreshFromLocal()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `payload` is intentionally omitted: we only want to refire when its derived stats change, not when the payload object reference itself changes.
  }, [payload?.stats, streakHook.data.currentStreak, streakHook.data.longestStreak, refreshFromLocal])

  // Cross-tab sync — listen for storage events on the goals + history keys.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === STORAGE_KEYS.goals ||
        e.key === STORAGE_KEYS.readingHistory ||
        e.key === STORAGE_KEYS.streak ||
        e.key === STORAGE_KEYS.progress ||
        e.key === STORAGE_KEYS.goalsMilestones
      ) {
        refreshFromLocal()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [refreshFromLocal])

  // Persist newly-unlocked milestones.
  useEffect(() => {
    if (!payload?.milestones) return
    const newlyUnlocked = payload.milestones.filter(
      (m) => m.unlocked && !milestoneUnlockedAt[m.id],
    )
    if (newlyUnlocked.length === 0) return
    const today = toISODate(new Date())
    const next = { ...milestoneUnlockedAt }
    let changed = false
    for (const m of newlyUnlocked) {
      if (!next[m.id]) {
        next[m.id] = today
        changed = true
        toast.success(`🎉 دستاورد باز شد: ${m.title}`, {
          description: m.description,
        })
      }
    }
    if (changed) {
      setMilestoneUnlockedAt(next)
      try {
        localStorage.setItem(
          STORAGE_KEYS.goalsMilestones,
          JSON.stringify(next),
        )
      } catch {
        /* ignore */
      }
    }
  }, [payload?.milestones, milestoneUnlockedAt])

  /** Update a single goal period and persist to localStorage + POST to API. */
  const updateGoal = useCallback(
    async (period: GoalPeriod, next: GoalConfig) => {
      const updated = { ...goals, [period]: next }
      setGoals(updated)
      try {
        localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(updated))
      } catch {
        /* ignore */
      }
      // Optimistically re-derive progress with the new goal.
      const localHistory = readReadingHistory()
      const progress = computeGoalProgress(updated, localHistory)
      setPayload((prev) =>
        prev
          ? {
              ...prev,
              daily: progress.daily,
              weekly: progress.weekly,
              monthly: progress.monthly,
            }
          : prev,
      )
      // Persist to the server (best-effort validation).
      try {
        await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goals: updated }),
        })
      } catch {
        /* the API is best-effort; localStorage is the source of truth */
      }
      toast.success(`هدف ${PERIOD_LABELS[period]} به‌روزرسانی شد`)
    },
    [goals],
  )

  /** Reset a goal to its default target (preserves unit). */
  const resetGoal = useCallback(
    (period: GoalPeriod) => {
      const next = DEFAULT_GOALS[period]
      updateGoal(period, next)
      toast.info(`هدف ${PERIOD_LABELS[period]} به حالت پیش‌فرض بازنشانی شد`)
    },
    [updateGoal],
  )

  /** Load saved goals from localStorage on first mount. */
  useEffect(() => {
    if (!initialLoadRef.current) return
    initialLoadRef.current = false
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.goals)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          setGoals({
            daily: { ...DEFAULT_GOALS.daily, ...parsed.daily },
            weekly: { ...DEFAULT_GOALS.weekly, ...parsed.weekly },
            monthly: { ...DEFAULT_GOALS.monthly, ...parsed.monthly },
          })
        }
      }
    } catch {
      /* ignore */
    }
  }, [])

  // ── Derived display values ──────────────────────────────────────────
  const nextMilestone = useMemo(() => {
    if (!payload?.milestones) return null
    const locked = payload.milestones.filter((m) => !m.unlocked)
    if (locked.length === 0) return null
    return locked.reduce((best, m) =>
      m.pct > best.pct ? m : best,
    )
  }, [payload?.milestones])

  // ── Loading state ───────────────────────────────────────────────────
  if (loading || !payload) {
    return (
      <div className="space-y-6">
        <GoalsSkeleton />
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            <Target className="h-7 w-7 text-gold-600 dark:text-gold-400" aria-hidden />
            اهداف و آمار مطالعه
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            اهداف روزانه، هفتگی و ماهانه خود را تنظیم کنید، پیشرفتتان را در
            نمودارها و تقویم استمرار دنبال کنید و نقاط عطف مطالعه را جشن بگیرید.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-md shadow-gold-500/30">
            <Flame className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <div className="text-xl font-extrabold tabular-nums text-gold-600 dark:text-gold-400">
              {toPersianDigits(streakHook.data.currentStreak)} روز
            </div>
            <div className="text-[11px] text-muted-foreground">زنجیره فعلی</div>
          </div>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-400"
        >
          {error}
        </div>
      )}

      {/* ── Section 1: Goal setup cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GoalSetupCard
          period="daily"
          goal={goals.daily}
          progress={payload.daily}
          index={0}
          onEdit={(next) => updateGoal('daily', next)}
          onReset={() => resetGoal('daily')}
        />
        <GoalSetupCard
          period="weekly"
          goal={goals.weekly}
          progress={payload.weekly}
          index={1}
          onEdit={(next) => updateGoal('weekly', next)}
          onReset={() => resetGoal('weekly')}
        />
        <GoalSetupCard
          period="monthly"
          goal={goals.monthly}
          progress={payload.monthly}
          index={2}
          onEdit={(next) => updateGoal('monthly', next)}
          onReset={() => resetGoal('monthly')}
        />
      </div>

      {/* ── Section 2: Velocity chart ────────────────────────────────── */}
      <VelocityChartCard
        velocity={payload.velocity}
        avgPagesPerDay={payload.avgPagesPerDay}
        bestDayPages={payload.bestDayPages}
        bestDayDate={payload.bestDayDate}
        dailyTarget={goals.daily.unit === 'pages' ? goals.daily.target : 0}
      />

      {/* ── Section 3: Streak calendar ───────────────────────────────── */}
      <StreakCalendarCard
        history={history}
        currentStreak={payload.streak.current}
        longestStreak={payload.streak.longest}
      />

      {/* ── Sections 4 & 5 side-by-side on lg ────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TimeDistributionCard
          distribution={payload.timeDistribution}
          bestHour={payload.bestHour}
        />
        <MilestonesTimelineCard
          milestones={payload.milestones}
          nextMilestone={nextMilestone}
        />
      </div>

      {/* ── Section 6: Weekly summary ───────────────────────────────── */}
      <WeeklySummaryCard summary={payload.weeklySummary} />

      {/* ── Footer link back to dashboard ────────────────────────────── */}
      <div className="flex items-center justify-center pt-2">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/dashboard">
            <Sparkles className="h-4 w-4" />
            بازگشت به داشبورد
          </Link>
        </Button>
      </div>

      {/* SR-only live region announcing unlocked milestone count */}
      <p className="sr-only" aria-live="polite">
        {payload.milestones.filter((m) => m.unlocked).length} نقطه عطف از{' '}
        {payload.milestones.length} باز شده است.
      </p>
    </div>
  )
}
