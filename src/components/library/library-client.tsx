'use client'

import { BookCardWithPreview } from '@/components/library/book-card-preview'
import { ActiveFilterChips, type ActiveFilter } from '@/components/library/active-filter-chips'
import { LibrarySkeleton } from '@/components/library/library-skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import dynamic from 'next/dynamic'
import {
  BookOpen,
  ChevronDown,
  LayoutGrid,
  LayoutList,
  Loader2,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BookListItem } from '@/lib/data'
import {
  getLocalProgress,
  type ProgressMap,
} from '@/hooks/reader/use-local-progress'
import { cn } from '@/lib/utils'
import { STORAGE_KEYS } from '@/lib/storage-keys'

const MobileFiltersDrawer = dynamic(
  () => import('@/components/library/mobile-filters-drawer').then((mod) => mod.MobileFiltersDrawer),
  { ssr: false }
)
const BookListItemRow = dynamic(
  () => import('@/components/library/book-list-item').then((mod) => mod.BookListItemRow),
  { ssr: false }
)
const LibraryEmptyState = dynamic(
  () => import('@/components/library/empty-state').then((mod) => mod.LibraryEmptyState),
  { ssr: false }
)

const LEVELS = ['A2', 'B1', 'B2', 'C1']
const SORTS = [
  { value: 'recent', label: 'جدیدترین' },
  { value: 'rating', label: 'بالاترین امتیاز' },
  { value: 'views', label: 'پرخواننده‌ترین' },
  { value: 'title', label: 'عنوان (الفبا)' },
  { value: 'year', label: 'سال نشر' },
]
const STATUS_OPTIONS = [
  { value: 'all', label: 'همه' },
  { value: 'unread', label: 'شروع‌نشده' },
  { value: 'reading', label: 'در حال مطالعه' },
  { value: 'finished', label: 'تمام‌شده' },
] as const

/** Min-rating thresholds — chip row in the filter drawer. 0 = "all". */
const RATING_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'همه' },
  { value: 3, label: '۳ به بالا' },
  { value: 3.5, label: '۳٫۵ به بالا' },
  { value: 4, label: '۴ به بالا' },
  { value: 4.5, label: '۴٫۵ به بالا' },
]

type StatusValue = (typeof STATUS_OPTIONS)[number]['value']
type ViewMode = 'grid' | 'list'

const PAGE_SIZE_DESKTOP = 12
const PAGE_SIZE_MOBILE = 6

const VIEW_KEY = STORAGE_KEYS.libraryView
const STATUS_KEY = STORAGE_KEYS.libraryStatus

const STATUS_LABELS: Record<StatusValue, string> = {
  all: 'همه',
  unread: 'شروع‌نشده',
  reading: 'در حال مطالعه',
  finished: 'تمام‌شده',
}

function statusOf(slug: string, progress: ProgressMap): StatusValue {
  const e = progress[slug]
  if (!e || e.percent <= 0) return 'unread'
  if (e.percent >= 100) return 'finished'
  return 'reading'
}

