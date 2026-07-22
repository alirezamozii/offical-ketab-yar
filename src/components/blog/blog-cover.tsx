'use client'

/**
 * src/components/blog/blog-cover.tsx
 * ---------------------------------------------------------------
 * Procedural cover art for blog posts. When a post has no explicit
 * `coverUrl` (the common case for seeded/editorial posts), this
 * component generates a beautiful gradient + icon cover from the
 * post's first tag — so every post has a visual identity without
 * requiring image uploads.
 *
 * Design:
 *  - Warm-earth gradient palette (gold/bronze/amber — NO blue/indigo)
 *  - Tag-to-icon map: each blog tag maps to a Lucide icon + gradient
 *  - Subtle paper-texture overlay (CSS radial gradients)
 *  - Decorative orbs + the post's initial as a watermark
 *
 * Variants:
 *  - `list`: 176×128px thumbnail for the blog list page
 *  - `hero`: full-width aspect-video banner for the blog detail header
 *
 * Owner: CRON-REVIEW-202607171254
 * ---------------------------------------------------------------
 */

import { motion, useReducedMotion } from 'framer-motion'
import {
  BookOpen,
  Brain,
  Clock,
  Globe,
  GraduationCap,
  Lightbulb,
  type LucideIcon,
  NotebookPen,
  Sparkles,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/** Tag → { icon, gradient } mapping. Falls back to Sparkles. */
const TAG_THEME: Record<
  string,
  { icon: LucideIcon; from: string; to: string; accent: string }
> = {
  // Learning / language
  'یادگیری زبان': {
    icon: GraduationCap,
    from: 'from-amber-500/30',
    to: 'to-gold-700/20',
    accent: 'text-amber-700 dark:text-amber-300',
  },
  'روش مطالعه': {
    icon: BookOpen,
    from: 'from-gold-500/30',
    to: 'to-gold-700/20',
    accent: 'text-gold-700 dark:text-gold-300',
  },
  راهنما: {
    icon: Lightbulb,
    from: 'from-amber-400/30',
    to: 'to-orange-600/20',
    accent: 'text-amber-600 dark:text-amber-300',
  },
  'انتخاب کتاب': {
    icon: BookOpen,
    from: 'from-gold-400/30',
    to: 'to-amber-700/20',
    accent: 'text-gold-700 dark:text-gold-300',
  },
  CEFR: {
    icon: Target,
    from: 'from-orange-500/30',
    to: 'to-red-700/20',
    accent: 'text-orange-700 dark:text-orange-300',
  },
  // Productivity / focus
  بهروری: {
    icon: Clock,
    from: 'from-teal-500/25',
    to: 'to-gold-700/20',
    accent: 'text-teal-700 dark:text-teal-300',
  },
  تمرکز: {
    icon: Target,
    from: 'from-emerald-500/25',
    to: 'to-gold-700/20',
    accent: 'text-emerald-700 dark:text-emerald-300',
  },
  'عادت مطالعه': {
    icon: Sparkles,
    from: 'from-gold-500/30',
    to: 'to-amber-600/20',
    accent: 'text-gold-700 dark:text-gold-300',
  },
  // Vocabulary / idioms
  اصطلاحات: {
    icon: NotebookPen,
    from: 'from-amber-600/30',
    to: 'to-orange-800/20',
    accent: 'text-amber-700 dark:text-amber-300',
  },
  واژگان: {
    icon: NotebookPen,
    from: 'from-gold-500/25',
    to: 'to-amber-700/20',
    accent: 'text-gold-700 dark:text-gold-300',
  },
  ادبیات: {
    icon: BookOpen,
    from: 'from-amber-500/25',
    to: 'to-gold-800/20',
    accent: 'text-amber-700 dark:text-amber-300',
  },
  // Science / brain
  علم: {
    icon: Brain,
    from: 'from-rose-500/25',
    to: 'to-gold-700/20',
    accent: 'text-rose-700 dark:text-rose-300',
  },
  مغز: {
    icon: Brain,
    from: 'from-rose-500/25',
    to: 'to-amber-700/20',
    accent: 'text-rose-700 dark:text-rose-300',
  },
  دوزبانه: {
    icon: Globe,
    from: 'from-teal-500/25',
    to: 'to-amber-600/20',
    accent: 'text-teal-700 dark:text-teal-300',
  },
  // Dictionary / tools
  دیکشنری: {
    icon: BookOpen,
    from: 'from-gold-500/25',
    to: 'to-amber-700/20',
    accent: 'text-gold-700 dark:text-gold-300',
  },
  خواندن: {
    icon: BookOpen,
    from: 'from-amber-500/25',
    to: 'to-gold-700/20',
    accent: 'text-amber-700 dark:text-amber-300',
  },
}

const DEFAULT_THEME = {
  icon: Sparkles,
  from: 'from-gold-500/25',
  to: 'to-gold-700/15',
  accent: 'text-gold-700 dark:text-gold-300',
}

function getTheme(tag: string | undefined) {
  if (!tag) return DEFAULT_THEME
  return TAG_THEME[tag] ?? DEFAULT_THEME
}

interface BlogCoverProps {
  /** The post's first tag (drives the icon + gradient). */
  tag?: string
  /** The post title — used for the watermark initial. */
  title: string
  /** List thumbnail (176×128) or hero banner (aspect-video). */
  variant?: 'list' | 'hero'
  className?: string
}

export function BlogCover({
  tag,
  title,
  variant = 'list',
  className,
}: BlogCoverProps) {
  const reduceMotion = useReducedMotion()
  const theme = getTheme(tag)
  const Icon = theme.icon
  const initial = title.trim().charAt(0) || 'ک'

  if (variant === 'list') {
    return (
      <div
        className={cn(
          'relative hidden h-32 w-44 shrink-0 overflow-hidden rounded-xl ring-1 ring-border/60 sm:block',
          className,
        )}
        aria-hidden="true"
      >
        {/* Gradient background */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br',
            theme.from,
            theme.to,
          )}
        />
        {/* Paper texture overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.06) 0%, transparent 50%)',
          }}
        />
        {/* Decorative orb */}
        <div
          className={cn(
            'absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-40 blur-xl',
            theme.from,
            theme.to,
          )}
        />
        {/* Watermark initial */}
        <span className="absolute bottom-1 right-2 text-5xl font-black text-foreground/5">
          {initial}
        </span>
        {/* Tag icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm',
              theme.accent,
            )}
          >
            <Icon className="h-6 w-6" />
          </span>
        </div>
      </div>
    )
  }

  // Hero variant — full-width banner
  return (
    <div
      className={cn(
        'relative aspect-video w-full overflow-hidden rounded-2xl ring-1 ring-border/60',
        className,
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br',
          theme.from,
          theme.to,
        )}
      />
      {/* Paper texture */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 85% 80%, rgba(0,0,0,0.08) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(184,149,106,0.05) 0%, transparent 70%)',
        }}
      />
      {/* Decorative orbs */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'absolute -left-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br opacity-30 blur-3xl',
          theme.from,
          theme.to,
        )}
      />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-gradient-to-tl opacity-20 blur-3xl',
          theme.from,
          theme.to,
        )}
      />
      {/* Watermark initial */}
      <span className="absolute bottom-4 right-6 text-[120px] font-black leading-none text-foreground/[0.04]">
        {initial}
      </span>
      {/* Tag icon + label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col items-center gap-3"
        >
          <span
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-2xl bg-background/70 shadow-lg backdrop-blur-md sm:h-20 sm:w-20',
              theme.accent,
            )}
          >
            <Icon className="h-8 w-8 sm:h-10 sm:w-10" />
          </span>
          {tag && (
            <span className="rounded-full bg-background/60 px-3 py-1 text-xs font-semibold text-foreground/70 backdrop-blur-sm">
              {tag}
            </span>
          )}
        </motion.div>
      </div>
    </div>
  )
}
