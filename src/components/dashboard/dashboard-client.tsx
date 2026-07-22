'use client'

import { BookCard } from '@/components/books/book-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AchievementCelebration } from '@/components/dashboard/achievement-celebration'
import { AchievementsWidget } from '@/components/dashboard/achievements-widget'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { DailyChallenges } from '@/components/dashboard/daily-challenges'
import { DailyGoalCard } from '@/components/dashboard/daily-goal-card'
import { DashboardSection } from '@/components/dashboard/dashboard-section'
import { GettingStartedGuide } from '@/components/dashboard/getting-started-guide'
import { LevelUpCelebration } from '@/components/dashboard/level-up-celebration'
import { ReadingHeatmap } from '@/components/dashboard/reading-heatmap'
import { MonthlyStreakCalendar } from '@/components/dashboard/monthly-streak-calendar'
import { RecommendationsWidget } from '@/components/dashboard/recommendations-widget'
import { RecentSessionsWidget } from '@/components/dashboard/recent-sessions-widget'
import { ResumeCard } from '@/components/dashboard/resume-card'
import { StreakProtectionWidget } from '@/components/dashboard/streak-protection-widget'
import { StreakWidget } from '@/components/dashboard/streak-widget'
import { WelcomeWidget } from '@/components/dashboard/welcome-widget'
import { XPBar } from '@/components/dashboard/xp-bar'
import { ProfileHeader } from '@/components/dashboard/profile-header'
import { getLocalProgress, type ProgressEntry } from '@/hooks/reader/use-local-progress'
import { useReadingStreak } from '@/hooks/reader/use-reading-streak'
import { setVocabCount as setAchievementVocabCount } from '@/hooks/reader/use-achievements'
import { toPersianNumber } from '@/lib/gamification'
import { cn } from '@/lib/utils'
import {
  motion,
  useReducedMotion,
  type Variants,
} from 'framer-motion'
import { Activity, BookOpen, Flame, Library, Zap } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys, fetchXp, fetchBooksBySlugs, fetchVocabulary } from '@/lib/api/queries'
import type { BookListItem } from '@/lib/data'

// Code-split InsightsWidget — it's the only dashboard widget that pulls in
// recharts (~500KB). Loading it eagerly would put recharts in the dashboard
// bundle even though it's a single widget among ~15. `ssr: false` because
// recharts needs ResizeObserver/DOMRect (browser-only). The skeleton
// mirrors the widget's card shape so there's no layout shift.
const InsightsWidget = dynamic(
  () => import('@/components/dashboard/insights-widget').then((m) => m.InsightsWidget),
  {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full rounded-2xl" />,
  },
)

/* ------------------------------------------------------------------ */
/*  Summary strip — 4 KPI cards (XP, streak, books started, pages)     */
/*  Per user feedback: dashboard should be the single place where      */
/*  these stats live (was previously duplicated in profile + stats).   */
/* ------------------------------------------------------------------ */

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  gradient,
  delay,
}: {
  icon: typeof Zap
  label: string
  value: string
  sub?: string
  gradient: string
  delay: number
}) {
  const reduceMotion = useReducedMotion()
  const variants: Variants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0 },
      }
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* gilded top hairline */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold-500/60 to-transparent"
        aria-hidden
      />
      <div className="flex items-center justify-between">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md',
            gradient,
          )}
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </div>
        {sub && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {sub}
          </span>
        )}
      </div>
      <div className="mt-3 text-2xl font-extrabold tabular-nums leading-none">
        {value}
      </div>
      <div className="mt-1 text-xs font-medium text-foreground/80">{label}</div>
    </motion.div>
  )
}

