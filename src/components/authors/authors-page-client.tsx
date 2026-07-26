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
import { BookCard } from '@/components/books/book-card'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Feather,
  Globe,
  Library,
  Search,
  Sparkles,
  Star,
  Tag,
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
  const reduceMotion = useReducedMotion()

  const [query, setQuery] = useState('')
  const [eraFilter, setEraFilter] = useState<AuthorEra | 'all'>('all')
  const [sort, setSort] = useState<SortValue>('books')
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)

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

  const toggleExpand = (slug: string) => {
    setExpandedSlug((prev) => (prev === slug ? null : slug))
  }

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
            مجموعه‌ای گران‌بها از زبده‌ترین نویسندگان و برجسته‌ترین چهره‌های ادبیات جهان. در این بخش می‌توانید زندگی‌نامه دوزبانه، ملیت، دوران ادبی، سبک نگارش و کلیه کتاب‌های منتشرشده هر نویسنده را در کتابخانه دوزبانه کتاب‌یار کاوش نمایید.
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

      {/* ─── Grid with In-Page Expansion ───────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState query={query} />
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((author, idx) => {
              const isExpanded = expandedSlug === author.slug
              return (
                <motion.div
                  key={author.slug}
                  layout
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  transition={{
                    duration: 0.35,
                    ease: [0.16, 1, 0.3, 1],
                    delay: reduceMotion ? 0 : Math.min(idx * 0.03, 0.2),
                  }}
                  className={cn(
                    isExpanded && 'sm:col-span-2 lg:col-span-3 transition-all duration-300',
                  )}
                >
                  <AuthorExpandableCard
                    author={author}
                    isExpanded={isExpanded}
                    onToggle={() => toggleExpand(author.slug)}
                  />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------
 * AuthorExpandableCard — Supports inline expansion with full details & books
 * ---------------------------------------------------------------- */

interface AuthorExpandableCardProps {
  author: AuthorWithBio
  isExpanded: boolean
  onToggle: () => void
}

function AuthorExpandableCard({
  author,
  isExpanded,
  onToggle,
}: AuthorExpandableCardProps) {
  const locale = usePersianLocale()
  const reduceMotion = useReducedMotion()
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
    <motion.article
      layout
      whileHover={reduceMotion || isExpanded ? undefined : { y: -4 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-[border-color,box-shadow,background-color] duration-300 hover:border-gold-500/40 hover:shadow-book',
        isExpanded && 'border-gold-500/50 ring-1 ring-gold-500/20 bg-card/95 shadow-xl',
      )}
    >
      {/* Decorative top hairline */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold-500/60 to-transparent"
      />

      <div className="flex items-start gap-4">
        {/* Avatar or Photo */}
        {photoUrl ? (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-gold-500/30 shadow-md">
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
            aria-hidden="true"
            className={cn(
              'flex h-16 w-16 shrink-0 items-center justify-center rounded-full',
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

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3
              className="truncate text-base font-bold text-foreground group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors"
              dir="ltr"
            >
              {author.name}
            </h3>
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
        {bio && (
          <Badge
            variant="outline"
            className="gap-1 border-border/70 bg-background/60 text-foreground"
          >
            <span aria-hidden="true">{bio.flagEmoji}</span>
            <span className="text-xs">{bio.nationalityFa}</span>
          </Badge>
        )}
        {bio && (
          <Badge
            variant="outline"
            className="gap-1 border-gold-500/30 bg-gold-500/10 text-gold-700 dark:text-gold-300"
          >
            <Feather aria-hidden="true" className="h-3 w-3" />
            <span className="text-xs">{bio.eraFa}</span>
          </Badge>
        )}
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

      {/* Bio preview (hidden if expanded) */}
      {!isExpanded && (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {bio?.bioFa ?? bio?.bio ?? author.books[0]?.description ?? '—'}
        </p>
      )}

      {/* Tags preview (if any) */}
      {!isExpanded && bio?.tags && bio.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
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

      {/* Expanded Content Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 space-y-6 border-t border-border/60 pt-5"
          >
            {/* Biography */}
            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold text-foreground mb-2">
                <Sparkles className="h-4 w-4 text-gold-600 dark:text-gold-400" />
                زندگی‌نامه و بیوگرافی
              </h4>
              <p className="text-sm leading-relaxed text-foreground/90">
                {bio?.bioFa || bio?.bio || 'اطلاعات بیشتری ثبت نشده است.'}
              </p>

              {bio?.biographyFa && (
                <div className="mt-3 rounded-xl border border-border/40 bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
                  {bio.biographyFa}
                </div>
              )}
            </div>

            {/* Notable works & tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bio && bio.notableWorks.length > 0 && (
                <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                  <h5 className="mb-2 text-xs font-semibold text-muted-foreground">
                    آثار شاخص:
                  </h5>
                  <ul className="space-y-1" dir="ltr">
                    {bio.notableWorks.map((w) => (
                      <li key={w} className="text-xs text-foreground/80 flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-gold-500" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {bio && bio.tags.length > 0 && (
                <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                  <h5 className="mb-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    برچسب‌ها و سبک نگارش:
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {bio.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md border border-border/60 bg-background/80 px-2 py-0.5 text-xs text-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* External Links */}
            {(bio?.wikipedia || bio?.website) && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {bio.wikipedia && (
                  <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <a href={bio.wikipedia} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                      ویکی‌پدیا
                    </a>
                  </Button>
                )}
                {bio.website && (
                  <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <a href={bio.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-3 w-3" />
                      وبگاه رسمی
                    </a>
                  </Button>
                )}
              </div>
            )}

            {/* Books in Library */}
            <div>
              <h4 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-foreground">
                <Library className="h-4 w-4 text-gold-600 dark:text-gold-400" />
                کتاب‌ها در کتابخانه کتاب‌یار
                <span className="text-xs font-normal text-muted-foreground">
                  ({locale.toPersianDigits(author.books.length)})
                </span>
              </h4>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {author.books.map((b) => (
                  <BookCard key={b.slug} book={b} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer controls */}
      <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/40">
        <Button
          type="button"
          size="sm"
          variant={isExpanded ? 'secondary' : 'outline'}
          onClick={onToggle}
          aria-label={isExpanded ? 'بستن جزئیات' : 'مشاهده بیوگرافی و آثار'}
          className="gap-1.5 border-gold-500/40 text-gold-700 transition-colors hover:bg-gold-500/10 dark:text-gold-300"
        >
          <BookOpen aria-hidden="true" className="h-3.5 w-3.5" />
          {isExpanded ? (
            <>
              بستن جزئیات <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              مشاهده بیوگرافی و آثار <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </Button>

        <Button asChild variant="ghost" size="sm" className="text-xs">
          <Link href={`/authors/${author.slug}`} className="gap-1">
            صفحه اختصاصی
            <Feather className="h-3 w-3" />
          </Link>
        </Button>
      </div>
    </motion.article>
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
