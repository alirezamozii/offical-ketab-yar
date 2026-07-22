'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import {
  Award,
  BookOpen,
  Check,
  Crown,
  Flame,
  Gamepad2,
  Lock,
  Medal,
  Share2,
  Sparkles,
  Star,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import {
  getLocalProgress,
  type ProgressEntry,
} from '@/hooks/reader/use-local-progress'
import { useReadingStreak } from '@/hooks/reader/use-reading-streak'
import {
  CATEGORY_LABELS,
  RARITY_LABELS,
  RARITY_STYLES,
  computeAchievementStates,
  type AchievementCategory,
  type AchievementRarity,
  type AchievementState,
  type AchievementStats,
} from '@/lib/achievements'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Types & helpers                                                    */
/* ------------------------------------------------------------------ */

type StatusFilter = 'all' | 'unlocked' | 'locked'
type RarityFilter = AchievementRarity | 'all'
type CategoryFilter = AchievementCategory | 'all'

interface ApiResponse {
  achievements: AchievementState[]
  stats: AchievementStats
  summary: {
    total: number
    unlocked: number
    totalXPEarned: number
    completionPct: number
  }
  error?: string
}

/** Read localStorage-only stats the server can't see. */
function loadLocalStats(serverStats: AchievementStats): AchievementStats {
  if (typeof window === 'undefined') return serverStats
  const progressMap: Record<string, ProgressEntry> = getLocalProgress()
  const booksStarted = Object.keys(progressMap).length
  const gamesPlayedRaw = localStorage.getItem(STORAGE_KEYS.vocabGamesPlayed)
  const gamesPlayed = Number.isFinite(Number(gamesPlayedRaw))
    ? Number(gamesPlayedRaw)
    : 0
  return {
    ...serverStats,
    booksStarted,
    gamesPlayed,
  }
}

/** Read the per-id unlockedAt map. Returns {} on the server / on parse errors. */
function loadUnlockedAtMap(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.achievementsUnlockedAt)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/** Persist the per-id unlockedAt map. Best-effort; never throws. */
function saveUnlockedAtMap(map: Record<string, string>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      STORAGE_KEYS.achievementsUnlockedAt,
      JSON.stringify(map),
    )
  } catch {
    /* ignore quota / private-mode errors */
  }
}

/* ------------------------------------------------------------------ */
/*  Circular progress ring — overall completion %                      */
/* ------------------------------------------------------------------ */

