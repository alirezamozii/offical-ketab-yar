'use client'

/**
 * HeaderSearchModal — quick search overlay.
 *
 * Live search: results start appearing under the input ~250ms after the user
 * stops typing (no Enter needed). Keyboard users get ↑/↓ to move through the
 * hits and Enter to open the selected/first one; the "همه نتایج" affordances
 * (submit button + footer link) still jump to the full /search page.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  BookOpen,
  CornerDownLeft,
  FileText,
  Flame,
  History,
  Loader2,
  Search,
  SearchX,
  User,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookCover } from '@/components/books/book-cover'
import { Button } from '@/components/ui/button'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { cn } from '@/lib/utils'

interface HeaderSearchModalProps {
  open: boolean
  onClose: () => void
  query: string
  setQuery: (q: string) => void
  onSubmit: (e?: React.FormEvent) => void
}

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
  coverImageUrl?: string
  coverImage?: string
  coverBlurhash?: string
  pageNumber: number
  segments: Segment[]
  matchType: 'english' | 'farsi'
  type: SearchHitType
}

interface SearchResponse {
  hits: SearchHit[]
  total: number
  fuzzy: boolean
}

const DEBOUNCE_MS = 250
/** Fetched from the API — enough headroom for the per-book cap to diversify. */
const QUICK_FETCH = 24
/** Rows shown in the dropdown. */
const QUICK_SHOW = 10
/** Max rows per book, so one book doesn't flood the list. */
const MAX_PER_BOOK = 2
const MAX_RECENT = 6

const POPULAR_SEARCHES = ['Alice', 'Sherlock', 'love', 'Frankenstein', 'poetry', 'آسمان']

