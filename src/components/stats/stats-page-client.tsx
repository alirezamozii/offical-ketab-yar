'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Area,
  AreaChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import {
  BookOpen,
  CalendarDays,
  Clock,
  Crown,
  Flame,
  Gamepad2,
  Library,
  Medal,
  Share2,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Type,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { getLocalProgress } from '@/hooks/reader/use-local-progress'
import { useReadingStreak } from '@/hooks/reader/use-reading-streak'
import {
  RARITY_LABELS,
  RARITY_STYLES,
  computeAchievementStates,
  type AchievementDef,
  type AchievementState,
} from '@/lib/achievements'
import {
  WEEKDAY_LABELS_FA,
  WEEKDAY_INITIALS_FA,
  aggregateReadingHistory,
  buildVocabGrowth,
  classifyPersonality,
  computeConsistencyScore,
  pickRarestAchievement,
  type StatsPayload,
  type ReadingHistoryDay,
  type BookJourneyEntry,
  type GenreStat,
  type AuthorStat,
} from '@/lib/stats-data'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { ShareCard } from '@/components/stats/share-card'
import { cn } from '@/lib/utils'
import type { BookListItem } from '@/lib/data'

/* ------------------------------------------------------------------ */
/*  Types & helpers                                                    */
/* ------------------------------------------------------------------ */

interface BookMeta {
  slug: string
  title: string
  author: string
  coverFrom: string
  coverTo: string
  coverAccent: string
  genres: string[]
  pageCount: number
}

/** Pick a time-of-day Persian label for a 0..23 hour. */
function timeOfDayLabel(hour: number): string {
  if (hour >= 5 && hour < 12) return 'صبح'
  if (hour >= 12 && hour < 17) return 'بعدازظهر'
  if (hour >= 17 && hour < 21) return 'عصر'
  return 'شب'
}

/* ------------------------------------------------------------------ */
/*  CountUp hook — animated number that counts up to target.           */
/* ------------------------------------------------------------------ */

function useCountUp(target: number, durationMs = 1200, deps: unknown[] = []): number {
  const reduceMotion = useReducedMotion()
  const [value, setValue] = useState(0)
  const fromRef = useRef(0)
  const targetRef = useRef(target)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    targetRef.current = target
    if (reduceMotion) {
      setValue(target)
      fromRef.current = target
      return
    }
    const from = fromRef.current
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      const next = Math.round(from + (target - from) * eased)
      setValue(next)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      fromRef.current = targetRef.current
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `...deps` is a passthrough of caller-supplied dependencies; the spread can't be statically analyzed but is intentional.
  }, [target, durationMs, reduceMotion, ...deps])

  return value
}

/* ------------------------------------------------------------------ */
/*  Scene section wrapper — consistent card + heading styling.         */
/* ------------------------------------------------------------------ */

