'use client'

/**
 * src/components/onboarding/onboarding-flow.tsx
 * ---------------------------------------------------------------
 * Multi-step first-run wizard. Five steps:
 *
 *   0. Welcome         — animated gold-book logo, start / skip CTA
 *   1. Reading Level   — Beginner / Intermediate / Advanced
 *   2. Genres          — pick up to 5 favorite genres
 *   3. First Book      — 4-6 recommendations based on level + genres
 *   4. Ready           — summary, confetti, +50 XP bonus, go to dashboard
 *
 * Visual language:
 *   - Strictly gold/amber/emerald/rose/teal/stone palette (NO indigo/blue).
 *   - Reuses shadcn/ui Dialog, Button, Badge, Progress, Skeleton, BookCover.
 *   - Framer-motion AnimatePresence for step transitions, confetti, XP pop.
 *   - All animations gated on `useReducedMotion()`.
 *   - All UI text in Persian (RTL). Book text (English) uses `dir="ltr"`.
 *   - Full-screen on mobile (inset-0), centered modal on desktop.
 *
 * Owner: onboarding-flow-builder (CRON4-B).
 * ---------------------------------------------------------------
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BookCover } from '@/components/books/book-cover'
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  Drama,
  Ghost,
  Heart,
  Laugh,
  Leaf,
  Mountain,
  PartyPopper,
  Rocket,
  ScrollText,
  Sparkles,
  Star,
  Swords,
  TreePalm,
  Wand2,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import {
  completeOnboarding,
  skipOnboarding,
  type OnboardingState,
} from '@/lib/onboarding'
import { cefrToDifficulty } from '@/lib/gamification'
import type { BookListItem } from '@/lib/data'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Static step + level config
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 5 // 0..4

interface LevelOption {
  id: 'beginner' | 'intermediate' | 'advanced'
  title: string
  range: string
  description: string
  icon: LucideIcon
  /** Tailwind gradient + ring classes for this option. */
  accent: {
    glow: string
    iconBg: string
    selectedBorder: string
    selectedGlow: string
  }
  /** CEFR levels that should match this option when filtering books. */
  levels: string[]
}

const LEVEL_OPTIONS: LevelOption[] = [
  {
    id: 'beginner',
    title: 'مبتدی',
    range: 'A1 — A2',
    description: 'تازه شروع به یادگیری زبان کرده‌ام',
    icon: Rocket,
    accent: {
      glow: 'bg-emerald-500/10',
      iconBg:
        'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30',
      selectedBorder: 'border-emerald-400/70',
      selectedGlow: 'shadow-glow-gold',
    },
    levels: ['A1', 'A2'],
  },
  {
    id: 'intermediate',
    title: 'متوسط',
    range: 'B1 — B2',
    description: 'می‌توانم متون ساده را بخوانم',
    icon: BookOpen,
    accent: {
      glow: 'bg-amber-500/10',
      iconBg:
        'bg-gradient-to-br from-gold-500 to-amber-600 text-white shadow-lg shadow-gold-500/30',
      selectedBorder: 'border-gold-400/80',
      selectedGlow: 'shadow-glow-gold',
    },
    levels: ['B1', 'B2'],
  },
  {
    id: 'advanced',
    title: 'پیشرفته',
    range: 'C1 — C2',
    description: 'با متن‌های پیچیده راحت هستم',
    icon: Sparkles,
    accent: {
      glow: 'bg-rose-500/10',
      iconBg:
        'bg-gradient-to-br from-rose-500 to-amber-600 text-white shadow-lg shadow-rose-500/30',
      selectedBorder: 'border-rose-400/70',
      selectedGlow: 'shadow-glow-gold',
    },
    levels: ['C1', 'C2'],
  },
]

interface GenreOption {
  /** English tag stored in books' genres JSON. */
  tag: string
  /** Persian label shown in the chip. */
  label: string
  icon: LucideIcon
  /** Subtle Tailwind tint applied to the chip icon. */
  tint: string
}

