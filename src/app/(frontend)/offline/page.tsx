'use client'

import { BookCard } from '@/components/books/book-card'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  CheckCircle2,
  Home,
  Library,
  RotateCcw,
  WifiOff,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '@/lib/storage-keys'

/**
 * Offline fallback page (`/offline`).
 *
 * Served by the service worker when:
 *   1. A navigation request fails (offline + nothing in the runtime
 *      `ketab-pages` cache) — see `src/app/sw.ts` `fallbacks.entries`.
 *   2. The user manually navigates here.
 *
 * ─── What this page does now (post-audit 11 §5 fix) ────────────────────
 *
 * The audit flagged this page as a "UX lie": it linked to `/books/read/[slug]`
 * (a server route that hits the DB), so clicking a book offline produced a
 * 500. With the new Serwist runtime caching (`StaleWhileRevalidate` on
 * `/api/books/[slug]/pages` + `NetworkFirst` on navigations), a previously-
 * opened book's HTML *and* its content API are cached, so the reader
 * **actually loads offline**. Books the user has merely favorited but never
 * opened aren't cached yet — clicking them offline will route back to
 * `/offline` via the SW fallback (a graceful degradation, no 500).
 *
 * To make this discoverable, we split the book list into two sections:
 *   • "در دسترس آفلاین" — books with a reader-session-history entry
 *     (`ky_reader_session_history`), which means the user has opened them
 *     at least once and the SW has cached their content. These get a
 *     "آفلاین" badge.
 *   • "علاقه‌مندی‌ها" — favorited books (`ky_favorites`). These *might*
 *     be cached if the user has read them, but we don't have a guarantee,
 *     so no badge.
 *
 * ─── Retry button ──────────────────────────────────────────────────────
 *
 * The audit (and the task spec) asked for `window.location.reload()` on
 * retry. We do that — if we're back online, the reload fetches the page
 * from the network; if still offline, the SW serves `/offline` again.
 */

// ─── Types ────────────────────────────────────────────────────────────────

type CachedBook = {
  slug: string
  title: string
  author: string
  coverFrom: string
  coverTo: string
  coverAccent: string
  addedAt?: number
}

type ProgressEntry = {
  currentPage: number
  totalPages: number
  percent: number
  ts: number
}

type ProgressMap = Record<string, ProgressEntry>

type ReaderSessionHistoryEntry = {
  startedAt: string
  endedAt: string
  seconds: number
  bookSlug: string
  bookTitle: string
}

// ─── localStorage readers (all client-gated) ──────────────────────────────

function readFavorites(): CachedBook[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.favorites)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return []
    return Object.values(parsed as Record<string, unknown>)
      .filter(
        (b): b is CachedBook =>
          b !== null &&
          typeof b === 'object' &&
          typeof (b as Record<string, unknown>).slug === 'string' &&
          typeof (b as Record<string, unknown>).title === 'string',
      )
      .sort((a, b) => {
        const aAdded = typeof a.addedAt === 'number' ? a.addedAt : 0
        const bAdded = typeof b.addedAt === 'number' ? b.addedAt : 0
        return bAdded - aAdded
      })
  } catch {
    return []
  }
}

function readProgress(): ProgressMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.progress)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as ProgressMap) : {}
  } catch {
    return {}
  }
}

function readSessionHistory(): ReaderSessionHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.readerSessionHistory)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ReaderSessionHistoryEntry[]) : []
  } catch {
    return []
  }
}

/** Defensive online check — `navigator.onLine` can be undefined in some webviews. */
function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true
  if (typeof navigator.onLine === 'boolean') return navigator.onLine
  return true
}

/** Convert a number to Persian digits for display. */
function toPersian(n: number): string {
  return n.toLocaleString('fa-IR')
}

// ─── Component ────────────────────────────────────────────────────────────

