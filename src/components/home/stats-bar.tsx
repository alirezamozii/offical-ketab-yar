'use client'

import { animate, motion, useInView, useReducedMotion } from 'framer-motion'
import { BookOpen, Clock, FileText, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Stat = {
  icon: typeof BookOpen
  value: number
  suffix?: string
  label: string
}

type StatsBarProps = {
  /** Real book count fetched from DB on the server. */
  booksCount?: number
  /** Real total page count fetched from DB on the server. */
  pagesCount?: number
  /** Total reads across the catalog (sum of viewCount). */
  totalReads?: number
  /** Estimated total minutes read across the catalog. */
  totalMinutes?: number
}

function toPersian(n: number): string {
  return n.toLocaleString('fa-IR')
}

/**
 * CountUp — animates from 0 → `to` with an ease-in-out (slow → fast → slow)
 * curve as requested in the feedback. The animation re-triggers whenever the
 * element re-enters the viewport so the user always sees it complete even if
 * they scroll past and back quickly.
 */
function CountUp({ to, duration = 1.4 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { margin: '-40px' })
  const [value, setValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (!inView) {
      // Reset when out of view so re-entry re-triggers the animation.
      if (hasAnimated) {
        setValue(0)
        setHasAnimated(false)
      }
      return
    }
    if (hasAnimated) return
    if (to <= 1) {
      setValue(to)
      setHasAnimated(true)
      return
    }
    // ease-in-out (slow → fast → slow) — cubic-bezier(.4, 0, .2, 1)
    const controls = animate(0, to, {
      duration,
      ease: [0.4, 0, 0.2, 1],
      onUpdate: (v) => setValue(Math.round(v)),
      onComplete: () => setHasAnimated(true),
    })
    return () => controls.stop()
  }, [inView, to, duration, hasAnimated])

  return (
    <span ref={ref} aria-live="polite">
      {toPersian(value)}
    </span>
  )
}

export function StatsBar({
  booksCount = 0,
  pagesCount = 0,
  totalReads = 0,
  totalMinutes = 0,
}: StatsBarProps) {
  const reduceMotion = useReducedMotion()
  // Per user feedback: removed "سطح پیشرفت" (10 progress levels) and
  // "1 هوش مصنوعی" — both were meaningless. Replaced with two real,
  // dynamic metrics driven by database counts: total reads and total
  // reading minutes across the catalog.
  const STATS: Stat[] = [
    { icon: BookOpen, value: booksCount, label: 'کتاب دوزبانه' },
    { icon: FileText, value: pagesCount, label: 'صفحه با ترجمه' },
    {
      icon: Users,
      value: totalReads,
      suffix: '+',
      label: 'مرتبه مطالعه',
    },
    {
      icon: Clock,
      value: totalMinutes,
      suffix: '+',
      label: 'دقیقه مطالعه',
    },
  ]

  return (
    <section className="border-y border-border/40 bg-gradient-to-b from-gold-500/5 via-transparent to-transparent">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {STATS.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.label}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.45,
                  delay: i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={reduceMotion ? undefined : { y: -3 }}
                className="group flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 px-4 py-3 backdrop-blur-sm transition-colors hover:border-gold-400/60 hover:bg-gold-500/5"
              >
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gold-500/20 to-gold-700/10 text-gold-700 dark:text-gold-400">
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-lg bg-gold-500/40 opacity-50 blur-md transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <Icon className="relative h-5 w-5 transition-transform duration-300 ease-out-expo group-hover:scale-110" />
                </span>
                <div className="min-w-0">
                  <div className="text-xl font-extrabold leading-tight text-foreground sm:text-2xl">
                    <CountUp to={s.value} />
                    {s.suffix}
                  </div>
                  <div className="truncate text-xs text-muted-foreground sm:text-sm">
                    {s.label}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
