'use client'

import {
  BookOpen,
  CheckCircle2,
  Gamepad2,
  Library,
  Sparkles,
  Star,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { cn } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: string
  message: string
  timestamp: number
  icon: string
  isCurrentUser: boolean
}

/** Map activity-type string → Lucide icon + accent color class. */
const TYPE_META: Record<string, { icon: LucideIcon; ring: string; chip: string }> = {
  book_started: {
    icon: BookOpen,
    ring: 'from-amber-400 to-orange-500',
    chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  },
  book_completed: {
    icon: CheckCircle2,
    ring: 'from-emerald-400 to-teal-500',
    chip: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  },
  vocab_learned: {
    icon: Library,
    ring: 'from-gold-400 to-amber-500',
    chip: 'bg-gold-500/15 text-gold-700 dark:text-gold-400',
  },
  level_up: {
    icon: Zap,
    ring: 'from-yellow-400 to-amber-500',
    chip: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  },
  game_played: {
    icon: Gamepad2,
    ring: 'from-rose-400 to-orange-500',
    chip: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
  },
  review_posted: {
    icon: Star,
    ring: 'from-amber-400 to-rose-500',
    chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  },
  social: {
    icon: Users,
    ring: 'from-stone-400 to-stone-500',
    chip: 'bg-muted text-muted-foreground',
  },
}

function metaFor(type: string) {
  return (
    TYPE_META[type] ?? {
      icon: Sparkles,
      ring: 'from-gold-400 to-gold-600',
      chip: 'bg-gold-500/15 text-gold-700 dark:text-gold-400',
    }
  )
}

const TYPE_LABEL: Record<string, string> = {
  book_started: 'شروع کتاب',
  book_completed: 'اتمام کتاب',
  vocab_learned: 'یادگیری واژه',
  level_up: 'ارتقای سطح',
  game_played: 'بازی واژگان',
  review_posted: 'ثبت نظر',
  social: 'فعالیت دوستان',
}

const PREVIEW_COUNT = 5

export function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const { formatRelativeTime } = usePersianLocale()
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    fetch('/api/activity')
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => setItems(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const visible = useMemo(
    () => (expanded ? items : items.slice(0, PREVIEW_COUNT)),
    [items, expanded],
  )

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (items.length === 0) return null

  return (
    <div>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {visible.map((item, i) => {
            const meta = metaFor(item.type)
            const Icon = meta.icon
            const isHovered = hoveredId === item.id
            return (
              <motion.div
                key={item.id}
                layout={reduceMotion ? false : true}
                initial={reduceMotion ? false : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
                transition={{ delay: i * 0.04 }}
                onHoverStart={() => setHoveredId(item.id)}
                onHoverEnd={() => setHoveredId(null)}
                className={cn(
                  'group flex items-center gap-3 rounded-xl border p-3 transition-[transform,opacity,colors,border-color,background-color]',
                  item.isCurrentUser
                    ? 'border-gold-400/40 bg-gold-500/5'
                    : 'border-border/50 bg-card/50 hover:border-gold-400/30 hover:bg-gold-500/[0.03]',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-sm',
                    meta.ring,
                  )}
                  aria-hidden
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm font-medium transition-[transform,opacity,colors,border-color,background-color]',
                      isHovered ? 'line-clamp-none' : 'truncate',
                    )}
                  >
                    {item.message}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                        meta.chip,
                      )}
                    >
                      {TYPE_LABEL[item.type] ?? 'فعالیت'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {items.length > PREVIEW_COUNT && (
        <div className="mt-3 flex justify-center">
          <motion.button
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/40 bg-gold-500/5 px-4 py-1.5 text-xs font-bold text-gold-700 transition-colors hover:bg-gold-500/10 dark:text-gold-400"
            aria-label={expanded ? 'نمایش کمتر' : 'مشاهده همه فعالیت‌ها'}
            aria-expanded={expanded}
          >
            {expanded
              ? 'نمایش کمتر'
              : `مشاهده همه (${items.length} مورد)`}
          </motion.button>
        </div>
      )}
    </div>
  )
}
