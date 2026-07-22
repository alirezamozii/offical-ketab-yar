'use client'

/**
 * QuotesPageClient — interactive gallery for /quotes.
 *
 * Three tabs (server-side data passed via props; client-side filters +
 * localStorage-backed "saved" + "highlights" live on top):
 *
 *   1. «نقل‌قول‌های برگزیده» (Curated)   — the 40 hand-picked quotes,
 *      masonry grid, theme/length/sort filters, share + save actions.
 *   2. «هایلایت‌های من» (Highlights)    — every reader highlight the user
 *      has made, grouped by book, with export + clear-all.
 *   3. «ذخیره‌شده‌ها» (Saved)            — curated quotes the user has
 *      bookmarked from tab 1.
 *
 * The Quote-of-the-Day hero sits ABOVE the tabs and is always visible —
 * it cycles via the "نقل قول بعدی" button.
 */

import * as React from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Clock,
  Compass,
  Download,
  Feather,
  FileText,
  Flame,
  Heart,
  Leaf,
  Lightbulb,
  Quote as QuoteIcon,
  Share2,
  Shuffle,
  Smile,
  Sparkles,
  Sprout,
  Trash2,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { useStorageSync, STORAGE_KEYS } from '@/lib/storage-keys'
import {
  HIGHLIGHT_LABELS,
  HIGHLIGHT_SWATCHES,
  type Highlight,
} from '@/lib/reader/types'
import {
  QUOTE_THEMES,
  QUOTE_LENGTHS,
  type CuratedQuote,
  type QuoteTheme,
} from '@/lib/quotes'
import type { BookListItem } from '@/lib/data'
import { BookCover } from '@/components/books/book-cover'

// ---------------------------------------------------------------------------
// Static config — theme icons + filter chips
// ---------------------------------------------------------------------------

const THEME_ICON: Record<QuoteTheme, LucideIcon> = {
  'خوش‌بینی': Smile,
  'عشق': Heart,
  'ماجراجویی': Compass,
  'حکمت': Lightbulb,
  'رشد شخصی': Sprout,
  'طبیعت': Leaf,
  'دوستی': Users,
  'شجاعت': Flame,
  'زمان': Clock,
  'خیال': Sparkles,
}

/** Theme icon + a soft tint per theme for the chip active state.
 *  Strictly gold/amber/emerald/rose/teal/stone — no indigo/blue. */
const THEME_TINT: Record<QuoteTheme, string> = {
  'خوش‌بینی':
    'border-amber-400/40 bg-amber-400/15 text-amber-700 dark:text-amber-300',
  'عشق': 'border-rose-400/40 bg-rose-400/15 text-rose-700 dark:text-rose-300',
  'ماجراجویی':
    'border-teal-400/40 bg-teal-400/15 text-teal-700 dark:text-teal-300',
  'حکمت': 'border-gold-400/40 bg-gold-400/15 text-gold-700 dark:text-gold-300',
  'رشد شخصی':
    'border-emerald-400/40 bg-emerald-400/15 text-emerald-700 dark:text-emerald-300',
  'طبیعت':
    'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  'دوستی':
    'border-stone-300/40 bg-stone-300/15 text-stone-700 dark:text-stone-300',
  'شجاعت':
    'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300',
  'زمان': 'border-gold-500/40 bg-gold-500/15 text-gold-700 dark:text-gold-300',
  'خیال':
    'border-amber-300/40 bg-amber-300/15 text-amber-700 dark:text-amber-300',
}

const LENGTH_LABEL: Record<CuratedQuote['length'], string> = {
  'کوتاه': 'کوتاه',
  'متوسط': 'متوسط',
  'بلند': 'بلند',
}

type SortKey = 'newest' | 'random' | 'byBook'

