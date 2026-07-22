'use client'

import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Drama,
  Mountain,
  Baby,
  Crown,
  Heart,
  BookText,
  Leaf,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface GenreInfo {
  name: string
  count: number
  views: number
}

/**
 * Genre-specific icon mapping.
 *
 * Per user feedback: "بر اساس موضوغ هم ایکون حودش داشته باشه" — each
 * genre gets an icon that reflects its subject matter, not a generic
 * BookOpen icon for all.
 *
 * The lookup is by English genre name (case-insensitive). Falls back to
 * BookOpen for unknown genres. Add new mappings as the catalog grows.
 */
const GENRE_ICONS: Record<string, LucideIcon> = {
  // Drama / play
  drama: Drama,
  play: Drama,
  // Adventure / journey / quest
  adventure: Mountain,
  quest: Mountain,
  journey: Mountain,
  // Children / kids
  children: Baby,
  kids: Baby,
  // Classic / literature
  classic: Crown,
  classics: Crown,
  literature: BookText,
  // Romance / love
  romance: Heart,
  love: Heart,
  // Fiction / novel
  fiction: BookText,
  novel: BookText,
  // Nature / pastoral
  nature: Leaf,
  pastoral: Leaf,
  // Fantasy / magic
  fantasy: Sparkles,
  magic: Sparkles,
}

/** Returns the genre-specific icon, or BookOpen as fallback. */
function getGenreIcon(genreName: string): LucideIcon {
  const key = genreName.toLowerCase().trim()
  // Direct match
  if (GENRE_ICONS[key]) return GENRE_ICONS[key]
  // Partial match (genre name contains a known keyword)
  for (const known of Object.keys(GENRE_ICONS)) {
    if (key.includes(known)) return GENRE_ICONS[known]
  }
  return BookOpen
}

// Deterministic gradient per genre name.
//
// IMPORTANT — color discipline: the project bans indigo/blue/purple. The
// palette stays strictly within the gold/amber/rose/emerald/teal/
// yellow/orange/red family that the rest of the app uses.
const GRADIENTS = [
  'from-amber-400 to-orange-600',
  'from-rose-400 to-pink-600',
  'from-emerald-400 to-teal-600',
  'from-yellow-400 to-amber-600',
  'from-orange-400 to-red-600',
  'from-teal-400 to-emerald-600',
  'from-amber-500 to-rose-500',
  'from-gold-400 to-gold-700',
  'from-red-400 to-rose-600',
  'from-lime-400 to-emerald-600',
  'from-orange-500 to-amber-700',
  'from-emerald-500 to-teal-700',
  'from-rose-500 to-red-700',
  'from-yellow-500 to-orange-700',
]

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function GenreCard({
  genre,
  index,
}: {
  genre: GenreInfo
  index: number
  sort?: 'count' | 'views'
}) {
  const reduceMotion = useReducedMotion()
  const grad = GRADIENTS[hash(genre.name) % GRADIENTS.length]
  const Icon = getGenreIcon(genre.name)

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduceMotion ? 0 : Math.min(index * 0.04, 0.4) }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
    >
      <Link
        href={`/library?genre=${encodeURIComponent(genre.name)}`}
        className="group relative block overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-[transform,opacity,colors,border-color,background-color] duration-300 ease-out-expo hover:border-gold-500/40 hover:shadow-lg hover:shadow-gold-500/10"
        aria-label={`ژانر ${genre.name} — ${genre.count} کتاب`}
      >
        <div className="relative h-28 overflow-hidden">
          <div className={cn('absolute inset-0 bg-gradient-to-br opacity-90 transition-transform duration-500 ease-out-expo group-hover:scale-105', grad)} />
          {/* Subtle dot pattern */}
          <div className="absolute inset-0 bg-dot-pattern opacity-20" />
          {/* Top-light glow */}
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/20 blur-2xl transition-opacity duration-500 group-hover:bg-white/30" />
          {/* Gilded top hairline */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-center justify-between px-5">
            {/* Genre-specific icon — per user feedback: "بر اساس موضوغ هم
                ایکون حودش داشته باشه". */}
            <Icon className="h-8 w-8 text-white/90 transition-transform duration-300 ease-out-expo group-hover:scale-110" />
            <ArrowLeft className="h-5 w-5 text-white/70 transition-transform duration-300 ease-out-expo group-hover:-translate-x-1" />
          </div>
          {/* Count badge — REMOVED per user feedback: "روی تون رنکا نوشتیم
              چند تا کناب اینو پپاک کن نمیخوایم". The count is still shown
              in the meta section below the gradient header. */}
        </div>
        <div className="p-4">
          <h3
            className="text-lg font-bold transition-colors duration-300 group-hover:text-primary"
            dir="ltr"
          >
            {genre.name}
          </h3>
          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {genre.count.toLocaleString('fa-IR')} کتاب
            </span>
            {genre.views > 0 && (
              <span>
                {genre.views.toLocaleString('fa-IR')} بازدید
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
