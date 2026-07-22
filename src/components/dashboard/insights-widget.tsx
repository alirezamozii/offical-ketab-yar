'use client'

import {
  BookMarked,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  Sparkles,
  Sunrise,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { motion, useReducedMotion } from 'framer-motion'
import { getLocalProgress, type ProgressMap } from '@/hooks/reader/use-local-progress'
import { useReadingStreak } from '@/hooks/reader/use-reading-streak'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { cn } from '@/lib/utils'

interface Insights {
  booksStarted: number
  booksCompleted: number
  booksInProgress: number
  totalPagesRead: number
  avgPagesPerActiveDay: number
  bestDayLabel: string
  totalReadingDays: number
  todayMinutes: number
  /** best time-of-day bucket from today's start hour */
  bestTimeLabel: string
}

const DAY_NAMES = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']
const WEEKDAY_SHORT = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش']

function computeInsights(
  progress: ProgressMap,
  activeDays: string[],
  todaySeconds: number,
  todayStartedAt: number | null,
): Insights {
  const entries = Object.values(progress)
  const booksStarted = entries.length
  const booksCompleted = entries.filter((e) => e.percent >= 100).length
  const booksInProgress = entries.filter((e) => e.percent > 0 && e.percent < 100).length
  const totalPagesRead = entries.reduce(
    (s, e) => s + Math.round((e.percent / 100) * e.totalPages),
    0,
  )
  const totalReadingDays = activeDays.length
  const avgPagesPerActiveDay =
    totalReadingDays > 0 ? Math.round(totalPagesRead / totalReadingDays) : 0

  const weekdayCount = new Array(7).fill(0)
  for (const d of activeDays) {
    const date = new Date(d)
    if (!isNaN(date.getTime())) weekdayCount[date.getDay()]++
  }
  let bestDayIdx = 0
  for (let i = 1; i < 7; i++)
    if (weekdayCount[i] > weekdayCount[bestDayIdx]) bestDayIdx = i
  const bestDayLabel = totalReadingDays > 0 ? DAY_NAMES[bestDayIdx] : '—'

  // Best time-of-day bucket — derive from session start (if any).
  let bestTimeLabel = 'عصر'
  if (todayStartedAt) {
    const h = new Date(todayStartedAt).getHours()
    if (h < 12) bestTimeLabel = 'صبح'
    else if (h < 17) bestTimeLabel = 'بعدازظهر'
    else if (h < 21) bestTimeLabel = 'عصر'
    else bestTimeLabel = 'شب'
  }

  return {
    booksStarted,
    booksCompleted,
    booksInProgress,
    totalPagesRead,
    avgPagesPerActiveDay,
    bestDayLabel,
    totalReadingDays,
    todayMinutes: Math.floor(todaySeconds / 60),
    bestTimeLabel,
  }
}

interface InsightsWidgetProps {
  /** Saved vocabulary count — passed from the dashboard so we don't double-fetch. */
  vocabCount?: number
}

interface TrendPoint {
  day: string
  label: string
  /** reading intensity 0–100 (active days = 100, today = goal-progress %, inactive = 0) */
  value: number
  active: boolean
  isToday: boolean
}

function buildTrend(
  activeDays: string[],
  todaySeconds: number,
  dailyGoalSeconds: number,
): TrendPoint[] {
  const DAY = 24 * 60 * 60 * 1000
  const today = new Date()
  const activeSet = new Set(activeDays)
  const points: TrendPoint[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`
    const isToday = i === 0
    const active = activeSet.has(key)
    const value = isToday
      ? Math.min(100, Math.round((todaySeconds / Math.max(1, dailyGoalSeconds)) * 100))
      : active
        ? 100
        : 0
    points.push({
      day: key,
      label: WEEKDAY_SHORT[d.getDay()],
      value,
      active,
      isToday,
    })
  }
  return points
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: TrendPoint }> }) {
  const { toPersianDigits } = usePersianLocale()
  if (!active || !payload || !payload.length) return null
  const p = payload[0].payload as TrendPoint
  return (
    <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <div className="font-bold">{p.isToday ? 'امروز' : 'روز گذشته'}</div>
      <div className="mt-0.5 text-muted-foreground">
        {p.active || p.isToday
          ? `${toPersianDigits(p.value)}٪ فعالیت`
          : 'بدون فعالیت'}
      </div>
    </div>
  )
}

/**
 * Premium insights widget — 7-day reading-trend area chart + KPI grid +
 * three derived insight chips. Stateless header (no <section>/<h2>) so
 * it can sit inside a `DashboardSection` or alongside other stat cards.
 */
export function InsightsWidget({ vocabCount = 0 }: InsightsWidgetProps) {
  const { data } = useReadingStreak()
  const { toPersianDigits } = usePersianLocale()
  const [insights, setInsights] = useState<Insights | null>(null)
  const reduceMotion = useReducedMotion()

  const trend = useMemo(
    () =>
      buildTrend(data.activeDays, data.todaySeconds, data.dailyGoalSeconds),
    [data.activeDays, data.todaySeconds, data.dailyGoalSeconds],
  )

  useEffect(() => {
    const progress = getLocalProgress()
    setInsights(
      computeInsights(progress, data.activeDays, data.todaySeconds, data.todayStartedAt),
    )
  }, [data.activeDays, data.todaySeconds, data.todayStartedAt])

  if (!insights) return null

  const cards = [
    {
      icon: BookOpen,
      label: 'در حال مطالعه',
      value: toPersianDigits(insights.booksInProgress),
      gradient: 'from-amber-400 to-orange-500',
      hint: 'کتاب ناتمام',
    },
    {
      icon: CheckCircle2,
      label: 'کتاب تمام‌شده',
      value: toPersianDigits(insights.booksCompleted),
      gradient: 'from-emerald-400 to-teal-500',
      hint: 'تا انتها خوانده‌شده',
    },
    {
      icon: TrendingUp,
      label: 'صفحات خوانده‌شده',
      value: toPersianDigits(insights.totalPagesRead),
      gradient: 'from-gold-400 to-amber-500',
      hint: 'در کل کتاب‌ها',
    },
    {
      icon: BookMarked,
      label: 'واژگان ذخیره‌شده',
      value: toPersianDigits(vocabCount),
      gradient: 'from-rose-400 to-orange-500',
      hint: 'در واژه‌نامه',
    },
  ]

  const insightChips = [
    {
      icon: TrendingUp,
      label: 'میانگین روزانه',
      value: `${toPersianDigits(insights.avgPagesPerActiveDay)} صفحه`,
      sub: 'در روز فعال',
    },
    {
      icon: Flame,
      label: 'بهترین روز مطالعه',
      value: insights.bestDayLabel,
      sub: 'بیشترین فعالیت',
    },
    {
      icon: Sunrise,
      label: 'بهترین زمان مطالعه',
      value: insights.bestTimeLabel,
      sub: 'بر اساس امروز',
    },
    {
      icon: Clock,
      label: 'زمان امروز',
      value: `${toPersianDigits(insights.todayMinutes)} دقیقه`,
      sub: 'در این جلسه',
    },
  ]

  const fadeUp = reduceMotion
    ? { initial: false, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

  return (
    <motion.section
      {...fadeUp}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6"
      aria-label="نمودار و آمار هفتگی"
    >
      {/* header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/15 text-gold-700 dark:text-gold-400">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold leading-tight sm:text-xl">
              آمار و بینش‌ها
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              روند مطالعه هفتگی شما
            </p>
          </div>
        </div>
        <span className="rounded-full bg-gold-500/15 px-3 py-1 text-xs font-bold text-gold-700 dark:text-gold-400">
          ۷ روز اخیر
        </span>
      </div>

      {/* trend chart */}
      <div className="relative h-44 w-full sm:h-52" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={trend}
            margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient id="insightsTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(38 75% 55%)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="hsl(32 70% 45%)" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="insightsStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(38 70% 60%)" />
                <stop offset="100%" stopColor="hsl(28 75% 50%)" />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'currentColor' }}
              tickLine={false}
              axisLine={false}
              dy={6}
            />
            <YAxis hide domain={[0, 100]} />
            <RTooltip
              cursor={{ stroke: 'hsl(38 70% 55%)', strokeWidth: 1, strokeDasharray: '3 3' }}
              content={<ChartTooltip />}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="url(#insightsStroke)"
              strokeWidth={2.5}
              fill="url(#insightsTrend)"
              dot={{ r: 3, fill: 'hsl(38 70% 55%)', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: 'hsl(28 75% 50%)', stroke: 'white', strokeWidth: 2 }}
              isAnimationActive={!reduceMotion}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* KPI grid */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c, i) => {
          const Icon = c.icon
          return (
            <motion.div
              key={c.label}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-xl border border-border/60 bg-background/40 p-3"
            >
              <div
                className={cn(
                  'mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm',
                  c.gradient,
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="text-lg font-extrabold tabular-nums leading-none">
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

      {/* Insight chips row */}
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/50 pt-4 lg:grid-cols-4">
        {insightChips.map((c) => {
          const Icon = c.icon
          return (
            <div
              key={c.label}
              className="flex items-center gap-2.5 rounded-xl bg-gold-500/5 p-2.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-500/15 text-gold-700 dark:text-gold-400">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">{c.value}</div>
                <div className="truncate text-[10px] text-muted-foreground">
                  {c.label} · {c.sub}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </motion.section>
  )
}