export default function OfflinePage() {
  // Lazy initializers read localStorage + navigator.onLine synchronously
  // during the first client render — avoids setState-in-effect (which
  // would cause an extra render) and removes the need for a `loaded` flag.
  // All readers are no-ops on the server (return [] / {} / true) so SSR
  // and the initial client render agree.
  const [online, setOnline] = useState<boolean>(() => isOnline())
  const [books] = useState<CachedBook[]>(() => readFavorites())
  const [progress] = useState<ProgressMap>(() => readProgress())
  const [readSlugs] = useState<Set<string>>(() => {
    const history = readSessionHistory()
    return new Set(history.map((h) => h.bookSlug))
  })
  const [retrying, setRetrying] = useState(false)
  const loaded = true

  // Subscribe to online/offline events. setState only fires inside event
  // handlers — never synchronously in the effect body.
  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  /**
   * Retry — per task spec, call `window.location.reload()`. If we're online,
   * the reload fetches the requested page from the network. If still
   * offline, the SW fallback serves `/offline` again. We delay briefly so
   * the user sees the "در حال بررسی…" feedback state.
   */
  const handleRetry = useCallback(() => {
    setRetrying(true)
    setTimeout(() => {
      if (isOnline()) {
        // Reload the current URL — if the user was on /books/read/x, they
        // get the reader back; if they were on /offline, they go home.
        window.location.reload()
      } else {
        // Still offline — flip the badge and stop the spinner.
        setOnline(false)
        setRetrying(false)
      }
    }, 500)
  }, [])

  // Split favorites into "cached" (user has opened → SW has content) and
  // "favorites-only" (may or may not be cached). Books in both groups are
  // rendered the same way; the cached group gets a small "آفلاین" badge.
  const { cachedBooks, favOnlyBooks } = useMemo(() => {
    const cached: CachedBook[] = []
    const favOnly: CachedBook[] = []
    for (const b of books) {
      if (readSlugs.has(b.slug)) cached.push(b)
      else favOnly.push(b)
    }
    return { cachedBooks: cached, favOnlyBooks: favOnly }
  }, [books, readSlugs])

  return (
    <div className="relative mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center px-4 py-12 text-center sm:px-6">
      {/* soft warm glow */}
      <div
        aria-hidden
        className="absolute top-1/4 -z-10 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl"
      />

      {/* Brand wordmark */}
      <span className="mb-8 text-gradient-gold text-sm font-bold tracking-wide">
        کتاب‌یار
      </span>

      {/* Icon — a "torn book with wifi-off" feel using two stacked icons */}
      <span className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gold-500/15 text-gold-600 shadow-md-warm dark:text-gold-400">
        <BookOpen className="h-10 w-10" aria-hidden="true" />
        <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-background shadow-sm-warm">
          <WifiOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </span>
      </span>

      <h1 className="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
        شما آفلاین هستید
      </h1>
      <p className="mt-3 max-w-md text-pretty text-muted-foreground">
        اتصال اینترنت شما قطع شده است. کتاب‌هایی که قبلاً باز کرده‌اید را می‌توانید
        در حالت آفلاین ادامه دهید. پس از برقراری اتصال، دوباره تلاش کنید.
      </p>

      {/* Online status badge — reflects the live `online` state */}
      <span
        className={`mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
          online
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            : 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400'
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            online ? 'bg-emerald-500' : 'bg-rose-500'
          } ${online ? 'animate-pulse' : ''}`}
          aria-hidden="true"
        />
        {online ? 'اتصال برقرار شد' : 'هنوز آفلاین هستید'}
      </span>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={handleRetry}
          variant="glow"
          size="lg"
          disabled={retrying}
          aria-label="ارسال مجدد و تلاش دوباره برای اتصال"
        >
          <RotateCcw
            className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          {retrying ? 'در حال بررسی…' : 'ارسال مجدد'}
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">
            <Home className="h-4 w-4" aria-hidden="true" />
            بازگشت به خانه
          </Link>
        </Button>
      </div>

      {/* ─── Offline-ready books (user has opened → SW has content cached) ── */}
      <section
        className="mt-14 w-full"
        aria-labelledby="cached-books-heading"
      >
        <div className="mb-5 flex items-center justify-center gap-2 text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-gold-600 dark:text-gold-400" aria-hidden="true" />
          <h2
            id="cached-books-heading"
            className="text-sm font-semibold tracking-wide"
          >
            در دسترس آفلاین
          </h2>
        </div>

        {!loaded ? (
          <p className="text-sm text-muted-foreground">
            در حال بارگذاری فهرست کتاب‌های ذخیره‌شده…
          </p>
        ) : cachedBooks.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-10 text-center">
            <p className="text-sm font-medium">هنوز کتابی آفلاین نشده</p>
            <p className="mt-2 text-xs text-muted-foreground">
              کتاب‌هایی که حداقل یک بار باز کرده باشید، به‌صورت خودکار برای مطالعه
              آفلاین ذخیره می‌شوند.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {cachedBooks.slice(0, 8).map((book) => {
              const p = progress[book.slug]
              return (
                <li key={book.slug} className="group">
                  <BookCard
                    book={{
                      id: '',
                      description: '',
                      viewCount: 0,
                      genres: [],
                      level: '',
                      rating: 0,
                      reviewCount: 0,
                      pageCount: 0,
                      isPremium: false,
                      publishedYear: 1900,
                      ...book,
                    }}
                    progress={p ? p.percent : undefined}
                    href={`/books/read/${book.slug}`}
                    cached
                  />
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ─── Favorited but not-yet-cached books ───────────────────────────── */}
      {favOnlyBooks.length > 0 ? (
        <section
          className="mt-12 w-full"
          aria-labelledby="fav-books-heading"
        >
          <div className="mb-5 flex items-center justify-center gap-2 text-muted-foreground">
            <Library className="h-4 w-4" aria-hidden="true" />
            <h2
              id="fav-books-heading"
              className="text-sm font-semibold tracking-wide"
            >
              کتاب‌های علاقه‌مندی (نیاز به اینترنت)
            </h2>
          </div>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 opacity-75">
            {favOnlyBooks.slice(0, 8).map((book) => {
              const p = progress[book.slug]
              return (
                <li key={book.slug} className="group">
                  <BookCard
                    book={{
                      id: '',
                      description: '',
                      viewCount: 0,
                      genres: [],
                      level: '',
                      rating: 0,
                      reviewCount: 0,
                      pageCount: 0,
                      isPremium: false,
                      publishedYear: 1900,
                      ...book,
                    }}
                    progress={p ? p.percent : undefined}
                    href={`/books/read/${book.slug}`}
                    cached={false}
                  />
                </li>
              )
            })}
          </ul>
          {favOnlyBooks.length > 8 ? (
            <p className="mt-4 text-xs text-muted-foreground">
              و {toPersian(favOnlyBooks.length - 8)} کتاب دیگر در علاقه‌مندی‌های شما
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
