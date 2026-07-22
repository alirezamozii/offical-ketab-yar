'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  Highlighter,
  Languages,
  Quote,
  Sparkles,
  Trophy,
  Volume2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Feature-experience carousel — REDESIGNED per user feedback.
 *
 * Per user feedback: "نیاز نیست کل باکس تنمیشن داشت باشه وقت یمیره بعدی
 * توشته ایمونا خودشون منحوری فید این و اوت بشن" — the BOX stays still,
 * only the TEXT CONTENT inside fades in/out. No box movement at all.
 */
const FEATURE_SCENARIOS = [
  {
    icon: Languages,
    title: 'مطالعه دوزبانه',
    text: 'پاراگراف انگلیسی را می‌خوانم، نگاهی به ترجمه فارسی کنارش می‌اندازم و دوباره به متن اصلی برمی‌گردم. درک کلیِ متن سریع‌تر اتفاق می‌افتد.',
  },
  {
    icon: Brain,
    title: 'چت با هوش مصنوعی',
    text: 'وقتی به جمله‌ای می‌رسم که ساختار گرامری‌اش نامفهوم است، آیکون چت را باز می‌کنم و از هوش مصنوعی می‌پرسم «این جمله چه معنی‌ای دارد؟».',
  },
  {
    icon: BookOpen,
    title: 'دیکشنری فوری',
    text: 'روی هر کلمه ناشناخته می‌زنم؛ معنی، تلفظ و یک مثال کاربردی نمایش داده می‌شود. بدون خروج از صفحه مطالعه.',
  },
  {
    icon: Highlighter,
    title: 'هایلایت هوشمند',
    text: 'جمله‌ای که دوست دارم را با یکی از سه رنگ هایلایت می‌کنم. در پنل هایلایت‌ها می‌توانم بعداً به همه‌شان برگردم.',
  },
  {
    icon: Trophy,
    title: 'بازی‌وارسازی',
    text: 'هر پاراگراف امتیاز می‌آورد. هر روز یک چالش دارم. سطح من از ۱ تا ۱۰ بالا می‌رود و انگیزه برای ادامه مطالعه را زنده نگه می‌دارد.',
  },
  {
    icon: Volume2,
    title: 'تلفظ صوتی',
    text: 'کلمه‌ای که نمی‌دانم چطور تلفظ می‌شود را انتخاب می‌کنم و روی آیکون صدا می‌زنم تا تلفظ درست آن را بشنوم.',
  },
  {
    icon: Sparkles,
    title: 'واژگان‌ساز',
    text: 'هر کلمه ناشناخته را به واژگان‌ساز اضافه می‌کنم و با بازی‌های تکرار با فاصله، آن‌ها را در حافظه‌ام می‌کارم.',
  },
]

const INTERVAL_MS = 5500

export function TestimonialsSection() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % FEATURE_SCENARIOS.length)
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [paused])

  function go(dir: 1 | -1) {
    setIndex(
      (i) => (i + dir + FEATURE_SCENARIOS.length) % FEATURE_SCENARIOS.length,
    )
  }

  const current = FEATURE_SCENARIOS[index]
  const Icon = current.icon

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mb-10 space-y-3 text-center"
      >
        <span className="inline-block rounded-full bg-gold-500/15 px-3 py-1 text-xs font-bold text-gold-700 dark:text-gold-400">
          تجربه استفاده
        </span>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          با کتاب‌یار چه‌کار می‌توان کرد؟
        </h2>
        <p className="mx-auto max-w-2xl text-xs text-muted-foreground sm:text-sm">
          یک نگاه سریع به کارهایی که هر روز می‌توانید با کتاب‌یار انجام دهید.
        </p>
      </motion.div>

      {/* Carousel — the BOX stays still, only the content fades.
          Per user feedback: "نیاز نیست کل باکس تنمیشن داشت باشه". */}
      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* ─── STATIC BOX (no animation on this element) ─── */}
        <div
          className={cn(
            'relative min-h-[280px] overflow-hidden rounded-3xl sm:min-h-[240px]',
            'border border-gold-400/20',
            'bg-gradient-to-br from-card via-card to-gold-500/5',
            'shadow-lg shadow-gold-500/5',
            'p-10 sm:p-14',
          )}
        >
          {/* Ambient gold halos */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-gold-700/8 blur-3xl"
          />
          {/* Gilded top hairline */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent"
          />
          {/* Quote watermark */}
          <Quote
            aria-hidden="true"
            className="pointer-events-none absolute start-10 top-8 h-16 w-16 rotate-180 text-gold-500/10 sm:h-20 sm:w-20"
            strokeWidth={1.5}
          />

          {/* ─── ANIMATED CONTENT (only this part fades) ───
              Per user feedback: "توشته ایمونا خودشون منحوری فید این و اوت
              بشن" — only the text content fades in/out, the box stays. */}
          <div className="relative mx-auto flex min-h-[180px] max-w-2xl flex-col items-center justify-center gap-6 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                className="flex flex-col items-center gap-6"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {/* Icon chip */}
                <span
                  aria-hidden="true"
                  className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-lg shadow-gold-500/30"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-2xl bg-gold-400/30 blur-md"
                  />
                  <Icon className="relative h-6 w-6" />
                </span>

                <h3 className="text-xl font-bold tracking-tight text-gold-700 dark:text-gold-300 sm:text-2xl">
                  {current.title}
                </h3>

                <p className="text-base leading-relaxed text-foreground/80 sm:text-lg">
                  {current.text}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-center gap-6">
          <button
            onClick={() => go(-1)}
            aria-label="سناریوی قبلی"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card text-foreground transition-[transform,opacity,colors,border-color,background-color] duration-200 hover:border-gold-400/60 hover:bg-gold-500/5 hover:text-gold-700 dark:hover:text-gold-300"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            {FEATURE_SCENARIOS.map((s, i) => (
              <button
                key={s.title}
                onClick={() => setIndex(i)}
                aria-label={`سناریوی ${i + 1}`}
                className={cn(
                  'h-2 rounded-full transition-[transform,opacity,colors,border-color,background-color] duration-300',
                  i === index
                    ? 'w-8 bg-gradient-to-l from-gold-400 to-gold-600'
                    : 'w-2 bg-border hover:bg-gold-400/40',
                )}
              />
            ))}
          </div>

          <button
            onClick={() => go(1)}
            aria-label="سناریوی بعدی"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card text-foreground transition-[transform,opacity,colors,border-color,background-color] duration-200 hover:border-gold-400/60 hover:bg-gold-500/5 hover:text-gold-700 dark:hover:text-gold-300"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
