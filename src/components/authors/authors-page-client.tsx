'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Feather,
  Globe,
  Library,
  Search,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import type { AuthorSummary } from '@/lib/data'
import type { AuthorBio, AuthorEra } from '@/lib/authors'
import { AUTHOR_ERAS } from '@/lib/authors'
import { cn } from '@/lib/utils'

/** Author record as consumed by the client: `AuthorSummary` + curated bio. */
export type AuthorWithBio = AuthorSummary & {
  bio: AuthorBio | null
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

/**
 * Build a 2-letter avatar initials string from an author name.
 *
 *   "Lewis Carroll"            → "LC"
 *   "L. Frank Baum"            → "LB"   (initials preserved)
 *   "L. M. Montgomery"         → "LM"
 *   "Antoine de Saint-Exupéry" → "AS"   (particles like "de" skipped)
 *   "H. G. Wells"              → "HW"
 */
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
  const [selected, setSelected] = useState<AuthorWithBio | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = authors
    if (q) {
      list = list.filter((a) => {
        const name = a.name.toLowerCase()
        const nameFa = a.bio?.nameFa ?? ''
        const nationality = a.bio?.nationality.toLowerCase() ?? ''
        const nationalityFa = a.bio?.nationalityFa ?? ''
        return (
          name.includes(q) ||
          nameFa.includes(query.trim()) ||
          nationality.includes(q) ||
          nationalityFa.includes(query.trim())
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
      // 'books' — restore the server-side sort (bookCount desc, then name)
      sorted.sort((a, b) => b.bookCount - a.bookCount || a.name.localeCompare(b.name, 'en'))
    }
    return sorted
  }, [authors, query, eraFilter, sort])

  const visibleEraValues = useMemo(() => {
    const set = new Set<string>()
    for (const a of authors) if (a.bio?.era) set.add(a.bio.era)
    return set
  }, [authors])

  // Filter-chip list — only show eras that actually appear in the catalog.
  // "همه" (All) is always shown.
  const visibleEraFilters = ERA_FILTERS.filter(
    (f) => f.value === 'all' || visibleEraValues.has(f.value as string),
  )

  const authorCount = authors.length

  return (
    <div className="space-y-8">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-6 sm:p-8">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-16 -right-16 h-44 w-44 rounded-full bg-rose-500/8 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-700 dark:text-gold-300">
              <Feather aria-hidden="true" className="h-3.5 w-3.5" />
              فهرست نویسندگان
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Users aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="tabular-nums">
                {locale.formatNumber(authorCount)}
              </span>{' '}
              نویسنده
              <span className="mx-1 opacity-50">·</span>
              <BookOpen aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="tabular-nums">
                {locale.formatNumber(totalBooks)}
              </span>{' '}
              کتاب
              <span className="mx-1 opacity-50">·</span>
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
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
            نویسندگان
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            کاوش کنید در زندگی و آثار نویسندگان کلاسیک کتاب‌یار — زندگی‌نامه،
            ملیت، دوران ادبی و کتاب‌های هر نویسنده را در کتابخانهٔ دوزبانه
            مرور کنید.
          </p>
        </div>
      </header>

      {/* ─── Filters ─────────────────────────────────────────────────── */}
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
            placeholder="جستجوی نام نویسنده…"
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

        {/* Era filter chips — horizontally scrollable on mobile. */}
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

        {/* Sort */}
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

      {/* ─── Grid ─────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState query={query} />
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((author, idx) => (
              <motion.div
                key={author.slug}
                layout
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{
                  duration: 0.35,
                  ease: [0.16, 1, 0.3, 1],
                  delay: reduceMotion ? 0 : Math.min(idx * 0.04, 0.3),
                }}
              >
                <AuthorCard
                  author={author}
                  onOpen={() => setSelected(author)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ─── Detail dialog ────────────────────────────────────────────── */}
      <AuthorDetailDialog
        author={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}

/* ----------------------------------------------------------------
 * AuthorCard
 * ---------------------------------------------------------------- */

interface AuthorCardProps {
  author: AuthorWithBio
  onOpen: () => void
}

function AuthorCard({ author, onOpen }: AuthorCardProps) {
  const locale = usePersianLocale()
  const reduceMotion = useReducedMotion()
  const initials = getInitials(author.name)
  const bio = author.bio
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
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-[transform,opacity,colors,border-color,background-color] duration-300 ease-out-expo hover:border-gold-500/40 hover:shadow-book"
    >
      {/* Decorative gold hairline at top, animates in on hover. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px origin-right scale-x-0 bg-gradient-to-l from-transparent via-gold-500/60 to-transparent transition-transform duration-500 ease-out-expo group-hover:scale-x-100"
      />

      <div className="flex items-start gap-4">
        {/* Avatar — gold gradient with serif initials. */}
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

        <div className="min-w-0 flex-1">
          <h3
            className="truncate text-base font-bold text-foreground"
            dir="ltr"
          >
            {author.name}
          </h3>
          {bio?.nameFa && (
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">
              {bio.nameFa}
            </p>
          )}
          {yearsLabel && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar aria-hidden="true" className="h-3 w-3 opacity-70" />
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

      {/* Bio — 2-line clamp. */}
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {bio?.bioFa ?? bio?.bio ?? author.books[0]?.description ?? '—'}
      </p>

      {/* Genres (subtle) */}
      {author.genres.length > 0 && (
        <p className="mt-2 line-clamp-1 text-xs text-muted-foreground/80">
          {author.genres.slice(0, 4).join(' · ')}
        </p>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="text-xs text-muted-foreground">
          {bio ? `${bio.nationality} · ${bio.era}` : 'نویسندهٔ کلاسیک'}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onOpen}
          aria-label={`مشاهده کتاب‌ها و زندگی‌نامهٔ ${author.name}`}
          className="gap-1.5 border-gold-500/40 text-gold-700 transition-colors hover:bg-gold-500/10 hover:text-gold-800 dark:text-gold-300 dark:hover:text-gold-200"
        >
          <BookOpen aria-hidden="true" className="h-3.5 w-3.5" />
          مشاهده کتاب‌ها
        </Button>
      </div>
    </motion.article>
  )
}

/* ----------------------------------------------------------------
 * AuthorDetailDialog
 * ---------------------------------------------------------------- */

interface AuthorDetailDialogProps {
  author: AuthorWithBio | null
  onClose: () => void
}

function AuthorDetailDialog({ author, onClose }: AuthorDetailDialogProps) {
  const locale = usePersianLocale()
  const reduceMotion = useReducedMotion()

  return (
    <Dialog open={!!author} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
        aria-describedby="author-dialog-desc"
      >
        {author && (
          <>
            <DialogHeader className="gap-3">
              <div className="flex items-start gap-4">
                <div
                  aria-hidden="true"
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 shadow-lg shadow-gold-500/25 ring-2 ring-gold-500/15"
                >
                  <span
                    className="font-serif text-2xl font-bold text-white"
                    style={{
                      fontFamily: 'var(--font-display), ui-serif, Georgia, serif',
                    }}
                    dir="ltr"
                  >
                    {getInitials(author.name)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle
                    className="text-xl font-extrabold tracking-tight"
                    dir="ltr"
                  >
                    {author.name}
                  </DialogTitle>
                  {author.bio?.nameFa && (
                    <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                      {author.bio.nameFa}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {author.bio && (
                      <Badge
                        variant="outline"
                        className="gap-1 border-border/70 bg-background/60 text-foreground"
                      >
                        <Globe aria-hidden="true" className="h-3 w-3" />
                        <span className="text-xs">
                          {author.bio.nationalityFa}
                        </span>
                      </Badge>
                    )}
                    {author.bio && (
                      <Badge
                        variant="outline"
                        className="gap-1 border-gold-500/30 bg-gold-500/10 text-gold-700 dark:text-gold-300"
                      >
                        <Feather aria-hidden="true" className="h-3 w-3" />
                        <span className="text-xs">{author.bio.eraFa}</span>
                      </Badge>
                    )}
                    <Badge
                      variant="secondary"
                      className="gap-1 bg-secondary/80 text-secondary-foreground"
                    >
                      <BookOpen aria-hidden="true" className="h-3 w-3" />
                      <span className="tabular-nums">
                        {locale.toPersianDigits(author.bookCount)}
                      </span>{' '}
                      کتاب
                    </Badge>
                  </div>
                </div>
              </div>
              <DialogDescription id="author-dialog-desc" className="sr-only">
                زندگی‌نامه و کتاب‌های {author.name}.
              </DialogDescription>
            </DialogHeader>

            {/* Bio + meta grid */}
            <div className="mt-2 space-y-4">
              {author.bio ? (
                <>
                  {author.bio.birthYear > 0 && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar aria-hidden="true" className="h-4 w-4 text-gold-600 dark:text-gold-400" />
                      <span className="tabular-nums">
                        {locale.toPersianDigits(author.bio.birthYear)} —{' '}
                        {author.bio.deathYear
                          ? locale.toPersianDigits(author.bio.deathYear)
                          : 'اکنون'}
                      </span>
                      <span className="mx-1 opacity-50">·</span>
                      <Globe aria-hidden="true" className="h-4 w-4 text-gold-600 dark:text-gold-400" />
                      <span>
                        {author.bio.nationalityFa} ({author.bio.nationality})
                      </span>
                    </p>
                  )}

                  <p className="text-sm leading-relaxed text-foreground/90">
                    {author.bio.bioFa}
                  </p>

                  {author.bio.notableWorks.length > 0 && (
                    <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <Sparkles
                          aria-hidden="true"
                          className="h-4 w-4 text-gold-600 dark:text-gold-400"
                        />
                        آثار شاخص
                      </h4>
                      <ul className="space-y-1" dir="ltr">
                        {author.bio.notableWorks.map((w) => (
                          <li
                            key={w}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold-500"
                            />
                            <span dir="ltr" className="text-left">
                              {w}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                  زندگی‌نامهٔ این نویسنده هنوز به فهرست اضافه نشده است. کتاب‌های
                  موجود در کتابخانه را در ادامه ببینید.
                </p>
              )}

              {/* Books in the library */}
              <div>
                <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Library
                    aria-hidden="true"
                    className="h-4 w-4 text-gold-600 dark:text-gold-400"
                  />
                  کتاب‌ها در کتاب‌یار
                  <span className="text-xs font-normal text-muted-foreground">
                    ({locale.toPersianDigits(author.books.length)})
                  </span>
                </h4>
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                >
                  {author.books.map((b) => (
                    <BookCard key={b.slug} book={b} />
                  ))}
                </motion.div>
              </div>

              {/* View all in library */}
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-4">
                <Button asChild variant="ghost" size="sm">
                  <Link
                    href={`/authors/${author.slug}`}
                    className="gap-1.5"
                    aria-label={`صفحهٔ اختصاصی ${author.name}`}
                  >
                    <Feather aria-hidden="true" className="h-3.5 w-3.5" />
                    صفحهٔ اختصاصی نویسنده
                  </Link>
                </Button>
                <Button asChild variant="glow" size="sm">
                  <Link
                    href={`/library?author=${encodeURIComponent(author.name)}`}
                    className="gap-1.5"
                    aria-label={`مشاهدهٔ همهٔ کتاب‌های ${author.name} در کتابخانه`}
                  >
                    <Library aria-hidden="true" className="h-3.5 w-3.5" />
                    مشاهدهٔ همه در کتابخانه
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ----------------------------------------------------------------
 * Empty state
 * ---------------------------------------------------------------- */

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
          ? `برای «${query}» نویسنده‌ای پیدا نکردیم. نام دیگری را امتحان کنید یا فیلترها را پاک کنید.`
          : 'هیچ نویسنده‌ای با فیلتر فعلی موجود نیست. فیلترها را تغییر دهید.'}
      </p>
    </div>
  )
}
