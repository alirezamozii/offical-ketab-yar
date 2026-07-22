'use client'

/**
 * src/components/dashboard/getting-started-guide.tsx
 * ---------------------------------------------------------------
 * A warm, actionable "Getting Started" card shown on the /dashboard
 * for brand-new users (guests or freshly-signed-in) who have:
 *   - No books in progress (inProgress.length === 0)
 *   - No saved vocabulary words (vocabCount === 0)
 *
 * The card walks the user through 4 steps with icons, Persian labels,
 * and deep-links to the relevant pages. It is dismissible for the
 * session (sessionStorage) so it doesn't annoy returning users who
 * just happen to have cleared their progress.
 *
 * Visual design: gold-themed card with a subtle gradient, staggered
 * step reveal animation, and per-step hover states. Respects
 * prefers-reduced-motion.
 *
 * Owner: CRON-REVIEW-202607171225
 * ---------------------------------------------------------------
 */

import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Compass,
  NotebookPen,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const DISMISS_KEY = 'ky_getting_started_dismissed'

interface Step {
  icon: typeof BookOpen
  title: string
  description: string
  href: string
  cta: string
  /** Roughly how many minutes this step takes — shown as a subtle hint. */
  minutes: number
}

const STEPS: Step[] = [
  {
    icon: Compass,
    title: 'کتابخانه را کاوش کنید',
    description:
      'از بین ده‌ها کتاب دوزبانه، یکی را انتخاب کنید. داستان، کلاسیک، ماجراجویی — همه با ترجمه فارسی.',
    href: '/library',
    cta: 'رفتن به کتابخانه',
    minutes: 2,
  },
  {
    icon: BookOpen,
    title: 'شروع به خواندن کنید',
    description:
      'با یک کلیک وارد ریدر حرفه‌ای شوید. ترجمه، دیکشنری، صوت و هوش مصنوعی — همه در دسترس.',
    href: '/library',
    cta: 'باز کردن ریدر',
    minutes: 1,
  },
  {
    icon: NotebookPen,
    title: 'واژگان خود را بسازید',
    description:
      'کلمات ناشناخته را با یک کلیک ذخیره کنید و با بازی‌های SRS آن‌ها را یاد بگیرید.',
    href: '/vocabulary',
    cta: 'بخش واژگان',
    minutes: 3,
  },
  {
    icon: Target,
    title: 'پیشرفت خود را دنبال کنید',
    description:
      'هدف روزانه تعیین کنید، زنجیره مطالعه را زنده نگه دارید و در لیدربورد صدر بگیرید.',
    href: '/goals',
    cta: 'تعیین هدف',
    minutes: 2,
  },
]

interface GettingStartedGuideProps {
  /** Reserved for future use — parent controls rendering visibility. */
  ready?: boolean
}

export function GettingStartedGuide({ ready: _ready }: GettingStartedGuideProps = {}) {
  const reduceMotion = useReducedMotion()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') setDismissed(true)
    } catch {
      /* ignore */
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  if (dismissed) return null

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-gold-500/30 bg-gradient-to-br from-gold-500/10 via-card to-card p-5 shadow-sm sm:p-7"
      aria-label="راهنمای شروع"
    >
      {/* Decorative gold orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-gold-700/10 blur-3xl"
      />

      {/* Header */}
      <div className="relative mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-lg shadow-gold-500/30">
            <Sparkles className="h-5 w-5" />
            <span
              aria-hidden
              className="absolute inset-0 rounded-2xl bg-gold-400/40 opacity-60 blur-md"
            />
          </span>
          <div>
            <h2 className="text-lg font-extrabold leading-tight text-foreground sm:text-xl">
              شروع کار با کتاب‌یار
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              ۴ قدم ساده تا شروع ماجراجویی دوزبانه شما
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="بستن راهنما"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Steps */}
      <ol className="relative space-y-3">
        {/* Vertical connecting line */}
        <span
          aria-hidden
          className="absolute right-[22px] top-2 bottom-2 w-px bg-gradient-to-b from-gold-500/40 via-border to-transparent sm:right-[26px]"
        />

        {STEPS.map((step, i) => {
          const Icon = step.icon
          return (
            <motion.li
              key={step.title}
              initial={reduceMotion ? false : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.1 + i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Link
                href={step.href}
                className="group flex items-start gap-3 rounded-2xl border border-transparent p-2.5 transition-[transform,opacity,colors,border-color,background-color] hover:border-border hover:bg-card/80 sm:p-3"
              >
                {/* Step number circle */}
                <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-gold-500/40 bg-card text-sm font-bold text-gold-700 transition-colors group-hover:border-gold-500 group-hover:bg-gold-500 group-hover:text-white dark:text-gold-400 sm:h-[52px] sm:w-[52px]">
                  <Icon className="h-5 w-5" />
                </span>

                {/* Content */}
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground sm:text-base">
                      {step.title}
                    </h3>
                    <span className="hidden shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
                      {step.minutes} دقیقه
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {step.description}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold-700 transition-[transform,opacity,colors,border-color,background-color] group-hover:gap-2 dark:text-gold-400">
                    {step.cta}
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </span>
                </div>

                {/* Step index badge */}
                <span
                  aria-hidden
                  className="mt-1 text-2xl font-black text-gold-500/15 sm:text-3xl"
                >
                  {(i + 1).toLocaleString('fa-IR')}
                </span>
              </Link>
            </motion.li>
          )
        })}
      </ol>

      {/* Footer hint */}
      <div className="relative mt-5 flex items-center gap-2 rounded-2xl bg-gold-500/5 px-4 py-3 text-xs text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-gold-600 dark:text-gold-400" />
        <span>
          همین که اولین کتاب را شروع کنید یا اولین واژه را ذخیره کنید، این راهنما
          ناپدید می‌شود.
        </span>
      </div>
    </motion.section>
  )
}
