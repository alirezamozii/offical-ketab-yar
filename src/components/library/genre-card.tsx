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
  Search,
  Ghost,
  Lightbulb,
  Brain,
  Briefcase,
  Hourglass,
  Atom,
  Feather,
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
 * Persian translations for common genre tags so CMS-managed English genres
 * are presented to Persian users with native terminology while preserving
 * the English subtitle.
 */
const GENRE_FA_MAP: Record<string, string> = {
  fiction: 'داستان و رمان',
  classic: 'کلاسیک',
  classics: 'کلاسیک',
  drama: 'درام و نمایشنامه',
  tragedy: 'تراژدی',
  adventure: 'ماجراجویی',
  fantasy: 'فانتزی و تخیلی',
  romance: 'عاشقانه',
  children: 'کودک و نوجوان',
  kids: 'کودک و نوجوان',
  'young adult': 'نوجوانان',
  mystery: 'معمایی و کارآگاهی',
  detective: 'کارآگاهی',
  horror: 'وحشت و ترسناک',
  gothic: 'گوتیک',
  history: 'تاریخی',
  historical: 'تاریخی',
  philosophy: 'فلسفی',
  philosophical: 'فلسفی',
  psychology: 'روانشناسی',
  'self-help': 'خودیاری و توسعه فردی',
  business: 'کسب‌وکار و مدیریت',
  science: 'علمی',
  'sci-fi': 'علمی‌تخیلی',
  'science fiction': 'علمی‌تخیلی',
  biography: 'زندگی‌نامه',
  memoir: 'خاطرات',
  poetry: 'شعر و ادب منظوم',
  comedy: 'طنز و کمدی',
  nature: 'طبیعت',
}

/**
 * Genre-specific icon mapping (Persian & English keywords).
 */
const GENRE_ICONS: Record<string, LucideIcon> = {
  // Drama / play / tragedy
  drama: Drama,
  play: Drama,
  tragedy: Drama,
  theater: Drama,
  درام: Drama,
  نمایش: Drama,
  نمایشنامه: Drama,
  تراژدی: Drama,
  تئاتر: Drama,

  // Adventure / journey / quest / travel
  adventure: Mountain,
  quest: Mountain,
  journey: Mountain,
  travel: Mountain,
  ماجراجویی: Mountain,
  سفر: Mountain,
  طبیعت‌گردی: Mountain,

  // Children / kids / young adult
  children: Baby,
  kids: Baby,
  'young adult': Baby,
  کودک: Baby,
  کودکان: Baby,
  نوجوان: Baby,

  // Classic / literature
  classic: Crown,
  classics: Crown,
  masterpiece: Crown,
  کلاسیک: Crown,
  شاهکار: Crown,

  // Romance / love
  romance: Heart,
  love: Heart,
  عاشقانه: Heart,
  عشق: Heart,

  // Fiction / novel / literature
  fiction: BookText,
  novel: BookText,
  literature: BookText,
  داستان: BookText,
  داستانی: BookText,
  رمان: BookText,
  ادبیات: BookText,

  // Nature / pastoral
  nature: Leaf,
  pastoral: Leaf,
  طبیعت: Leaf,
  محیط: Leaf,

  // Fantasy / magic
  fantasy: Sparkles,
  magic: Sparkles,
  myth: Sparkles,
  فانتزی: Sparkles,
  جادو: Sparkles,
  افسانه: Sparkles,

  // Mystery / detective / crime
  mystery: Search,
  detective: Search,
  crime: Search,
  معمایی: Search,
  کارآگاهی: Search,
  پلیسی: Search,
  جنایی: Search,

  // Horror / gothic
  horror: Ghost,
  gothic: Ghost,
  ترسناک: Ghost,
  وحشت: Ghost,
  گوتیک: Ghost,

  // Philosophy / wisdom
  philosophy: Lightbulb,
  philosophical: Lightbulb,
  wisdom: Lightbulb,
  فلسفه: Lightbulb,
  فلسفی: Lightbulb,
  حکمت: Lightbulb,

  // Psychology / mind / self-help
  psychology: Brain,
  mind: Brain,
  'self-help': Brain,
  روانشناسی: Brain,
  خودیاری: Brain,
  توسعه: Brain,

  // Business / management / finance
  business: Briefcase,
  management: Briefcase,
  finance: Briefcase,
  کسب: Briefcase,
  مدیریت: Briefcase,
  مالی: Briefcase,

  // History / biography
  history: Hourglass,
  historical: Hourglass,
  biography: Hourglass,
  memoir: Hourglass,
  تاریخ: Hourglass,
  تاریخی: Hourglass,
  زندگی: Hourglass,
  خاطرات: Hourglass,

  // Science / sci-fi
  science: Atom,
  'sci-fi': Atom,
  scientific: Atom,
  علمی: Atom,

  // Poetry
  poetry: Feather,
  poem: Feather,
  شعر: Feather,
  منظوم: Feather,
}

/** Returns the genre-specific icon, or BookOpen as fallback. */
function getGenreIcon(genreName: string): LucideIcon {
  const key = genreName.toLowerCase().trim()
  if (GENRE_ICONS[key]) return GENRE_ICONS[key]
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
  const grad = GRADIENTS[hash(genre.name) % GRADIENTS.length]
  const Icon = getGenreIcon(genre.name)

  const lowerName = genre.name.toLowerCase().trim()
  const faTranslation = GENRE_FA_MAP[lowerName]
  const isPersian = /[\u0600-\u06FF]/.test(genre.name)
  const displayTitle = isPersian ? genre.name : (faTranslation || genre.name)
  const displaySubtitle = !isPersian && faTranslation ? genre.name : null

  return (
    <div
      className="transition-all duration-300 motion-safe:hover:-translate-y-1.5 motion-safe:active:scale-[0.98] animate-in fade-in slide-in-from-bottom-3 fill-mode-both"
      style={{
        animationDelay: `${Math.min(index * 35, 280)}ms`,
      }}
    >
      <Link
        href={`/library?genre=${encodeURIComponent(genre.name)}`}
        prefetch={false}
        className="group relative block overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-[transform,opacity,colors,border-color,background-color] duration-300 ease-out-expo hover:border-gold-500/40 hover:shadow-lg hover:shadow-gold-500/10"
        aria-label={`ژانر ${displayTitle} — ${genre.count} کتاب`}
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
            <Icon className="h-8 w-8 text-white/90 transition-transform duration-300 ease-out-expo group-hover:scale-110" />
            <ArrowLeft className="h-5 w-5 text-white/70 transition-transform duration-300 ease-out-expo group-hover:-translate-x-1" />
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-baseline justify-between gap-1.5">
            <h3
              className="text-base font-bold transition-colors duration-300 group-hover:text-primary sm:text-lg"
              dir="auto"
            >
              {displayTitle}
            </h3>
            {displaySubtitle && (
              <span className="shrink-0 text-[11px] font-medium text-muted-foreground/75 uppercase tracking-wider" dir="ltr">
                {displaySubtitle}
              </span>
            )}
          </div>
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
    </div>
  )
}