export function HeaderSearchModal({
  open,
  onClose,
  query,
  setQuery,
  onSubmit,
}: HeaderSearchModalProps) {
  const { toPersianDigits } = usePersianLocale()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [hits, setHits] = useState<SearchHit[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const [recent, setRecent] = useState<string[]>([])

  const abortRef = useRef<AbortController | null>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load recent searches (shared with the full search page) when the modal mounts.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.recentSearches)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setRecent(parsed.filter((x) => typeof x === 'string').slice(0, MAX_RECENT))
        }
      }
    } catch {
      /* ignore — private mode / corrupt entry */
    }
  }, [])

  const trimmed = query.trim()

  const saveRecent = (term: string) => {
    setRecent((prev) => {
      const next = [term, ...prev.filter((x) => x !== term)].slice(0, MAX_RECENT)
      try {
        localStorage.setItem(STORAGE_KEYS.recentSearches, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  // ─── debounced live search ────────────────────────────────────────────
  useEffect(() => {
    if (trimmed.length < 2) {
      setHits([])
      setTotal(0)
      setSearched(false)
      setLoading(false)
      setError(false)
      setSelectedIdx(-1)
      return
    }
    const timer = window.setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      setError(false)
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&limit=${QUICK_FETCH}`,
          { signal: controller.signal },
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as SearchResponse
        // Cap hits per book so the dropdown surfaces many different books
        // instead of a dozen pages of the same one. The API already orders
        // groups by their best hit, so capping in order keeps relevance.
        const perBook = new Map<string, number>()
        const shown: SearchHit[] = []
        for (const hit of data.hits ?? []) {
          const n = perBook.get(hit.bookSlug) ?? 0
          if (n >= MAX_PER_BOOK) continue
          perBook.set(hit.bookSlug, n + 1)
          shown.push(hit)
          if (shown.length >= QUICK_SHOW) break
        }
        setHits(shown)
        setTotal(data.total ?? 0)
        setSearched(true)
        setSelectedIdx(-1)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setHits([])
        setTotal(0)
        setError(true)
      } finally {
        if (abortRef.current === controller) setLoading(false)
      }
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [trimmed])

  // Abort any in-flight request when the modal closes or unmounts.
  useEffect(() => {
    if (!open) abortRef.current?.abort()
  }, [open])
  useEffect(() => () => abortRef.current?.abort(), [])

  // Scroll the keyboard-selected hit into view.
  useEffect(() => {
    if (selectedIdx < 0) return
    listRef.current
      ?.querySelector(`[data-idx="${selectedIdx}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [selectedIdx])

  const openHit = (hit: SearchHit) => {
    saveRecent(trimmed)
    onClose()
    router.push(`/books/read/${hit.bookSlug}`)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (hits.length) setSelectedIdx((i) => (i + 1) % hits.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (hits.length) setSelectedIdx((i) => (i - 1 + hits.length) % hits.length)
    } else if (e.key === 'Enter') {
      // Handle Enter explicitly — implicit form submission is unreliable
      // inside the portaled overlay.
      e.preventDefault()
      const target = selectedIdx >= 0 ? hits[selectedIdx] : hits[0]
      if (target) openHit(target)
      else onSubmit()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  // Enter: open the selected (or first) hit; fall back to the full search page.
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const target = selectedIdx >= 0 ? hits[selectedIdx] : hits[0]
    if (target) openHit(target)
    else onSubmit(e)
  }

  const inputEmpty = trimmed.length === 0
  const tooShort = !inputEmpty && trimmed.length < 2
  const showResults = !inputEmpty && !tooShort && (loading || searched)

  const recentChips = useMemo(
    () => (mounted ? recent.filter((t) => t !== trimmed) : []),
    [mounted, recent, trimmed],
  )

  if (!open || !mounted || typeof document === 'undefined') return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="جستجو"
      data-state={open ? 'open' : 'closed'}
      className={cn(
        'fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
        'duration-200 ease-out motion-reduce:transition-none',
      )}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-state={open ? 'open' : 'closed'}
        className={cn(
          'mt-16 sm:mt-24 w-full max-w-2xl',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
          'data-[state=open]:slide-in-from-top-4 data-[state=closed]:slide-out-to-top-4',
          'duration-200 ease-out motion-reduce:transition-none',
        )}
      >
        <form
          onSubmit={handleFormSubmit}
          className="overflow-hidden rounded-2xl border border-border/80 bg-background/95 shadow-2xl backdrop-blur-xl ring-1 ring-gold-500/20"
        >
          {/* ─── input row ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 p-3 sm:p-3.5">
            <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-gold-500" />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="جستجوی کتاب، نویسنده، متن یا ژانر…"
              className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              aria-label="جستجو"
              role="combobox"
              aria-expanded={showResults && hits.length > 0}
              aria-controls="quick-search-results"
              aria-autocomplete="list"
              aria-activedescendant={
                selectedIdx >= 0 ? `quick-search-hit-${selectedIdx}` : undefined
              }
            />
            {loading && (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            )}
            {query && !loading && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="پاک کردن"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Button type="submit" size="sm" variant="glow" disabled={!query.trim()}>
              جستجو
            </Button>
          </div>

          {/* ─── live results ──────────────────────────────────────────── */}
          {showResults && (
            <div className="border-t border-border/60">
              {error ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  خطا در دریافت نتایج. دوباره تلاش کنید.
                </p>
              ) : loading && hits.length === 0 ? (
                <ul className="divide-y divide-border/40" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <li key={i} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="h-12 w-9 shrink-0 animate-pulse rounded-md bg-muted/60" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-1/3 animate-pulse rounded bg-muted/60" />
                        <div className="h-3 w-2/3 animate-pulse rounded bg-muted/40" />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : hits.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <SearchX className="mx-auto mb-2 h-6 w-6 text-muted-foreground/60" />
                  <p className="text-sm font-medium">
                    نتیجه‌ای برای «{trimmed}» یافت نشد
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    عبارت کوتاه‌تری امتحان کنید یا{' '}
                    <Link
                      href={`/search?q=${encodeURIComponent(trimmed)}`}
                      onClick={onClose}
                      className="font-medium text-gold-600 underline-offset-2 hover:underline dark:text-gold-400"
                    >
                      صفحه کامل جستجو
                    </Link>{' '}
                    را ببینید.
                  </p>
                </div>
              ) : (
                <>
                  <p className="px-3 pt-2 pb-1 text-[11px] font-medium text-muted-foreground" aria-live="polite">
                    {toPersianDigits(total)} نتیجه
                  </p>
                  <ul
                    id="quick-search-results"
                    ref={listRef}
                    role="listbox"
                    aria-label="نتایج جستجو"
                    className="max-h-[min(52vh,420px)] divide-y divide-border/40 overflow-y-auto pb-1"
                  >
                    {hits.map((h, i) => (
                      <li
                        key={`${h.bookSlug}-${h.pageNumber}-${h.matchType}-${i}`}
                        id={`quick-search-hit-${i}`}
                        role="option"
                        aria-selected={i === selectedIdx}
                        data-idx={i}
                        onMouseEnter={() => setSelectedIdx(i)}
                        className={cn(
                          'cursor-pointer px-3 py-2.5 transition-colors',
                          i === selectedIdx && 'bg-accent/60',
                        )}
                        onClick={() => openHit(h)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="h-12 w-9 shrink-0 overflow-hidden rounded-md shadow">
                            <BookCover
                              title={h.bookTitle}
                              author={h.bookAuthor}
                              from={h.coverFrom}
                              imageUrl={h.coverImageUrl || h.coverImage || undefined}
                              blurhash={h.coverBlurhash || undefined}
                              to={h.coverTo}
                              accent={h.coverAccent}
                              size="sm"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              {h.type === 'author' ? (
                                <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              ) : h.type === 'book' ? (
                                <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              ) : (
                                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              )}
                              <span className="truncate text-sm font-medium" dir="ltr">
                                <Hi text={h.bookTitle} q={trimmed} />
                              </span>
                            </span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="truncate">
                                <Hi text={h.bookAuthor} q={trimmed} />
                              </span>
                              {h.type === 'page' && h.pageNumber > 0 && (
                                <span dir="rtl">
                                  · صفحه {toPersianDigits(h.pageNumber)}
                                </span>
                              )}
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
                            </span>
                          </span>
                          {i === selectedIdx && (
                            <span className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
                              <CornerDownLeft className="h-3 w-3" />
                              باز کردن
                            </span>
                          )}
                        </div>
                        {/* Snippet line: page hits always show it (the page
                            text is what matched); metadata hits only when the
                            snippet itself contains the match (description
                            match) — a title/author match is already highlighted
                            in the lines above. */}
                        {h.segments.length > 0 &&
                          (h.type === 'page' ||
                            h.segments.some((s) => s.match)) && (
                            <p
                              className="mt-1 truncate text-xs leading-relaxed text-muted-foreground"
                              dir={h.matchType === 'english' ? 'ltr' : 'rtl'}
                            >
                              <QuickSegments segments={h.segments} />
                            </p>
                          )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* ─── discovery (empty input) / too-short hint ──────────────── */}
          {inputEmpty && (
            <div className="space-y-3 border-t border-border/60 px-3 py-3">
              {recentChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <History className="h-3.5 w-3.5" />
                    اخیر:
                  </span>
                  {recentChips.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setQuery(term)}
                      dir={/[\u0600-\u06FF]/.test(term) ? 'rtl' : 'ltr'}
                      className="rounded-full border border-border px-2.5 py-1 text-xs transition-colors hover:bg-accent/60"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                  <Flame className="h-3.5 w-3.5 text-gold-600 dark:text-gold-400" />
                  محبوب:
                </span>
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    dir={/[\u0600-\u06FF]/.test(term) ? 'rtl' : 'ltr'}
                    className="rounded-full border border-gold-500/30 bg-gold-500/5 px-2.5 py-1 text-xs transition-colors hover:border-gold-500/60 hover:bg-gold-500/15"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
          {tooShort && (
            <p className="border-t border-border/60 px-3 py-2.5 text-xs text-muted-foreground">
              حداقل ۲ حرف وارد کنید…
            </p>
          )}
        </form>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" />
            باز کردن نتیجه
          </span>
          <Link
            href={trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search'}
            onClick={onClose}
            className="inline-flex items-center gap-1 font-medium text-gold-600 dark:text-gold-400 hover:underline"
          >
            <span>ورود به صفحه کامل جستجو</span>
            <span aria-hidden="true">←</span>
          </Link>
          <span>Escape برای بستن</span>
        </div>
      </div>
    </div>,
    document.body
  )
}

/** Render the API's pre-split highlight segments with <mark> on matches. */
function QuickSegments({ segments }: { segments: Segment[] }) {
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

/** Split arbitrary text (book title / author name) into highlight segments
 *  against the live query, so metadata matches light up like page hits. */
function splitHighlight(text: string, q: string): Segment[] {
  if (!q) return [{ text, match: false }]
  const lower = text.toLowerCase()
  const lq = q.toLowerCase()
  const parts: Segment[] = []
  let last = 0
  let idx = lower.indexOf(lq)
  while (idx !== -1) {
    if (idx > last) parts.push({ text: text.slice(last, idx), match: false })
    parts.push({ text: text.slice(idx, idx + lq.length), match: true })
    last = idx + lq.length
    idx = lower.indexOf(lq, last)
  }
  if (last < text.length) parts.push({ text: text.slice(last), match: false })
  return parts.length ? parts : [{ text, match: false }]
}

/** Highlight a title/author string against the current query. */
function Hi({ text, q }: { text: string; q: string }) {
  return <QuickSegments segments={splitHighlight(text, q)} />
}