function CircularProgressRing({
  percent,
  size = 88,
  strokeWidth = 8,
}: {
  percent: number
  size?: number
  strokeWidth?: number
}) {
  const reduceMotion = useReducedMotion()
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const safePct = Math.max(0, Math.min(100, percent))
  const offset = circumference - (safePct / 100) * circumference

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`پیشرفت کلی: ${Math.round(safePct)} درصد`}
      className="shrink-0"
    >
      <defs>
        <linearGradient id="ring-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(43 74% 67%)" />
          <stop offset="50%" stopColor="hsl(35 70% 55%)" />
          <stop offset="100%" stopColor="hsl(28 60% 42%)" />
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
      {/* Progress arc — rotates so it starts at the top. */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#ring-gold)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        initial={reduceMotion ? false : { strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Center label */}
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className="fill-foreground text-lg font-extrabold"
        style={{ fontSize: size * 0.22 }}
      >
        {Math.round(safePct)}٪
      </text>
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Achievement card                                                   */
/* ------------------------------------------------------------------ */

function AchievementCard({
  ach,
  index,
  onSelect,
}: {
  ach: AchievementState
  index: number
  onSelect: (a: AchievementState) => void
}) {
  const reduceMotion = useReducedMotion()
  const { toPersianDigits, formatNumber } = usePersianLocale()
  const rarity = RARITY_STYLES[ach.rarity]

  const enter: Variants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 18, scale: 0.96 },
        visible: { opacity: 1, y: 0, scale: 1 },
      }

  const isLegendary = ach.rarity === 'legendary'
  const isEpic = ach.rarity === 'epic'

  return (
    <motion.div
      layout
      role="listitem"
      variants={enter}
      initial="hidden"
      animate="visible"
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.92 }}
      transition={{
        delay: Math.min(index * 0.04, 0.6),
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={reduceMotion ? undefined : { y: -5 }}
      className="group relative"
    >
      <button
        type="button"
        onClick={() => onSelect(ach)}
        aria-label={`${ach.title} — ${ach.description}${
          ach.unlocked ? ' — باز شده' : ' — قفل‌دار'
        }`}
        className={cn(
          'relative flex h-full w-full flex-col items-start gap-3 overflow-hidden rounded-2xl border p-5 text-right transition-[transform,opacity,colors,border-color,background-color]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          ach.unlocked
            ? 'border-border/70 bg-card hover:border-gold-400/60 hover:shadow-lg hover:shadow-gold-500/10'
            : 'border-border/40 bg-card/40',
        )}
      >
        {/* Ambient glow for unlocked cards — rarity-colored. */}
        {ach.unlocked && (
          <div
            aria-hidden
            className={cn(
              'pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br opacity-30 blur-2xl transition-opacity group-hover:opacity-50',
              rarity.glow,
            )}
          />
        )}

        {/* Legendary animated shimmer overlay */}
        {ach.unlocked && isLegendary && !reduceMotion && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              background:
                'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}

        {/* Top row: badge + rarity chip */}
        <div className="relative flex w-full items-start justify-between gap-2">
          {/* Icon badge with rarity gradient border */}
          <div className="relative">
            <div
              className={cn(
                'relative flex h-14 w-14 items-center justify-center rounded-2xl text-3xl shadow-md',
                'bg-gradient-to-br p-[2px]',
                ach.unlocked ? rarity.border : 'from-stone-500/40 to-stone-700/40',
              )}
            >
              <div
                className={cn(
                  'flex h-full w-full items-center justify-center rounded-[14px]',
                  ach.unlocked
                    ? 'bg-gradient-to-br ' + ach.color
                    : 'bg-muted',
                )}
              >
                {ach.unlocked ? (
                  <span aria-hidden className={cn(!ach.unlocked && 'opacity-40')}>
                    {ach.icon}
                  </span>
                ) : (
                  <Lock
                    aria-hidden
                    className="h-6 w-6 text-muted-foreground"
                  />
                )}
              </div>

              {/* Epic / legendary sparkle particles */}
              {ach.unlocked && (isEpic || isLegendary) && !reduceMotion && (
                <>
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      aria-hidden
                      className="pointer-events-none absolute text-[10px]"
                      style={{
                        left: `${50 + 30 * Math.cos((i * 2 * Math.PI) / 3)}%`,
                        top: `${50 + 30 * Math.sin((i * 2 * Math.PI) / 3)}%`,
                      }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0.4, 1.1, 0.4],
                      }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        delay: i * 0.4,
                      }}
                    >
                      ✨
                    </motion.span>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Rarity chip */}
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
              rarity.chipBg,
              rarity.text,
            )}
          >
            {ach.rarity === 'legendary' && <Crown className="h-3 w-3" />}
            {ach.rarity === 'epic' && <Sparkles className="h-3 w-3" />}
            {ach.rarity === 'rare' && <Star className="h-3 w-3" />}
            {rarity.label}
          </span>
        </div>

        {/* Title + description */}
        <div className="relative w-full space-y-1">
          <h3
            className={cn(
              'text-sm font-bold leading-tight transition-colors',
              ach.unlocked
                ? 'text-foreground'
                : 'text-muted-foreground',
            )}
          >
            {ach.title}
          </h3>
          <p
            className={cn(
              'text-xs leading-snug',
              ach.unlocked ? 'text-muted-foreground' : 'text-muted-foreground/70',
            )}
          >
            {ach.description}
          </p>
        </div>

        {/* Progress bar (locked) OR unlocked badge */}
        <div className="relative w-full">
          {ach.unlocked ? (
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <Check className="h-3 w-3" />
                باز شده
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-bold text-gold-700 dark:text-gold-400">
                <Zap className="h-3 w-3" />+{toPersianDigits(ach.xpReward)} XP
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={cn(
                    'h-full rounded-full bg-gradient-to-l',
                    rarity.border,
                  )}
                  initial={
                    reduceMotion ? false : { width: 0 }
                  }
                  animate={{ width: `${ach.progressPct}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                  {formatNumber(ach.progress)} / {formatNumber(ach.maxProgress)}{' '}
                  {ach.unit}
                </span>
                <span>{toPersianDigits(ach.progressPct)}٪</span>
              </div>
            </div>
          )}
        </div>

        {/* Locked overlay — subtle dimming. */}
        {!ach.unlocked && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl bg-background/10"
          />
        )}
      </button>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Confetti burst — fires for legendary achievements on dialog open   */
/* ------------------------------------------------------------------ */

const CONFETTI_COLORS = [
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#10b981',
  '#fde047',
  '#facc15',
]

interface ConfettiPiece {
  id: number
  x: number
  y: number
  rotation: number
  color: string
  delay: number
  size: number
  duration: number
}

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 20,
    y: 50 + (Math.random() - 0.5) * 10,
    rotation: Math.random() * 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: Math.random() * 0.3,
    size: 6 + Math.random() * 10,
    duration: 1.6 + Math.random() * 1.4,
  }))
}

function LegendaryConfetti({ active }: { active: boolean }) {
  const reduceMotion = useReducedMotion()
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])
  useEffect(() => {
    if (!active || reduceMotion) return
    setPieces(generateConfetti(60))
    const t = setTimeout(() => setPieces([]), 3200)
    return () => clearTimeout(t)
  }, [active, reduceMotion])

  if (pieces.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => {
        const angle = (p.id % 24) * 15
        const rad = (angle * Math.PI) / 180
        const distance = 35 + Math.random() * 20
        const targetX = p.x + Math.cos(rad) * distance
        const targetY = p.y + Math.sin(rad) * distance
        return (
          <motion.div
            key={p.id}
            initial={{ x: `${p.x}%`, y: `${p.y}%`, scale: 0.3, opacity: 1 }}
            animate={{
              x: `${targetX}%`,
              y: `${targetY}%`,
              scale: [0.3, 1.2, 0.8, 0.4],
              opacity: [1, 1, 0.7, 0],
              rotate: p.rotation + 540,
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: 'easeOut',
            }}
            className="absolute"
            style={{
              width: p.size,
              height: p.size,
              background: p.color,
              borderRadius: '2px',
              boxShadow: `0 0 8px ${p.color}`,
            }}
          />
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Achievement detail dialog                                          */
/* ------------------------------------------------------------------ */

function AchievementDialog({
  ach,
  onClose,
}: {
  ach: AchievementState | null
  onClose: () => void
}) {
  const { toPersianDigits, formatNumber, formatDate } = usePersianLocale()
  const reduceMotion = useReducedMotion()
  const open = ach !== null
  const rarity = ach ? RARITY_STYLES[ach.rarity] : null
  const isLegendary = ach?.rarity === 'legendary'
  const isEpic = ach?.rarity === 'epic'
  const rarityBorderClass = ach
    ? ach.rarity === 'legendary'
      ? 'border-rose-400/70'
      : ach.rarity === 'epic'
        ? 'border-gold-400/70'
        : ach.rarity === 'rare'
          ? 'border-emerald-400/60'
          : 'border-stone-400/60'
    : 'border-border'

  const handleShare = useCallback(async () => {
    if (!ach) return
    const text = `🏆 دستاورد «${ach.title}» را در کتاب‌یار باز کردم! ${ach.description}`
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/achievements`
        : '/achievements'
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function'
    ) {
      try {
        await navigator.share({ title: ach.title, text, url })
      } catch {
        /* user dismissed — ignore */
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`)
        toast.success('متن دستاورد در کلیپ‌بورد کپی شد.')
      } catch {
        toast.error('اشتراک‌گذاری ناموفق بود.')
      }
    }
  }, [ach])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className={cn(
          'overflow-hidden border-2 p-0 sm:max-w-md',
          rarityBorderClass,
        )}
      >
        {ach && rarity && (
          <div className="relative overflow-hidden">
            {/* Confetti burst for legendary achievements */}
            <LegendaryConfetti active={open && isLegendary} />

            {/* Header with gradient + icon */}
            <div
              className={cn(
                'relative flex flex-col items-center gap-3 bg-gradient-to-br p-8 text-center opacity-95',
                rarity.border,
              )}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-background/40"
              />
              {/* Sparkle ring for epic / legendary */}
              {(isEpic || isLegendary) && !reduceMotion && (
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-10 h-32 w-32 -translate-x-1/2 -translate-y-1/2"
                    initial={{ rotate: 0, opacity: 0 }}
                    animate={{ rotate: 360, opacity: 0.6 }}
                    transition={{
                      rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
                      opacity: { duration: 0.4 },
                    }}
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span
                        key={i}
                        className="absolute left-1/2 top-1/2 text-xs"
                        style={{
                          transform: `rotate(${i * 45}deg) translateY(-58px)`,
                          transformOrigin: '0 0',
                        }}
                      >
                        ✨
                      </span>
                    ))}
                  </motion.div>
                )}

              <motion.div
                initial={reduceMotion ? false : { scale: 0.5, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                className={cn(
                  'relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br text-5xl shadow-2xl',
                  ach.color,
                )}
              >
                <span aria-hidden>{ach.icon}</span>
              </motion.div>

              <div className="relative space-y-1">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[11px] font-bold',
                    rarity.chipBg,
                    rarity.text,
                  )}
                >
                  {ach.rarity === 'legendary' && <Crown className="h-3 w-3" />}
                  {ach.rarity === 'epic' && <Sparkles className="h-3 w-3" />}
                  {ach.rarity === 'rare' && <Star className="h-3 w-3" />}
                  {rarity.label}
                </span>
                <DialogTitle className="text-2xl font-extrabold">
                  {ach.title}
                </DialogTitle>
              </div>
            </div>

            <DialogHeader className="px-6 pt-6">
              <DialogDescription className="text-sm leading-relaxed">
                {ach.description}
              </DialogDescription>
            </DialogHeader>

            {/* Detail grid */}
            <div className="grid grid-cols-2 gap-3 px-6 pt-4">
              <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  وضعیت
                </p>
                <p
                  className={cn(
                    'mt-1 text-sm font-bold',
                    ach.unlocked
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground',
                  )}
                >
                  {ach.unlocked ? '✓ باز شده' : '🔒 قفل‌دار'}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  پاداش XP
                </p>
                <p className="mt-1 text-sm font-bold text-gold-700 dark:text-gold-400">
                  +{toPersianDigits(ach.xpReward)} XP
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  پیشرفت
                </p>
                <p className="mt-1 text-sm font-bold">
                  {formatNumber(ach.progress)} / {formatNumber(ach.maxProgress)}{' '}
                  {ach.unit}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {ach.unlocked ? 'تاریخ باز شدن' : 'باقی‌مانده'}
                </p>
                <p className="mt-1 text-sm font-bold">
                  {ach.unlocked
                    ? ach.unlockedAt
                      ? formatDate(ach.unlockedAt, 'medium')
                      : 'اخیراً'
                    : `${formatNumber(Math.max(0, ach.maxProgress - ach.progress))} ${ach.unit}`}
                </p>
              </div>
            </div>

            {/* Progress bar — custom (gold gradient instead of default primary) */}
            <div className="px-6 pt-4">
              <div
                className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={ach.progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={cn(
                    'h-full rounded-full bg-gradient-to-l transition-[transform,opacity,colors,border-color,background-color]',
                    rarity.border,
                  )}
                  style={{ width: `${ach.progressPct}%` }}
                />
              </div>
              <p className="mt-1 text-left text-[10px] text-muted-foreground">
                {toPersianDigits(ach.progressPct)}٪
              </p>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-2 p-6 pt-4">
              <Button variant="ghost" onClick={onClose}>
                بستن
              </Button>
              <Button
                variant="glow"
                size="sm"
                onClick={handleShare}
                className="gap-2"
                disabled={!ach.unlocked}
              >
                <Share2 className="h-4 w-4" />
                اشتراک‌گذاری
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/*  Header (title + ring)                                              */
/* ------------------------------------------------------------------ */

function GalleryHeader({
  total,
  unlocked,
  completionPct,
  totalXPEarned,
}: {
  total: number
  unlocked: number
  completionPct: number
  totalXPEarned: number
}) {
  const reduceMotion = useReducedMotion()
  const { toPersianDigits, formatNumber } = usePersianLocale()

  const enter: Variants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: -10 },
        visible: { opacity: 1, y: 0 },
      }

  return (
    <motion.header
      variants={enter}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-gold-500/30 bg-gradient-to-br from-gold-500/10 via-card to-card p-5 shadow-sm sm:p-7"
      aria-label="گالری دستاوردها"
    >
      {/* Ambient halos */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-gold-500/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-gold-700/15 blur-3xl"
      />

      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-lg shadow-gold-500/30">
              <Trophy className="h-6 w-6" aria-hidden />
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              دستاوردها
            </h1>
          </div>
          <p className="text-sm text-muted-foreground sm:text-base">
            <span className="font-bold text-gold-700 dark:text-gold-400">
              {formatNumber(unlocked)}
            </span>{' '}
            از{' '}
            <span className="font-bold text-gold-700 dark:text-gold-400">
              {formatNumber(total)}
            </span>{' '}
            دستاورد باز شده —{' '}
            <span className="text-gold-700 dark:text-gold-400">
              {toPersianDigits(completionPct)}٪
            </span>{' '}
            تکمیل شده.
          </p>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-700 dark:text-gold-400">
            <Zap className="h-3.5 w-3.5" />
            مجموع XP کسب‌شده از دستاوردها:{' '}
            <span className="font-bold">
              {formatNumber(totalXPEarned)} XP
            </span>
          </div>
        </div>

        <CircularProgressRing percent={completionPct} size={96} strokeWidth={9} />
      </div>
    </motion.header>
  )
}

/* ------------------------------------------------------------------ */
/*  Stats row — total XP, rarest unlocked, latest unlocked             */
/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  gradient,
  delay,
}: {
  icon: LucideIcon
  label: string
  value: string
  sub?: string
  gradient: string
  delay: number
}) {
  const reduceMotion = useReducedMotion()
  const enter: Variants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0 },
      }
  return (
    <motion.div
      variants={enter}
      initial="hidden"
      animate="visible"
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold-500/60 to-transparent"
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
      <div className="mt-3 text-xl font-extrabold tabular-nums leading-none">
        {value}
      </div>
      <div className="mt-1 text-xs font-medium text-foreground/80">{label}</div>
    </motion.div>
  )
}

function StatsRow({
  achievements,
  totalXPEarned,
}: {
  achievements: AchievementState[]
  totalXPEarned: number
}) {
  const { formatNumber } = usePersianLocale()

  const unlocked = useMemo(
    () => achievements.filter((a) => a.unlocked),
    [achievements],
  )

  // Rarest unlocked: legendary > epic > rare > common
  const rarestUnlocked = useMemo(() => {
    if (unlocked.length === 0) return null
    const rarityRank: Record<AchievementRarity, number> = {
      common: 0,
      rare: 1,
      epic: 2,
      legendary: 3,
    }
    return unlocked.reduce((best, cur) =>
      rarityRank[cur.rarity] > rarityRank[best.rarity] ? cur : best,
    )
  }, [unlocked])

  // Latest unlocked — by unlockedAt (ISO string) desc, fallback to "اخیراً"
  const latestUnlocked = useMemo(() => {
    if (unlocked.length === 0) return null
    const withDates = unlocked.filter((a) => a.unlockedAt)
    if (withDates.length === 0) return unlocked[unlocked.length - 1]
    return withDates.reduce((latest, cur) =>
      (cur.unlockedAt || '') > (latest.unlockedAt || '') ? cur : latest,
    )
  }, [unlocked])

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard
        icon={Zap}
        label="مجموع XP از دستاوردها"
        value={`${formatNumber(totalXPEarned)} XP`}
        sub="جمع پاداش"
        gradient="from-gold-400 to-gold-600"
        delay={0.05}
      />
      <StatCard
        icon={Trophy}
        label="کل دستاوردهای باز شده"
        value={formatNumber(unlocked.length)}
        sub={`از ${formatNumber(achievements.length)}`}
        gradient="from-emerald-400 to-teal-600"
        delay={0.1}
      />
      <StatCard
        icon={Crown}
        label="کمیاب‌ترین دستاورد"
        value={rarestUnlocked ? rarestUnlocked.title : '—'}
        sub={
          rarestUnlocked ? RARITY_LABELS[rarestUnlocked.rarity] : 'هنوز باز نشده'
        }
        gradient="from-rose-400 to-pink-600"
        delay={0.15}
      />
      <StatCard
        icon={Sparkles}
        label="آخرین دستاورد باز شده"
        value={latestUnlocked ? latestUnlocked.title : '—'}
        sub={latestUnlocked ? latestUnlocked.icon : 'در انتظار'}
        gradient="from-amber-400 to-orange-600"
        delay={0.2}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Filter row — status tabs + rarity chips + category chips           */
/* ------------------------------------------------------------------ */

function FilterRow({
  status,
  onStatus,
  rarity,
  onRarity,
  category,
  onCategory,
}: {
  status: StatusFilter
  onStatus: (s: StatusFilter) => void
  rarity: RarityFilter
  onRarity: (r: RarityFilter) => void
  category: CategoryFilter
  onCategory: (c: CategoryFilter) => void
}) {
  const rarityChip = (r: RarityFilter, label: string) => (
    <button
      key={r}
      type="button"
      onClick={() => onRarity(r)}
      aria-pressed={rarity === r}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        rarity === r
          ? 'border-gold-400/60 bg-gold-500/15 text-gold-700 dark:text-gold-400'
          : 'border-border/60 bg-card text-muted-foreground hover:text-foreground',
      )}
    >
      {r !== 'all' && (
        <span
          aria-hidden
          className={cn(
            'h-2 w-2 rounded-full bg-gradient-to-br',
            RARITY_STYLES[r as AchievementRarity].border,
          )}
        />
      )}
      {label}
    </button>
  )

  const categoryChip = (c: CategoryFilter, label: string, Icon: LucideIcon) => (
    <button
      key={c}
      type="button"
      onClick={() => onCategory(c)}
      aria-pressed={category === c}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        category === c
          ? 'border-gold-400/60 bg-gold-500/15 text-gold-700 dark:text-gold-400'
          : 'border-border/60 bg-card text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </button>
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={status} onValueChange={(v) => onStatus(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="all">همه</TabsTrigger>
            <TabsTrigger value="unlocked">باز شده</TabsTrigger>
            <TabsTrigger value="locked">قفل‌دار</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-1.5">
          {rarityChip('all', 'همه کمیاب‌ها')}
          {(
            ['common', 'rare', 'epic', 'legendary'] as AchievementRarity[]
          ).map((r) => rarityChip(r, RARITY_LABELS[r]))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {categoryChip('all', 'همه دسته‌ها', Trophy)}
        {categoryChip('reading', CATEGORY_LABELS.reading, BookOpen)}
        {categoryChip('vocabulary', CATEGORY_LABELS.vocabulary, BookOpen)}
        {categoryChip('streak', CATEGORY_LABELS.streak, Flame)}
        {categoryChip('level', CATEGORY_LABELS.level, Medal)}
        {categoryChip('games', CATEGORY_LABELS.games, Gamepad2)}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Loading + error states                                             */
/* ------------------------------------------------------------------ */

function GallerySkeleton() {
  return (
    <div className="space-y-7">
      <Skeleton className="h-40 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-9 w-64 rounded-lg" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-2xl border border-border/60 bg-card p-5"
          >
            <div className="flex items-start justify-between">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center"
    >
      <Trophy className="h-10 w-10 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium text-foreground">
        بارگذاری دستاوردها ناموفق بود.
      </p>
      <p className="text-xs text-muted-foreground">
        لطفاً اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.
      </p>
      <Button variant="glow" size="sm" onClick={onRetry} className="mt-2 gap-2">
        <Sparkles className="h-4 w-4" />
        تلاش دوباره
      </Button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
      <Award className="h-10 w-10 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium text-foreground">
        هیچ دستاوردی با این فیلترها یافت نشد.
      </p>
      <p className="text-xs text-muted-foreground">
        فیلترها را تغییر دهید تا دستاوردهای بیشتر را ببینید.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main gallery client                                                */
/* ------------------------------------------------------------------ */

export function AchievementsGalleryClient() {
  const reduceMotion = useReducedMotion()
  const { data: streak } = useReadingStreak()

  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')

  const [selected, setSelected] = useState<AchievementState | null>(null)

  /** Fetch from /api/achievements, then override with localStorage-only stats. */
  const fetchAchievements = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/achievements', { cache: 'no-store' })
      if (!res.ok) throw new Error('failed')
      const json = (await res.json()) as ApiResponse

      // Override server stats with client-only stats (booksStarted, gamesPlayed,
      // currentStreak, longestStreak, totalReadingDays).
      const localStats: AchievementStats = {
        ...json.stats,
        booksStarted: 0,
        gamesPlayed: 0,
        currentStreak: streak.currentStreak || json.stats.currentStreak,
        longestStreak: streak.longestStreak || json.stats.longestStreak,
        totalReadingDays: streak.totalReadingDays || json.stats.totalReadingDays,
      }
      // Apply localStorage-only fields (requires window).
      const refined = loadLocalStats(localStats)
      const unlockedAtMap = loadUnlockedAtMap()

      // `computeAchievementStates` now requires the defs as its first arg
      // (the legacy module-level `ACHIEVEMENT_DEFS` constant has been
      // deleted — the DB is the source of truth). The API response's
      // `achievements` field is an `AchievementState[]` which extends
      // `AchievementDef[]`, so we can pass it directly as the defs source.
      const achievements = computeAchievementStates(
        json.achievements,
        refined,
        unlockedAtMap,
      )

      // Persist unlockedAt for any newly-unlocked achievement that doesn't
      // have a timestamp yet. This gives us accurate dates going forward.
      let mapChanged = false
      const now = new Date().toISOString()
      for (const a of achievements) {
        if (a.unlocked && !a.unlockedAt) {
          unlockedAtMap[a.id] = now
          a.unlockedAt = now
          mapChanged = true
        }
      }
      if (mapChanged) saveUnlockedAtMap(unlockedAtMap)

      const unlocked = achievements.filter((a) => a.unlocked).length
      const total = achievements.length
      const totalXPEarned = achievements
        .filter((a) => a.unlocked)
        .reduce((sum, a) => sum + a.xpReward, 0)
      const completionPct =
        total > 0 ? Math.round((unlocked / total) * 100) : 0

      setData({
        achievements,
        stats: refined,
        summary: { total, unlocked, totalXPEarned, completionPct },
      })
    } catch (err) {
      console.error('[achievements-gallery] fetch failed:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [streak.currentStreak, streak.longestStreak, streak.totalReadingDays])

  // Initial fetch.
  useEffect(() => {
    fetchAchievements()
  }, [fetchAchievements])

  // Re-fetch on cross-tab storage changes (e.g. unlock in another tab).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === STORAGE_KEYS.progress ||
        e.key === STORAGE_KEYS.streak ||
        e.key === STORAGE_KEYS.vocabGamesPlayed ||
        e.key === STORAGE_KEYS.achievementsUnlockedAt
      ) {
        fetchAchievements()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [fetchAchievements])

  /** Filtered + sorted achievements for the grid. */
  const filtered = useMemo(() => {
    if (!data) return []
    return data.achievements.filter((a) => {
      if (statusFilter === 'unlocked' && !a.unlocked) return false
      if (statusFilter === 'locked' && a.unlocked) return false
      if (rarityFilter !== 'all' && a.rarity !== rarityFilter) return false
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false
      return true
    })
  }, [data, statusFilter, rarityFilter, categoryFilter])

  return (
    <div className="space-y-7 sm:space-y-8">
      {loading ? (
        <GallerySkeleton />
      ) : error ? (
        <ErrorState onRetry={fetchAchievements} />
      ) : data ? (
        <>
          <GalleryHeader
            total={data.summary.total}
            unlocked={data.summary.unlocked}
            completionPct={data.summary.completionPct}
            totalXPEarned={data.summary.totalXPEarned}
          />

          <StatsRow
            achievements={data.achievements}
            totalXPEarned={data.summary.totalXPEarned}
          />

          <FilterRow
            status={statusFilter}
            onStatus={setStatusFilter}
            rarity={rarityFilter}
            onRarity={setRarityFilter}
            category={categoryFilter}
            onCategory={setCategoryFilter}
          />

          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <motion.div
              layout={!reduceMotion}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              role="list"
              aria-label="فهرست دستاوردها"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((ach, i) => (
                  <AchievementCard
                    key={ach.id}
                    ach={ach}
                    index={i}
                    onSelect={setSelected}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Hidden helper text for screen readers — count summary */}
          <p className="sr-only" aria-live="polite">
            {data.summary.unlocked} از {data.summary.total} دستاورد باز شده.
          </p>
        </>
      ) : null}

      <AchievementDialog
        ach={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
