'use client'

/**
 * SearchClient — enhanced instant search experience.
 *
 * Features:
 *  - 250ms debounced instant search with AbortController (cancels in-flight requests)
 *  - Autocomplete dropdown showing top 5 matches (combobox + listbox roles)
 *  - Recent searches in localStorage with "پاک کردن" clear button
 *  - "جستجوهای محبوب" (popular searches) section when no query
 *  - Filter sidebar: genre, level (A1-C2), language, min-rating
 *  - Result-type tabs: books / pages / authors / all
 *  - Highlighted search terms (via pre-split segments from the API)
 *  - "نتیجه‌ای یافت نشد" empty state with suggestions
 *  - Result count + search-time display ("Y نتیجه در Z ثانیه")
 *  - Keyboard navigation (arrow keys + Enter to open)
 *  - URL sync (search query + filters in URL params for shareable links)
 *  - Empty state before any search
 *  - Error state with retry button
 *  - "بیشتر" load-more pagination
 *
 * All text in Persian. Gold/amber/emerald accents only. Animations gated by
 * `useReducedMotion`. localStorage via `STORAGE_KEYS`. Numbers via
 * `usePersianLocale.toPersianDigits`.
 */

import { BookCover } from '@/components/books/book-cover'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  ArrowLeft,
  BookOpen,
  CornerDownLeft,
  FileText,
  Filter,
  Flame,
  HelpCircle,
  History,
  Lightbulb,
  Loader2,
  RotateCw,
  Search,
  SearchX,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { cn } from '@/lib/utils'

interface Segment {
  text: string
  match: boolean
}

type SearchHitType = 'book' | 'page' | 'author'

interface SearchHit {
  bookSlug: string
  bookTitle: string
  bookAuthor: string
  coverFrom: string
  coverTo: string
  coverAccent: string
  pageNumber: number
  snippetEn: string
  snippetFa: string
  segments: Segment[]
  matchType: 'english' | 'farsi'
  score: number
  highlight: string
  type: SearchHitType
}

interface SearchResponse {
  hits: SearchHit[]
  total: number
  bookCount: number
  took: number
  fuzzy: boolean
  offset: number
  limit: number
}

interface GenreAgg {
  name: string
  count: number
  views: number
}

type Lang = 'all' | 'en' | 'fa'
type ResultTab = 'all' | 'book' | 'page' | 'author'

const RECENT_KEY = STORAGE_KEYS.recentSearches
const MAX_RECENT = 10
const DEBOUNCE_MS = 250
const PAGE_SIZE = 20
const AUTOCOMPLETE_COUNT = 5

/** Curated "popular searches" — a mix of common English/Farsi terms likely
 *  to surface good results across the catalog. Shown when the input is empty. */
const POPULAR_SEARCHES: { term: string; dir: 'rtl' | 'ltr' }[] = [
  { term: 'Alice', dir: 'ltr' },
  { term: 'Sherlock', dir: 'ltr' },
  { term: 'love', dir: 'ltr' },
  { term: 'هوش مصنوعی', dir: 'rtl' },
  { term: 'دوزبانه', dir: 'rtl' },
  { term: 'آسمان', dir: 'rtl' },
  { term: 'Frankenstein', dir: 'ltr' },
  { term: 'poetry', dir: 'ltr' },
]

const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'en', label: 'انگلیسی' },
  { value: 'fa', label: 'فارسی' },
]

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

const TAB_DEFS: { value: ResultTab; label: string; icon: typeof BookOpen }[] = [
  { value: 'all', label: 'همه', icon: Search },
  { value: 'book', label: 'کتاب‌ها', icon: BookOpen },
  { value: 'page', label: 'صفحات', icon: FileText },
  { value: 'author', label: 'نویسندگان', icon: User },
]

interface SearchFilters {
  lang: Lang
  genres: string[]
  levels: string[]
  minRating: number
}

const EMPTY_FILTERS: SearchFilters = {
  lang: 'all',
  genres: [],
  levels: [],
  minRating: 0,
}

