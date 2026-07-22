'use client'

import { AchievementsWidget } from '@/components/dashboard/achievements-widget'
import { DashboardSection } from '@/components/dashboard/dashboard-section'
import { LevelUpCelebration } from '@/components/dashboard/level-up-celebration'
import { ReadingHeatmap } from '@/components/dashboard/reading-heatmap'
import { XPBar } from '@/components/dashboard/xp-bar'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Slider } from '@/components/ui/slider'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Flame,
  Lock,
  Moon,
  Settings,
  Star,
  Sun,
  Trash2,
  Trophy,
  Zap,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { toPersianNumber } from '@/lib/gamification'
import { getLocalProgress } from '@/hooks/reader/use-local-progress'
import { useReadingStreak } from '@/hooks/reader/use-reading-streak'
import { STORAGE_KEYS, clearAllKyStorage } from '@/lib/storage-keys'

interface XPStats {
  totalXP: number
  level: number
  levelTitle: string
  progressPercentage: number
  xpForNextLevel: number
  pagesRead: number
  booksCompleted: number
  streakDays: number
}

const MEMBER_SINCE_KEY = STORAGE_KEYS.memberSince

function getMemberSince(): string {
  if (typeof window === 'undefined') return new Date().toISOString()
  try {
    const existing = localStorage.getItem(MEMBER_SINCE_KEY)
    if (existing) return existing
    const now = new Date().toISOString()
    localStorage.setItem(MEMBER_SINCE_KEY, now)
    return now
  } catch {
    return new Date().toISOString()
  }
}

function formatMemberSince(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}

