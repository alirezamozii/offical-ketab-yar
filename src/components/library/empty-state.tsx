'use client'

import { Button } from '@/components/ui/button'
import { motion, useReducedMotion } from 'framer-motion'
import {
  BookOpen,
  Filter,
  Lightbulb,
  Search,
  SearchX,
  Sparkles,
  Undo2,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * Polished "no results" state — explains what's blocking results, offers a
 * clear-filters CTA, suggests popular genres as one-tap chips, and surfaces
 * a couple of helpful tips so the user knows what to try next.
 *
 * Premium touches:
 *   - A small SVG bookshelf illustration behind the icon tile so the empty
 *     state reads as "intentional" rather than a broken page.
 *   - The icon tile pulses with a soft gold halo on mount (gated by
 *     reduced-motion).
 *   - The popular-genre chips have their own hover state (border-gold,
 *     text-foreground) so the user can tell they're interactive.
 *   - Two CTAs: primary "پاک کردن همه فیلترها" (glow) and secondary
 *     "مرور بر اساس ژانر" (outline) so the user has a clear next step
 *     no matter what kind of filter is blocking results.
 *   - Two tip cards: one about filters, one about fuzzy search.
 */
export function LibraryEmptyState({
  hasFilters,
  popularGenres,
  onClearFilters,
  onPickGenre,
}: {
  hasFilters: boolean
  popularGenres: string[]
  onClearFilters: () => void
  onPickGenre: (g: string) => void
}) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col items-center gap-5 overflow-hidden rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-14 text-center"
    >
      {/* Ambient gold halo — radiates from behind the icon tile. */}
      <div
        className="pointer-events-none absolute -top-10 left-1/2 -z-10 h-40 w-40 -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Decorative SVG bookshelf illustration — sits behind the icon tile.
          Includes a wooden plank, varied book spines with title stripes, a
          small reading lamp casting a warm glow, and a potted plant. The
          whole illustration pulses gently (gated by reduced-motion) so the
          empty state reads as alive rather than static. */}
      <motion.svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-4 -z-10 mx-auto h-40 w-72 sm:h-44 sm:w-80"
        viewBox="0 0 320 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={reduceMotion ? undefined : { opacity: 0.6 }}
        animate={
          reduceMotion
            ? undefined
            : {
                opacity: [0.7, 1, 0.7],
                scale: [1, 1.035, 1],
              }
        }
        transition={
          reduceMotion
            ? undefined
            : {
                duration: 3.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }
        }
      >
        <defs>
          {/* Wood-tone gradient for the shelf plank. */}
          <linearGradient id="lib-shelf-wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a87553" />
            <stop offset="100%" stopColor="#6b4226" />
          </linearGradient>
          {/* Warm gold glow gradient for the lamp aura. */}
          <radialGradient id="lib-lamp-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          {/* Book spine gradients — gold/amber/emerald/rose/teal. */}
          <linearGradient id="lib-spine-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="lib-spine-amber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
          <linearGradient id="lib-spine-emerald" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#065f46" />
          </linearGradient>
          <linearGradient id="lib-spine-rose" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#9f1239" />
          </linearGradient>
          <linearGradient id="lib-spine-teal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="100%" stopColor="#115e59" />
          </linearGradient>
        </defs>

        {/* Warm lamp glow behind everything. */}
        <circle cx="48" cy="40" r="68" fill="url(#lib-lamp-glow)" />

        {/* Reading lamp — base + arm + shade + bulb glow. */}
        <g>
          {/* Lamp base. */}
          <ellipse cx="46" cy="150" rx="14" ry="3" fill="#3f3a32" />
          {/* Vertical post. */}
          <rect x="43" y="98" width="6" height="52" rx="3" fill="#52473b" />
          {/* Articulated arm. */}
          <path
            d="M46 98 L30 64 L52 52"
            stroke="#52473b"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Lamp shade — gold gradient. */}
          <path
            d="M36 38 L72 38 L66 58 L42 58 Z"
            fill="url(#lib-spine-gold)"
            stroke="#92400e"
            strokeWidth="1"
          />
          {/* Bulb glow ellipse. */}
          <ellipse cx="54" cy="58" rx="10" ry="3" fill="#fef3c7" opacity="0.9" />
        </g>

        {/* Potted plant on the right end of the shelf. */}
        <g>
          {/* Leaves. */}
          <path
            d="M276 134 C264 110 266 96 272 88 C280 96 282 112 276 134 Z"
            fill="#10b981"
          />
          <path
            d="M290 134 C298 114 296 98 290 90 C282 100 280 116 290 134 Z"
            fill="#34d399"
          />
          <path
            d="M283 134 C283 118 283 104 283 96 C283 104 283 118 283 134 Z"
            fill="#059669"
          />
          {/* Pot. */}
          <path d="M266 134 L304 134 L300 154 L270 154 Z" fill="#a87553" />
          <rect x="264" y="132" width="42" height="5" rx="2" fill="#6b4226" />
        </g>

        {/* Shelf plank. */}
        <rect x="18" y="150" width="284" height="10" rx="3" fill="url(#lib-shelf-wood)" />
        <rect
          x="18"
          y="158"
          width="284"
          height="3"
          rx="1.5"
          fill="#3f2818"
          opacity="0.6"
        />

        {/* Books — varied widths, heights, colors, with title stripes. */}
        {/* Book 1 — tall gold. */}
        <rect x="28" y="68" width="14" height="82" rx="2" fill="url(#lib-spine-gold)" />
        <rect x="30" y="76" width="10" height="2" rx="1" fill="#fff7ed" opacity="0.75" />
        <rect x="30" y="82" width="10" height="2" rx="1" fill="#fff7ed" opacity="0.55" />
        <rect x="30" y="88" width="10" height="2" rx="1" fill="#fff7ed" opacity="0.4" />

        {/* Book 2 — short amber. */}
        <rect x="46" y="90" width="12" height="60" rx="2" fill="url(#lib-spine-amber)" />

        {/* Book 3 — emerald, tilted slightly. */}
        <g transform="rotate(-3 66 116)">
          <rect x="58" y="58" width="16" height="92" rx="2" fill="url(#lib-spine-emerald)" />
          <rect x="61" y="68" width="10" height="2" rx="1" fill="#d1fae5" opacity="0.75" />
          <rect x="61" y="74" width="10" height="2" rx="1" fill="#d1fae5" opacity="0.55" />
        </g>

        {/* Book 4 — tall rose with title bar. */}
        <rect x="78" y="50" width="14" height="100" rx="2" fill="url(#lib-spine-rose)" />
        <rect x="80" y="60" width="10" height="2" rx="1" fill="#ffe4e6" opacity="0.75" />
        <rect x="80" y="66" width="10" height="2" rx="1" fill="#ffe4e6" opacity="0.55" />

        {/* Book 5 — wide gold with multiple title stripes. */}
        <rect x="96" y="74" width="20" height="76" rx="2" fill="url(#lib-spine-gold)" />
        <rect x="99" y="84" width="14" height="2" rx="1" fill="#451a03" opacity="0.55" />
        <rect x="99" y="90" width="14" height="2" rx="1" fill="#451a03" opacity="0.55" />
        <rect x="99" y="96" width="14" height="2" rx="1" fill="#451a03" opacity="0.55" />

        {/* Book 6 — short teal. */}
        <rect x="120" y="92" width="12" height="58" rx="2" fill="url(#lib-spine-teal)" />

        {/* Book 7 — tilted amber leaning right. */}
        <g transform="rotate(6 142 122)">
          <rect x="136" y="64" width="14" height="86" rx="2" fill="url(#lib-spine-amber)" />
          <rect x="139" y="74" width="8" height="2" rx="1" fill="#fff7ed" opacity="0.75" />
        </g>

        {/* Book 8 — medium rose with title stripes. */}
        <rect x="156" y="78" width="14" height="72" rx="2" fill="url(#lib-spine-rose)" />
        <rect x="158" y="88" width="10" height="2" rx="1" fill="#ffe4e6" opacity="0.7" />
        <rect x="158" y="94" width="10" height="2" rx="1" fill="#ffe4e6" opacity="0.5" />

        {/* Book 9 — tall emerald with stripes. */}
        <rect x="174" y="56" width="14" height="94" rx="2" fill="url(#lib-spine-emerald)" />
        <rect x="177" y="66" width="8" height="2" rx="1" fill="#ecfdf5" opacity="0.75" />
        <rect x="177" y="72" width="8" height="2" rx="1" fill="#ecfdf5" opacity="0.55" />

        {/* Book 10 — short gold. */}
        <rect x="192" y="90" width="12" height="60" rx="2" fill="url(#lib-spine-gold)" />

        {/* Book 11 — wide amber with title. */}
        <rect x="208" y="70" width="20" height="80" rx="2" fill="url(#lib-spine-amber)" />
        <rect x="211" y="80" width="14" height="2" rx="1" fill="#451a03" opacity="0.55" />
        <rect x="211" y="86" width="14" height="2" rx="1" fill="#451a03" opacity="0.55" />
        <rect x="211" y="92" width="14" height="2" rx="1" fill="#451a03" opacity="0.55" />

        {/* Book 12 — medium teal, slightly tilted. */}
        <g transform="rotate(-2 240 116)">
          <rect x="234" y="82" width="12" height="68" rx="2" fill="url(#lib-spine-teal)" />
        </g>

        {/* Book 13 — short rose at the end. */}
        <rect x="250" y="86" width="12" height="64" rx="2" fill="url(#lib-spine-rose)" />

        {/* A small bookmark ribbon hanging from book 4. */}
        <path
          d="M85 150 L85 164 L88 160 L91 164 L91 150 Z"
          fill="#dc2626"
          opacity="0.85"
        />
      </motion.svg>

      <div className="relative">
        <motion.div
          initial={reduceMotion ? undefined : { scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/20"
        >
          {hasFilters ? (
            <SearchX className="h-8 w-8" />
          ) : (
            <BookOpen className="h-8 w-8" />
          )}
        </motion.div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-bold">
          {hasFilters ? 'کتابی با این فیلترها پیدا نشد' : 'هنوز کتابی موجود نیست'}
        </h3>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {hasFilters
            ? 'لطفاً فیلترها را تغییر دهید یا عبارت دیگری را جستجو کنید. می‌توانید از ژانرهای محبوب زیر هم شروع کنید.'
            : 'به‌زودی کتاب‌های جدید اضافه می‌شود. دوباره سر بزنید!'}
        </p>
      </div>

      {hasFilters && popularGenres.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">ژانرهای محبوب:</span>
          {popularGenres.slice(0, 6).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onPickGenre(g)}
              className={cn(
                'rounded-full border border-border bg-background px-3 py-1 text-xs font-medium',
                'text-muted-foreground transition-colors hover:border-gold-500/50 hover:bg-gold-500/5 hover:text-foreground',
              )}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        {hasFilters && (
          <Button onClick={onClearFilters} variant="glow" className="gap-2">
            <Undo2 className="h-4 w-4" />
            پاک کردن همه فیلترها
          </Button>
        )}
        <Button asChild variant="outline" className="gap-2">
          <Link href="/library/genres">
            <Sparkles className="h-4 w-4" />
            مرور بر اساس ژانر
          </Link>
        </Button>
      </div>

      {/* Tip cards — helpful next-steps for the user. */}
      {hasFilters && (
        <div className="mt-2 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
          <TipCard
            icon={<Filter className="h-4 w-4" />}
            title="سطح یا امتیاز را کمی بازتر کنید"
            body="گاهی یک سطح پایین‌تر یا امتیاز ۳ به بالا، نتایج بسیار بیشتری نشان می‌دهد."
          />
          <TipCard
            icon={<Search className="h-4 w-4" />}
            title="جستجوی پیشرفته را امتحان کنید"
            body="با تایپ دو حرف در نوار جستجو، تطابق‌های فازی را در همه کتاب‌ها ببینید."
          />
        </div>
      )}
    </motion.div>
  )
}

function TipCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-card/60 p-3 text-right">
      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-gold-700 dark:text-gold-400">
        {icon}
      </span>
      <div className="space-y-0.5 text-right">
        <p className="text-xs font-semibold leading-snug">
          <Lightbulb className="me-1 inline h-3 w-3 text-gold-500" />
          {title}
        </p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
    </div>
  )
}