export function SearchClient({
  initialQuery,
  initialFilters = EMPTY_FILTERS,
}: {
  initialQuery: string
  initialFilters?: SearchFilters
}) {
  const router = useRouter()
  const { toPersianDigits } = usePersianLocale()
  const reduceMotion = useReducedMotion()

  // ─── state ──────────────────────────────────────────────────────────
  const [q, setQ] = useState(initialQuery)
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [tab, setTab] = useState<ResultTab>('all')

  const [hits, setHits] = useState<SearchHit[]>([])
  const [total, setTotal] = useState(0)
  const [bookCount, setBookCount] = useState(0)
  const [took, setTook] = useState(0)
  const [fuzzy, setFuzzy] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [recent, setRecent] = useState<string[]>([])
  const [genres, setGenres] = useState<GenreAgg[]>([])
  const [genresLoading, setGenresLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const [selectedIdx, setSelectedIdx] = useState(-1)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // ─── refs ───────────────────────────────────────────────────────────
  const inputRef = useRef<HTMLInputElement>(null)
  const hitRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const lastRequestRef = useRef<{ q: string; filters: SearchFilters } | null>(null)

  // ─── load recent searches + genre list on mount ─────────────────────
  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem(RECENT_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setRecent(parsed.filter((x) => typeof x === 'string').slice(0, MAX_RECENT))
        }
      }
    } catch {
      /* ignore — private mode / corrupt entry */
    }
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    let cancelled = false
    setGenresLoading(true)
    fetch('/api/genres?sort=count')
      .then((r) => (r.ok ? r.json() : []))
      .then((g: GenreAgg[]) => {
        if (!cancelled) setGenres(g)
      })
      .catch(() => {
        if (!cancelled) setGenres([])
      })
      .finally(() => {
        if (!cancelled) setGenresLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // ─── recent searches ────────────────────────────────────────────────
  const saveRecent = useCallback((term: string) => {
    setRecent((prev) => {
      const next = [term, ...prev.filter((x) => x !== term)].slice(0, MAX_RECENT)
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const clearRecent = useCallback(() => {
    setRecent([])
    try {
      localStorage.removeItem(RECENT_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  // ─── URL sync (query + filters) ─────────────────────────────────────
  // Replace the URL whenever q or filters change so the page is shareable.
  // Uses history.replaceState to avoid a full navigation on every keystroke.
  useEffect(() => {
    if (!mounted) return
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (filters.lang !== 'all') params.set('lang', filters.lang)
    if (filters.genres.length) params.set('genre', filters.genres.join(','))
    if (filters.levels.length) params.set('level', filters.levels.join(','))
    if (filters.minRating > 0) params.set('minRating', String(filters.minRating))
    const qs = params.toString()
    const url = qs ? `/search?${qs}` : '/search'
    window.history.replaceState(null, '', url)
  }, [q, filters, mounted])

  // ─── debounced instant search ──────────────────────────────────────
  const runSearch = useCallback(
    async (query: string, f: SearchFilters, offset: number, append: boolean) => {
      const trimmed = query.trim()
      if (trimmed.length < 2) {
        setHits([])
        setTotal(0)
        setBookCount(0)
        setTook(0)
        setFuzzy(false)
        setSearched(false)
        setSelectedIdx(-1)
        setHasMore(false)
        setLoading(false)
        setError(null)
        return
      }

      // Cancel any in-flight request before starting a new one.
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
        setSearched(true)
        setSelectedIdx(-1)
      }
      setError(null)

      const params = new URLSearchParams()
      params.set('q', trimmed)
      params.set('lang', f.lang)
      params.set('offset', String(offset))
      params.set('limit', String(PAGE_SIZE))
      if (f.genres.length) params.set('genre', f.genres.join(','))
      if (f.levels.length) params.set('level', f.levels.join(','))
      if (f.minRating > 0) params.set('minRating', String(f.minRating))

      try {
        const res = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as SearchResponse
        // Stale-response guard: if the user typed more since this request was
        // issued, drop the result — a newer request is in flight.
        if (
          lastRequestRef.current &&
          (lastRequestRef.current.q !== trimmed ||
            !shallowEqFilters(lastRequestRef.current.filters, f))
        ) {
          return
        }
        const next = data.hits || []
        setHits((prev) => (append ? [...prev, ...next] : next))
        setTotal(data.total ?? 0)
        setBookCount(data.bookCount ?? 0)
        setTook(data.took ?? 0)
        setFuzzy(!!data.fuzzy)
        setHasMore(offset + next.length < (data.total ?? 0))
        if (!append && next.length > 0) saveRecent(trimmed)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        if (!append) {
          setError('خطا در دریافت نتایج جستجو. لطفاً دوباره تلاش کنید.')
        }
      } finally {
        if (append) setLoadingMore(false)
        else setLoading(false)
      }
    },
    [saveRecent],
  )

  // Debounced search trigger — fires 250ms after q / filters change.
  useEffect(() => {
    const trimmed = q.trim()
    if (trimmed.length < 2) {
      // Synchronous clear (no debounce) for snappy UX when input is short.
      setHits([])
      setTotal(0)
      setBookCount(0)
      setTook(0)
      setFuzzy(false)
      setSearched(false)
      setSelectedIdx(-1)
      setHasMore(false)
      setLoading(false)
      setError(null)
      return
    }
    lastRequestRef.current = { q: trimmed, filters }
    const timer = window.setTimeout(() => {
      void runSearch(trimmed, filters, 0, false)
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [q, filters, runSearch])

  // Cleanup any in-flight request on unmount.
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  // ─── keyboard navigation on results ─────────────────────────────────
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (hits.length === 0) return
      e.preventDefault()
      setSelectedIdx((i) => (i + 1) % hits.length)
    } else if (e.key === 'ArrowUp') {
      if (hits.length === 0) return
      e.preventDefault()
      setSelectedIdx((i) => (i - 1 + hits.length) % hits.length)
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      const h = hits[selectedIdx]
      if (h) {
        e.preventDefault()
        router.push(`/books/read/${h.bookSlug}`)
      }
    } else if (e.key === 'Escape') {
      setSelectedIdx(-1)
      setDropdownOpen(false)
      ;(e.target as HTMLInputElement).blur()
    }
  }

  // Scroll selected hit into view.
  useEffect(() => {
    if (selectedIdx < 0) return
    const el = hitRefs.current[selectedIdx]
    el?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [selectedIdx, reduceMotion])

  // Close autocomplete dropdown on outside click.
  useEffect(() => {
    if (!dropdownOpen) return
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [dropdownOpen])

  // ─── derived ────────────────────────────────────────────────────────
  /** Group hits by book, preserving flat order from the API. */
  const grouped = useMemo(() => {
    const map = new Map<string, SearchHit[]>()
    for (const h of hits) {
      const arr = map.get(h.bookSlug) ?? []
      arr.push(h)
      map.set(h.bookSlug, arr)
    }
    return Array.from(map.entries())
  }, [hits])

  const flatIndexOf = (h: SearchHit) => hits.indexOf(h)

  const autocompleteHits = useMemo(
    () => hits.slice(0, AUTOCOMPLETE_COUNT),
    [hits],
  )

  const inputEmpty = q.trim() === ''
  const showDropdown =
    dropdownOpen && !inputEmpty && autocompleteHits.length > 0 && !loading

  // ─── handlers ───────────────────────────────────────────────────────
  const runChip = (term: string) => {
    setQ(term)
    inputRef.current?.focus()
    setDropdownOpen(true)
  }

  const loadMore = () => {
    if (loadingMore || !hasMore) return
    void runSearch(q.trim(), filters, hits.length, true)
  }

  const retry = () => {
    setError(null)
    void runSearch(q.trim(), filters, 0, false)
  }

  const toggleGenre = (g: string) => {
    setFilters((f) => ({
      ...f,
      genres: f.genres.includes(g)
        ? f.genres.filter((x) => x !== g)
        : [...f.genres, g],
    }))
  }

  const toggleLevel = (lv: string) => {
    setFilters((f) => ({
      ...f,
      levels: f.levels.includes(lv)
        ? f.levels.filter((x) => x !== lv)
        : [...f.levels, lv],
    }))
  }

  const clearFilters = () => setFilters(EMPTY_FILTERS)

  const activeFilterCount =
    (filters.lang !== 'all' ? 1 : 0) +
    filters.genres.length +
    filters.levels.length +
    (filters.minRating > 0 ? 1 : 0)

  // ─── render ─────────────────────────────────────────────────────────
  // SSR-safe: render a skeleton during SSR + the first client render (before
  // the `mounted` effect runs), then swap to the full UI. This avoids any
  // hydration mismatch caused by framer-motion's `useReducedMotion` returning
  // `null` on the server but `false`/`true` on the client.
  if (!mounted) {
    return (
      <div className="space-y-6" suppressHydrationWarning>
        <div className="relative">
          <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/50 p-3 shadow-sm">
            <div className="h-12 flex-1 animate-pulse rounded-lg bg-muted/50" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl border border-border/40 bg-card/30" />
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-32 animate-pulse rounded-xl border border-border/40 bg-card/30" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ---------- search form with autocomplete ---------- */}
      <div ref={containerRef} className="relative">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            // Enter with no selection → jump to first hit (if any).
            if (selectedIdx < 0 && hits.length > 0) {
              router.push(`/books/read/${hits[0].bookSlug}`)
            }
          }}
          className="relative"
          role="search"
        >
          <Search className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setDropdownOpen(true)
            }}
            onKeyDown={onKeyDown}
            onFocus={() => setDropdownOpen(true)}
            onBlur={() => {
              // Delay so click events on dropdown items fire first.
              window.setTimeout(() => setDropdownOpen(false), 150)
            }}
            placeholder="جستجو در متن کتاب‌ها... (حداقل ۲ حرف)"
            className="h-12 ps-11 pe-16 text-base"
            autoFocus
            aria-label="جستجو در کتاب‌ها"
            aria-expanded={showDropdown}
            aria-controls="search-autocomplete"
            aria-autocomplete="list"
            role="combobox"
            aria-activedescendant={
              selectedIdx >= 0 ? `search-hit-${selectedIdx}` : undefined
            }
          />
          <div className="absolute end-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {q && !loading && (
              <button
                type="button"
                onClick={() => {
                  setQ('')
                  inputRef.current?.focus()
                }}
                aria-label="پاک کردن عبارت جستجو"
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {!q && !loading && hits.length > 0 && (
              <span className="pointer-events-none hidden items-center gap-1 rounded-md bg-muted/70 px-2 py-0.5 text-[10px] text-muted-foreground sm:flex">
                <CornerDownLeft className="h-3 w-3" />
                باز کردن
              </span>
            )}
          </div>
        </form>

        {/* ---------- autocomplete dropdown (top 5 matches) ---------- */}
        {showDropdown && (
          <motion.div
            id="search-autocomplete"
            role="listbox"
            aria-label="پیشنهادهای جستجو"
            initial={reduceMotion ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-3 py-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">
                {toPersianDigits(autocompleteHits.length)} نتیجه برتر
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <CornerDownLeft className="h-3 w-3" />
                برای انتخاب کلید Enter
              </span>
            </div>
            <ul className="max-h-80 overflow-y-auto py-1">
              {autocompleteHits.map((h, i) => (
                <li key={`${h.bookSlug}-${h.pageNumber}-${h.matchType}-${i}`}>
                  <Link
                    href={`/books/read/${h.bookSlug}`}
                    role="option"
                    aria-selected={i === selectedIdx}
                    className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-accent/60"
                  >
                    <span className="flex h-7 w-5 shrink-0 items-center justify-center">
                      {h.type === 'author' ? (
                        <User className="h-4 w-4 text-muted-foreground" />
                      ) : h.type === 'book' ? (
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium" dir="ltr">
                        {h.bookTitle}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {h.bookAuthor}
                        {h.pageNumber > 0 && (
                          <>
                            {' · '}
                            <span dir="rtl">
                              صفحه {toPersianDigits(h.pageNumber + 1)}
                            </span>
                          </>
                        )}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                        h.matchType === 'english'
                          ? 'bg-gold-500/15 text-gold-700 dark:text-gold-400'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
                      )}
                    >
                      {h.matchType === 'english' ? 'EN' : 'FA'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>

      {/* ---------- language filter + status bar ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          type="single"
          value={filters.lang}
          onValueChange={(v) => {
            if (v === 'all' || v === 'en' || v === 'fa') {
              setFilters((f) => ({ ...f, lang: v }))
            }
          }}
          variant="outline"
          size="sm"
          aria-label="فیلتر زبان نتایج"
        >
          {LANG_OPTIONS.map((o) => (
            <ToggleGroupItem key={o.value} value={o.value} aria-label={o.label}>
              {o.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {error
            ? 'خطا در جستجو'
            : searched && !loading && hits.length > 0
              ? `${toPersianDigits(total)} نتیجه در ${toPersianDigits(
                  bookCount,
                )} کتاب — ${formatSearchTime(took, toPersianDigits)}`
              : searched && !loading && hits.length === 0
                ? 'بدون نتیجه'
                : loading
                  ? 'در حال جستجو…'
                  : 'زبان نتایج را فیلتر کنید'}
        </p>
      </div>

      {/* ---------- result type tabs ---------- */}
      {!inputEmpty && (
        <Tabs value={tab} onValueChange={(v) => setTab(v as ResultTab)}>
          <TabsList className="w-full justify-start sm:w-auto">
            {TAB_DEFS.map((t) => {
              const Icon = t.icon
              const count =
                t.value === 'all'
                  ? hits.length
                  : hits.filter((h) => h.type === t.value).length
              return (
                <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  <span>{t.label}</span>
                  {count > 0 && (
                    <span className="rounded-full bg-muted-foreground/15 px-1.5 text-[10px] font-medium text-muted-foreground">
                      {toPersianDigits(count)}
                    </span>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      )}

      {/* ---------- two-column layout: filters + results ---------- */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* ---------- filter sidebar ---------- */}
        <FilterSidebar
          genres={genres}
          genresLoading={genresLoading}
          filters={filters}
          activeCount={activeFilterCount}
          mounted={mounted}
          onToggleGenre={toggleGenre}
          onToggleLevel={toggleLevel}
          onLangChange={(lang) => setFilters((f) => ({ ...f, lang }))}
          onMinRatingChange={(v) => setFilters((f) => ({ ...f, minRating: v[0] ?? 0 }))}
          onClear={clearFilters}
          toPersianDigits={toPersianDigits}
        />

        {/* ---------- main content ---------- */}
        <div className="min-w-0">
          {inputEmpty ? (
            /* ---------- discovery panel (input empty) ---------- */
            <DiscoveryPanel
              mounted={mounted}
              recent={recent}
              onRunChip={runChip}
              onClearRecent={clearRecent}
              toPersianDigits={toPersianDigits}
            />
          ) : error ? (
            /* ---------- error state ---------- */
            <ErrorState onRetry={retry} />
          ) : loading ? (
            /* ---------- loading skeletons ---------- */
            <LoadingSkeletons />
          ) : hits.length === 0 ? (
            /* ---------- no results ---------- */
            <NoResults query={q.trim()} onRunChip={runChip} />
          ) : (
            /* ---------- results ---------- */
            <div className="space-y-6">
              {fuzzy && (
                <div className="flex items-start gap-2 rounded-xl border border-gold-500/30 bg-gold-500/5 p-3 text-sm">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gold-600 dark:text-gold-400" />
                  <p className="text-muted-foreground">
                    نتیجه دقیق یافت نشد. نتایج نمایش‌داده‌شده بر اساس تطبیق
                    کلمات عبارت شما هستند.
                  </p>
                </div>
              )}
              <motion.div
                className="stagger-in space-y-6"
                initial={reduceMotion ? false : false}
              >
                <ResultsList
                  grouped={grouped}
                  tab={tab}
                  selectedIdx={selectedIdx}
                  flatIndexOf={flatIndexOf}
                  hitRefs={hitRefs}
                  toPersianDigits={toPersianDigits}
                />
              </motion.div>

              {/* ---------- load more ---------- */}
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="gap-2"
                  >
                    {loadingMore ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowLeft className="h-4 w-4" />
                    )}
                    {loadingMore ? 'در حال بارگذاری…' : 'بیشتر'}
                  </Button>
                </div>
              )}

              {!hasMore && total > PAGE_SIZE && (
                <p className="text-center text-xs text-muted-foreground">
                  نمایش همه {toPersianDigits(total)} نتیجه
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/library">
            <ArrowLeft className="h-4 w-4" />
            بازگشت به کتابخانه
          </Link>
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Format search execution time — ms if <1s, seconds with one decimal otherwise. */
function formatSearchTime(
  tookMs: number,
  toFa: (n: string | number) => string,
): string {
  if (tookMs < 1000) return `${toFa(tookMs)} میلی‌ثانیه`
  const sec = (tookMs / 1000).toFixed(1)
  return `${toFa(sec)} ثانیه`
}

/** Shallow comparison for SearchFilters — used by the stale-response guard. */
function shallowEqFilters(a: SearchFilters, b: SearchFilters): boolean {
  if (a.lang !== b.lang) return false
  if (a.minRating !== b.minRating) return false
  if (a.genres.length !== b.genres.length) return false
  if (a.levels.length !== b.levels.length) return false
  if (!a.genres.every((g) => b.genres.includes(g))) return false
  if (!a.levels.every((l) => b.levels.includes(l))) return false
  return true
}

/** Render pre-computed highlight segments from the API. */
function Segments({ segments }: { segments: Segment[] }) {
  return (
    <>
      {segments.map((s, i) =>
        s.match ? (
          <mark
            key={i}
            className="rounded bg-gold-400/40 px-0.5 font-semibold text-foreground dark:bg-gold-500/30"
          >
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  )
}

/** Relevance badge — color-coded by score band. */
function RelevanceBadge({ score }: { score: number }) {
  let label = 'کم'
  let cls = 'bg-muted text-muted-foreground'
  if (score >= 10_000) {
    label = 'عالی'
    cls = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
  } else if (score >= 5_000) {
    label = 'بالا'
    cls = 'bg-gold-500/15 text-gold-700 dark:text-gold-400'
  } else if (score >= 1_000) {
    label = 'متوسط'
    cls = 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
  }
  return (
    <Badge variant="secondary" className={cn('text-[10px] font-medium', cls)}>
      {label}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// FilterSidebar
// ---------------------------------------------------------------------------

interface FilterSidebarProps {
  genres: GenreAgg[]
  genresLoading: boolean
  filters: SearchFilters
  activeCount: number
  mounted: boolean
  onToggleGenre: (g: string) => void
  onToggleLevel: (lv: string) => void
  onLangChange: (lang: Lang) => void
  onMinRatingChange: (v: number[]) => void
  onClear: () => void
  toPersianDigits: (n: string | number) => string
}

function FilterSidebar({
  genres,
  genresLoading,
  filters,
  activeCount,
  mounted,
  onToggleGenre,
  onToggleLevel,
  onLangChange,
  onMinRatingChange,
  onClear,
  toPersianDigits,
}: FilterSidebarProps) {
  return (
    <aside
      className="hidden lg:block"
      aria-label="فیلترهای جستجو"
    >
      <div className="sticky top-4 space-y-5 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Filter className="h-4 w-4 text-gold-600 dark:text-gold-400" />
            فیلترها
          </h2>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-muted-foreground transition-colors hover:text-destructive"
            >
              پاک کردن ({toPersianDigits(activeCount)})
            </button>
          )}
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            زبان
          </Label>
          <ToggleGroup
            type="single"
            value={filters.lang}
            onValueChange={(v) => {
              if (v === 'all' || v === 'en' || v === 'fa') onLangChange(v)
            }}
            variant="outline"
            size="sm"
            className="w-full justify-stretch"
            aria-label="فیلتر زبان"
          >
            {LANG_OPTIONS.map((o) => (
              <ToggleGroupItem
                key={o.value}
                value={o.value}
                aria-label={o.label}
                className="flex-1"
              >
                {o.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Level (A1-C2) */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            سطح (CEFR)
          </Label>
          <div className="grid grid-cols-3 gap-1.5">
            {LEVELS.map((lv) => {
              const active = filters.levels.includes(lv)
              return (
                <button
                  key={lv}
                  type="button"
                  onClick={() => onToggleLevel(lv)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                    active
                      ? 'border-gold-500 bg-gold-500/15 text-gold-700 dark:text-gold-400'
                      : 'border-border bg-transparent text-muted-foreground hover:bg-accent',
                  )}
                >
                  {lv}
                </button>
              )
            })}
          </div>
        </div>

        {/* Min rating */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">
              حداقل امتیاز
            </Label>
            <span className="text-xs font-medium text-foreground">
              {filters.minRating > 0
                ? `${toPersianDigits(filters.minRating)}+`
                : '—'}
            </span>
          </div>
          <Slider
            value={[filters.minRating]}
            onValueChange={onMinRatingChange}
            min={0}
            max={5}
            step={0.5}
            aria-label="حداقل امتیاز کتاب"
            disabled={!mounted}
          />
        </div>

        {/* Genres */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            ژانر
          </Label>
          {genresLoading ? (
            <div className="space-y-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : genres.length === 0 ? (
            <p className="text-xs text-muted-foreground">ژانری موجود نیست.</p>
          ) : (
            <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
              {genres.map((g) => {
                const active = filters.genres.includes(g.name)
                return (
                  <label
                    key={g.name}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-xs transition-colors hover:bg-accent/60"
                  >
                    <Checkbox
                      checked={active}
                      onCheckedChange={() => onToggleGenre(g.name)}
                      aria-label={`فیلتر بر اساس ژانر ${g.name}`}
                    />
                    <span className="flex-1 truncate">{g.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {toPersianDigits(g.count)}
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

// ---------------------------------------------------------------------------
// DiscoveryPanel — shown when input is empty
// ---------------------------------------------------------------------------

interface DiscoveryPanelProps {
  mounted: boolean
  recent: string[]
  onRunChip: (term: string) => void
  onClearRecent: () => void
  toPersianDigits: (n: string | number) => string
}

function DiscoveryPanel({
  mounted,
  recent,
  onRunChip,
  onClearRecent,
}: DiscoveryPanelProps) {
  return (
    <div className="space-y-6">
      {/* Recent searches */}
      {mounted && recent.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <History className="h-4 w-4" />
              جستجوهای اخیر
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearRecent}
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              پاک کردن
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onRunChip(term)}
                dir={/[\u0600-\u06FF]/.test(term) ? 'rtl' : 'ltr'}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:border-primary/40 hover:bg-accent/60"
              >
                {term}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Popular searches */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Flame className="h-4 w-4 text-gold-600 dark:text-gold-400" />
          جستجوهای محبوب
        </h2>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SEARCHES.map((p) => (
            <button
              key={p.term}
              type="button"
              onClick={() => onRunChip(p.term)}
              dir={p.dir}
              className="rounded-full border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-sm text-foreground transition-colors hover:border-gold-500/60 hover:bg-gold-500/15"
            >
              {p.term}
            </button>
          ))}
        </div>
      </section>

      {/* Instructional card */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-12 text-center">
        <Search className="h-10 w-10 text-muted-foreground" />
        <p className="font-semibold">در متن کتاب‌ها جستجو کنید</p>
        <p className="max-w-md text-sm text-muted-foreground">
          کلمه یا عبارتی را وارد کنید تا در محتوای انگلیسی و فارسی همه کتاب‌ها
          جستجو شود. با کلیدهای جهت‌نما بین نتایج جابه‌جا شوید و Enter را بزنید.
          از فیلترهای کناری برای محدود کردن نتایج استفاده کنید.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// LoadingSkeletons
// ---------------------------------------------------------------------------

function LoadingSkeletons() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-border/60"
        >
          <div className="flex items-center gap-3 border-b border-border/50 bg-muted/30 p-3">
            <Skeleton className="h-16 w-12 shrink-0 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ErrorState
// ---------------------------------------------------------------------------

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-destructive/40 py-12 text-center">
      <SearchX className="h-12 w-12 text-destructive/60" />
      <p className="font-semibold">خطا در جستجو</p>
      <p className="max-w-md text-sm text-muted-foreground">
        دریافت نتایج جستجو با خطا مواجه شد. لطفاً دوباره تلاش کنید.
      </p>
      <Button onClick={onRetry} size="sm" variant="outline" className="mt-2 gap-2">
        <RotateCw className="h-4 w-4" />
        تلاش مجدد
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// NoResults
// ---------------------------------------------------------------------------

function NoResults({
  query,
  onRunChip,
}: {
  query: string
  onRunChip: (term: string) => void
}) {
  // Generate a few "آیا منظورتان این بود؟" variants of the user's query.
  // These are lightweight transformations (trimmed, lowercased, first/last
  // half, stripped non-alphanumeric) — they don't require server round-trip
  // and often surface the actual match (e.g. user typed "alice in" but meant
  // "Alice in Wonderland", or "shrlck" → "Sherlock").
  const suggestions = useMemo(() => {
    const q = query.trim()
    if (!q) return [] as string[]
    const seen = new Set<string>()
    const out: string[] = []
    const push = (s: string) => {
      const lower = s.toLowerCase()
      if (lower && lower !== q.toLowerCase() && !seen.has(lower)) {
        seen.add(lower)
        out.push(s)
      }
    }
    // Strip punctuation / non-word chars
    push(q.replace(/[^\p{L}\p{N}\s]/gu, '').trim())
    // First half (likely the "topic" half — e.g. "Alice in Wonderland" → "Alice")
    const words = q.split(/\s+/).filter(Boolean)
    if (words.length >= 2) {
      push(words.slice(0, Math.ceil(words.length / 2)).join(' '))
      push(words.slice(0, 1).join(' '))
      push(words.slice(-1).join(' '))
    }
    // Lowercased + capitalized variants
    push(q.charAt(0).toUpperCase() + q.slice(1).toLowerCase())
    return out.slice(0, 5)
  }, [query])

  return (
    <div className="space-y-6">
      <div className="relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-dashed border-border py-12 text-center">
        {/* Soft gold halo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 left-1/2 -z-10 h-36 w-36 -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl"
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/20">
          <SearchX className="h-7 w-7" />
        </div>
        <p className="font-semibold">نتیجه‌ای یافت نشد</p>
        <p className="max-w-md text-sm text-muted-foreground">
          عبارت «<span className="font-medium text-foreground">{query}</span>»
          در هیچ کتابی یافت نشد. عبارت دیگری را امتحان کنید یا فیلترها را
          تغییر دهید.
        </p>
        <Button asChild size="sm" variant="glow" className="mt-1 gap-2">
          <Link href="/library">
            <BookOpen className="h-4 w-4" />
            مرور کتابخانه
          </Link>
        </Button>
      </div>

      {/* "آیا منظورتان این بود؟" — variant suggestions of the user's query */}
      {suggestions.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <HelpCircle className="h-4 w-4 text-gold-600 dark:text-gold-400" />
            آیا منظورتان این بود؟
          </h2>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onRunChip(s)}
                dir="auto"
                className="rounded-full border border-gold-500/40 bg-gold-500/5 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-gold-500/70 hover:bg-gold-500/15"
              >
                {s}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Sparkles className="h-4 w-4 text-gold-600 dark:text-gold-400" />
          پیشنهادهای دیگر
        </h2>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SEARCHES.map((p) => (
            <button
              key={p.term}
              type="button"
              onClick={() => onRunChip(p.term)}
              dir={p.dir}
              className="rounded-full border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-sm text-foreground transition-colors hover:border-gold-500/60 hover:bg-gold-500/15"
            >
              {p.term}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ResultsList — renders grouped hits, optionally filtered by the active tab
// ---------------------------------------------------------------------------

interface ResultsListProps {
  grouped: [string, SearchHit[]][]
  tab: ResultTab
  selectedIdx: number
  flatIndexOf: (h: SearchHit) => number
  hitRefs: React.MutableRefObject<(HTMLAnchorElement | null)[]>
  toPersianDigits: (n: string | number) => string
}

function ResultsList({
  grouped,
  tab,
  selectedIdx,
  flatIndexOf,
  hitRefs,
  toPersianDigits,
}: ResultsListProps) {
  // Filter the grouped hits by the active tab. The flat-index lookup must
  // still map to the ORIGINAL hits array (so keyboard nav stays in sync), so
  // we filter at render time rather than re-slicing.
  const visibleGroups = grouped
    .map(([slug, list]) => {
      const filtered =
        tab === 'all' ? list : list.filter((h) => h.type === tab)
      return [slug, filtered] as [string, SearchHit[]]
    })
    .filter(([, list]) => list.length > 0)

  if (visibleGroups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        در این دسته نتیجه‌ای نیست.
      </div>
    )
  }

  return (
    <>
      {visibleGroups.map(([slug, bookHits]) => (
        <div
          key={slug}
          className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
        >
          {/* Book header */}
          <div className="flex items-center gap-3 border-b border-border/50 bg-muted/30 p-3">
            <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md shadow">
              <BookCover
                title={bookHits[0].bookTitle}
                author={bookHits[0].bookAuthor}
                from={bookHits[0].coverFrom}
                to={bookHits[0].coverTo}
                accent={bookHits[0].coverAccent}
                size="sm"
              />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/books/${slug}`}
                className="font-bold hover:text-primary"
                dir="ltr"
              >
                {bookHits[0].bookTitle}
              </Link>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {bookHits[0].bookAuthor}
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={`/books/read/${slug}`}>
                <BookOpen className="h-4 w-4" />
                مطالعه
              </Link>
            </Button>
          </div>

          {/* Hit rows */}
          <div className="divide-y divide-border/40">
            {bookHits.map((h) => {
              const flatIdx = flatIndexOf(h)
              const selected = flatIdx === selectedIdx
              return (
                <Link
                  key={`${h.pageNumber}-${h.matchType}-${flatIdx}`}
                  ref={(el) => {
                    hitRefs.current[flatIdx] = el
                  }}
                  href={`/books/read/${slug}`}
                  id={`search-hit-${flatIdx}`}
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    'block p-4 transition-colors hover:bg-accent/40',
                    selected && 'bg-primary/5 ring-2 ring-inset ring-primary',
                  )}
                >
                  <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {h.type === 'page' && h.pageNumber > 0 && (
                      <>
                        <FileText className="h-3.5 w-3.5" />
                        <span dir="rtl">
                          صفحه {toPersianDigits(h.pageNumber + 1)}
                        </span>
                      </>
                    )}
                    {h.type === 'book' && (
                      <>
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>معرفی کتاب</span>
                      </>
                    )}
                    {h.type === 'author' && (
                      <>
                        <User className="h-3.5 w-3.5" />
                        <span>نویسنده</span>
                      </>
                    )}
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 font-medium',
                        h.matchType === 'english'
                          ? 'bg-gold-500/15 text-gold-700 dark:text-gold-400'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
                      )}
                    >
                      {h.matchType === 'english' ? 'EN' : 'FA'}
                    </span>
                    {flatIdx === 0 && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 font-medium text-primary">
                        بهترین تطابق
                      </span>
                    )}
                    <span className="ms-auto">
                      <RelevanceBadge score={h.score} />
                    </span>
                  </div>
                  {h.segments.length > 0 && (
                    <p
                      className="text-sm leading-relaxed"
                      dir={h.matchType === 'english' ? 'ltr' : 'rtl'}
                    >
                      <Segments segments={h.segments} />
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
}