function SceneSection({
  index,
  title,
  subtitle,
  icon: Icon,
  accentClass = 'from-gold-400 to-amber-600',
  children,
  ariaLabel,
}: {
  index: number
  title: string
  subtitle?: string
  icon: LucideIcon
  accentClass?: string
  children: React.ReactNode
  ariaLabel: string
}) {
  const reduceMotion = useReducedMotion()
  const enter: Variants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0 },
      }
  return (
    <motion.section
      aria-label={ariaLabel}
      variants={enter}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-7"
    >
      {/* Ambient accent glow */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br opacity-20 blur-3xl',
          accentClass,
        )}
      />
      <header className="relative mb-5 flex items-start gap-3">
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg',
            accentClass,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </header>
      <div className="relative">{children}</div>
    </motion.section>
  )
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyState({ message, cta = true }: { message: string; cta?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/30 px-4 py-10 text-center">
      <Sparkles className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {cta && (
        <Button asChild variant="glow" size="sm" className="gap-1.5">
          <Link href="/library">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            شروع مطالعه
          </Link>
        </Button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Scene 1: Hero                                                      */
/* ------------------------------------------------------------------ */

function HeroScene({ payload }: { payload: StatsPayload }) {
  const reduceMotion = useReducedMotion()
  const { formatNumber, toPersianDigits } = usePersianLocale()
  const pagesCount = useCountUp(payload.totals.totalPages, 1500, [payload.totals.totalPages])

  // Animated gradient background — slowly rotates between 3 gold/amber stops.
  const gradientClass = payload.totals.totalPages > 0
    ? 'from-gold-500/20 via-amber-500/10 to-rose-500/10'
    : 'from-stone-500/10 via-stone-600/5 to-stone-700/10'

  return (
    <motion.section
      aria-label="خلاصه‌ی سال شما"
      initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative overflow-hidden rounded-3xl border border-gold-500/30 bg-gradient-to-br p-8 sm:p-12',
        gradientClass,
      )}
    >
      {/* Animated ambient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold-500/20 blur-3xl"
        style={{
          animation: reduceMotion ? undefined : 'pulse 6s ease-in-out infinite',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-rose-500/15 blur-3xl"
        style={{
          animation: reduceMotion ? undefined : 'pulse 8s ease-in-out infinite 1s',
        }}
      />

      <div className="relative space-y-5">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-700 dark:text-gold-300">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          مرور سال شما
        </div>

        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
          سال شما در کتاب‌ها
        </h1>

        {/* Big pages count */}
        <div>
          <div
            className="bg-gradient-to-br from-gold-400 via-amber-500 to-rose-500 bg-clip-text text-6xl font-black tabular-nums text-transparent sm:text-7xl"
            dir="ltr"
            aria-label={`${formatNumber(payload.totals.totalPages)} صفحه`}
          >
            {formatNumber(pagesCount)}
          </div>
          <p className="mt-1 text-base text-muted-foreground sm:text-lg">صفحه خوانده‌شده</p>
        </div>

        {/* Inline KPIs */}
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-1.5 backdrop-blur">
            <BookOpen className="h-4 w-4 text-gold-500" aria-hidden="true" />
            {toPersianDigits(payload.totals.booksCompleted)} کتاب
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-1.5 backdrop-blur">
            <Type className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            {formatNumber(payload.totals.totalPages)} صفحه
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-1.5 backdrop-blur">
            <Clock className="h-4 w-4 text-rose-500" aria-hidden="true" />
            {formatNumber(payload.totals.totalReadingMinutes)} دقیقه
          </span>
        </div>

        {/* Sub-stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'سطح', value: toPersianDigits(payload.totals.level), icon: Zap, color: 'text-gold-500' },
            { label: 'استمرار فعلی', value: toPersianDigits(payload.streak.current), icon: Flame, color: 'text-rose-500' },
            { label: 'واژه‌ها', value: formatNumber(payload.totals.vocabCount), icon: Type, color: 'text-emerald-500' },
            { label: 'دستاوردها', value: `${toPersianDigits(payload.achievements.unlocked)} / ${toPersianDigits(payload.achievements.total)}`, icon: Trophy, color: 'text-amber-500' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border/50 bg-card/60 p-3 backdrop-blur"
            >
              <div className="flex items-center gap-1.5">
                <s.icon className={cn('h-3.5 w-3.5', s.color)} aria-hidden="true" />
                <span className="text-[11px] font-medium text-muted-foreground">{s.label}</span>
              </div>
              <div className="mt-1 text-lg font-extrabold tabular-nums text-foreground">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="glow" size="sm" className="gap-1.5">
            <Link href="/library">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              ادامه مطالعه
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <Link href="/goals">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              مشاهده اهداف
            </Link>
          </Button>
        </div>
      </div>
    </motion.section>
  )
}

/* ------------------------------------------------------------------ */
/*  Scene 2: Top genres                                                */
/* ------------------------------------------------------------------ */

function TopGenresScene({ genres }: { genres: GenreStat[] }) {
  const { toPersianDigits, formatNumber } = usePersianLocale()
  if (genres.length === 0) {
    return <EmptyState message="هنوز ژانری برای نمایش وجود ندارد. با شروع اولین کتاب، ژانرهای محبوب شما اینجا ظاهر می‌شوند." />
  }
  const max = Math.max(1, ...genres.map((g) => g.count))
  return (
    <div className="space-y-4">
      {genres.map((g, i) => (
        <div key={g.name} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-semibold text-foreground">
              <span className="text-xs font-bold text-muted-foreground">{toPersianDigits(i + 1)}</span>
              {g.name}
              {i === 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-bold text-gold-700 dark:text-gold-300">
                  <Crown className="h-3 w-3" aria-hidden="true" />
                  قهرمان ژانر
                </span>
              )}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {toPersianDigits(g.count)} کتاب · {formatNumber(g.pages)} صفحه
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className={cn('h-full rounded-full bg-gradient-to-l', i === 0 ? 'from-gold-400 to-amber-600' : i === 1 ? 'from-emerald-400 to-teal-600' : 'from-rose-400 to-red-500')}
              initial={{ width: 0 }}
              whileInView={{ width: `${(g.count / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Scene 3: Reading streak                                            */
/* ------------------------------------------------------------------ */

function StreakScene({ payload }: { payload: StatsPayload }) {
  const reduceMotion = useReducedMotion()
  const { toPersianDigits } = usePersianLocale()
  const longest = payload.streak.longest
  const current = payload.streak.current
  const totalDays = payload.streak.totalReadingDays

  if (longest === 0 && current === 0) {
    return <EmptyState message="هنوز زنجیره استمراری ثبت نشده. با خواندن روزانه، زنجیره شما شکل می‌گیرد." />
  }

  // Mini 12-week timeline (use the streak hook's heatmap data — but since we
  // only have payload here, build a simple linear visualization from current
  // vs longest instead, with a "now" indicator).
  const ratio = longest > 0 ? Math.min(1, current / longest) : 0

  return (
    <div className="space-y-6">
      {/* Big flame + longest streak */}
      <div className="flex items-center justify-center gap-4">
        <motion.div
          aria-hidden
          animate={reduceMotion ? undefined : { scale: [1, 1.08, 1], rotate: [0, -2, 2, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 via-amber-400 to-rose-500 text-5xl shadow-xl shadow-rose-500/30"
        >
          🔥
        </motion.div>
        <div>
          <div className="text-5xl font-black tabular-nums text-rose-500" dir="ltr">
            {toPersianDigits(longest)}
          </div>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            روز — طولانی‌ترین استمرار
          </p>
        </div>
      </div>

      {/* Current vs longest bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">
            زنجیره فعلی: {toPersianDigits(current)} روز
          </span>
          <span className="text-muted-foreground">
            مجموع روزهای مطالعه: {toPersianDigits(totalDays)}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-gradient-to-l from-rose-400 to-amber-500"
            initial={{ width: 0 }}
            whileInView={{ width: `${Math.max(2, ratio * 100)}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <p className="text-center text-[11px] text-muted-foreground">
          {current === longest && longest > 0
            ? '🎉 شما در بهترین دوران استمرار خود هستید!'
            : current > 0
              ? `نزدیک به رکوردتان: ${toPersianDigits(longest - current)} روز دیگر`
              : 'برای شروع زنجیره جدید، امروز بخوانید'}
        </p>
      </div>

      {/* Timeline markers */}
      <div className="flex items-center justify-between gap-2 rounded-2xl bg-muted/40 p-3 text-center">
        <div>
          <div className="text-lg font-extrabold text-foreground">{toPersianDigits(current)}</div>
          <div className="text-[10px] text-muted-foreground">روز فعلی</div>
        </div>
        <div className="text-muted-foreground">→</div>
        <div>
          <div className="text-lg font-extrabold text-foreground">{toPersianDigits(longest)}</div>
          <div className="text-[10px] text-muted-foreground">رکورد</div>
        </div>
        <div className="text-muted-foreground">→</div>
        <div>
          <div className="text-lg font-extrabold text-foreground">{toPersianDigits(totalDays)}</div>
          <div className="text-[10px] text-muted-foreground">مجموع</div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Scene 4: Reading rhythm — radar + compact heatmap                  */
/* ------------------------------------------------------------------ */

function ReadingRhythmScene({ payload }: { payload: StatsPayload }) {
  const reduceMotion = useReducedMotion()
  const { toPersianDigits } = usePersianLocale()
  const byDay = payload.readingByDayOfWeek
  const maxDay = Math.max(1, ...byDay.map((d) => d.minutes))

  const radarData = byDay.map((d, i) => ({
    day: WEEKDAY_INITIALS_FA[i],
    label: WEEKDAY_LABELS_FA[i],
    minutes: d.minutes,
    pct: maxDay > 0 ? Math.round((d.minutes / maxDay) * 100) : 0,
  }))

  const bestDayIdx = payload.bestDayOfWeek
  const bestDayLabel = bestDayIdx >= 0 ? WEEKDAY_LABELS_FA[bestDayIdx] : '—'

  // Compact 12-month heatmap — minutes per month.
  const months = payload.readingByMonth
  const maxMonth = Math.max(1, ...months.map((m) => m.minutes))

  const hasRhythm = byDay.some((d) => d.minutes > 0)

  return (
    <div className="space-y-5">
      {!hasRhythm ? (
        <EmptyState message="هنوز الگوی زمانی ثبت نشده. با چند روز مطالعه، الگوی هفتگی شما در این نمودار ظاهر می‌شود." cta={false} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              بیشتر در <span className="font-bold text-gold-600 dark:text-gold-400">{bestDayLabel}</span> می‌خوانید
            </p>
            {payload.bestHour >= 0 && (
              <p className="text-xs text-muted-foreground">
                ساعت محبوب: <span className="font-bold text-emerald-600 dark:text-emerald-400">{toPersianDigits(payload.bestHour)}:۰۰</span> ({timeOfDayLabel(payload.bestHour)})
              </p>
            )}
          </div>

          <div className="h-64" role="img" aria-label="نمودار راداری الگوی هفتگی مطالعه">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="day" tick={{ fontSize: 13, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} />
                <PolarRadiusAxis tick={false} axisLine={false} domain={[0, maxDay]} />
                <Radar
                  name="دقیقه"
                  dataKey="minutes"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="#fbbf24"
                  fillOpacity={0.5}
                  isAnimationActive={!reduceMotion}
                />
                <RTooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number, _name, p) => [
                    `${toPersianDigits(Math.round(Number(v)))} دقیقه`,
                    (p?.payload as { label?: string })?.label ?? '',
                  ]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Compact 12-month heatmap */}
      <div>
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          فعالیت ۱۲ ماه اخیر
        </p>
        <div className="flex gap-1" role="img" aria-label="نقشه‌حرارتی فعالیت ماهانه">
          {months.map((m) => {
            const intensity = m.minutes / maxMonth
            const bg =
              m.minutes === 0
                ? 'bg-muted'
                : intensity > 0.66
                  ? 'bg-gold-500'
                  : intensity > 0.33
                    ? 'bg-gold-400/80'
                    : 'bg-gold-300/60'
            return (
              <div
                key={m.key}
                title={`${m.label}: ${toPersianDigits(m.minutes)} دقیقه`}
                className={cn('h-8 flex-1 rounded-md transition-colors', bg)}
              />
            )
          })}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
          {months.filter((_, i) => i % 2 === 0).map((m) => (
            <span key={m.key}>{m.label.slice(0, 3)}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Scene 5: Book journey — horizontal scroll of covers                */
/* ------------------------------------------------------------------ */

function BookJourneyScene({ books }: { books: BookJourneyEntry[] }) {
  const { toPersianDigits } = usePersianLocale()
  if (books.length === 0) {
    return <EmptyState message="هنوز کتابی را همراه خود نداشته‌اید. اولین کتاب را پیدا کنید و سفر آغاز شود." />
  }
  const maxPages = Math.max(1, ...books.map((b) => b.pages))

  return (
    <div className="-mx-1 overflow-x-auto pb-2">
      <div className="flex gap-3 px-1" role="list">
        {books.map((b, i) => {
          // Scale cover height by pages read — 120px min, 200px max.
          const ratio = b.pages / maxPages
          const height = 120 + Math.round(ratio * 80)
          return (
            <motion.div
              key={b.slug}
              role="listitem"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.5) }}
              className="shrink-0"
            >
              <Link
                href={`/books/${b.slug}`}
                className="group block"
                aria-label={`کتاب ${b.title} از ${b.author}: ${toPersianDigits(b.pages)} صفحه خوانده‌شده`}
              >
                <div
                  className="relative overflow-hidden rounded-xl shadow-lg transition-transform group-hover:scale-105"
                  style={{
                    height: `${height}px`,
                    width: '112px',
                    background: `linear-gradient(150deg, ${b.coverFrom} 0%, ${b.coverTo} 100%)`,
                  }}
                >
                  {/* Spine */}
                  <div
                    aria-hidden
                    className="absolute inset-y-0 right-0 w-3"
                    style={{
                      background: 'linear-gradient(to left, rgba(0,0,0,0.5), transparent)',
                    }}
                  />
                  {/* Title overlay — EN·FA pill removed per user feedback */}
                  <div className="absolute inset-0 flex flex-col justify-end p-2.5">
                    <div>
                      <p
                        className="text-[11px] font-bold leading-tight line-clamp-3 text-white drop-shadow"
                        dir="ltr"
                      >
                        {b.title}
                      </p>
                      <p
                        className="mt-0.5 text-[9px] font-medium line-clamp-1"
                        style={{ color: b.coverAccent }}
                        dir="ltr"
                      >
                        {b.author}
                      </p>
                    </div>
                  </div>
                  {/* Pages read badge */}
                  <div className="absolute -bottom-2 -left-2 rounded-full bg-background px-2 py-1 text-[10px] font-bold text-foreground shadow-md">
                    {toPersianDigits(b.pages)} ص
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-gold-400 to-amber-600"
                    style={{ width: `${Math.min(100, b.percent)}%` }}
                  />
                </div>
                <p className="mt-1 text-center text-[10px] text-muted-foreground">
                  {toPersianDigits(Math.round(b.percent))}٪
                </p>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Scene 6: Vocabulary growth — line chart                            */
/* ------------------------------------------------------------------ */

function VocabGrowthScene({
  payload,
  gamesPlayed,
}: {
  payload: StatsPayload
  gamesPlayed: number
}) {
  const reduceMotion = useReducedMotion()
  const { toPersianDigits, formatNumber } = usePersianLocale()
  const data = payload.vocabGrowth

  return (
    <div className="space-y-5">
      {/* Stat row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-muted/40 p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <Type className="h-3 w-3" aria-hidden="true" />
            واژه
          </div>
          <div className="mt-1 text-xl font-extrabold text-emerald-500">
            {formatNumber(payload.totals.vocabCount)}
          </div>
        </div>
        <div className="rounded-2xl bg-muted/40 p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <Gamepad2 className="h-3 w-3" aria-hidden="true" />
            بازی
          </div>
          <div className="mt-1 text-xl font-extrabold text-gold-500">
            {toPersianDigits(gamesPlayed)}
          </div>
        </div>
        <div className="rounded-2xl bg-muted/40 p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <TrendingUp className="h-3 w-3" aria-hidden="true" />
            این هفته
          </div>
          <div className="mt-1 text-xl font-extrabold text-rose-500">
            {toPersianDigits(data.reduce((s, p) => s + p.reviewed, 0))}
          </div>
        </div>
      </div>

      {data.length === 0 || payload.totals.vocabCount === 0 ? (
        <EmptyState message="هنوز واژه‌ای ذخیره نشده. با اضافه کردن واژه‌های جدید، نمودار رشد شما شکل می‌گیرد." cta={false} />
      ) : (
        <div className="h-56" role="img" aria-label="نمودار رشد واژگان در ۱۴ روز اخیر">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="vocabGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v: string) => {
                  const d = new Date(v + 'T00:00:00')
                  return toPersianDigits(`${d.getDate()}/${d.getMonth() + 1}`)
                }}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v: number) => toPersianDigits(v)}
                width={32}
              />
              <RTooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelFormatter={(v: string) => {
                  const d = new Date(v + 'T00:00:00')
                  return toPersianDigits(`${d.getDate()}/${d.getMonth() + 1}`)
                }}
                formatter={(v: number) => [toPersianDigits(Number(v)), 'مجموع واژه‌ها']}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#vocabGrad)"
                isAnimationActive={!reduceMotion}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Scene 7: Achievements grid                                         */
/* ------------------------------------------------------------------ */

function AchievementsScene({
  achievements,
  rarest,
}: {
  achievements: AchievementState[]
  rarest: StatsPayload['achievements']['rarest']
}) {
  const unlocked = achievements.filter((a) => a.unlocked)

  if (unlocked.length === 0) {
    return <EmptyState message="هنوز دستاوردی باز نشده. با مطالعه و بازی، اولین دستاوردها روشن می‌شوند." cta={false} />
  }

  // Show up to 12 unlocked, sorted by rarity desc.
  const sorted = [...unlocked].sort((a, b) => {
    const order = { legendary: 3, epic: 2, rare: 1, common: 0 }
    return order[b.rarity] - order[a.rarity]
  })
  const shown = sorted.slice(0, 12)

  return (
    <div className="space-y-4">
      {/* Rarest highlight */}
      {rarest && (
        <div className="flex items-center gap-3 rounded-2xl border border-gold-500/30 bg-gradient-to-br from-gold-500/10 to-amber-600/5 p-4">
          <span
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl shadow-lg',
              RARITY_STYLES[rarest.rarity].border,
            )}
            aria-hidden
          >
            {rarest.icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gold-700 dark:text-gold-300">
                کمیاب‌ترین دستاورد شما
              </span>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', RARITY_STYLES[rarest.rarity].chipBg, RARITY_STYLES[rarest.rarity].text)}>
                {RARITY_LABELS[rarest.rarity]}
              </span>
            </div>
            <div className="mt-0.5 truncate font-bold text-foreground">{rarest.title}</div>
          </div>
          <Star className="h-5 w-5 shrink-0 text-gold-500" aria-hidden="true" />
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4" role="list">
        {shown.map((a, i) => (
          <motion.div
            key={a.id}
            role="listitem"
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
            className="group relative flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card p-3 text-center"
          >
            <span
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl shadow-md transition-transform group-hover:scale-110',
                a.color,
              )}
              aria-hidden
            >
              {a.icon}
            </span>
            <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-foreground">
              {a.title}
            </span>
            <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-bold', RARITY_STYLES[a.rarity].chipBg, RARITY_STYLES[a.rarity].text)}>
              {RARITY_LABELS[a.rarity]}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/achievements">
            <Medal className="h-4 w-4" aria-hidden="true" />
            مشاهده همه دستاوردها
          </Link>
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Scene 8: Reading personality                                       */
/* ------------------------------------------------------------------ */

function PersonalityScene({ payload }: { payload: StatsPayload }) {
  const reduceMotion = useReducedMotion()
  const p = payload.personality

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card to-muted/30 p-6">
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br opacity-25 blur-3xl',
          p.color,
        )}
      />
      <div className="relative flex items-center gap-4">
        <motion.span
          aria-hidden
          animate={reduceMotion ? undefined : { rotate: [0, -5, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className={cn(
            'flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br text-4xl shadow-xl',
            p.color,
          )}
        >
          {p.icon}
        </motion.span>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            شخصیت مطالعه‌ای شما
          </div>
          <div className="mt-0.5 text-2xl font-black text-foreground sm:text-3xl">
            {p.title}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {p.description}
          </p>
        </div>
      </div>
      {payload.totals.consistencyScore > 0 && (
        <div className="relative mt-5 border-t border-border/50 pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">امتیاز استمرار</span>
            <span className="font-bold text-gold-600 dark:text-gold-400">
              {payload.totals.consistencyScore} از ۱۰۰
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-to-l from-gold-400 to-amber-600"
              initial={{ width: 0 }}
              whileInView={{ width: `${payload.totals.consistencyScore}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function StatsPageClient() {
  const { toPersianDigits, formatNumber } = usePersianLocale()
  const [payload, setPayload] = useState<StatsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const streak = useReadingStreak()
  const shareCardRef = useRef<HTMLDivElement | null>(null)

  // Achievement defs fetched from /api/achievements (the DB is the source of
  // truth — the legacy `ACHIEVEMENT_DEFS` constant has been deleted). We
  // store them in a ref so the localStorage-override effect (which recomputes
  // achievement states after merging client-only stats) can call
  // `computeAchievementStates(defs, stats, map)` without re-fetching.
  const [achievementDefs, setAchievementDefs] = useState<AchievementDef[]>([])

  // ── Fetch /api/stats + /api/achievements on mount ──────────────────
  // The achievements fetch supplies the def list needed by the
  // localStorage-override effect below (replaces the legacy
  // `ACHIEVEMENT_DEFS` constant — the DB is now the source of truth).
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      fetch('/api/stats').then(async (r) => {
        if (!r.ok) throw new Error('failed')
        return (await r.json()) as StatsPayload
      }),
      fetch('/api/achievements', { cache: 'no-store' })
        .then(async (r) => {
          if (!r.ok) return []
          const json = (await r.json()) as { achievements?: AchievementState[] }
          return (json.achievements ?? []) as AchievementDef[]
        })
        .catch(() => [] as AchievementDef[]),
    ])
      .then(([data, defs]) => {
        if (cancelled) return
        setAchievementDefs(defs)
        setPayload(data)
        setError(data.error ?? null)
      })
      .catch((err) => {
        console.error('[StatsPageClient] fetch failed:', err)
        if (!cancelled) setError('بارگذاری آمار ناموفق بود.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // ── Override with localStorage data ─────────────────────────────────
  useEffect(() => {
    if (!payload) return

    let next: StatsPayload = { ...payload }

    // 1. Reading history → monthly / day-of-week / hour buckets.
    let maxDayPages = 0
    try {
      const rawHistory = localStorage.getItem(STORAGE_KEYS.readingHistory)
      if (rawHistory) {
        const parsed = JSON.parse(rawHistory) as ReadingHistoryDay[]
        if (Array.isArray(parsed)) {
          const history = parsed.filter(
            (d): d is ReadingHistoryDay =>
              d && typeof d.date === 'string' && typeof d.pages === 'number' && typeof d.seconds === 'number',
          )
          const agg = aggregateReadingHistory(history)
          maxDayPages = history.reduce((m, d) => Math.max(m, d.pages), 0)
          next = {
            ...next,
            readingByMonth: agg.byMonth,
            readingByDayOfWeek: agg.byDayOfWeek,
            readingByHour: agg.byHour,
            bestHour: agg.bestHour,
            bestDayOfWeek: agg.bestDayOfWeek,
            totals: {
              ...next.totals,
              totalReadingMinutes: agg.totalMinutes,
              avgPagesPerDay: agg.avgPagesPerDay30d,
            },
          }
        }
      }
    } catch {
      /* ignore */
    }

    // 2. Progress map + book metadata → top genres / authors / book journey.
    try {
      const progress = getLocalProgress()
      const slugs = Object.keys(progress)
      if (slugs.length > 0) {
        // Fetch book metadata for these slugs.
        fetch(`/api/books?slugs=${encodeURIComponent(slugs.join(','))}`)
          .then((r) => (r.ok ? r.json() : []))
          .then((books: BookListItem[] | { error?: string }) => {
            if (!Array.isArray(books)) return
            const booksMeta: BookMeta[] = books.map((b) => ({
              slug: b.slug,
              title: b.title,
              author: b.author,
              coverFrom: b.coverFrom,
              coverTo: b.coverTo,
              coverAccent: b.coverAccent,
              genres: b.genres ?? [],
              pageCount: b.pageCount ?? 0,
            }))
            const metaMap = new Map(booksMeta.map((b) => [b.slug, b]))
            setPayload((prev) =>
              prev
                ? {
                    ...prev,
                    ...computeBookDerivedStats(prev, progress, metaMap),
                  }
                : prev,
            )
          })
          .catch(() => {
            /* ignore — book metadata is best-effort */
          })
      }
    } catch {
      /* ignore */
    }

    // 3. Streak data (current / longest / totalReadingDays) from ky_streak.
    if (streak.loaded) {
      next = {
        ...next,
        streak: {
          current: streak.data.currentStreak,
          longest: streak.data.longestStreak,
          totalReadingDays: streak.data.totalReadingDays,
        },
      }
    }

    // 4. Vocab games played from ky_vocab_games_played.
    let gamesPlayed = 0
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.vocabGamesPlayed)
      if (raw) gamesPlayed = Number(JSON.parse(raw)) || 0
    } catch {
      /* ignore */
    }

    // 5. Vocab activity → vocab growth chart.
    let vocabActivity: Record<string, number> = {}
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.vocabActivity)
      if (raw) vocabActivity = JSON.parse(raw) ?? {}
    } catch {
      /* ignore */
    }
    const vocabGrowth = buildVocabGrowth(vocabActivity, next.totals.vocabCount)
    next = { ...next, vocabGrowth }

    // 6. Achievements unlockedAt map + refined stats.
    let unlockedAtMap: Record<string, string> = {}
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.achievementsUnlockedAt)
      if (raw) unlockedAtMap = JSON.parse(raw) ?? {}
    } catch {
      /* ignore */
    }
    try {
      const refinedStats = {
        booksStarted: Object.keys(getLocalProgress()).length,
        booksCompleted: next.totals.booksCompleted,
        pagesRead: next.totals.totalPages,
        currentStreak: next.streak.current,
        longestStreak: next.streak.longest,
        totalReadingDays: next.streak.totalReadingDays,
        totalXP: next.totals.totalXP,
        level: next.totals.level,
        vocabCount: next.totals.vocabCount,
        gamesPlayed,
      }
      const states = computeAchievementStates(
        achievementDefs,
        refinedStats,
        unlockedAtMap,
      )
      const unlocked = states.filter((s) => s.unlocked)
      const rarest = pickRarestAchievement(unlocked)
      const recent = unlocked
        .map((a) => ({
          id: a.id,
          title: a.title,
          icon: a.icon,
          rarity: a.rarity,
          unlockedAt: a.unlockedAt ?? null,
        }))
        .sort((a, b) => (b.unlockedAt ?? '').localeCompare(a.unlockedAt ?? ''))
        .slice(0, 6)
      next = {
        ...next,
        achievements: {
          unlocked: unlocked.length,
          total: achievementDefs.length,
          rarest,
          recent,
        },
        totals: {
          ...next.totals,
          booksStarted: refinedStats.booksStarted,
          booksInProgress: Math.max(0, refinedStats.booksStarted - refinedStats.booksCompleted),
          gamesPlayed,
          achievementsUnlocked: unlocked.length,
        },
      }
    } catch {
      /* ignore */
    }

    // 7. Consistency score.
    const consistencyScore = computeConsistencyScore(
      readHistoryFromStorage(),
      next.streak.current,
    )

    // 8. Personality.
    const uniqueGenres = new Set(
      next.topGenres.map((g) => g.name),
    ).size
    const personality = classifyPersonality({
      bestHour: next.bestHour,
      avgPagesPerDay30d: next.totals.avgPagesPerDay,
      maxDayPages,
      longestStreak: next.streak.longest,
      uniqueGenres,
      vocabCount: next.totals.vocabCount,
    })

    next = {
      ...next,
      totals: { ...next.totals, consistencyScore },
      personality,
      isEmpty:
        next.totals.booksStarted === 0 &&
        next.totals.booksCompleted === 0 &&
        next.totals.totalPages === 0 &&
        next.totals.totalReadingMinutes === 0 &&
        next.totals.vocabCount === 0,
    }

    setPayload(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- This effect enriches `payload` with localStorage + streak data once `streak` has loaded. Adding `payload`, `achievementDefs`, or `streak.data.*` would cause an infinite loop because we call `setPayload` inside.
  }, [streak.loaded])

  // ── Render ──────────────────────────────────────────────────────────
  if (loading) {
    return <StatsLoadingSkeleton />
  }
  if (error && !payload) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
        <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 gap-1.5"
          onClick={() => window.location.reload()}
        >
          تلاش مجدد
        </Button>
      </div>
    )
  }
  if (!payload) return null

  // Empty state for brand-new users.
  if (payload.isEmpty) {
    return (
      <div className="space-y-6">
        <HeroScene payload={payload} />
        <div className="rounded-3xl border border-dashed border-border/60 bg-muted/20 p-10 text-center">
          <Library className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-extrabold text-foreground">
            سفر شما تازه آغاز می‌شود
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            هنوز داده‌ی کافی برای نمایش آمار سالانه جمع نشده. با خواندن چند کتاب،
            الگوی شخصی شما در اینجا ظاهر می‌شود — ژانرهای محبوب، استمرار، الگوی
            زمانی و دستاوردها.
          </p>
          <Button asChild variant="glow" className="mt-5 gap-1.5">
            <Link href="/library">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              شروع اولین کتاب
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <HeroScene payload={payload} />

      {/* Floating share button (desktop) */}
      <div className="sticky top-20 z-30 hidden justify-end lg:flex">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-gold-500/30 bg-card/80 backdrop-blur"
          onClick={() => setShareOpen((v) => !v)}
          aria-label="اشتراک‌گذاری کارت آمار"
          aria-expanded={shareOpen}
        >
          <Share2 className="h-4 w-4 text-gold-600 dark:text-gold-400" aria-hidden="true" />
          اشتراک‌گذاری
        </Button>
      </div>

      {/* Scene 2: Top genres */}
      <SceneSection
        index={1}
        title="ژانرهای محبوب شما"
        subtitle="بر اساس کتاب‌هایی که خوانده‌اید"
        icon={Star}
        ariaLabel="ژانرهای محبوب"
      >
        <TopGenresScene genres={payload.topGenres} />
      </SceneSection>

      {/* Scene 3 & 4: Streak + rhythm side-by-side on lg */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SceneSection
          index={2}
          title="طولانی‌ترین استمرار"
          subtitle="زنجیره روزهای پشت سر هم"
          icon={Flame}
          accentClass="from-rose-400 to-red-500"
          ariaLabel="استمرار مطالعه"
        >
          <StreakScene payload={payload} />
        </SceneSection>

        <SceneSection
          index={3}
          title="الگوی مطالعه شما"
          subtitle="توزیع هفتگی و ماهانه"
          icon={CalendarDays}
          accentClass="from-emerald-400 to-teal-600"
          ariaLabel="الگوی زمانی مطالعه"
        >
          <ReadingRhythmScene payload={payload} />
        </SceneSection>
      </div>

      {/* Scene 5: Book journey */}
      <SceneSection
        index={4}
        title="کتاب‌هایی که همراهتان بودند"
        subtitle="اندازه‌ی هر جلد، نشان‌گر صفحات خوانده‌شده است"
        icon={BookOpen}
        accentClass="from-gold-400 to-amber-600"
        ariaLabel="سفر کتاب‌ها"
      >
        <BookJourneyScene books={payload.bookJourney} />
      </SceneSection>

      {/* Scene 6 & 7: Vocab + achievements */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SceneSection
          index={5}
          title="رشد واژگان شما"
          subtitle="واژه‌ها و بازی‌های واژگان"
          icon={Type}
          accentClass="from-emerald-400 to-cyan-500"
          ariaLabel="رشد واژگان"
        >
          <VocabGrowthScene payload={payload} gamesPlayed={payload.totals.gamesPlayed} />
        </SceneSection>

        <SceneSection
          index={6}
          title="دستاوردهای باز شده"
          subtitle="نشان‌هایی که به دست آورده‌اید"
          icon={Trophy}
          accentClass="from-gold-400 to-amber-500"
          ariaLabel="دستاوردها"
        >
          <AchievementsScene
            achievements={computeAchievementStates(
              achievementDefs,
              {
                booksStarted: payload.totals.booksStarted,
                booksCompleted: payload.totals.booksCompleted,
                pagesRead: payload.totals.totalPages,
                currentStreak: payload.streak.current,
                longestStreak: payload.streak.longest,
                totalReadingDays: payload.streak.totalReadingDays,
                totalXP: payload.totals.totalXP,
                level: payload.totals.level,
                vocabCount: payload.totals.vocabCount,
                gamesPlayed: payload.totals.gamesPlayed,
              },
            )}
            rarest={payload.achievements.rarest}
          />
        </SceneSection>
      </div>

      {/* Scene 8: Personality */}
      <SceneSection
        index={7}
        title="شخصیت مطالعه‌ای شما"
        subtitle="بر اساس آمار واقعی شما"
        icon={Sparkles}
        accentClass="from-amber-400 to-rose-500"
        ariaLabel="شخصیت مطالعه‌ای"
      >
        <PersonalityScene payload={payload} />
      </SceneSection>

      {/* Scene 9: Share card */}
      <SceneSection
        index={8}
        title="کارت اشتراک‌گذاری"
        subtitle="سال خود را با دوستان به اشتراک بگذارید"
        icon={Share2}
        accentClass="from-gold-400 to-amber-600"
        ariaLabel="اشتراک‌گذاری کارت آمار"
      >
        <div ref={shareCardRef}>
          <ShareCard payload={payload} />
        </div>
      </SceneSection>

      {/* Mobile share button (sticky bottom) */}
      <div className="sticky bottom-4 z-30 flex justify-center lg:hidden">
        <Button
          variant="glow"
          size="sm"
          className="gap-1.5 shadow-xl"
          onClick={() => {
            setShareOpen(true)
            shareCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }}
          aria-label="اسکرول به کارت اشتراک‌گذاری"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
          اشتراک‌گذاری کارت
        </Button>
      </div>

      {/* SR-only summary for screen readers */}
      <p className="sr-only" aria-live="polite">
        سال شما در کتاب‌ها: {toPersianDigits(payload.totals.totalPages)} صفحه،{' '}
        {toPersianDigits(payload.totals.booksCompleted)} کتاب تمام شده،{' '}
        {formatNumber(payload.totals.totalReadingMinutes)} دقیقه مطالعه،{' '}
        {toPersianDigits(payload.streak.longest)} روز طولانی‌ترین استمرار.
        شخصیت مطالعه‌ای شما: {payload.personality.title}.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function readHistoryFromStorage(): ReadingHistoryDay[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.readingHistory)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (d): d is ReadingHistoryDay =>
        d && typeof d.date === 'string' && typeof d.pages === 'number' && typeof d.seconds === 'number',
    )
  } catch {
    return []
  }
}

/** Compute top genres / authors / book journey from the progress map + book metadata. */
function computeBookDerivedStats(
  _prev: StatsPayload,
  progress: ReturnType<typeof getLocalProgress>,
  metaMap: Map<string, BookMeta>,
): Pick<StatsPayload, 'topGenres' | 'topAuthors' | 'bookJourney'> {
  const genreMap = new Map<string, { count: number; pages: number }>()
  const authorMap = new Map<string, { count: number; pages: number }>()
  const journey: BookJourneyEntry[] = []

  for (const [slug, p] of Object.entries(progress)) {
    const meta = metaMap.get(slug)
    if (!meta) continue
    const pages = Math.max(0, Math.min(p.currentPage, meta.pageCount || p.currentPage))
    if (pages <= 0) continue

    // Genres.
    for (const g of meta.genres) {
      const cur = genreMap.get(g) ?? { count: 0, pages: 0 }
      cur.count += 1
      cur.pages += pages
      genreMap.set(g, cur)
    }
    // Author.
    const authorKey = meta.author || 'ناشناس'
    const curA = authorMap.get(authorKey) ?? { count: 0, pages: 0 }
    curA.count += 1
    curA.pages += pages
    authorMap.set(authorKey, curA)

    journey.push({
      slug,
      title: meta.title,
      author: meta.author,
      pages,
      totalPages: meta.pageCount,
      percent: meta.pageCount > 0 ? Math.min(100, Math.round((pages / meta.pageCount) * 100)) : 0,
      coverFrom: meta.coverFrom,
      coverTo: meta.coverTo,
      coverAccent: meta.coverAccent,
    })
  }

  const topGenres: GenreStat[] = [...genreMap.entries()]
    .map(([name, v]) => ({ name, count: v.count, pages: v.pages }))
    .sort((a, b) => b.count - a.count || b.pages - a.pages)
    .slice(0, 5)
  const topAuthors: AuthorStat[] = [...authorMap.entries()]
    .map(([name, v]) => ({ name, count: v.count, pages: v.pages }))
    .sort((a, b) => b.count - a.count || b.pages - a.pages)
    .slice(0, 5)
  journey.sort((a, b) => b.pages - a.pages)

  return { topGenres, topAuthors, bookJourney: journey }
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton (inline — avoids the file-level skeleton flash)   */
/* ------------------------------------------------------------------ */

function StatsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 w-full rounded-3xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-3xl" />
        <Skeleton className="h-72 w-full rounded-3xl" />
      </div>
      <Skeleton className="h-48 w-full rounded-3xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-3xl" />
        <Skeleton className="h-72 w-full rounded-3xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-3xl" />
    </div>
  )
}