const SORT_LABELS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'جدیدترین' },
  { key: 'random', label: 'تصادفی' },
  { key: 'byBook', label: 'بر اساس کتاب' },
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface QuotesPageClientProps {
  initialQuotes: CuratedQuote[]
  initialBookLookup: Record<string, BookListItem>
  initialQuoteOfTheDay: CuratedQuote
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a quote for clipboard / Web Share — «quote» — Author (Book Title). */
function formatQuoteForShare(q: CuratedQuote): string {
  return `«${q.text}» — ${q.bookAuthor} (${q.bookTitle})`
}

/** Pull every `ky_hl_*` highlight from localStorage, tagged with the slug. */
function loadAllHighlights(): Array<Highlight & { bookSlug: string }> {
  if (typeof window === 'undefined') return []
  const out: Array<Highlight & { bookSlug: string }> = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith('ky_hl_')) continue
    const slug = key.slice('ky_hl_'.length)
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) continue
      for (const h of parsed) {
        if (
          h &&
          typeof h === 'object' &&
          typeof h.id === 'string' &&
          typeof h.text === 'string'
        ) {
          out.push({ ...(h as Highlight), bookSlug: slug })
        }
      }
    } catch {
      /* ignore corrupt JSON */
    }
  }
  // newest first
  out.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
  return out
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuotesPageClient({
  initialQuotes,
  initialBookLookup,
  initialQuoteOfTheDay,
}: QuotesPageClientProps) {
  const prefersReduced = useReducedMotion()
  const { toPersianDigits } = usePersianLocale()

  // ---- shared client state ----
  const [tab, setTab] = React.useState<'curated' | 'highlights' | 'saved'>(
    'curated',
  )

  // ---- Quote of the Day hero state ----
  // The hero starts on the deterministic QOTD, then "next quote" cycles
  // through the curated list in order (no shuffle so the user can predict
  // the loop length).
  const [heroIdx, setHeroIdx] = React.useState(() =>
    Math.max(
      0,
      initialQuotes.findIndex((q) => q.id === initialQuoteOfTheDay.id),
    ),
  )
  const heroQuote = initialQuotes[heroIdx] ?? initialQuotes[0]

  // ---- filters ----
  const [theme, setTheme] = React.useState<QuoteTheme | 'all'>('all')
  const [length, setLength] = React.useState<
    CuratedQuote['length'] | 'all'
  >('all')
  const [sort, setSort] = React.useState<SortKey>('newest')
  // Bump to re-shuffle when sort === 'random' (so the button re-rolls).
  const [shuffleSeed, setShuffleSeed] = React.useState(0)

  // ---- saved quotes (localStorage) ----
  const [savedIds, setSavedIds] = useStorageSync<string[]>(
    STORAGE_KEYS.savedQuotes,
    [],
  )
  const savedQuoteSet = React.useMemo(
    () => new Set(savedIds),
    [savedIds],
  )
  const savedQuotes = React.useMemo(
    () => initialQuotes.filter((q) => savedQuoteSet.has(q.id)),
    [initialQuotes, savedQuoteSet],
  )

  // ---- highlights (localStorage, manual read on mount + on tab focus) ----
  const [highlights, setHighlights] = React.useState<
    Array<Highlight & { bookSlug: string }>
  >([])
  React.useEffect(() => {
    setHighlights(loadAllHighlights())
  }, [tab])

  const toggleSave = React.useCallback(
    (id: string) => {
      setSavedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      )
    },
    [setSavedIds],
  )

  const share = React.useCallback(
    async (q: CuratedQuote) => {
      const text = formatQuoteForShare(q)
      // Prefer the Web Share API on capable devices (mobile / iPadOS / some
      // desktop Chromium). Falls back to clipboard on desktop.
      const nav = navigator as Navigator & {
        share?: (data: { text?: string; title?: string }) => Promise<void>
      }
      if (typeof nav.share === 'function') {
        try {
          await nav.share({ text, title: 'نقل‌قول از کتاب‌یار' })
          return
        } catch (err) {
          // User-cancelled share sheet — fall through to clipboard so the
          // button still does *something* useful.
          if ((err as Error)?.name === 'AbortError') return
        }
      }
      try {
        await navigator.clipboard.writeText(text)
        toast.success('کپی شد', {
          description: 'نقل‌قول در کلیپ‌بورد ذخیره شد.',
        })
      } catch {
        toast.error('کپی ناموفق بود', {
          description: 'مرورگر اجازه دسترسی به کلیپ‌بورد را نداد.',
        })
      }
    },
    [],
  )

  // ---- derived filtered list (curated tab) ----
  const filtered = React.useMemo(() => {
    let list = initialQuotes.filter((q) => {
      if (theme !== 'all' && !q.theme.includes(theme)) return false
      if (length !== 'all' && q.length !== length) return false
      return true
    })
    if (sort === 'random') {
      // Deterministic shuffle per `shuffleSeed` so the order only changes
      // when the user clicks the "تصادفی" sort button again.
      const seed = shuffleSeed
      list = list
        .map((q, i) => ({ q, k: (Math.sin(seed * 9301 + i * 49297) + 1) * 0.5 }))
        .sort((a, b) => a.k - b.k)
        .map(({ q }) => q)
    } else if (sort === 'byBook') {
      list = list.slice().sort((a, b) => {
        if (a.bookSlug !== b.bookSlug) {
          return a.bookSlug.localeCompare(b.bookSlug)
        }
        return a.pageNumber - b.pageNumber
      })
    }
    // 'newest' → leave as-is (the curated array is hand-curated in a
    // narrative order; "newest" reads as "as authored" for our purposes).
    return list
  }, [initialQuotes, theme, length, sort, shuffleSeed])

  // ---- highlights grouping ----
  const highlightsByBook = React.useMemo(() => {
    const groups = new Map<
      string,
      { book?: BookListItem; items: Array<Highlight & { bookSlug: string }> }
    >()
    for (const h of highlights) {
      const g = groups.get(h.bookSlug) ?? {
        book: initialBookLookup[h.bookSlug],
        items: [],
      }
      g.items.push(h)
      groups.set(h.bookSlug, g)
    }
    // Sort groups by most-recent highlight timestamp desc.
    return Array.from(groups.entries())
      .map(([slug, g]) => ({ slug, ...g }))
      .sort(
        (a, b) =>
          (b.items[0]?.timestamp ?? 0) - (a.items[0]?.timestamp ?? 0),
      )
  }, [highlights, initialBookLookup])

  // ---- hero cycling ----
  const nextHero = React.useCallback(() => {
    setHeroIdx((i) => (i + 1) % initialQuotes.length)
  }, [initialQuotes.length])

  return (
    <div className="space-y-10">
      {/* ─── Page header ─── */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              <span className="text-glow-gold">نقل‌قول‌ها</span>
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              گالری نقل‌قول‌های برگزیده از کتاب‌های کلاسیک، در کنار
              هایلایت‌های خودتان. هر نقل‌قول را می‌توانید ذخیره کنید، به اشتراک
              بگذارید، یا مستقیم به همان صفحه از کتاب بروید.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-gold-400/30 bg-gold-400/10 px-3 py-1 text-gold-700 dark:text-gold-300"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {toPersianDigits(initialQuotes.length)} نقل‌قول برگزیده
          </Badge>
        </div>
      </header>

      {/* ─── Quote of the Day hero ─── */}
      <QuoteOfTheDayHero
        quote={heroQuote}
        book={initialBookLookup[heroQuote.bookSlug]}
        onNext={nextHero}
        onShare={() => share(heroQuote)}
        isSaved={savedQuoteSet.has(heroQuote.id)}
        onToggleSave={() => toggleSave(heroQuote.id)}
        toPersianDigits={toPersianDigits}
        prefersReduced={!!prefersReduced}
        heroIdx={heroIdx}
        total={initialQuotes.length}
      />

      {/* ─── Tabs ─── */}
      <Tabs
        value={tab}
        onValueChange={(v) =>
          setTab(v as 'curated' | 'highlights' | 'saved')
        }
        className="w-full"
      >
        <TabsList className="h-auto flex-wrap gap-1 rounded-xl p-1">
          <TabsTrigger
            value="curated"
            className="gap-1.5 rounded-lg px-3 py-1.5"
          >
            <QuoteIcon className="h-4 w-4" aria-hidden="true" />
            نقل‌قول‌های برگزیده
            <Badge
              variant="secondary"
              className="ms-1 rounded-full bg-gold-400/15 px-1.5 py-0 text-[10px] text-gold-700 dark:text-gold-300"
            >
              {toPersianDigits(initialQuotes.length)}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="highlights"
            className="gap-1.5 rounded-lg px-3 py-1.5"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            هایلایت‌های من
            {highlights.length > 0 && (
              <Badge
                variant="secondary"
                className="ms-1 rounded-full bg-emerald-400/15 px-1.5 py-0 text-[10px] text-emerald-700 dark:text-emerald-300"
              >
                {toPersianDigits(highlights.length)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="saved"
            className="gap-1.5 rounded-lg px-3 py-1.5"
          >
            <Bookmark className="h-4 w-4" aria-hidden="true" />
            ذخیره‌شده‌ها
            {savedQuotes.length > 0 && (
              <Badge
                variant="secondary"
                className="ms-1 rounded-full bg-amber-400/15 px-1.5 py-0 text-[10px] text-amber-700 dark:text-amber-300"
              >
                {toPersianDigits(savedQuotes.length)}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── Curated tab ─── */}
        <TabsContent value="curated" className="space-y-6 outline-none">
          <FilterBar
            theme={theme}
            setTheme={setTheme}
            length={length}
            setLength={setLength}
            sort={sort}
            setSort={(s) => {
              setSort(s)
              if (s === 'random') setShuffleSeed((n) => n + 1)
            }}
            onReshuffle={() => setShuffleSeed((n) => n + 1)}
            filteredCount={filtered.length}
            toPersianDigits={toPersianDigits}
          />

          {filtered.length === 0 ? (
            <EmptyState
              icon={QuoteIcon}
              title="نقل‌قولی با این فیلترها پیدا نشد"
              hint="فیلتر موضوع یا طول را تغییر دهید."
            />
          ) : (
            <QuoteMasonry
              quotes={filtered}
              bookLookup={initialBookLookup}
              savedSet={savedQuoteSet}
              onShare={share}
              onToggleSave={toggleSave}
              prefersReduced={!!prefersReduced}
              toPersianDigits={toPersianDigits}
            />
          )}
        </TabsContent>

        {/* ─── Highlights tab ─── */}
        <TabsContent value="highlights" className="space-y-6 outline-none">
          <HighlightsTab
            groups={highlightsByBook}
            bookLookup={initialBookLookup}
            onClearAll={() => {
              // Wipe every ky_hl_* key in localStorage.
              if (typeof window === 'undefined') return
              const toRemove: string[] = []
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i)
                if (k && k.startsWith('ky_hl_')) toRemove.push(k)
              }
              for (const k of toRemove) localStorage.removeItem(k)
              setHighlights([])
              toast.success('همه هایلایت‌ها حذف شدند', {
                description: `${toPersianDigits(toRemove.length)} کتاب پاک‌سازی شد.`,
              })
            }}
            toPersianDigits={toPersianDigits}
          />
        </TabsContent>

        {/* ─── Saved tab ─── */}
        <TabsContent value="saved" className="space-y-6 outline-none">
          {savedQuotes.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="هنوز نقل‌قولی ذخیره نکرده‌اید"
              hint="در زبانه «نقل‌قول‌های برگزیده»، دکمه ذخیره را روی هر کارت بزنید تا اینجا جمع شوند."
              cta={
                <Button
                  variant="glow"
                  size="sm"
                  onClick={() => setTab('curated')}
                >
                  <QuoteIcon className="h-4 w-4" aria-hidden="true" />
                  دیدن نقل‌قول‌ها
                </Button>
              }
            />
          ) : (
            <QuoteMasonry
              quotes={savedQuotes}
              bookLookup={initialBookLookup}
              savedSet={savedQuoteSet}
              onShare={share}
              onToggleSave={toggleSave}
              prefersReduced={!!prefersReduced}
              toPersianDigits={toPersianDigits}
              savedMode
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Quote of the Day hero
// ---------------------------------------------------------------------------

interface QuoteOfTheDayHeroProps {
  quote: CuratedQuote
  book?: BookListItem
  onNext: () => void
  onShare: () => void
  isSaved: boolean
  onToggleSave: () => void
  toPersianDigits: (n: string | number) => string
  prefersReduced: boolean
  heroIdx: number
  total: number
}

function QuoteOfTheDayHero({
  quote,
  book,
  onNext,
  onShare,
  isSaved,
  onToggleSave,
  toPersianDigits,
  prefersReduced,
  heroIdx,
  total,
}: QuoteOfTheDayHeroProps) {
  return (
    <motion.section
      aria-label="نقل‌قول روز"
      className="relative overflow-hidden rounded-3xl border border-gold-400/30 bg-gradient-to-br from-gold-500/15 via-amber-500/10 to-rose-500/5 p-6 shadow-glow-gold sm:p-10"
      initial={prefersReduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Decorative ambient glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold-500/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-amber-500/12 blur-3xl"
      />
      {/* Decorative giant quotation mark — gold, low-opacity */}
      <QuoteIcon
        aria-hidden="true"
        className="pointer-events-none absolute right-6 top-4 h-32 w-32 text-gold-500/15 sm:h-44 sm:w-44"
        strokeWidth={1.2}
      />

      <div className="relative space-y-5">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge className="gap-1.5 rounded-full bg-gradient-to-r from-gold-500 to-amber-600 px-3 py-1 text-white shadow-md shadow-gold-500/30">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              نقل‌قول روز
            </Badge>
            <span className="text-xs text-muted-foreground">
              {toPersianDigits(heroIdx + 1)} از {toPersianDigits(total)}
            </span>
          </div>

          {/* Theme badges */}
          <div className="flex flex-wrap gap-1.5">
            {quote.theme.map((t) => {
              const Icon = THEME_ICON[t]
              return (
                <Badge
                  key={t}
                  variant="outline"
                  className={cn(
                    'gap-1 rounded-full border px-2 py-0.5 text-[11px]',
                    THEME_TINT[t],
                  )}
                >
                  <Icon className="h-3 w-3" aria-hidden="true" />
                  {t}
                </Badge>
              )
            })}
            <Badge
              variant="outline"
              className="rounded-full border-gold-400/30 bg-gold-400/10 px-2 py-0.5 text-[11px] text-gold-700 dark:text-gold-300"
            >
              {LENGTH_LABEL[quote.length]}
            </Badge>
          </div>
        </div>

        {/* English quote — large serif, LTR */}
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={quote.id}
            initial={prefersReduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            dir="ltr"
            className="font-serif text-2xl font-medium leading-snug text-foreground sm:text-3xl"
          >
            <span className="text-gold-500/60">“</span>
            {quote.text}
            <span className="text-gold-500/60">”</span>
          </motion.blockquote>
        </AnimatePresence>

        {/* Farsi translation */}
        <p
          dir="rtl"
          className="text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          {quote.textFa}
        </p>

        {/* Attribution + actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gold-400/15 pt-5">
          <div className="flex items-center gap-3">
            {book ? (
              <Link
                href={`/books/read/${quote.bookSlug}`}
                className="group flex items-center gap-3"
                aria-label={`رفتن به کتاب ${quote.bookTitle}`}
              >
                <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md shadow-md ring-1 ring-gold-400/20 transition-transform group-hover:scale-105">
                  <BookCover
                    title={book.title}
                    author={book.author}
                    from={book.coverFrom}
                    to={book.coverTo}
                    accent={book.coverAccent}
                    size="sm"
                  />
                </div>
                <div className="space-y-0.5 text-sm">
                  <div
                    className="font-semibold text-foreground group-hover:text-gold-700 dark:group-hover:text-gold-300"
                    dir="ltr"
                  >
                    {quote.bookTitle}
                  </div>
                  <div
                    className="text-xs text-muted-foreground"
                    dir="ltr"
                  >
                    {quote.bookAuthor} · صفحه{' '}
                    {toPersianDigits(quote.pageNumber)}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="space-y-0.5 text-sm">
                <div className="font-semibold" dir="ltr">
                  {quote.bookTitle}
                </div>
                <div className="text-xs text-muted-foreground" dir="ltr">
                  {quote.bookAuthor} · صفحه {toPersianDigits(quote.pageNumber)}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleSave}
                  aria-pressed={isSaved}
                  aria-label={
                    isSaved ? 'حذف از ذخیره‌شده‌ها' : 'ذخیره نقل‌قول'
                  }
                  className={cn(
                    'gap-1.5',
                    isSaved &&
                      'border-amber-400/40 bg-amber-400/15 text-amber-700 dark:text-amber-300',
                  )}
                >
                  {isSaved ? (
                    <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Bookmark className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline">
                    {isSaved ? 'ذخیره شد' : 'ذخیره'}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isSaved ? 'حذف از ذخیره‌شده‌ها' : 'افزودن به ذخیره‌شده‌ها'}
              </TooltipContent>
            </Tooltip>

            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              className="gap-1.5"
              aria-label="اشتراک‌گذاری نقل‌قول"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">اشتراک‌گذاری</span>
            </Button>

            <Button
              variant="glow"
              size="sm"
              onClick={onNext}
              className="gap-1.5"
              aria-label="نقل قول بعدی"
            >
              نقل قول بعدی
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------

interface FilterBarProps {
  theme: QuoteTheme | 'all'
  setTheme: (t: QuoteTheme | 'all') => void
  length: CuratedQuote['length'] | 'all'
  setLength: (l: CuratedQuote['length'] | 'all') => void
  sort: SortKey
  setSort: (s: SortKey) => void
  onReshuffle: () => void
  filteredCount: number
  toPersianDigits: (n: string | number) => string
}

function FilterBar({
  theme,
  setTheme,
  length,
  setLength,
  sort,
  setSort,
  onReshuffle,
  filteredCount,
  toPersianDigits,
}: FilterBarProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card/40 p-4">
      {/* Theme chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Chip active={theme === 'all'} onClick={() => setTheme('all')}>
          همه
        </Chip>
        {QUOTE_THEMES.map((t) => {
          const Icon = THEME_ICON[t]
          const active = theme === t
          return (
            <Chip
              key={t}
              active={active}
              onClick={() => setTheme(t)}
              activeClass={THEME_TINT[t]}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {t}
            </Chip>
          )
        })}
      </div>

      {/* Length + sort + count */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            طول:
          </span>
          <Chip active={length === 'all'} onClick={() => setLength('all')}>
            همه
          </Chip>
          {QUOTE_LENGTHS.map((l) => (
            <Chip
              key={l}
              active={length === l}
              onClick={() => setLength(l)}
              activeClass="border-teal-400/40 bg-teal-400/15 text-teal-700 dark:text-teal-300"
            >
              {LENGTH_LABEL[l]}
            </Chip>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            مرتب‌سازی:
          </span>
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background/60 p-0.5">
            {SORT_LABELS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSort(s.key)}
                aria-pressed={sort === s.key}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  sort === s.key
                    ? 'bg-gold-500/15 text-gold-700 dark:text-gold-300'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {s.label}
              </button>
            ))}
            {sort === 'random' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onReshuffle}
                    aria-label="بُرش دوباره"
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">بُرش دوباره</TooltipContent>
              </Tooltip>
            )}
          </div>

          <Badge
            variant="outline"
            className="rounded-full border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            {toPersianDigits(filteredCount)} نتیجه
          </Badge>
        </div>
      </div>
    </div>
  )
}

function Chip({
  active,
  activeClass,
  onClick,
  children,
}: {
  active: boolean
  activeClass?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-[transform,opacity,colors,border-color,background-color]',
        'tap-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        active
          ? activeClass ??
              'border-gold-400/40 bg-gold-400/15 text-gold-700 dark:text-gold-300'
          : 'border-border/60 bg-background/40 text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Quote masonry grid
// ---------------------------------------------------------------------------

interface QuoteMasonryProps {
  quotes: CuratedQuote[]
  bookLookup: Record<string, BookListItem>
  savedSet: Set<string>
  onShare: (q: CuratedQuote) => void
  onToggleSave: (id: string) => void
  prefersReduced: boolean
  toPersianDigits: (n: string | number) => string
  savedMode?: boolean
}

function QuoteMasonry({
  quotes,
  bookLookup,
  savedSet,
  onShare,
  onToggleSave,
  prefersReduced,
  toPersianDigits,
  savedMode = false,
}: QuoteMasonryProps) {
  return (
    <div className="[column-fill:_balance] columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
      {quotes.map((q, i) => (
        <QuoteCard
          key={q.id}
          quote={q}
          book={bookLookup[q.bookSlug]}
          isSaved={savedSet.has(q.id)}
          onShare={() => onShare(q)}
          onToggleSave={() => onToggleSave(q.id)}
          prefersReduced={prefersReduced}
          toPersianDigits={toPersianDigits}
          index={i}
          savedMode={savedMode}
        />
      ))}
    </div>
  )
}

interface QuoteCardProps {
  quote: CuratedQuote
  book?: BookListItem
  isSaved: boolean
  onShare: () => void
  onToggleSave: () => void
  prefersReduced: boolean
  toPersianDigits: (n: string | number) => string
  index: number
  savedMode?: boolean
}

function QuoteCard({
  quote,
  book,
  isSaved,
  onShare,
  onToggleSave,
  prefersReduced,
  toPersianDigits,
  index,
  savedMode = false,
}: QuoteCardProps) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <motion.article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={prefersReduced ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-5% 0px' }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.04, 0.4),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={prefersReduced ? undefined : { y: -6 }}
      className={cn(
        'group mb-4 flex break-inside-avoid flex-col gap-3 rounded-2xl border bg-card/70 p-5',
        'shadow-sm transition-shadow duration-300',
        'border-border/60 hover:border-gold-400/40 hover:shadow-glow-gold',
      )}
    >
      {/* Decorative quote mark + theme badges */}
      <div className="flex items-start justify-between gap-2">
        <QuoteIcon
          aria-hidden="true"
          className="h-8 w-8 shrink-0 text-gold-500/40"
          strokeWidth={1.5}
        />
        <div className="flex flex-wrap justify-end gap-1">
          {quote.theme.slice(0, 2).map((t) => {
            const Icon = THEME_ICON[t]
            return (
              <Badge
                key={t}
                variant="outline"
                className={cn(
                  'gap-1 rounded-full border px-1.5 py-0 text-[10px]',
                  THEME_TINT[t],
                )}
              >
                <Icon className="h-2.5 w-2.5" aria-hidden="true" />
                {t}
              </Badge>
            )
          })}
        </div>
      </div>

      {/* English text — serif, LTR */}
      <blockquote
        dir="ltr"
        className="font-serif text-base font-medium leading-relaxed text-foreground"
      >
        {quote.text}
      </blockquote>

      {/* Farsi translation — smaller, muted */}
      <p
        dir="rtl"
        className="text-sm leading-relaxed text-muted-foreground"
      >
        {quote.textFa}
      </p>

      {/* Book attribution */}
      <div className="mt-1 flex items-center gap-2 border-t border-border/40 pt-3">
        {book ? (
          <Link
            href={`/books/read/${quote.bookSlug}`}
            className="flex shrink-0 items-center gap-2"
            aria-label={`رفتن به کتاب ${quote.bookTitle}`}
          >
            <div className="h-12 w-8 shrink-0 overflow-hidden rounded-sm shadow-sm ring-1 ring-gold-400/15 transition-transform group-hover:scale-105">
              <BookCover
                title={book.title}
                author={book.author}
                from={book.coverFrom}
                to={book.coverTo}
                accent={book.coverAccent}
                size="sm"
              />
            </div>
          </Link>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <Link
            href={`/books/read/${quote.bookSlug}`}
            className="truncate text-xs font-semibold text-foreground hover:text-gold-700 dark:hover:text-gold-300"
            dir="ltr"
            title={quote.bookTitle}
          >
            {quote.bookTitle}
          </Link>
          <span
            className="truncate text-[11px] text-muted-foreground"
            dir="ltr"
          >
            {quote.bookAuthor} · صفحه {toPersianDigits(quote.pageNumber)}
          </span>
        </div>
        <Badge
          variant="outline"
          className="shrink-0 rounded-full border-teal-400/30 bg-teal-400/10 px-1.5 py-0 text-[10px] text-teal-700 dark:text-teal-300"
        >
          {LENGTH_LABEL[quote.length]}
        </Badge>
      </div>

      {/* Hover actions */}
      <div
        className={cn(
          'flex items-center gap-1.5 transition-opacity duration-200',
          hovered ? 'opacity-100' : 'opacity-60 sm:opacity-0',
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onShare}
          className="h-8 gap-1.5 px-2 text-xs"
          aria-label="اشتراک‌گذاری"
        >
          <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
          اشتراک‌گذاری
        </Button>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-xs"
        >
          <Link
            href={`/books/read/${quote.bookSlug}`}
            aria-label={`رفتن به کتاب ${quote.bookTitle}`}
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            رفتن به کتاب
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSave}
          aria-pressed={isSaved}
          className={cn(
            'ms-auto h-8 gap-1.5 px-2 text-xs',
            isSaved &&
              'text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200',
          )}
          aria-label={
            savedMode
              ? 'حذف از ذخیره‌شده‌ها'
              : isSaved
                ? 'حذف از ذخیره‌شده‌ها'
                : 'ذخیره نقل‌قول'
          }
        >
          {savedMode ? (
            <>
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              حذف از ذخیره‌شده‌ها
            </>
          ) : isSaved ? (
            <>
              <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
              ذخیره شد
            </>
          ) : (
            <>
              <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
              ذخیره
            </>
          )}
        </Button>
      </div>
    </motion.article>
  )
}

// ---------------------------------------------------------------------------
// Highlights tab
// ---------------------------------------------------------------------------

interface HighlightsTabProps {
  groups: Array<{
    slug: string
    book?: BookListItem
    items: Array<Highlight & { bookSlug: string }>
  }>
  bookLookup: Record<string, BookListItem>
  onClearAll: () => void
  toPersianDigits: (n: string | number) => string
}

function HighlightsTab({
  groups,
  bookLookup,
  onClearAll,
  toPersianDigits,
}: HighlightsTabProps) {
  const totalHighlights = groups.reduce((s, g) => s + g.items.length, 0)

  // Export as plain text — every highlight as "«text» — Book (page N)\n"
  const exportText = React.useCallback(() => {
    const lines: string[] = ['# هایلایت‌های من — کتاب‌یار', '']
    for (const g of groups) {
      const title = g.book?.title ?? g.slug
      const author = g.book?.author ?? ''
      lines.push(`## ${title}${author ? ` — ${author}` : ''}`)
      for (const h of g.items) {
        lines.push(
          `- «${h.text}» (صفحه ${h.page + 1}${h.note ? `، یادداشت: ${h.note}` : ''})`,
        )
      }
      lines.push('')
    }
    const blob = new Blob([lines.join('\n')], {
      type: 'text/plain;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ketabyar-highlights-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('خروجی گرفته شد', {
      description: `${toPersianDigits(totalHighlights)} هایلایت در فایل متنی.`,
    })
  }, [groups, totalHighlights, toPersianDigits])

  const exportJson = React.useCallback(() => {
    const payload = groups.map((g) => ({
      bookSlug: g.slug,
      bookTitle: g.book?.title ?? g.slug,
      bookAuthor: g.book?.author ?? '',
      highlights: g.items.map((h) => ({
        text: h.text,
        page: h.page,
        color: h.color,
        note: h.note ?? '',
        timestamp: h.timestamp,
      })),
    }))
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ketabyar-highlights-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('خروجی JSON گرفته شد')
  }, [groups])

  if (totalHighlights === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="هنوز متنی را هایلایت نکرده‌اید"
        hint="هنگام مطالعه، متن را انتخاب کنید و یکی از رنگ‌های هایلایت را بزنید. هایلایت‌های شما اینجا جمع می‌شوند."
        cta={
          <Button asChild variant="glow" size="sm">
            <Link href="/library">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              شروع مطالعه
            </Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/40 p-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <span>
            {toPersianDigits(totalHighlights)} هایلایت در{' '}
            {toPersianDigits(groups.length)} کتاب
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={exportText}
                className="gap-1.5"
                aria-label="خروجی متنی"
              >
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">خروجی متنی</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">دانلود همه به‌صورت متن</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={exportJson}
                className="gap-1.5"
                aria-label="خروجی JSON"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">JSON</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">دانلود همه به‌صورت JSON</TooltipContent>
          </Tooltip>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-rose-400/40 text-rose-700 hover:bg-rose-400/10 hover:text-rose-800 dark:text-rose-300 dark:hover:text-rose-200"
                aria-label="حذف همه هایلایت‌ها"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">حذف همه</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>حذف همه هایلایت‌ها؟</AlertDialogTitle>
                <AlertDialogDescription>
                  این عمل تمام {toPersianDigits(totalHighlights)} هایلایت شما
                  را از {toPersianDigits(groups.length)} کتاب پاک می‌کند. این
                  عمل قابل بازگشت نیست.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>انصراف</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onClearAll}
                  className="bg-rose-600 text-white hover:bg-rose-700"
                >
                  حذف همه
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Groups */}
      {groups.map((g) => {
        const book = g.book ?? bookLookup[g.slug]
        return (
          <section
            key={g.slug}
            className="space-y-3 rounded-2xl border border-border/60 bg-card/40 p-4"
          >
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {book ? (
                  <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md shadow-md ring-1 ring-gold-400/20">
                    <BookCover
                      title={book.title}
                      author={book.author}
                      from={book.coverFrom}
                      to={book.coverTo}
                      accent={book.coverAccent}
                      size="sm"
                    />
                  </div>
                ) : null}
                <div className="space-y-0.5">
                  <Link
                    href={`/books/read/${g.slug}`}
                    className="font-semibold text-foreground hover:text-gold-700 dark:hover:text-gold-300"
                    dir="ltr"
                  >
                    {book?.title ?? g.slug}
                  </Link>
                  <div className="text-xs text-muted-foreground" dir="ltr">
                    {book?.author ?? ''}
                  </div>
                </div>
              </div>
              <Badge
                variant="outline"
                className="rounded-full border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-700 dark:text-emerald-300"
              >
                {toPersianDigits(g.items.length)} هایلایت
              </Badge>
            </header>

            <ul className="space-y-2">
              {g.items.map((h) => {
                const swatch = HIGHLIGHT_SWATCHES[h.color]
                const label = HIGHLIGHT_LABELS[h.color]
                return (
                  <li
                    key={h.id}
                    className="rounded-xl border border-border/50 bg-background/60 p-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-1 h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10"
                        style={{ background: swatch.bg }}
                        title={label}
                      />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="text-sm leading-relaxed text-foreground">
                          {h.text}
                        </p>
                        {h.note ? (
                          <p className="rounded-md bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
                            <Feather
                              className="ms-0.5 me-1 inline h-3 w-3 align-text-bottom"
                              aria-hidden="true"
                            />
                            {h.note}
                          </p>
                        ) : null}
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>صفحه {toPersianDigits(h.page + 1)}</span>
                          <span aria-hidden="true">·</span>
                          <span>{label}</span>
                          {h.timestamp ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>
                                {new Date(h.timestamp).toLocaleDateString(
                                  'fa-IR',
                                )}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({
  icon: Icon,
  title,
  hint,
  cta,
}: {
  icon: LucideIcon
  title: string
  hint?: string
  cta?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-card/30 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-600 dark:text-gold-300">
        <Icon className="h-8 w-8" aria-hidden="true" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {hint ? (
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
      {cta}
    </div>
  )
}