const GENRE_OPTIONS: GenreOption[] = [
  { tag: 'Classic', label: 'کلاسیک', icon: ScrollText, tint: 'text-gold-600 dark:text-gold-400' },
  { tag: 'Adventure', label: 'ماجراجویی', icon: Swords, tint: 'text-amber-600 dark:text-amber-400' },
  { tag: 'Fantasy', label: 'فانتزی', icon: Wand2, tint: 'text-rose-500 dark:text-rose-400' },
  { tag: 'Children', label: 'کودکانه', icon: Star, tint: 'text-teal-600 dark:text-teal-400' },
  { tag: 'Romance', label: 'عاشقانه', icon: Heart, tint: 'text-rose-600 dark:text-rose-400' },
  { tag: 'Drama', label: 'درام', icon: Drama, tint: 'text-stone-500 dark:text-stone-300' },
  { tag: 'Horror', label: 'ترسناک', icon: Ghost, tint: 'text-stone-700 dark:text-stone-200' },
  { tag: 'Nature', label: 'طبیعت', icon: Leaf, tint: 'text-emerald-600 dark:text-emerald-400' },
  { tag: 'Comedy', label: 'طنز', icon: Laugh, tint: 'text-amber-500 dark:text-amber-400' },
  { tag: 'Mystery', label: 'معمایی', icon: Compass, tint: 'text-teal-600 dark:text-teal-400' },
  { tag: 'Science Fiction', label: 'علمی-تخیلی', icon: Rocket, tint: 'text-emerald-600 dark:text-emerald-400' },
  { tag: 'Fiction', label: 'داستانی', icon: BookOpen, tint: 'text-gold-600 dark:text-gold-400' },
  { tag: 'Historical', label: 'تاریخی', icon: ScrollText, tint: 'text-stone-600 dark:text-stone-300' },
  { tag: 'Young Adult', label: 'نوجوانانه', icon: TreePalm, tint: 'text-amber-600 dark:text-amber-400' },
  { tag: 'Coming of Age', label: 'بلوغ', icon: Mountain, tint: 'text-rose-500 dark:text-rose-400' },
  { tag: 'Literary', label: 'ادبی', icon: ScrollText, tint: 'text-gold-700 dark:text-gold-400' },
]

const MAX_GENRES = 5

// ---------------------------------------------------------------------------
// Confetti — pure framer-motion, no external dependency.
// 40 gold/amber/emerald/rose/teal particles falling from the top of the dialog.
// ---------------------------------------------------------------------------

const CONFETTI_COLORS = [
  'bg-gold-400',
  'bg-amber-400',
  'bg-emerald-400',
  'bg-rose-400',
  'bg-teal-400',
]

// Tiny seeded RNG (mulberry32) — keeps the confetti layout stable between
// renders so React doesn't re-mount the particles on every state change.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function Confetti({ run }: { run: boolean }) {
  const reduceMotion = useReducedMotion()
  // Deterministic particle set — generated once per mount so the layout
  // doesn't reshuffle on re-render. Stable enough to keep React happy.
  const particles = React.useMemo(() => {
    const rng = mulberry32(20240117)
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: rng() * 100, // % across the width
      delay: rng() * 0.6, // s
      duration: 1.4 + rng() * 1.6, // s
      rotate: (rng() - 0.5) * 720, // deg
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + Math.floor(rng() * 6), // px
    }))
  }, [])

  if (reduceMotion || !run) return null

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className={cn('absolute top-0 rounded-[2px]', p.color)}
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size * 0.6,
          }}
          initial={{ y: -20, opacity: 0, rotate: 0 }}
          animate={{ y: '120%', opacity: [0, 1, 1, 0], rotate: p.rotate }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeIn',
            repeat: 0,
          }}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Floating "+50 XP" animation — rises from the center and fades.
// ---------------------------------------------------------------------------

function XpPop({ run }: { run: boolean }) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion || !run) return null
  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 select-none"
      initial={{ opacity: 0, y: 0, scale: 0.6 }}
      animate={{ opacity: [0, 1, 1, 0], y: -80, scale: 1 }}
      transition={{ duration: 1.8, ease: 'easeOut', delay: 0.2 }}
      aria-hidden="true"
    >
      <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-500 to-amber-600 px-5 py-2 text-base font-extrabold text-white shadow-lg shadow-gold-500/40">
        <Zap className="h-5 w-5" />
        +۵۰ XP
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Progress indicator — top of the modal. Shows dots + a thin gold bar.
// ---------------------------------------------------------------------------

