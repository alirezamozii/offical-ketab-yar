'use client'

/**
 * src/components/books/trending-badge.tsx
 * ---------------------------------------------------------------
 * A small animated badge shown on book detail pages for books that
 * are "trending" — i.e. have a high viewCount relative to the
 * catalog average. Three tiers:
 *   - 🔥 داغ (Hot):     viewCount >= 10,000
 *   - 📈 محبوب (Popular): viewCount >= 1,000
 *   - ✨ در حال رشد (Rising): viewCount >= 300
 *
 * Books below 300 views show no badge (avoid clutter).
 *
 * Design: pill-shaped badge with a Flame icon, gold gradient
 * background, subtle pulse animation. Respects prefers-reduced-motion.
 *
 * Owner: CRON-REVIEW-202607171322
 * ---------------------------------------------------------------
 */

import { motion, useReducedMotion } from 'framer-motion'
import { Flame, TrendingUp, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrendingBadgeProps {
  viewCount: number
  className?: string
}

type Tier = {
  label: string
  icon: typeof Flame
  className: string
  threshold: number
}

const TIERS: Tier[] = [
  {
    label: 'داغ',
    icon: Flame,
    className:
      'bg-gradient-to-l from-red-500/20 via-orange-500/20 to-amber-500/20 text-orange-700 border-orange-500/40 dark:text-orange-400',
    threshold: 10_000,
  },
  {
    label: 'محبوب',
    icon: TrendingUp,
    className:
      'bg-gradient-to-l from-amber-500/20 via-gold-500/20 to-gold-700/20 text-gold-700 border-gold-500/40 dark:text-gold-400',
    threshold: 1_000,
  },
  {
    label: 'در حال رشد',
    icon: Sparkles,
    className:
      'bg-gradient-to-l from-teal-500/15 via-emerald-500/15 to-gold-500/15 text-teal-700 border-teal-500/30 dark:text-teal-400',
    threshold: 300,
  },
]

export function TrendingBadge({ viewCount, className }: TrendingBadgeProps) {
  const reduceMotion = useReducedMotion()

  // Find the highest tier the book qualifies for
  const tier = TIERS.find((t) => viewCount >= t.threshold)
  if (!tier) return null

  const Icon = tier.icon

  return (
    <motion.span
      initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold',
        tier.className,
        className,
      )}
    >
      <Icon
        className={cn(
          'h-3.5 w-3.5',
          !reduceMotion && tier.label === 'داغ' && 'animate-pulse',
        )}
        aria-hidden="true"
      />
      {tier.label}
    </motion.span>
  )
}