export function useLibraryFilters(initial: BookListItem[]) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [debouncedQ, setDebouncedQ] = useState(q)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(q)
    }, 250)
    return () => clearTimeout(handler)
  }, [q])

  const [genre, setGenre] = useState<string>(searchParams.get('genre') || '')
  const [level, setLevel] = useState<string>(searchParams.get('level') || '')
  const [sort, setSort] = useState<string>(searchParams.get('sort') || 'recent')
  const [minRating, setMinRating] = useState<number>(0)

  const [view, setView] = useState<ViewMode>('grid')
  const [status, setStatus] = useState<StatusValue>('all')
  const [progressMap, setProgressMap] = useState<ProgressMap>({})
  const [visible, setVisible] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 640
      ? PAGE_SIZE_MOBILE
      : PAGE_SIZE_DESKTOP,
  )
    const [filtersOpenMobile, setFiltersOpenMobile] = useState(false)

  
  const [popularGenres, setPopularGenres] = useState<string[]>([])
  const [books, setBooks] = useState<BookListItem[]>(initial)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!filtersOpenMobile && !genre) return
    if (popularGenres.length > 0) return
    let active = true
    fetch('/api/genres?sort=count')
      .then((res) => (res.ok ? res.json() : []))
      .then((gs: any[]) => {
        if (active && Array.isArray(gs)) setPopularGenres(gs.map((g) => g.name))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [filtersOpenMobile, genre, popularGenres.length])

  useEffect(() => {
    const hasFilter = Boolean(debouncedQ || genre || level || (sort && sort !== 'recent'))
    if (!hasFilter) {
      setBooks(initial)
      return
    }
    let active = true
    setLoading(true)
    const params = new URLSearchParams()
    if (debouncedQ) params.set('q', debouncedQ)
    if (genre) params.set('genre', genre)
    if (level) params.set('level', level)
    if (sort) params.set('sort', sort)

    fetch(`/api/books?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: BookListItem[]) => {
        if (active && Array.isArray(data)) {
          setBooks(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [debouncedQ, genre, level, sort, initial])

  useEffect(() => {
        try {
      const v = localStorage.getItem(VIEW_KEY) as ViewMode | null
      if (v && (v === 'grid' || v === 'list')) setView(v)
    } catch {}
    try {
      const s = localStorage.getItem(STATUS_KEY) as StatusValue | null
      if (s && STATUS_OPTIONS.some((o) => o.value === s)) setStatus(s)
    } catch {}
    const p = getLocalProgress()
    if (Object.keys(p).length > 0) {
      setProgressMap(p)
    }
  }, [])

  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (genre) params.set('genre', genre)
    if (level) params.set('level', level)
    if (sort && sort !== 'recent') params.set('sort', sort)
    const qs = params.toString()
    const next = qs ? `/library?${qs}` : '/library'
    router.replace(next, { scroll: false })
  }, [q, genre, level, sort, router])

  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
    setVisible(isMobile ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP)
  }, [q, genre, level, sort, status, minRating])

  // Genres derive from the CMS catalog (API by popularity + genres present
  // in the already-loaded books) — no hardcoded genre list.
  const dynamicGenres = useMemo(() => {
    const set = new Set(popularGenres)
    for (const b of books) {
      for (const g of b.genres) set.add(g)
    }
    return Array.from(set)
  }, [popularGenres, books])

  const filteredBooks = useMemo(() => {
    let arr = books
    if (status !== 'all') {
      arr = arr.filter((b) => statusOf(b.slug, progressMap) === status)
    }
    if (minRating > 0) {
      arr = arr.filter((b) => b.rating >= minRating)
    }
    return arr
  }, [books, status, progressMap, minRating])

  const visibleBooks = filteredBooks.slice(0, visible)
  const hasMore = visible < filteredBooks.length

  const clearAll = useCallback(() => {
    setQ('')
    setGenre('')
    setLevel('')
    setStatus('all')
    setSort('recent')
    setMinRating(0)
  }, [])

  const activeFilters: ActiveFilter[] = useMemo(() => {
    const arr: ActiveFilter[] = []
    if (q.trim()) {
      arr.push({
        key: 'q',
        label: `جستجو: «${q.trim()}»`,
        onRemove: () => setQ(''),
      })
    }
    if (genre) {
      arr.push({
        key: 'genre',
        label: `ژانر: ${genre}`,
        onRemove: () => setGenre(''),
      })
    }
    if (level) {
      arr.push({
        key: 'level',
        label: `سطح: ${level}`,
        onRemove: () => setLevel(''),
      })
    }
    if (status !== 'all') {
      arr.push({
        key: 'status',
        label: `وضعیت: ${STATUS_LABELS[status]}`,
        onRemove: () => setStatus('all'),
      })
    }
    if (minRating > 0) {
      arr.push({
        key: 'rating',
        label: `امتیاز: ${minRating}+`,
        onRemove: () => setMinRating(0),
      })
    }
    if (sort !== 'recent') {
      const label = SORTS.find((s) => s.value === sort)?.label
      if (label) {
        arr.push({
          key: 'sort',
          label: `مرتب‌سازی: ${label}`,
          onRemove: () => setSort('recent'),
        })
      }
    }
    return arr
  }, [q, genre, level, status, sort, minRating])

  const showSkeleton = loading && filteredBooks.length === 0
  const showEmpty = !loading && filteredBooks.length === 0

  return {
    q, setQ,
    genre, setGenre,
    level, setLevel,
    sort, setSort,
    minRating, setMinRating,
    view, setView,
    status, setStatus,
    progressMap,
    visible, setVisible,
    filtersOpenMobile, setFiltersOpenMobile,
    popularGenres,
    dynamicGenres,
    loading,
    filteredBooks,
    visibleBooks,
    hasMore,
    clearAll,
    activeFilters,
    showSkeleton,
    showEmpty,
  }
}

export function LibraryClient({ initial }: { initial: BookListItem[] }) {
  const {
    q, setQ,
    genre, setGenre,
    level, setLevel,
    sort, setSort,
    minRating, setMinRating,
    view, setView,
    status, setStatus,
    progressMap,
    visible, setVisible,
    filtersOpenMobile, setFiltersOpenMobile,
    popularGenres,
    dynamicGenres,
    loading,
    filteredBooks,
    visibleBooks,
    hasMore,
    clearAll,
    activeFilters,
    showSkeleton,
    showEmpty,
  } = useLibraryFilters(initial)

  return (
    <div className="space-y-5">
      {/* ─── Clean search bar ─── */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جستجوی کتاب یا نویسنده..."
          className="ps-9 h-11 rounded-xl border-border/60 bg-card/60"
          aria-label="جستجو"
        />
      </div>

      {/* ─── Compact filter row ─── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="مرتب‌سازی"
            className="h-9 rounded-lg border border-border/70 bg-background/80 pe-7 ps-3 text-xs font-medium text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value} className="bg-background text-foreground">
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* Level */}
        <div className="relative">
          <select
            value={level || 'all'}
            onChange={(e) => setLevel(e.target.value === 'all' ? '' : e.target.value)}
            aria-label="سطح"
            className="h-9 rounded-lg border border-border/70 bg-background/80 pe-7 ps-3 text-xs font-medium text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
          >
            <option value="all" className="bg-background text-foreground">همه سطوح</option>
            {LEVELS.map((l) => (
              <option key={l} value={l} className="bg-background text-foreground">{l}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* Mobile filter button & drawer */}
        <MobileFiltersDrawer
          open={filtersOpenMobile}
          onOpenChange={setFiltersOpenMobile}
          activeFiltersCount={activeFilters.length}
          status={status}
          setStatus={setStatus}
          minRating={minRating}
          setMinRating={setMinRating}
          genre={genre}
          setGenre={setGenre}
          popularGenres={popularGenres}
          genres={dynamicGenres}
          statusOptions={STATUS_OPTIONS}
          ratingOptions={RATING_OPTIONS}
          activeFilters={activeFilters}
          clearAll={clearAll}
          filteredCount={filteredBooks.length}
        />

        {/* Desktop: inline status + rating + view toggle */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Status pills — compact */}
          <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-background/60 p-0.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={cn(
                  'rounded px-2 py-1 text-[11px] font-medium transition-colors',
                  status === opt.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border/60 bg-background/60 p-0.5" role="group" aria-label="نوع نمایش">
            <button
              type="button"
              onClick={() => setView('grid')}
              aria-label="شبکه‌ای"
              className={cn(
                'rounded p-1.5 text-xs transition-colors',
                view === 'grid'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              aria-label="لیستی"
              className={cn(
                'rounded p-1.5 text-xs transition-colors',
                view === 'list'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>

          {/* Clear filters */}
          {activeFilters.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-9 gap-1 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
              پاک کردن
            </Button>
          )}
        </div>
      </div>

      {/* Desktop genre chips — single clean row, scrollable */}
      <div className="hidden sm:flex sm:flex-wrap gap-1.5">
        <Chip active={!genre} onClick={() => setGenre('')}>همه</Chip>
        {dynamicGenres.slice(0, 10).map((g) => (
          <Chip key={g} active={genre === g} onClick={() => setGenre(genre === g ? '' : g)}>
            {g}
          </Chip>
        ))}
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <ActiveFilterChips filters={activeFilters} onClearAll={activeFilters.length > 1 ? clearAll : undefined} />
      )}

      {/* Result count */}
      <p className="text-sm text-muted-foreground">
        {loading ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            در حال جستجو...
          </span>
        ) : (
          <span>
            <span className="font-bold text-foreground">{filteredBooks.length.toLocaleString('fa-IR')}</span> کتاب
          </span>
        )}
      </p>

      {/* Body: skeleton / empty / grid / list */}
      {showSkeleton ? (
        <LibrarySkeleton count={PAGE_SIZE_DESKTOP} view={view} />
      ) : showEmpty ? (
        <LibraryEmptyState
          hasFilters={activeFilters.length > 0}
          popularGenres={popularGenres}
          onClearFilters={clearAll}
          onPickGenre={(g) => {
            setGenre(g)
            setStatus('all')
            setQ('')
            setLevel('')
            setMinRating(0)
          }}
        />
      ) : view === 'list' ? (
        <div className="stagger-in space-y-3">
          {visibleBooks.map((b, i) => (
            <BookListItemRow
              key={b.id}
              book={b}
              index={i}
              progress={progressMap[b.slug]?.percent}
            />
          ))}
        </div>
      ) : (
        <div className="stagger-in grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {visibleBooks.map((b) => (
            <BookCardWithPreview
              key={b.id}
              book={b}
              progress={progressMap[b.slug]?.percent}
            />
          ))}
        </div>
      )}

      {/* Loading more indicator — subtle shimmer when there are more books
          and a fetch is in flight (e.g. user changed filters). */}
      {loading && !showSkeleton && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          در حال به‌روزرسانی...
        </div>
      )}

      {/* Load more */}
      {hasMore && !showSkeleton && !showEmpty && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setVisible((v) => v + (typeof window !== 'undefined' && window.innerWidth < 640 ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP))}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            نمایش بیشتر
            <span className="text-xs text-muted-foreground">
              ({(filteredBooks.length - visible).toLocaleString('fa-IR')} کتاب باقی‌مانده)
            </span>
          </Button>
        </div>
      )}

      {/* Browse genres footer link */}
      {!showSkeleton && !showEmpty && filteredBooks.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button asChild variant="ghost" size="sm">
            <a href="/library/genres">
              <BookOpen className="h-4 w-4" />
              مرور بر اساس ژانر
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'tap-feedback rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary/15 text-primary'
          : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