export function ProfileClient() {
  const { resolvedTheme, setTheme } = useTheme()
  const { data: streakData, setGoal } = useReadingStreak()
  const [xp, setXp] = useState<XPStats | null>(null)
  const [vocabCount, setVocabCount] = useState(0)
  const [booksStarted, setBooksStarted] = useState(0)
  const [memberSince, setMemberSince] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  const [goalMins, setGoalMins] = useState<number>(
    Math.round(streakData.dailyGoalSeconds / 60),
  )
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    setMounted(true)
    setMemberSince(getMemberSince())
    setBooksStarted(Object.keys(getLocalProgress()).length)
    setGoalMins(Math.round(streakData.dailyGoalSeconds / 60))

    let alive = true
    Promise.all([
      fetch('/api/xp', { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : null,
      ),
      fetch('/api/vocabulary').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([x, v]) => {
        if (!alive) return
        if (x) setXp(x as XPStats)
        setVocabCount(Array.isArray(v) ? v.length : 0)
      })
      .catch(() => {})
      .finally(() => {})
    return () => {
      alive = false
    }
  }, [streakData.dailyGoalSeconds])

  function handleClearData() {
    setClearing(true)
    try {
      // Wipe every `ky_*` localStorage entry — static keys + every per-book /
      // per-day prefix variant. Replaces a hand-maintained list that had
      // drifted (it referenced `ky_reading_prefs` (typo for `ky_reader_prefs`)
      // and `ky_highlights` (no such key — the real key is `ky_hl_{slug}`)).
      clearAllKyStorage()
      toast.success('اطلاعات محلی پاک شد')
      setTimeout(() => window.location.reload(), 600)
    } catch {
      toast.error('خطا در پاک‌سازی')
      setClearing(false)
    }
  }

  function handleGoalChange(value: number[]) {
    const mins = value[0]
    setGoalMins(mins)
    setGoal(mins * 60)
    toast.success(`هدف روزانه به ${toPersianNumber(mins)} دقیقه تغییر کرد`)
  }

  const isDark = mounted && resolvedTheme === 'dark'
  const level = xp?.level ?? 1
  const levelTitle = xp?.levelTitle ?? '🌱 مبتدی'

  const stats = [
    {
      icon: BookOpen,
      label: 'کتاب شروع‌شده',
      value: toPersianNumber(booksStarted),
      color: 'from-amber-400 to-orange-500',
    },
    {
      icon: Trophy,
      label: 'کتاب تمام‌شده',
      value: toPersianNumber(xp?.booksCompleted ?? 0),
      color: 'from-emerald-400 to-teal-500',
    },
    {
      icon: BookOpen,
      label: 'صفحات خوانده‌شده',
      value: toPersianNumber(xp?.pagesRead ?? 0),
      color: 'from-gold-400 to-gold-600',
    },
    {
      icon: Zap,
      label: 'واژگان ذخیره‌شده',
      value: toPersianNumber(vocabCount),
      color: 'from-beige-400 to-gold-500',
    },
    {
      icon: CalendarDays,
      label: 'روزهای فعال',
      value: toPersianNumber(streakData.totalReadingDays),
      color: 'from-rose-400 to-red-500',
    },
    {
      icon: Flame,
      label: 'بیشترین رکورد',
      value: `${toPersianNumber(streakData.longestStreak)} روز`,
      color: 'from-yellow-400 to-amber-500',
    },
  ]

  return (
    <div className="space-y-10">
      <LevelUpCelebration />

      {/* Back to dashboard */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/dashboard">
            <ArrowRight className="h-4 w-4" />
            بازگشت به داشبورد
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/settings">
            <Settings className="h-4 w-4" />
            تنظیمات
          </Link>
        </Button>
      </div>

      {/* Guest user card */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border-2 border-gold-400/40 bg-gradient-to-br from-gold-500/10 via-card to-card p-6 shadow-sm sm:p-8"
      >
        <div className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-gold-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-gold-700/10 blur-3xl" />

        <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
          {/* Avatar circle */}
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 text-4xl font-extrabold text-white shadow-xl shadow-gold-500/30">
            <span>م</span>
            <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-gold-500 to-gold-700 text-xs font-bold text-white shadow-md">
              {toPersianNumber(level)}
            </span>
          </div>

          {/* Name + meta */}
          <div className="flex-1 text-center sm:text-end">
            <h1 className="text-2xl font-extrabold sm:text-3xl">کاربر مهمان</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              عضو از {formatMemberSince(memberSince)}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/15 px-3 py-1 text-sm font-bold text-gold-700 dark:text-gold-400">
                <Star className="h-3.5 w-3.5" />
                {levelTitle}
              </span>
              {xp && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                  <Zap className="h-3.5 w-3.5" />
                  {toPersianNumber(xp.totalXP)} XP
                </span>
              )}
              {streakData.currentStreak > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-3 py-1 text-sm font-bold text-orange-600 dark:text-orange-400">
                  <Flame className="h-3.5 w-3.5" />
                  {toPersianNumber(streakData.currentStreak)} روز
                </span>
              )}
            </div>
          </div>

          {/* Level badge (desktop) */}
          <div className="hidden shrink-0 items-center justify-center lg:flex">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-xl">
              <div className="text-center leading-none">
                <div className="text-[9px] font-bold uppercase tracking-widest opacity-80">
                  LVL
                </div>
                <div className="text-2xl font-extrabold tabular-nums">
                  {toPersianNumber(level)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* XP + level progress (reused) */}
      <div>
        <h2 className="mb-4 flex items-center gap-2.5 text-lg font-bold sm:text-xl">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/15 text-gold-700 dark:text-gold-400">
            <Zap className="h-5 w-5" />
          </span>
          پیشرفت سطح
        </h2>
        <XPBar />
      </div>

      {/* Lifetime stats grid */}
      <DashboardSection
        icon={Star}
        title="آمار کلی"
        subtitle="تصویری از کل فعالیت شما در کتاب‌یار"
        index={2}
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {stats.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
              >
                <div
                  className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow-md`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-extrabold leading-none tabular-nums">
                  {s.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </motion.div>
            )
          })}
        </div>
      </DashboardSection>

      {/* Achievements showcase */}
      <AchievementsWidget />

      {/* Heatmap */}
      <ReadingHeatmap />

      {/* Settings */}
      <DashboardSection
        icon={Settings}
        title="تنظیمات"
        subtitle="ترجیحات نمایش، هدف مطالعه و پاک‌سازی داده"
        index={6}
      >
        <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
          {/* Theme preference */}
          <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-4">
            <div>
              <p className="font-bold">تم برنامه</p>
              <p className="text-xs text-muted-foreground">
                بین حالت روشن و تاریک جابه‌جا شوید
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={!isDark ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
                onClick={() => setTheme('light')}
              >
                <Sun className="h-4 w-4" />
                روشن
              </Button>
              <Button
                variant={isDark ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
                onClick={() => setTheme('dark')}
              >
                <Moon className="h-4 w-4" />
                تاریک
              </Button>
            </div>
          </div>

          {/* Reading goal */}
          <div className="border-b border-border/40 pb-4">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold">هدف روزانه مطالعه</p>
                <p className="text-xs text-muted-foreground">
                  هدف روزانه خود را تنظیم کنید
                </p>
              </div>
              <span className="rounded-full bg-gold-500/15 px-3 py-1 text-sm font-bold text-gold-700 dark:text-gold-400">
                {toPersianNumber(goalMins)} دقیقه
              </span>
            </div>
            <Slider
              value={[goalMins]}
              min={5}
              max={60}
              step={5}
              onValueChange={handleGoalChange}
              aria-label="هدف روزانه به دقیقه"
            />
            <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
              <span>۵ دقیقه</span>
              <span>۶۰ دقیقه</span>
            </div>
          </div>

          {/* Clear data */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-destructive">پاک‌سازی داده محلی</p>
              <p className="text-xs text-muted-foreground">
                پیشرفت مطالعه، علاقه‌مندی‌ها و واژگان شما پاک می‌شود
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                  disabled={clearing}
                >
                  <Trash2 className="h-4 w-4" />
                  پاک‌سازی
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>پاک‌سازی همه داده محلی؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    این عمل تمام پیشرفت مطالعه، علاقه‌مندی‌ها، واژگان و دستاوردهای
                    ذخیره‌شده در این مرورگر را پاک می‌کند. این عمل قابل بازگشت
                    نیست. سطح و XP ذخیره‌شده در سرور نیز ممکن است با ریست نشست
                    تغییر کند.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    بله، پاک کن
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DashboardSection>

      {/* Footer note */}
      <div className="flex items-center justify-center gap-2 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        اطلاعات شما فقط به‌صورت محلی و روی این مرورگر ذخیره می‌شود.
      </div>
    </div>
  )
}