function StepProgress({ step }: { step: number }) {
  const reduceMotion = useReducedMotion()
  const { toPersianDigits } = usePersianLocale()
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <div className="flex flex-1 items-center gap-1.5">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <motion.span
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              i <= step
                ? 'bg-gradient-to-r from-gold-500 to-amber-500'
                : 'bg-border/70',
            )}
            initial={reduceMotion ? false : { scaleX: 0.6, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            style={{ transformOrigin: 'right' }}
          />
        ))}
      </div>
      <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
        {toPersianDigits(step + 1)} از {toPersianDigits(TOTAL_STEPS)}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step variants — slide-in from the right (RTL natural direction).
// ---------------------------------------------------------------------------

function useStepVariants() {
  const reduceMotion = useReducedMotion()
  return React.useMemo<Variants>(
    () =>
      reduceMotion
        ? { enter: { opacity: 1 }, center: { opacity: 1 }, exit: { opacity: 1 } }
        : {
            enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
            center: { opacity: 1, x: 0 },
            exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
          },
    [reduceMotion],
  )
}

// ---------------------------------------------------------------------------
// Step 0 — Welcome
// ---------------------------------------------------------------------------

function WelcomeStep({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  const reduceMotion = useReducedMotion()
  return (
    <div className="relative flex flex-col items-center justify-center gap-7 py-6 text-center sm:py-10">
      {/* Floating decorative book icons — subtle, behind content */}
      {!reduceMotion && (
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.15]" aria-hidden="true">
          {[
            { Icon: BookOpen, x: '8%', y: '14%', s: 28, d: 0 },
            { Icon: Sparkles, x: '82%', y: '18%', s: 22, d: 0.4 },
            { Icon: Star, x: '14%', y: '78%', s: 20, d: 0.8 },
            { Icon: BookOpen, x: '88%', y: '72%', s: 26, d: 1.2 },
            { Icon: Heart, x: '50%', y: '8%', s: 18, d: 1.6 },
          ].map(({ Icon, x, y, s, d }, i) => (
            <motion.div
              key={i}
              className="absolute text-gold-500"
              style={{ left: x, top: y }}
              animate={{ y: [0, -10, 0], rotate: [0, 6, 0] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: d }}
            >
              <Icon style={{ width: s, height: s }} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Animated gold book logo with sparkles */}
      <motion.div
        className="relative"
        initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Soft gold halo behind the book */}
        <div
          className="pointer-events-none absolute -inset-6 rounded-full bg-gold-500/25 blur-2xl"
          aria-hidden="true"
        />
        <motion.div
          className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 text-white shadow-2xl shadow-gold-500/40 sm:h-32 sm:w-32"
          animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <BookOpen className="h-14 w-14 sm:h-16 sm:w-16" strokeWidth={1.5} />
          {/* Twinkle sparkles */}
          {!reduceMotion && (
            <>
              <motion.span
                className="absolute -right-2 -top-2 text-amber-200"
                animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
              >
                <Sparkles className="h-5 w-5" />
              </motion.span>
              <motion.span
                className="absolute -bottom-1 -left-3 text-amber-200"
                animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: 1 }}
              >
                <Sparkles className="h-4 w-4" />
              </motion.span>
            </>
          )}
        </motion.div>
      </motion.div>

      <div className="space-y-3">
        <motion.h2
          className="text-2xl font-extrabold tracking-tight text-glow-gold sm:text-3xl"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          به کتاب‌یار خوش آمدید!
        </motion.h2>
        <motion.p
          className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          بیایید با هم سفر مطالعه شما را شروع کنیم. فقط چند پرسال کوتاه تا
          پیشنهاد کتاب اول شما.
        </motion.p>
      </div>

      <motion.div
        className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Button size="xl" variant="glow" className="gap-2 px-8" onClick={onStart}>
          <Sparkles className="h-5 w-5" />
          شروع
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="text-muted-foreground hover:text-foreground"
          onClick={onSkip}
        >
          رد کردن
        </Button>
      </motion.div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 1 — Reading Level
// ---------------------------------------------------------------------------

function LevelStep({
  value,
  onChange,
}: {
  value?: string
  onChange: (id: 'beginner' | 'intermediate' | 'advanced') => void
}) {
  const reduceMotion = useReducedMotion()
  return (
    <div className="space-y-5 py-2">
      <div className="space-y-1.5 text-center sm:text-right">
        <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
          سطح زبان خود را انتخاب کنید
        </h2>
        <p className="text-sm text-muted-foreground">
          برای پیشنهاد کتاب‌های متناسب با سطح شما.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {LEVEL_OPTIONS.map((opt, i) => {
          const Icon = opt.icon
          const selected = value === opt.id
          return (
            <motion.button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              whileHover={reduceMotion ? undefined : { y: -3 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              aria-pressed={selected}
              aria-label={`سطح ${opt.title} (${opt.range})`}
              className={cn(
                'group relative flex flex-col items-start gap-3 rounded-2xl border-2 p-4 text-right transition-[transform,opacity,colors,border-color,background-color] duration-300',
                selected
                  ? cn(opt.accent.selectedBorder, opt.accent.selectedGlow, 'bg-card')
                  : 'border-border/60 bg-card/60 hover:border-gold-400/40 hover:bg-card',
              )}
            >
              {/* Selected check badge */}
              <AnimatePresence>
                {selected && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-amber-600 text-white shadow-md"
                    aria-hidden="true"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </motion.span>
                )}
              </AnimatePresence>

              <div
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-xl transition-transform',
                  opt.accent.iconBg,
                  !reduceMotion && 'group-hover:scale-110',
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold">{opt.title}</span>
                  <Badge
                    variant="secondary"
                    className="bg-gold-500/15 text-gold-700 dark:text-gold-400"
                  >
                    {opt.range}
                  </Badge>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {opt.description}
                </p>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2 — Favorite Genres
// ---------------------------------------------------------------------------

function GenresStep({
  value,
  onChange,
}: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  const reduceMotion = useReducedMotion()
  const { toPersianDigits } = usePersianLocale()
  const atMax = value.length >= MAX_GENRES

  function toggle(tag: string) {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag))
    } else if (value.length < MAX_GENRES) {
      onChange([...value, tag])
    }
  }

  return (
    <div className="space-y-5 py-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="space-y-1.5">
          <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
            ژانرهای موردعلاقه خود را انتخاب کنید
          </h2>
          <p className="text-sm text-muted-foreground">
            حداقل یک ژانر — حداکثر پنج ژانر.
          </p>
        </div>
        <Badge
          variant="secondary"
          className={cn(
            'tabular-nums',
            atMax
              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
              : 'bg-gold-500/15 text-gold-700 dark:text-gold-400',
          )}
        >
          {toPersianDigits(value.length)} از {toPersianDigits(MAX_GENRES)} انتخاب شده
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
        {GENRE_OPTIONS.map((g, i) => {
          const Icon = g.icon
          const selected = value.includes(g.tag)
          const disabled = !selected && atMax
          return (
            <motion.button
              key={g.tag}
              type="button"
              onClick={() => toggle(g.tag)}
              disabled={disabled}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4), duration: 0.3 }}
              whileHover={!disabled && !reduceMotion ? { y: -2 } : undefined}
              whileTap={!disabled && !reduceMotion ? { scale: 0.97 } : undefined}
              aria-pressed={selected}
              aria-label={`ژانر ${g.label}`}
              className={cn(
                'group relative flex items-center gap-2.5 rounded-xl border-2 px-3 py-3 text-right transition-[transform,opacity,colors,border-color,background-color] duration-200',
                selected
                  ? 'border-gold-400/80 bg-gradient-to-br from-gold-500/20 to-amber-500/10 shadow-glow-gold'
                  : 'border-border/60 bg-card/60 hover:border-gold-400/40 hover:bg-card',
                disabled && 'cursor-not-allowed opacity-40',
              )}
            >
              {selected && (
                <span
                  className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-amber-600 text-white shadow"
                  aria-hidden="true"
                >
                  <Check className="h-3 w-3" />
                </span>
              )}
              <Icon className={cn('h-4 w-4 shrink-0', g.tint)} />
              <span className="text-sm font-semibold">{g.label}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3 — First Book Recommendation
// ---------------------------------------------------------------------------

function FirstBookStep({
  levelId,
  genres,
  onSelect,
  onSkip,
}: {
  levelId: string
  genres: string[]
  onSelect: (slug: string) => void
  onSkip: () => void
}) {
  const reduceMotion = useReducedMotion()
  const { toPersianDigits } = usePersianLocale()
  const [books, setBooks] = React.useState<BookListItem[]>([])
  const [loading, setLoading] = React.useState(true)

  // Map the chosen level bucket (beginner/intermediate/advanced) to the
  // concrete CEFR strings stored on Book.level. Falls back to all books
  // if the user skipped step 1.
  const levelCEFRs = React.useMemo(() => {
    const opt = LEVEL_OPTIONS.find((o) => o.id === levelId)
    return opt?.levels ?? []
  }, [levelId])

  React.useEffect(() => {
    let alive = true
    fetch('/api/books?sort=rating&limit=100')
      .then((r) => (r.ok ? r.json() : []))
      .then((all: BookListItem[]) => {
        if (!alive) return
        // Score every book by:
        //   +3 for matching CEFR level (exact)
        //   +2 for sharing the level bucket (cefrToDifficulty)
        //   +1 per matching favorite genre
        // Then take top 6.
        const targetBucket = levelId
          ? cefrToDifficulty(levelCEFRs[0] || 'B1')
          : null
        const scored = all
          .map((b) => {
            let score = 0
            if (levelCEFRs.includes(b.level)) score += 3
            if (targetBucket && cefrToDifficulty(b.level) === targetBucket) score += 2
            if (genres.length > 0) {
              for (const g of b.genres) {
                if (genres.includes(g)) score += 1
              }
            }
            // Tiny rating tiebreaker so a 4.8★ pips a 4.6★ on equal score.
            score += Math.min(0.99, b.rating / 5)
            return { b, score }
          })
          .sort((a, z) => z.score - a.score)
          .slice(0, 6)
          .map((s) => s.b)
        setBooks(scored)
        setLoading(false)
      })
      .catch(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [levelCEFRs, levelId, genres])

  return (
    <div className="space-y-5 py-2">
      <div className="space-y-1.5">
        <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
          کتاب اول خود را انتخاب کنید
        </h2>
        <p className="text-sm text-muted-foreground">
          بر اساس سطح و ژانرهای انتخابی شما — هرکدام را که بخواهید شروع کنید.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          کتابی برای نمایش یافت نشد. می‌توانید بعداً از کتابخانه انتخاب کنید.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((b, i) => {
            const levelOpt = LEVEL_OPTIONS.find((o) => o.levels.includes(b.level))
            const Icon = levelOpt?.icon ?? BookOpen
            return (
              <motion.div
                key={b.id}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.35 }}
                className="group relative flex gap-3 overflow-hidden rounded-2xl border-2 border-border/60 bg-card/60 p-3 transition-[transform,opacity,colors,border-color,background-color] duration-300 hover:border-gold-400/50 hover:bg-card hover:shadow-glow-gold"
              >
                {/* Cover thumbnail */}
                <div className="relative h-32 w-20 shrink-0 overflow-hidden rounded-lg">
                  <BookCover
                    title={b.title}
                    author={b.author}
                    from={b.coverFrom}
                    to={b.coverTo}
                    accent={b.coverAccent}
                    size="sm"
                  />
                </div>
                {/* Meta */}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="secondary"
                      className={cn('gap-1', levelOpt?.accent.glow)}
                    >
                      <Icon className="h-3 w-3" />
                      {b.level}
                    </Badge>
                    {b.genres.slice(0, 1).map((g) => (
                      <Badge
                        key={g}
                        variant="outline"
                        className="border-gold-500/30 text-gold-700 dark:text-gold-400"
                      >
                        {GENRE_OPTIONS.find((x) => x.tag === g)?.label ?? g}
                      </Badge>
                    ))}
                  </div>
                  <h3
                    className="line-clamp-2 text-sm font-bold leading-snug"
                    dir="ltr"
                    title={b.title}
                  >
                    {b.title}
                  </h3>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {b.author}
                  </p>
                  <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                    {b.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      {toPersianDigits(b.pageCount)} صفحه
                    </span>
                    <Button
                      size="sm"
                      variant="glow"
                      className="gap-1.5"
                      onClick={() => onSelect(b.slug)}
                      aria-label={`شروع مطالعه ${b.title}`}
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      شروع مطالعه
                    </Button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <div className="text-center">
        <Button
          variant="link"
          className="text-muted-foreground"
          onClick={onSkip}
        >
          بعداً انتخاب می‌کنم
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 4 — Ready (summary + confetti + XP pop)
// ---------------------------------------------------------------------------

function ReadyStep({
  state,
  onGoToDashboard,
}: {
  state: {
    readingLevel?: string
    favoriteGenres?: string[]
    firstBookSlug?: string
  }
  onGoToDashboard: () => void
}) {
  const reduceMotion = useReducedMotion()
  const levelOpt = LEVEL_OPTIONS.find((o) => o.id === state.readingLevel)
  const levelLabel = levelOpt?.title ?? 'متوسط'
  const genresLabel =
    state.favoriteGenres && state.favoriteGenres.length > 0
      ? state.favoriteGenres
          .map(
            (g) => GENRE_OPTIONS.find((x) => x.tag === g)?.label ?? g,
          )
          .join('، ')
      : 'بدون انتخاب'

  return (
    <div className="relative flex flex-col items-center justify-center gap-6 py-6 text-center sm:py-10">
      <Confetti run />
      <XpPop run />

      <motion.div
        initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        <div
          className="pointer-events-none absolute -inset-6 rounded-full bg-gold-500/25 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 text-white shadow-2xl shadow-gold-500/40">
          <PartyPopper className="h-12 w-12" strokeWidth={1.6} />
        </div>
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <h2 className="text-2xl font-extrabold tracking-tight text-glow-gold sm:text-3xl">
          همه آماده است!
        </h2>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
          تنظیمات اولیه شما ذخیره شد. امتیاز ورود به شما اهدا شد.
        </p>
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-md rounded-2xl border border-gold-500/30 bg-gradient-to-br from-gold-500/10 via-card to-card p-4 text-right shadow-glow-gold"
      >
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gold-700 dark:text-gold-400">
          <Sparkles className="h-3.5 w-3.5" />
          خلاصه
        </div>
        <dl className="space-y-1.5 text-sm">
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">سطح</dt>
            <dd className="font-semibold">{levelLabel}</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">ژانرهای موردعلاقه</dt>
            <dd className="max-w-[60%] text-left font-semibold" dir="rtl">
              {genresLabel}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">کتاب اول</dt>
            <dd className="font-semibold">
              {state.firstBookSlug ? (
                <span dir="ltr">{state.firstBookSlug}</span>
              ) : (
                'بدون انتخاب'
              )}
            </dd>
          </div>
        </dl>
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button size="xl" variant="glow" className="gap-2 px-8" onClick={onGoToDashboard}>
          <Sparkles className="h-5 w-5" />
          بریم به داشبورد!
        </Button>
      </motion.div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main OnboardingFlow component
// ---------------------------------------------------------------------------

export interface OnboardingFlowProps {
  /** Called when the wizard closes (either completed or skipped). */
  onClose?: () => void
}

export function OnboardingFlow({ onClose }: OnboardingFlowProps) {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const stepVariants = useStepVariants()

  const [step, setStep] = React.useState(0)
  const [direction, setDirection] = React.useState(1)
  const [readingLevel, setReadingLevel] = React.useState<
    'beginner' | 'intermediate' | 'advanced' | undefined
  >(undefined)
  const [favoriteGenres, setFavoriteGenres] = React.useState<string[]>([])
  const [firstBookSlug, setFirstBookSlug] = React.useState<string | undefined>(
    undefined,
  )
  const [open, setOpen] = React.useState(true)

  // Prevent body scroll while the wizard is open. Radix Dialog normally
  // handles this, but our DialogContent is custom-styled so we add an
  // extra guard.
  React.useEffect(() => {
    if (typeof document === 'undefined') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  function go(next: number) {
    const clamped = Math.max(0, Math.min(TOTAL_STEPS - 1, next))
    setDirection(clamped > step ? 1 : -1)
    setStep(clamped)
  }

  function handleSkip() {
    skipOnboarding()
    setOpen(false)
    onClose?.()
  }

  async function handleSelectBook(slug: string) {
    setFirstBookSlug(slug)
    await completeOnboarding({
      readingLevel: readingLevel ?? 'intermediate',
      favoriteGenres,
      firstBookSlug: slug,
    })
    setOpen(false)
    onClose?.()
    // Navigate to the reader for the chosen book.
    router.push(`/books/${slug}`)
  }

  async function handleSkipToReady() {
    // Skip from a middle step → jump to the final step with defaults.
    if (!readingLevel) setReadingLevel('intermediate')
    await completeOnboarding({
      readingLevel: readingLevel ?? 'intermediate',
      favoriteGenres,
      firstBookSlug,
    })
    go(TOTAL_STEPS - 1)
  }

  function handleGoToDashboard() {
    setOpen(false)
    onClose?.()
    router.push('/dashboard')
  }

  // Step content renderer
  function renderStep() {
    switch (step) {
      case 0:
        return <WelcomeStep onStart={() => go(1)} onSkip={handleSkip} />
      case 1:
        return (
          <LevelStep
            value={readingLevel}
            onChange={(id) => setReadingLevel(id)}
          />
        )
      case 2:
        return (
          <GenresStep
            value={favoriteGenres}
            onChange={setFavoriteGenres}
          />
        )
      case 3:
        return (
          <FirstBookStep
            levelId={readingLevel ?? 'intermediate'}
            genres={favoriteGenres}
            onSelect={handleSelectBook}
            onSkip={handleSkipToReady}
          />
        )
      case 4:
        return (
          <ReadyStep
            state={{ readingLevel, favoriteGenres, firstBookSlug }}
            onGoToDashboard={handleGoToDashboard}
          />
        )
      default:
        return null
    }
  }

  // Navigation footer — hidden on welcome (step 0) and ready (step 4) which
  // have their own CTAs.
  const showFooter = step > 0 && step < TOTAL_STEPS - 1
  const canAdvance =
    step === 1
      ? Boolean(readingLevel)
      : step === 2
        ? favoriteGenres.length > 0
        : true

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleSkip()
        else setOpen(o)
      }}
    >
      <DialogContent
        showCloseButton={false}
        // Full-screen on mobile, centered modal on desktop. We override the
        // default DialogContent positioning entirely.
        className="fixed inset-0 top-auto left-auto z-50 flex h-full w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-y-auto rounded-none border-0 bg-background p-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[92vh] sm:w-[min(720px,92vw)] sm:max-w-[720px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border-2 sm:border-gold-500/30 sm:shadow-glow-gold"
        aria-describedby={undefined}
      >
        {/* Hidden a11y title/description — Radix requires a DialogTitle. */}
        <DialogTitle className="sr-only">معرفی کتاب‌یار</DialogTitle>
        <DialogDescription id="onboarding-desc" className="sr-only">
          راهنمای چندمرحله‌ای شروع کار با کتاب‌یار.
        </DialogDescription>

        {/* Animated gradient background — gold/amber mesh, very subtle */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-mesh-gold opacity-70"
          aria-hidden="true"
        />
        {/* Ambient gold halos that drift between steps */}
        {!reduceMotion && (
          <>
            <motion.div
              className="pointer-events-none absolute -left-20 top-0 h-60 w-60 rounded-full bg-gold-500/10 blur-3xl"
              animate={{ x: [0, 20, 0], y: [0, 30, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            />
            <motion.div
              className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-amber-600/10 blur-3xl"
              animate={{ x: [0, -25, 0], y: [0, -20, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            />
          </>
        )}

        {/* Top bar — progress + skip */}
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/40 bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6">
          {step > 0 ? (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => go(step - 1)}
              aria-label="مرحله قبلی"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="w-9 shrink-0" aria-hidden="true" />
          )}
          <div className="flex-1">
            <StepProgress step={step} />
          </div>
          {step > 0 && step < TOTAL_STEPS - 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              onClick={handleSkip}
            >
              رد کردن
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
          {step === TOTAL_STEPS - 1 && (
            <div className="w-9 shrink-0" aria-hidden="true" />
          )}
        </header>

        {/* Step body — animated transitions */}
        <main className="relative flex-1 px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer — Back / Next */}
        {showFooter && (
          <footer className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-border/40 bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6">
            <Button
              variant="ghost"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => go(step - 1)}
            >
              <ArrowRight className="h-4 w-4" />
              قبلی
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="link" className="text-muted-foreground" onClick={handleSkip}>
                رد کردن
              </Button>
              <Button
                variant="glow"
                className="gap-1.5"
                disabled={!canAdvance}
                onClick={() => go(step + 1)}
              >
                {step === TOTAL_STEPS - 2 ? 'تکمیل' : 'بعدی'}
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </footer>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Convenience export — the OnboardingState type re-exported for callers.
// ---------------------------------------------------------------------------

export type { OnboardingState }
