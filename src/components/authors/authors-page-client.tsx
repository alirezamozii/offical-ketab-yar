'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Feather,
  Search,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import type { AuthorSummary } from '@/lib/data'
import type { AuthorBio, AuthorEra } from '@/lib/authors'
import { AUTHOR_ERAS } from '@/lib/authors'
import { cn } from '@/lib/utils'

export type AuthorWithBio = AuthorSummary & {
  bio: AuthorBio | null
  photoUrl?: string
  photoBlurhash?: string
}

const SORTS = [
  { value: 'books', label: 'بیشترین کتاب' },
  { value: 'name', label: 'نام (الفبا)' },
  { value: 'rating', label: 'بیشترین امتیاز' },
] as const

type SortValue = (typeof SORTS)[number]['value']

const ERA_FILTERS: { value: AuthorEra | 'all'; labelFa: string }[] = [
  { value: 'all', labelFa: 'همه' },
  ...AUTHOR_ERAS.map((e) => ({ value: e.value, labelFa: e.labelFa })),
]

function getInitials(name: string): string {
  const SKIP = new Set(['de', 'von', 'van', 'der', 'di', 'le', 'la', 'du'])
  const parts = name
    .split(/\s+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !SKIP.has(p.toLowerCase()))
  if (parts.length === 0) return '?'
  if (parts.length === 1) {
    const w = parts[0].replace(/[^\p{L}]/gu, '')
    return w.slice(0, 2).toUpperCase() || '?'
  }
  const first = parts[0].charAt(0).toUpperCase()
  const last = parts[parts.length - 1].charAt(0).toUpperCase()
  return first + last
}

interface AuthorsPageClientProps {
  authors: AuthorWithBio[]
  totalBooks: number
  totalPages: number
}

