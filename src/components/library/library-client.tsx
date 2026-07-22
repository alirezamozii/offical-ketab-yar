'use client'

import { BookCardWithPreview } from '@/components/library/book-card-preview'
import { BookListItemRow } from '@/components/library/book-list-item'
import { ActiveFilterChips, type ActiveFilter } from '@/components/library/active-filter-chips'
import { LibraryEmptyState } from '@/components/library/empty-state'
import { LibrarySkeleton } from '@/components/library/library-skeleton'
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  BookOpen,
  Filter,
  LayoutGrid,
  LayoutList,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { BookListItem } from '@/lib/data'
import {
  getLocalProgress,
  type ProgressMap,
} from '@/hooks/reader/use-local-progress'
import { cn } from '@/lib/utils'
import { STORAGE_KEYS } from '@/lib/storage-keys'

const GENRES = [
  'Fantasy', 'Classic', 'Adventure', 'Romance', 'Mystery', 'Children',
  'Drama', 'Historical', 'Literary', 'Nature', 'Coming of Age',
  'Young Adult', 'Psychological', 'Detective',
]
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

const PAGE_SIZE = 12

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

export function LibraryClient({ initial }: { initial: BookListItem[] }) {
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
  /** Minimum rating threshold (0 = all). Client-side filter — depends on
   *  book.rating which is already in BookListItem, no API change needed. */
  const [minRating, setMinRating] = useState<number>(0)

  // Client-only state (not URL-synced)
  const [view, setView] = useState<ViewMode>('grid')
  const [status, setStatus] = useState<StatusValue>('all')
  const [progressMap, setProgressMap] = useState<ProgressMap>({})
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [mounted, setMounted] = useState(false)
  const [filtersOpenMobile, setFiltersOpenMobile] = useState(false)

  // Re-read progress when invoked (e.g. on mount or when window refocuses)
  const refreshProgress = useCallback(() => {
    setProgressMap(getLocalProgress())
  }, [])

  // TanStack Queries
  const { data: popularGenres = [] } = useQuery<string[]>({
    queryKey: ['genres', 'popular'],
    queryFn: async () => {
      const res = await fetch('/api/genres?sort=count')
      if (!res.ok) return []
      const gs = await res.json()
      return gs.map((g: any) => g.name)
    },
    staleTime: 24 * 60 * 60 * 1000,
  })

  const { data: books = initial, isLoading: loading } = useQuery<BookListItem[]>({
    queryKey: ['books', { q: debouncedQ, genre, level, sort }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (debouncedQ) params.set('q', debouncedQ)
      if (genre) params.set('genre', genre)
      if (level) params.set('level', level)
      if (sort) params.set('sort', sort)
      const res = await fetch(`/api/books?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch books')
      return res.json() as Promise<BookListItem[]>
    },
    initialData: initial,
    staleTime: 30_000,
  })

  // Restore client-only prefs from localStorage on mount
  useEffect(() => {
    setMounted(true)
    try {
      const v = localStorage.getItem(VIEW_KEY) as ViewMode | null
      if (v === 'grid' || v === 'list') setView(v)
    } catch {}
    try {
      const s = localStorage.getItem(STATUS_KEY) as StatusValue | null
      if (s && STATUS_OPTIONS.some((o) => o.value === s)) setStatus(s)
    } catch {}
    refreshProgress()
  }, [refreshProgress])

  useEffect(() => {
    window.addEventListener('focus', refreshProgress)
    return () => window.removeEventListener('focus', refreshProgress)
  }, [refreshProgress])

  // Persist prefs
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(VIEW_KEY, view)
    } catch {}
  }, [view, mounted])
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(STATUS_KEY, status)
    } catch {}
  }, [status, mounted])

  // Keep URL in sync with the URL-synced filters (shareable + back-button)
  useEffect(() => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (genre) params.set('genre', genre)
    if (level) params.set('level', level)
    if (sort && sort !== 'recent') params.set('sort', sort)
    const qs = params.toString()
    const next = qs ? `/library?${qs}` : '/library'
    router.replace(next, { scroll: false })
  }, [q, genre, level, sort, router])

  // Reset "visible" count whenever the underlying book set changes
  useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [q, genre, level, sort, status, minRating])



  // Apply reading-status + min-rating filter (client-side, depends on
  // progressMap + book.rating which are already available)
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
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[130px] h-9 rounded-lg" aria-label="مرتب‌سازی">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Level */}
        <Select
          value={level || 'all'}
          onValueChange={(v) => setLevel(v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-[100px] h-9 rounded-lg" aria-label="سطح">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه سطوح</SelectItem>
            {LEVELS.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Mobile filter button */}
        <Sheet open={filtersOpenMobile} onOpenChange={setFiltersOpenMobile}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 rounded-lg sm:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              فیلتر
              {activeFilters.length > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {activeFilters.length}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" aria-describedby={undefined} className="max-h-[88vh] overflow-y-auto p-0">
            <SheetHeader className="border-b border-border px-5 py-4">
              <SheetTitle className="flex items-center gap-2 text-base font-bold">
                <Filter className="h-4 w-4 text-primary" />
                فیلترها
              </SheetTitle>
            </SheetHeader>
            <div className="p-5 space-y-4">
              {/* Status pills */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">وضعیت مطالعه</p>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_OPTIONS.map((opt) => (
                    <Chip key={opt.value} active={status === opt.value} onClick={() => setStatus(opt.value)}>
                      {opt.label}
                    </Chip>
                  ))}
                </div>
              </div>
              {/* Rating chips */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">حداقل امتیاز</p>
                <div className="flex flex-wrap gap-1.5">
                  {RATING_OPTIONS.map((r) => (
                    <Chip key={r.value} active={minRating === r.value} onClick={() => setMinRating(r.value)}>
                      {r.label}
                    </Chip>
                  ))}
                </div>
              </div>
              {/* Genre chips */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">ژانر</p>
                <div className="flex flex-wrap gap-1.5">
                  <Chip active={!genre} onClick={() => setGenre('')}>همه</Chip>
                  {(popularGenres.length > 0 ? popularGenres : GENRES).map((g) => (
                    <Chip key={g} active={genre === g} onClick={() => setGenre(genre === g ? '' : g)}>
                      {g}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-border bg-card/95 px-5 py-3 backdrop-blur-md">
              <Button variant="ghost" size="sm" onClick={clearAll} disabled={activeFilters.length === 0} className="gap-1.5">
                <X className="h-4 w-4" />
                پاک کردن
              </Button>
              <Button size="sm" variant="glow" onClick={() => setFiltersOpenMobile(false)} className="flex-1 max-w-[60%]">
                نمایش {filteredBooks.length.toLocaleString('fa-IR')} کتاب
              </Button>
            </div>
          </SheetContent>
        </Sheet>

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
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => { if (v === 'grid' || v === 'list') setView(v) }}
            variant="outline"
            size="sm"
            aria-label="نوع نمایش"
          >
            <ToggleGroupItem value="grid" aria-label="شبکه‌ای">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="لیستی">
              <LayoutList className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

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
        {(popularGenres.length > 0 ? popularGenres : GENRES).slice(0, 10).map((g) => (
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
        <LibrarySkeleton count={PAGE_SIZE} view={view} />
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
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
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

