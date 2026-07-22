'use client'

import { Button } from '@/components/ui/button'
import { toPersianDigits } from '@/lib/typography'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Dices,
  ImageIcon,
  Languages,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Magnetic } from '@/components/home/magnetic'

const VALUE_PILLS = [
  { icon: Languages, label: 'دوزبانه فارسی/انگلیسی' },
  { icon: Brain, label: 'هوش مصنوعی' },
  { icon: Trophy, label: 'بازی‌وارسازی' },
]

export function HeroSection({ booksCount = 0 }: { booksCount?: number } = {}) {
  const reduceMotion = useReducedMotion()

  // Parallax / mouse-tracking hooks removed — were only used by the
  // floating books that have been deleted per user feedback.
  // Keeping the section lean and free of dead motion values.

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-gradient-to-br from-gold-50 via-beige-100 to-gold-200/60 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"
    >
      <div className="pointer-events-none absolute inset-0">
        {/* Soft, controlled radial highlights — much subtler than before.
            Two warm orbs instead of aggressive purple/blue AI gradients. */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(184,149,106,0.18),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_75%,rgba(212,175,55,0.12),transparent_45%)]" />
        <div className="absolute inset-0 bg-dot-pattern opacity-30 dark:opacity-20" />

        {/* Slow, periodic glow pulse on the brand mark area.
            Controlled cadence (8s) and very soft — not a flicker.
            Disabled under reduced-motion. */}
        <motion.div
          aria-hidden="true"
          className="absolute right-1/4 top-1/4 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl"
          animate={
            reduceMotion
              ? undefined
              : { opacity: [0.4, 0.7, 0.4], scale: [1, 1.05, 1] }
          }
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Hero layout — MUST fit above the fold (header + hero in one viewport)
          on desktop. Per user feedback: "الان اینروی که باید بکم اسکرول کنم"
          — drastically reduced top/bottom padding so everything fits.
          On a 900px-tall viewport: h-14 header (56px) + hero content needs
          to fit in ~844px. Reduced from pt-28/pb-24 to pt-12/pb-8 on lg. */}
      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 md:pb-12 md:pt-16 lg:pb-16 lg:pt-20">
        {/* Two-column layout per user feedback:
            "تو دستکتاپ زاست چین کن من بعدا سمت چپ لی اوت اینا هالی باشه
             من بعدا یه عکسی از مسکات ما میزارم فعلا درست نشده ولی دوتایی
             لی اوت توبر عکسه"
            → On desktop: text on the right (RTL start), image placeholder
              on the left. On mobile: single column, text only (image
              hidden to save space). The placeholder is where the user
              will later drop a screenshot/mockup of the app. */}
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Copy — text content (right side on desktop RTL).
              Per user feedback: "این مانا جاستیفای ار راست مشن از چپن
              درست کن همشونو" — all text/elements must be RIGHT-aligned
              (RTL start), not left-aligned. In RTL: text-start = right,
              text-end = left. So we use text-start on desktop. */}
          <div className="space-y-4 text-center lg:text-start">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-gold-300/60 bg-beige-200/70 px-4 py-2 dark:border-gold-500/20 dark:bg-gold-500/10"
            >
              <Sparkles aria-hidden="true" className="h-4 w-4 text-gold-600 dark:text-gold-400" />
              <span className="text-sm font-semibold text-gold-800 dark:text-gold-300">
                پلتفرم مطالعه هوشمند با AI
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="space-y-3"
            >
              <h1
                id="hero-heading"
                className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
              >
                {/* Brand wordmark with a *very* subtle, slow gold glow —
                    one calm pulse every 6s, not the previous aggressive
                    random flicker. */}
                <span className="relative inline-block">
                  <span
                    aria-hidden="true"
                    className="absolute -inset-2 rounded-full bg-gold-400/20 blur-2xl motion-safe:animate-pulse-slow"
                  />
                  <span className="relative bg-gradient-to-l from-gold-500 via-gold-600 to-gold-700 bg-clip-text text-transparent">
                    کتاب‌یار
                  </span>
                </span>
              </h1>
              <h2 className="text-2xl font-bold leading-snug text-foreground/90 sm:text-3xl lg:text-4xl">
                انگلیسی را با کتاب، هوش مصنوعی و بازی یاد بگیر
              </h2>
            </motion.div>

            {/* Value-prop pills */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap items-center justify-center gap-2 lg:justify-start"
            >
              {VALUE_PILLS.map((p) => {
                const Icon = p.icon
                return (
                  <span
                    key={p.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/30 bg-card/70 px-3 py-1.5 text-xs font-semibold text-foreground/80 backdrop-blur-sm sm:text-sm"
                  >
                    <Icon aria-hidden="true" className="h-3.5 w-3.5 text-gold-600 dark:text-gold-400" />
                    {p.label}
                  </span>
                )
              })}
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0"
            >
              ترجمه پاراگراف به پاراگراف، دیکشنری فوری، چت با هوش مصنوعی و
              سیستم امتیاز و سطح. یادگیری زبان انگلیسی هرگز این‌قدر لذت‌بخش نبوده.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row lg:justify-start"
            >
              {/* Primary CTA — "شروع رایگان" → /library
                  Per user feedback: added Magnetic + shimmer effects
                  (same as the CTA section's "ورود به کتابخانه" button). */}
              <Magnetic strength={12} className="w-full sm:w-auto">
                <div className="group/cta relative w-full sm:w-auto">
                  {/* Pulse glow ring */}
                  <span
                    aria-hidden="true"
                    className="absolute -inset-1 rounded-xl bg-gold-500/30 opacity-50 blur-md transition-opacity duration-300 group-hover/cta:opacity-80"
                  />
                  <Button
                    asChild
                    size="xl"
                    variant="glow"
                    className="relative w-full overflow-hidden text-base sm:w-auto"
                  >
                    <Link
                      href="/library"
                      accessKey="l"
                      aria-label="شروع رایگان — ورود به کتابخانه (Alt+L)"
                      title="شروع رایگان (Alt+L)"
                    >
                      {/* Shimmer sweep on hover — same as CTA button */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
                      >
                        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-[1100ms] ease-out-expo group-hover/cta:translate-x-full" />
                      </span>
                      <BookOpen aria-hidden="true" className="relative h-5 w-5" />
                      <span className="relative">شروع رایگان</span>
                      <ArrowLeft aria-hidden="true" className="relative h-5 w-5 transition-transform duration-300 ease-out-expo group-hover/cta:-translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </Magnetic>

              {/* Secondary CTA — "کتاب تصادفی" (Feeling Lucky).
                  Also wrapped in Magnetic for consistency. */}
              <Magnetic strength={10} className="w-full sm:w-auto">
                <RandomBookButton />
              </Magnetic>
            </motion.div>

            {/* Trust microcopy */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground lg:justify-start"
            >
              <span className="inline-flex items-center gap-1">
                <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 text-gold-600 dark:text-gold-400" />
                بدون ثبت‌نام
              </span>
              <span aria-hidden="true">·</span>
              <span>رایگان</span>
              <span aria-hidden="true">·</span>
              <span>بدون محدودیت زمانی</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="flex flex-wrap items-center justify-center gap-6 pt-3 lg:justify-start"
            >
              <div className="flex items-center gap-2" aria-live="polite">
                <BookOpen aria-hidden="true" className="h-5 w-5 text-gold-600 dark:text-gold-400" />
                <div className="text-sm">
                  <div className="font-bold">
                    <span className="sr-only">تعداد کتاب‌های کلاسیک: </span>
                    {toPersianDigits(booksCount)} کتاب کلاسیک
                  </div>
                  <div className="text-xs text-muted-foreground">انگلیسی دوزبانه</div>
                </div>
              </div>
              <div aria-hidden="true" className="h-8 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Sparkles aria-hidden="true" className="h-5 w-5 text-gold-600 dark:text-gold-400" />
                <div className="text-sm">
                  <div className="font-bold">هوش مصنوعی</div>
                  <div className="text-xs text-muted-foreground">دیکشنری و چت</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Image placeholder — LEFT side on desktop (RTL: visual end).
              Per user feedback: "من بعدا سمت چپ لی اوت اینا هالی باشه من
              بعدا یه عکسی از مسکات ما میزارم فعلا درست نشده ولی دوتایی
              لی اوت توبر عکسه".
              This is a placeholder where the user will later drop a
              screenshot/mockup of the app. For now it's an elegant empty
              frame with a subtle gold gradient + icon, so the layout
              looks intentional rather than unfinished.
              Hidden on mobile (saves space, text-only is fine there). */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative hidden lg:block"
            aria-label="محل نمایش تصویر برنامه (به‌زودی)"
          >
            <div className="relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl border border-gold-400/30 bg-gradient-to-br from-gold-500/10 via-card to-gold-700/10 shadow-2xl">
              {/* Ambient halos matching the hero palette */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-gold-500/15 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-gold-700/15 blur-3xl"
              />
              {/* Gilded top hairline */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent"
              />
              {/* Centered placeholder icon + label */}
              <div className="relative flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                <span className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400/30 to-gold-600/20 text-gold-700 dark:text-gold-300">
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-2xl bg-gold-500/20 blur-md"
                  />
                  <ImageIcon className="relative h-10 w-10" strokeWidth={1.5} />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground/80">
                    محل نمایش تصویر برنامه
                  </p>
                  <p className="text-xs text-muted-foreground">
                    اسکرین‌شات یا موکاپ در اینجا قرار می‌گیرد
                  </p>
                </div>
              </div>
              {/* Decorative corner accents — subtle frame detailing */}
              <span className="pointer-events-none absolute left-4 top-4 h-6 w-6 rounded-tl-lg border-l-2 border-t-2 border-gold-400/40" aria-hidden="true" />
              <span className="pointer-events-none absolute right-4 top-4 h-6 w-6 rounded-tr-lg border-r-2 border-t-2 border-gold-400/40" aria-hidden="true" />
              <span className="pointer-events-none absolute bottom-4 left-4 h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-gold-400/40" aria-hidden="true" />
              <span className="pointer-events-none absolute bottom-4 right-4 h-6 w-6 rounded-br-lg border-b-2 border-r-2 border-gold-400/40" aria-hidden="true" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll-down indicator — removed per user feedback to save vertical
          space and ensure the hero fits in one viewport without scrolling. */}
    </section>
  )
}

/**
 * RandomBookButton — "Feeling Lucky"-style CTA. Fetches the full book list
 * from /api/books, picks one at random, and routes the user straight into
 * the reader (/books/read/[slug]) with no intermediate page.
 */
function RandomBookButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function pickRandom() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/books')
      const books = await res.json()
      if (!Array.isArray(books) || books.length === 0) {
        router.push('/library')
        return
      }
      const random = books[Math.floor(Math.random() * books.length)]
      router.push(`/books/read/${random.slug}`)
    } catch {
      router.push('/library')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      size="xl"
      variant="outline"
      className="w-full text-base sm:w-auto"
      onClick={pickRandom}
      disabled={loading}
      aria-label="کتاب تصادفی — مستقیم وارد ریدر شوید"
    >
      <Dices aria-hidden="true" className={loading ? 'h-5 w-5 animate-spin' : 'h-5 w-5'} />
      {loading ? 'در حال انتخاب…' : 'کتاب تصادفی'}
    </Button>
  )
}