export function AuthorsPageClient({
  authors,
  totalBooks,
  totalPages,
}: AuthorsPageClientProps) {
  const locale = usePersianLocale()

  const [query, setQuery] = useState('')
  const [eraFilter, setEraFilter] = useState<AuthorEra | 'all'>('all')
  const [sort, setSort] = useState<SortValue>('books')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = authors
    if (q) {
      list = list.filter((a) => {
        const name = a.name.toLowerCase()
        const nameFa = a.bio?.nameFa ?? ''
        const nationality = a.bio?.nationality.toLowerCase() ?? ''
        const nationalityFa = a.bio?.nationalityFa ?? ''
        const tags = a.bio?.tags || []
        const hasTagMatch = tags.some((t) => t.toLowerCase().includes(q))
        return (
          name.includes(q) ||
          nameFa.includes(query.trim()) ||
          nationality.includes(q) ||
          nationalityFa.includes(query.trim()) ||
          hasTagMatch
        )
      })
    }
    if (eraFilter !== 'all') {
      list = list.filter((a) => a.bio?.era === eraFilter)
    }
    const sorted = [...list]
    if (sort === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'en'))
    } else if (sort === 'rating') {
      sorted.sort((a, b) => b.averageRating - a.averageRating || b.bookCount - a.bookCount)
    } else {
      sorted.sort((a, b) => b.bookCount - a.bookCount || a.name.localeCompare(b.name, 'en'))
    }
    return sorted
  }, [authors, query, eraFilter, sort])

  const visibleEraValues = useMemo(() => {
    const set = new Set<string>()
    for (const a of authors) if (a.bio?.era) set.add(a.bio.era)
    return set
  }, [authors])

  const visibleEraFilters = ERA_FILTERS.filter(
    (f) => f.value === 'all' || visibleEraValues.has(f.value as string),
  )

  const authorCount = authors.length

  return (
    <div className="space-y-8">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-gold-500/5 p-6 sm:p-8 shadow-sm">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-16 -right-16 h-44 w-44 rounded-full bg-amber-500/8 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-700 dark:text-gold-300">
              <Feather aria-hidden="true" className="h-3.5 w-3.5" />
              فهرست اختصاصی نویسندگان
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Users aria-hidden="true" className="h-3.5 w-3.5 text-gold-600 dark:text-gold-400" />
              <span className="tabular-nums">
                {locale.formatNumber(authorCount)}
              </span>{' '}
              نویسنده
              <span className="mx-1 opacity-50">·</span>
              <BookOpen aria-hidden="true" className="h-3.5 w-3.5 text-gold-600 dark:text-gold-400" />
              <span className="tabular-nums">
                {locale.formatNumber(totalBooks)}
              </span>{' '}
              کتاب
              <span className="mx-1 opacity-50">·</span>
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-gold-600 dark:text-gold-400" />
              <span className="tabular-nums">
                {locale.formatNumber(totalPages)}
              </span>{' '}
              صفحه دوزبانه
            </span>
          </div>

          <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-lg shadow-gold-500/30 sm:h-12 sm:w-12"
            >
              <Feather className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            نویسندگان ادبیات جهان
          </h1>

          <p className="max-w-3xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            مجموعه‌ای گران‌بها از زبده‌ترین نویسندگان و برجسته‌ترین چهره‌های ادبیات جهان. با انتخاب هر نویسنده می‌توانید به زندگی‌نامه دوزبانه، مشخصات، دوران ادبی و تمام آثار او دسترسی داشته باشید.
          </p>
        </div>
      </header>

      {/* ─── Filters & Search ─────────────────────────────────────────── */}
      <div
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
        role="search"
      >
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی نام، ملیت یا برچسب…"
            aria-label="جستجوی نام نویسنده"
            className="pe-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="پاک کردن جستجو"
              className="absolute start-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Era filter chips */}
        <div
          className="flex flex-1 flex-wrap items-center gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label="فیلتر بر اساس دوران ادبی"
        >
          {visibleEraFilters.map((f) => {
            const active = eraFilter === f.value
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setEraFilter(f.value)}
                aria-pressed={active}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'border-gold-500/60 bg-gold-500/15 text-gold-700 dark:text-gold-300'
                    : 'border-border bg-background text-muted-foreground hover:border-gold-500/40 hover:text-foreground',
                )}
              >
                {f.labelFa}
              </button>
            )
          })}
        </div>

        {/* Sort dropdown */}
        <div className="sm:ms-auto">
          <Select
            value={sort}
            onValueChange={(v) => setSort(v as SortValue)}
          >
            <SelectTrigger
              aria-label="مرتب‌سازی نویسندگان"
              className="w-full sm:w-44"
            >
              <SelectValue placeholder="مرتب‌سازی" />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── Result count ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between" aria-live="polite">
        <p className="text-sm text-muted-foreground">
          {filtered.length === authors.length ? (
            <>
              نمایش{' '}
              <span className="font-semibold text-foreground tabular-nums">
                {locale.formatNumber(filtered.length)}
              </span>{' '}
              نویسنده
            </>
          ) : (
            <>
              نمایش{' '}
              <span className="font-semibold text-foreground tabular-nums">
                {locale.formatNumber(filtered.length)}
              </span>{' '}
              نویسنده از{' '}
              <span className="tabular-nums">
                {locale.formatNumber(authors.length)}
              </span>
            </>
          )}
        </p>
      </div>

      {/* ─── Grid of Authors ───────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState query={query} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((author, index) => (
            <div
              key={author.slug}
              style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-300 fill-mode-both cull-offscreen"
            >
              <AuthorCard author={author} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------
 * AuthorCard — Clean, focused card linking directly to dedicated page
 * ---------------------------------------------------------------- */

interface AuthorCardProps {
  author: AuthorWithBio
}

function AuthorCard({ author }: AuthorCardProps) {
  const locale = usePersianLocale()
  const initials = getInitials(author.name)
  const bio = author.bio
  const photoUrl = (author as any).photoUrl || ''

  const yearsLabel =
    bio && bio.birthYear > 0
      ? `${locale.toPersianDigits(bio.birthYear)} — ${
          bio.deathYear ? locale.toPersianDigits(bio.deathYear) : 'اکنون'
        }`
      : author.yearsActive.min > 0
        ? `${locale.toPersianDigits(author.yearsActive.min)} — ${locale.toPersianDigits(
            author.yearsActive.max,
          )}`
        : ''

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold-500/40 hover:shadow-book active:scale-[0.99]"
    >
      {/* Decorative top hairline */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold-500/60 to-transparent"
      />

      <div className="flex items-start gap-4">
        {/* Avatar or Photo with Link */}
        <Link
          href={`/authors/${author.slug}`}
          className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-full"
          tabIndex={-1}
          aria-hidden="true"
        >
          {photoUrl ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-gold-500/30 shadow-md">
              <Image
                src={photoUrl}
                alt={author.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="64px"
              />
            </div>
          ) : (
            <div
              className={cn(
                'flex h-16 w-16 items-center justify-center rounded-full',
                'bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700',
                'shadow-lg shadow-gold-500/20 ring-2 ring-gold-500/15',
                'transition-transform duration-500 ease-out-expo group-hover:scale-105',
              )}
            >
              <span
                className="font-serif text-2xl font-bold tracking-wide text-white"
                style={{ fontFamily: 'var(--font-display), ui-serif, Georgia, serif' }}
                dir="ltr"
              >
                {initials}
              </span>
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/authors/${author.slug}`}
              className="truncate text-base font-bold text-foreground group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors"
              dir="ltr"
            >
              {author.name}
            </Link>
            {bio?.nameFa && (
              <span className="truncate text-sm font-medium text-gold-700 dark:text-gold-300">
                {bio.nameFa}
              </span>
            )}
          </div>

          {yearsLabel && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar aria-hidden="true" className="h-3 w-3 opacity-70 text-gold-600 dark:text-gold-400" />
              <span className="tabular-nums">{yearsLabel}</span>
            </p>
          )}
        </div>
      </div>

      {/* Badges row */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {bio?.nationalityFa ? (
          <Badge
            variant="outline"
            className="gap-1 border-border/70 bg-background/60 text-foreground"
          >
            {bio.flagEmoji && <span aria-hidden="true">{bio.flagEmoji}</span>}
            <span className="text-xs">{bio.nationalityFa}</span>
          </Badge>
        ) : null}
        {bio?.eraFa ? (
          <Badge
            variant="outline"
            className="gap-1 border-gold-500/30 bg-gold-500/10 text-gold-700 dark:text-gold-300"
          >
            <Feather aria-hidden="true" className="h-3 w-3" />
            <span className="text-xs">{bio.eraFa}</span>
          </Badge>
        ) : null}
        {author.bookCount > 0 && (
          <Badge
            variant="secondary"
            className="gap-1 bg-secondary/80 text-secondary-foreground"
          >
            <BookOpen aria-hidden="true" className="h-3 w-3" />
            <span className="text-xs tabular-nums">
              {locale.toPersianDigits(author.bookCount)}
            </span>{' '}
            کتاب
          </Badge>
        )}
        {author.averageRating > 0 && (
          <Badge
            variant="outline"
            className="gap-1 border-border/70 bg-background/60 text-foreground"
          >
            <Star
              aria-hidden="true"
              className="h-3 w-3 fill-gold-500 text-gold-500"
            />
            <span className="text-xs tabular-nums">
              {locale.toPersianDigits(author.averageRating.toFixed(1))}
            </span>
          </Badge>
        )}
      </div>

      {/* Bio preview */}
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {bio?.bioFa ?? bio?.bio ?? author.books[0]?.description ?? '—'}
      </p>

      {/* Tags preview */}
      {bio?.tags && bio.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1">
          {bio.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Single Unified Action Button */}
      <div className="mt-auto pt-4 border-t border-border/40">
        <Button
          asChild
          className="w-full justify-between rounded-xl bg-gold-500/10 hover:bg-gold-500 hover:text-white dark:bg-gold-500/15 dark:hover:bg-gold-500 dark:hover:text-stone-950 text-gold-700 dark:text-gold-300 border border-gold-500/30 transition-all duration-200 group/btn font-medium text-xs sm:text-sm h-10 px-4 shadow-none hover:shadow-md hover:shadow-gold-500/20"
        >
          <Link href={`/authors/${author.slug}`} aria-label={`مشاهده بیوگرافی و آثار ${author.name}`}>
            <span className="flex items-center gap-1.5 font-semibold">
              <BookOpen aria-hidden="true" className="h-4 w-4 text-gold-600 dark:text-gold-400 group-hover/btn:text-current transition-colors" />
              مشاهده بیوگرافی و آثار
            </span>
            <ArrowLeft aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover/btn:-translate-x-1 text-current" />
          </Link>
        </Button>
      </div>
    </article>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-16 text-center">
      <div
        aria-hidden="true"
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/10 text-gold-600 dark:text-gold-400"
      >
        <Search className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground">
        نویسنده‌ای یافت نشد
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {query
          ? `برای «${query}» نویسنده‌ای پیدا نکردیم. نام یا برچسب دیگری را امتحان کنید.`
          : 'هیچ نویسنده‌ای با فیلتر فعلی موجود نیست. فیلترها را تغییر دهید.'}
      </p>
    </div>
  )
}