function SummaryStrip() {
  // Phase 3 R-FE.2: migrated from manual fetch+useState to TanStack Query.
  // Gives automatic caching, retry, staleTime, and background refetch.
  const { data: xp } = useQuery({
    queryKey: queryKeys.xp,
    queryFn: fetchXp,
    staleTime: 30_000,
  })
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({})
  const { data: streak } = useReadingStreak()

  useEffect(() => {
    setProgress(getLocalProgress())
  }, [])

  const booksStarted = Object.keys(progress).length
  const totalPagesRead = Object.values(progress).reduce(
    (s, e) => s + Math.round((e.percent / 100) * e.totalPages),
    0,
  )
  const streakDays = streak.currentStreak || xp?.streakDays || 0
  const totalXP = xp?.totalXP ?? 0

  const cards: {
    icon: typeof Zap
    label: string
    value: string
    sub: string
    gradient: string
  }[] = [
    {
      icon: Zap,
      label: 'امتیاز تجربه',
      value: `${toPersianNumber(totalXP)} XP`,
      sub: xp ? `سطح ${toPersianNumber(xp.level)}` : '—',
      gradient: 'from-gold-400 to-gold-600',
    },
    {
      icon: Flame,
      label: 'روز متوالی',
      value: toPersianNumber(streakDays),
      sub: 'استمرار',
      gradient: 'from-orange-400 to-rose-500',
    },
    {
      icon: BookOpen,
      label: 'کتاب شروع‌شده',
      value: toPersianNumber(booksStarted),
      sub: 'کتاب',
      gradient: 'from-emerald-400 to-teal-500',
    },
    {
      icon: Library,
      label: 'صفحه خوانده‌شده',
      value: toPersianNumber(totalPagesRead),
      sub: 'صفحه',
      gradient: 'from-amber-400 to-yellow-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((c, i) => (
        <KpiCard key={c.label} {...c} delay={i * 0.06} />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Section divider — gilded hairline                                  */
/* ------------------------------------------------------------------ */
function SectionDivider() {
  return (
    <div
      className="relative h-px w-full bg-gradient-to-l from-transparent via-border to-transparent"
      aria-hidden
    >
      <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/60" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Dashboard client — orchestrator                                    */
/* ------------------------------------------------------------------ */
export function DashboardClient() {
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({})

  useEffect(() => {
    setProgress(getLocalProgress())
  }, [])

  const slugs = Object.keys(progress)

  const { data: rawBooks = [], isLoading: loadingBooks } = useQuery({
    queryKey: queryKeys.booksBySlugs(slugs),
    queryFn: () => fetchBooksBySlugs(slugs),
    enabled: slugs.length > 0,
    staleTime: 60 * 1000,
  })
  const books = (rawBooks || []) as BookListItem[]

  const { data: vocab = [], isLoading: loadingVocab } = useQuery({
    queryKey: queryKeys.vocabulary,
    queryFn: fetchVocabulary,
    staleTime: 60 * 1000,
  })

  const vocabCount = Array.isArray(vocab) ? vocab.length : 0
  const loading = (slugs.length > 0 && loadingBooks) || loadingVocab

  useEffect(() => {
    if (vocabCount > 0) {
      setAchievementVocabCount(vocabCount)
    }
  }, [vocabCount])

  const inProgress = books
    .filter(
      (b) =>
        (progress[b.slug]?.percent || 0) > 0 &&
        (progress[b.slug]?.percent || 0) < 100,
    )
    .sort((a, b) => (progress[b.slug]?.ts || 0) - (progress[a.slug]?.ts || 0))

  return (
    <div className="space-y-7 sm:space-y-8">
      <AchievementCelebration />
      <LevelUpCelebration />

      {/* First-session welcome card — only renders right after onboarding
          completion (within 30 min). Auto-hides afterwards. */}
      <WelcomeWidget />

      {/* Getting-started guide — shows for brand-new users who have no
          books in progress AND no saved vocabulary. Dismissible for the
          session. Auto-hides once the user starts reading or saving words. */}
      {!loading && inProgress.length === 0 && vocabCount === 0 && (
        <GettingStartedGuide />
      )}

      {/* Profile header — replaces the old greeting widget per user feedback.
          Combines: avatar + name + level + share button (single place for
          identity, no duplicate "صبح بخیر/ظهر بخیر" widget). */}
      <ProfileHeader />
      <SummaryStrip />

      <SectionDivider />

      {/* 1. XP + level — identity */}
      <XPBar />

      {/* 2. Daily challenges — actionable today */}
      <DailyChallenges />

      {/* 3. Resume — continue reading */}
      <ResumeCard />

      {/* 4. Streak + Daily goal — complementary stats */}
      <div className="stagger-in grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <StreakWidget />
        <DailyGoalCard />
      </div>

      {/* 4b. Streak protection — risk status + countdown + CTA */}
      <StreakProtectionWidget />

      {/* 4c. Recent reading sessions — timeline of last 8 sessions */}
      <RecentSessionsWidget />

      {/* 5. Insights — mini chart + KPI grid */}
      <InsightsWidget vocabCount={vocabCount} />

      {/* 6. Continue-reading grid */}
      <DashboardSection
        icon={BookOpen}
        title="ادامه مطالعه"
        subtitle="کتاب‌هایی که در حال خواندنشان هستید"
        index={1}
        action={
          <Button asChild variant="ghost" size="sm">
            <Link href="/library">کتابخانه</Link>
          </Button>
        }
      >
        {loading ? (
          <div className="stagger-in grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] w-full rounded-2xl" />
            ))}
          </div>
        ) : inProgress.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">
              هنوز کتابی را شروع نکرده‌اید.
            </p>
            <Button asChild variant="glow" className="mt-4">
              <Link href="/library">شروع کنید</Link>
            </Button>
          </div>
        ) : (
          <div className="stagger-in grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {inProgress.slice(0, 4).map((b) => (
              <BookCard key={b.id} book={b} progress={progress[b.slug]?.percent} />
            ))}
          </div>
        )}
      </DashboardSection>

      <SectionDivider />

      {/* 7. Recommendations */}
      <RecommendationsWidget />

      <SectionDivider />

      {/* 8. Activity feed */}
      <DashboardSection
        icon={Activity}
        title="فعالیت اخیر"
        subtitle="کارهای شما و جامعه کتاب‌یار"
        index={2}
      >
        <ActivityFeed />
      </DashboardSection>

      <SectionDivider />

      {/* 9. Achievements */}
      <AchievementsWidget />

      <SectionDivider />

      {/* 10. Heatmap + Monthly calendar — side by side on large screens */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ReadingHeatmap />
        <MonthlyStreakCalendar />
      </div>
    </div>
  )
}
