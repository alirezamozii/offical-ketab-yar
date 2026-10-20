'use client'

/**
 * QuotesPageClient — interactive gallery for /quotes.
 *
 * Three tabs:
 *   1. «نقل‌قول‌های برگزیده و جامعه» (Curated & Community) — hand-picked & public quotes,
 *      masonry grid, search, theme/length/sort filters, reactions (like/dislike),
 *      and Paper Quote Studio.
 *   2. «هایلایت‌های من» (My Quotes & Highlights) — every reader highlight,
 *      filterable by book & color, searchable, public/private toggles, and Paper Quote Studio.
 *   3. «ذخیره‌شده‌ها» (Saved) — bookmarked quotes.
 *
 * The Quote-of-the-Day hero sits ABOVE the tabs with Paper Quote Studio export.
 */

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Clock,
  Compass,
  Feather,
  Flame,
  Globe,
  Heart,
  Highlighter,
  Leaf,
  Lightbulb,
  Lock,
  Palette,
  Quote as QuoteIcon,
  RotateCcw,
  Search,
  Share2,
  Shuffle,
  Smile,
  Sparkles,
  Sprout,
  ThumbsDown,
  Trash2,
  User,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { useStorageSync, STORAGE_KEYS } from '@/lib/storage-keys'
import {
  HIGHLIGHT_LABELS,
  HIGHLIGHT_SWATCHES,
  type Highlight,
  type HighlightColor,
} from '@/lib/reader/types'
import {
  QUOTE_THEMES,
  QUOTE_LENGTHS,
  type CuratedQuote,
  type QuoteTheme,
} from '@/lib/quotes'
import type { BookListItem } from '@/lib/data'
import { BookCover } from '@/components/books/book-cover'

const QuoteStudioModal = React.lazy(() =>
  import('./quote-studio-modal').then((module) => ({ default: module.QuoteStudioModal })),
)

function notify(kind: 'success' | 'error', message: string) {
  void import('sonner').then(({ toast }) => toast[kind](message))
}

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

type SortKey = 'newest' | 'popular' | 'random' | 'byBook'

const SORT_LABELS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'جدیدترین' },
  { key: 'popular', label: 'محبوب‌ترین' },
  { key: 'random', label: 'تصادفی' },
  { key: 'byBook', label: 'بر اساس کتاب' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatQuoteForShare(q: { text: string; bookAuthor?: string; bookTitle?: string }): string {
  return `«${q.text}» — ${q.bookAuthor || ''} (${q.bookTitle || ''})`
}

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
      /* ignore */
    }
  }
  out.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
  return out
}

interface ReactionData {
  likes: number
  dislikes: number
  userVote?: 'like' | 'dislike'
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface QuotesPageClientProps {
  initialQuotes: CuratedQuote[]
  initialBookLookup: Record<string, BookListItem>
  initialQuoteOfTheDay: CuratedQuote
}

export function QuotesPageClient({
  initialQuotes,
  initialBookLookup,
  initialQuoteOfTheDay,
}: QuotesPageClientProps) {
  const { toPersianDigits } = usePersianLocale()
  const prefersReduced = false
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')

  // Default to "highlights" (user's quotes), unless ?tab=curated or ?tab=saved is explicitly in URL
  const initialTab: 'curated' | 'highlights' | 'saved' = React.useMemo(() => {
    if (tabParam === 'curated' || tabParam === 'public') return 'curated'
    if (tabParam === 'saved') return 'saved'
    return 'highlights'
  }, [tabParam])

  const [tab, setTab] = React.useState<'curated' | 'highlights' | 'saved'>(initialTab)

  React.useEffect(() => {
    if (tabParam === 'curated' || tabParam === 'public') {
      setTab('curated')
    } else if (tabParam === 'saved') {
      setTab('saved')
    } else if (tabParam === 'highlights') {
      setTab('highlights')
    }
  }, [tabParam])

  // ---- Studio Modal State ----
  const [studioOpen, setStudioOpen] = React.useState(false)
  const [studioQuote, setStudioQuote] = React.useState<{
    id: string
    text: string
    textFa?: string
    bookTitle?: string
    bookAuthor?: string
    pageNumber?: number
    bookSlug?: string
    highlightColor?: string
  } | null>(null)
  const [studioBook, setStudioBook] = React.useState<BookListItem | undefined>(undefined)

  const openStudio = React.useCallback(
    (
      q: {
        id: string
        text: string
        textFa?: string
        bookTitle?: string
        bookAuthor?: string
        pageNumber?: number
        bookSlug?: string
        highlightColor?: string
      },
      b?: BookListItem,
    ) => {
      setStudioQuote(q)
      setStudioBook(b || (q.bookSlug ? initialBookLookup[q.bookSlug] : undefined))
      setStudioOpen(true)
    },
    [initialBookLookup],
  )

  // ---- Reactions (Likes / Dislikes) ----
  const [reactions, setReactions] = useStorageSync<Record<string, ReactionData>>(
    'ky_quote_reactions',
    {},
  )

  const handleVote = React.useCallback(
    (quoteId: string, type: 'like' | 'dislike') => {
      setReactions((prev) => {
        const current = prev[quoteId] || {
          likes: Math.floor(Math.random() * 24) + 12,
          dislikes: Math.floor(Math.random() * 3),
        }
        let nextLikes = current.likes
        let nextDislikes = current.dislikes
        let nextVote: 'like' | 'dislike' | undefined = type

        if (current.userVote === type) {
          // Toggle off
          nextVote = undefined
          if (type === 'like') nextLikes = Math.max(0, nextLikes - 1)
          if (type === 'dislike') nextDislikes = Math.max(0, nextDislikes - 1)
        } else {
          // Change vote
          if (type === 'like') {
            nextLikes += 1
            if (current.userVote === 'dislike') nextDislikes = Math.max(0, nextDislikes - 1)
          } else {
            nextDislikes += 1
            if (current.userVote === 'like') nextLikes = Math.max(0, nextLikes - 1)
          }
        }

        return {
          ...prev,
          [quoteId]: {
            likes: nextLikes,
            dislikes: nextDislikes,
            userVote: nextVote,
          },
        }
      })
    },
    [setReactions],
  )

  // ---- Quote of the Day hero state ----
  const [heroIdx, setHeroIdx] = React.useState(() =>
    Math.max(
      0,
      initialQuotes.findIndex((q) => q.id === initialQuoteOfTheDay.id),
    ),
  )
  const heroQuote = initialQuotes[heroIdx] ?? initialQuotes[0] ?? initialQuoteOfTheDay

  // ---- filters ----
  const [searchQuery, setSearchQuery] = React.useState('')
  const [theme, setTheme] = React.useState<QuoteTheme | 'all'>('all')
  const [length, setLength] = React.useState<CuratedQuote['length'] | 'all'>('all')
  const [sort, setSort] = React.useState<SortKey>('newest')
  const [shuffleSeed, setShuffleSeed] = React.useState(0)

  // ---- saved quotes ----
  const [savedIds, setSavedIds] = useStorageSync<string[]>(STORAGE_KEYS.savedQuotes, [])
  const savedQuoteSet = React.useMemo(() => new Set(savedIds), [savedIds])
  const savedQuotes = React.useMemo(
    () => initialQuotes.filter((q) => savedQuoteSet.has(q.id)),
    [initialQuotes, savedQuoteSet],
  )

  // ---- Public / Private highlights state (Public by default) ----
  const [privateHlIds, setPrivateHlIds] = useStorageSync<string[]>('ky_private_highlights', [])
  const privateHlSet = React.useMemo(() => new Set(privateHlIds), [privateHlIds])

  const togglePublicHighlight = React.useCallback(
    (id: string) => {
      setPrivateHlIds((prev) => {
        const isPriv = prev.includes(id)
        notify('success', isPriv ? 'هایلایت در بخش عمومی به اشتراک گذاشته شد.' : 'هایلایت خصوصی شد.')
        return isPriv ? prev.filter((x) => x !== id) : [...prev, id]
      })
    },
    [setPrivateHlIds],
  )

  // ---- highlights ----
  const [highlights, setHighlights] = React.useState<Array<Highlight & { bookSlug: string }>>([])
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

  const handleDeleteHighlight = React.useCallback((id: string, slug: string) => {
    const key = `ky_hl_${slug}`
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          const next = parsed.filter((x: { id: string }) => x.id !== id)
          localStorage.setItem(key, JSON.stringify(next))
          setHighlights((prev) => prev.filter((x) => x.id !== id))
          notify('success', 'کوت حذف شد.')
        }
      }
    } catch {
      notify('error', 'خطا در حذف کوت.')
    }
  }, [])

  const share = React.useCallback(
    async (q: { text: string; bookAuthor?: string; bookTitle?: string }) => {
      const text = formatQuoteForShare(q)
      const nav = navigator as Navigator & {
        share?: (data: { text?: string; title?: string }) => Promise<void>
      }
      if (typeof nav.share === 'function') {
        try {
          await nav.share({ text, title: 'کوت از بوکزی' })
          return
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') return
        }
      }
      try {
        await navigator.clipboard.writeText(text)
        notify('success', 'متن کوت در کلیپ‌بورد کپی شد.')
      } catch {
        notify('error', 'کپی ناموفق بود.')
      }
    },
    [],
  )

  // ---- derived filtered list (curated tab) ----
  const filtered = React.useMemo(() => {
    let list = initialQuotes.filter((q) => {
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase()
        const matchEn = q.text.toLowerCase().includes(query)
        const matchFa = q.textFa.toLowerCase().includes(query)
        const matchTitle = q.bookTitle.toLowerCase().includes(query)
        const matchAuthor = q.bookAuthor.toLowerCase().includes(query)
        if (!matchEn && !matchFa && !matchTitle && !matchAuthor) return false
      }
      if (theme !== 'all' && !q.theme.includes(theme)) return false
      if (length !== 'all' && q.length !== length) return false
      return true
    })

    if (sort === 'popular') {
      list = list.slice().sort((a, b) => {
        const rA = reactions[a.id]?.likes ?? 10
        const rB = reactions[b.id]?.likes ?? 10
        return rB - rA
      })
    } else if (sort === 'random') {
      const seed = shuffleSeed
      list = list
        .map((q, i) => ({ q, k: (Math.sin(seed * 9301 + i * 49297) + 1) * 0.5 }))
        .sort((a, b) => a.k - b.k)
        .map(({ q }) => q)
    } else if (sort === 'byBook') {
      list = list.slice().sort((a, b) => {
        if (a.bookSlug !== b.bookSlug) return a.bookSlug.localeCompare(b.bookSlug)
        return a.pageNumber - b.pageNumber
      })
    }
    return list
  }, [initialQuotes, searchQuery, theme, length, sort, shuffleSeed, reactions])

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
              <span className="text-glow-gold">کوت‌ها و برگزیده‌ها</span>
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              گالری کوت‌های برگزیده از کتاب‌ها، هایلایت‌های شخصی و امکان طراحی و ساخت کارت‌های کاغذی داینامیک برای استوری و تلگرام.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-gold-400/30 bg-gold-400/10 px-3 py-1 text-gold-700 dark:text-gold-300"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {toPersianDigits(initialQuotes.length)} کوت برگزیده
          </Badge>
        </div>
      </header>

      {/* ─── Quote of the Day hero ─── */}
      {heroQuote && (
        <QuoteOfTheDayHero
          quote={heroQuote}
          book={heroQuote.bookSlug ? initialBookLookup[heroQuote.bookSlug] : undefined}
          onNext={nextHero}
          onOpenStudio={() => openStudio(heroQuote)}
          onShare={() => share(heroQuote)}
          isSaved={savedQuoteSet.has(heroQuote.id)}
          onToggleSave={() => toggleSave(heroQuote.id)}
          reaction={reactions[heroQuote.id]}
          onVote={(type) => handleVote(heroQuote.id, type)}
          toPersianDigits={toPersianDigits}
          prefersReduced={!!prefersReduced}
          heroIdx={heroIdx}
          total={initialQuotes.length}
        />
      )}

      {/* ─── Tabs ─── */}
      <div className="w-full space-y-6" dir="rtl">
        <div className="flex w-full justify-start items-center">
          <div className="inline-flex h-auto flex-wrap items-center justify-start gap-1 rounded-xl bg-muted p-1 text-muted-foreground" role="tablist" aria-label="بخش‌های کوت‌ها">
            <QuoteTabButton active={tab === 'highlights'} onClick={() => setTab('highlights')}>
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              کوت‌های من
              {highlights.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ms-1 rounded-full bg-emerald-400/15 px-1.5 py-0 text-[10px] text-emerald-700 dark:text-emerald-300"
                >
                  {toPersianDigits(highlights.length)}
                </Badge>
              )}
            </QuoteTabButton>

            <QuoteTabButton active={tab === 'curated'} onClick={() => setTab('curated')}>
              <Globe className="h-4 w-4" aria-hidden="true" />
              کوت‌های عمومی
              <Badge
                variant="secondary"
                className="ms-1 rounded-full bg-gold-400/15 px-1.5 py-0 text-[10px] text-gold-700 dark:text-gold-300"
              >
                {toPersianDigits(initialQuotes.length)}
              </Badge>
            </QuoteTabButton>

            <QuoteTabButton active={tab === 'saved'} onClick={() => setTab('saved')}>
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
            </QuoteTabButton>
          </div>
        </div>

        {/* ─── Curated tab ─── */}
        {tab === 'curated' && <div role="tabpanel" className="w-full space-y-6 outline-none">
          <FilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            theme={theme}
            setTheme={setTheme}
            length={length}
            setLength={setLength}
            sort={sort}
            setSort={setSort}
            onReshuffle={() => setShuffleSeed((s) => s + 1)}
            filteredCount={filtered.length}
            toPersianDigits={toPersianDigits}
          />

          {filtered.length === 0 ? (
            <EmptyState
              icon={QuoteIcon}
              title="کوتی با این مشخصات یافت نشد"
              hint="فیلترهای موضوعی یا عبارت جستجو را تغییر دهید."
              cta={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setTheme('all')
                    setLength('all')
                  }}
                >
                  پاکسازی فیلترها
                </Button>
              }
            />
          ) : (
            <QuoteMasonry
              quotes={filtered}
              bookLookup={initialBookLookup}
              savedSet={savedQuoteSet}
              reactions={reactions}
              onVote={handleVote}
              onOpenStudio={openStudio}
              onShare={share}
              onToggleSave={toggleSave}
              prefersReduced={!!prefersReduced}
              toPersianDigits={toPersianDigits}
            />
          )}
        </div>}

        {/* ─── Highlights tab (کوت‌های من) ─── */}
        {tab === 'highlights' && <div role="tabpanel" className="w-full space-y-6 outline-none">
          <HighlightsTab
            highlights={highlights}
            bookLookup={initialBookLookup}
            privateHlSet={privateHlSet}
            onTogglePublic={togglePublicHighlight}
            onDeleteHighlight={handleDeleteHighlight}
            onOpenStudio={openStudio}
            onShare={share}
            toPersianDigits={toPersianDigits}
          />
        </div>}

        {/* ─── Saved tab ─── */}
        {tab === 'saved' && <div role="tabpanel" className="w-full space-y-6 outline-none">
          {savedQuotes.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="هنوز کوتی ذخیره نکرده‌اید"
              hint="در زبانه «کوت‌های عمومی»، دکمه ذخیره را روی هر کارت بزنید تا اینجا جمع شوند."
              cta={
                <Button variant="glow" size="sm" onClick={() => setTab('curated')}>
                  <QuoteIcon className="h-4 w-4" aria-hidden="true" />
                  دیدن کوت‌ها
                </Button>
              }
            />
          ) : (
            <QuoteMasonry
              quotes={savedQuotes}
              bookLookup={initialBookLookup}
              savedSet={savedQuoteSet}
              reactions={reactions}
              onVote={handleVote}
              onOpenStudio={openStudio}
              onShare={share}
              onToggleSave={toggleSave}
              prefersReduced={!!prefersReduced}
              toPersianDigits={toPersianDigits}
              savedMode
            />
          )}
        </div>}
      </div>

      {/* ─── Studio Modal ─── */}
      {studioOpen && (
        <React.Suspense fallback={null}>
          <QuoteStudioModal
            open={studioOpen}
            onOpenChange={setStudioOpen}
            quote={studioQuote}
            book={studioBook}
          />
        </React.Suspense>
      )}
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
  onOpenStudio: () => void
  onShare: () => void
  isSaved: boolean
  onToggleSave: () => void
  reaction?: ReactionData
  onVote: (type: 'like' | 'dislike') => void
  toPersianDigits: (n: string | number) => string
  prefersReduced: boolean
  heroIdx: number
  total: number
}

function QuoteTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-foreground transition-[color,box-shadow,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
        active && 'bg-background shadow-sm dark:border-input dark:bg-input/30 dark:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function QuoteOfTheDayHero({
  quote,
  book,
  onNext,
  onOpenStudio,
  isSaved,
  onToggleSave,
  reaction,
  onVote,
  toPersianDigits,
  prefersReduced: _prefersReduced,
  heroIdx,
  total,
}: QuoteOfTheDayHeroProps) {
  const likesCount = reaction?.likes ?? 28
  const dislikesCount = reaction?.dislikes ?? 1
  const userVote = reaction?.userVote

  return (
    <section
      aria-label="کوت روز"
      className="relative overflow-hidden rounded-3xl border border-gold-400/30 bg-gradient-to-br from-gold-500/15 via-amber-500/10 to-rose-500/5 p-6 shadow-glow-gold sm:p-10"
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
              کوت روز
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
                  className={cn('gap-1 rounded-full border px-2 py-0.5 text-[11px]', THEME_TINT[t])}
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

        {/* English quote */}
        <blockquote
          key={quote.id}
          dir="ltr"
          className="font-serif text-2xl font-medium leading-snug text-foreground sm:text-3xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-300"
        >
          <span className="text-gold-500/60">“</span>
          {quote.text}
          <span className="text-gold-500/60">”</span>
        </blockquote>

        {/* Farsi translation */}
        <p
          key={`fa-${quote.id}`}
          dir="rtl"
          className="text-base leading-relaxed text-muted-foreground sm:text-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-300"
        >
          {quote.textFa}
        </p>

        {/* Attribution + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gold-400/15 pt-5">
          <div className="flex items-center gap-3">
            {book ? (
              <Link
                href={`/books/read/${quote.bookSlug}`}
                className="group flex items-center gap-3"
              >
                <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md shadow-md ring-1 ring-gold-400/20 transition-transform group-hover:scale-105">
                  <BookCover
                    title={book.title}
                    author={book.author}
                    from={book.coverFrom}
                    imageUrl={book.coverImageUrl || book.coverImage || undefined}
                    blurhash={book.coverBlurhash || undefined}
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
                  <div className="text-xs text-muted-foreground" dir="ltr">
                    {quote.bookAuthor} · صفحه {toPersianDigits(quote.pageNumber)}
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

          <div className="flex flex-wrap items-center gap-2">
            {/* Reactions Like/Dislike */}
            <div className="flex items-center gap-1 bg-background/50 rounded-xl p-1 border border-gold-400/20">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onVote('like')}
                className={cn(
                  'h-8 gap-1.5 px-2.5 rounded-lg text-xs',
                  userVote === 'like' && 'bg-rose-500/15 text-rose-600 font-bold',
                )}
                aria-label={`پسندیدن، ${toPersianDigits(likesCount)} پسند`}
              >
                <Heart
                  className={cn('h-3.5 w-3.5', userVote === 'like' && 'fill-rose-500 text-rose-500')}
                />
                <span>{toPersianDigits(likesCount)}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onVote('dislike')}
                className={cn(
                  'h-8 gap-1 px-2 rounded-lg text-xs opacity-70',
                  userVote === 'dislike' && 'bg-black/10 dark:bg-white/10 opacity-100 font-bold',
                )}
                aria-label={`نپسندیدن، ${toPersianDigits(dislikesCount)} نپسند`}
              >
                <ThumbsDown className="h-3 w-3" />
                <span>{toPersianDigits(dislikesCount)}</span>
              </Button>
            </div>

            {/* Studio Open CTA */}
            <Button
              variant="glow"
              size="sm"
              onClick={onOpenStudio}
              className="gap-1.5 rounded-xl font-bold shadow-md shadow-gold-600/30"
              aria-label="طراحی و دانلود کارت"
            >
              <Palette className="h-4 w-4" />
              <span>طراحی و دانلود کارت</span>
            </Button>

            {/* Bookmark */}
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleSave}
              aria-pressed={isSaved}
              aria-label={isSaved ? 'حذف کوت از ذخیره‌شده‌ها' : 'ذخیره کوت'}
              className={cn(
                'gap-1.5 rounded-xl',
                isSaved && 'border-amber-400/40 bg-amber-400/15 text-amber-700 dark:text-amber-300',
              )}
            >
              {isSaved ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>

            {/* Next quote */}
            <Button
              variant="outline"
              size="sm"
              onClick={onNext}
              className="gap-1 rounded-xl"
              aria-label="کوت بعدی"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------

interface FilterBarProps {
  searchQuery: string
  setSearchQuery: (q: string) => void
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
  searchQuery,
  setSearchQuery,
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
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    theme !== 'all' ||
    length !== 'all' ||
    sort !== 'newest'

  const handleResetFilters = () => {
    setSearchQuery('')
    setTheme('all')
    setLength('all')
    setSort('newest')
  }

  return (
    <div className="space-y-3.5 rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5 shadow-xs backdrop-blur-md">
      {/* ─── 1. Search Bar + Active Count & Reset ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در کوت‌ها، ترجمه فارسی، نام کتاب یا نویسنده..."
            className="h-10 pr-10 pl-9 text-sm rounded-xl bg-background/60 border-border/70 focus-visible:ring-gold-500/30"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="پاک کردن جستجو"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <Badge
            variant="outline"
            className="h-9 px-3 rounded-xl border-gold-500/20 bg-gold-500/5 text-gold-700 dark:text-gold-300 font-semibold text-xs shrink-0"
          >
            {toPersianDigits(filteredCount)} کوت
          </Badge>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 gap-1.5 px-3 rounded-xl text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 font-medium transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>پاکسازی فیلترها</span>
            </Button>
          )}
        </div>
      </div>

      {/* ─── 2. Topic Categories (موضوعات) ─── */}
      <div className="space-y-2 border-t border-border/40 pt-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-gold-500" />
            موضوع کوت:
          </span>
          {theme !== 'all' && (
            <span className="text-[11px] text-muted-foreground">
              فیلتر فعال: <strong className="text-foreground font-bold">{theme}</strong>
            </span>
          )}
        </div>

        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-1 sm:flex-wrap">
          <Chip active={theme === 'all'} onClick={() => setTheme('all')}>
            همه موضوعات
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
      </div>

      {/* ─── 3. Secondary Controls: Length & Sort ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-border/40 pt-3">
        {/* Length Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground shrink-0">
            طول متن:
          </span>
          <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background/50 p-1">
            <button
              type="button"
              onClick={() => setLength('all')}
              aria-pressed={length === 'all'}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                length === 'all'
                  ? 'bg-gold-500/15 text-gold-700 dark:text-gold-300 font-bold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              همه
            </button>
            {QUOTE_LENGTHS.map((l) => {
              const active = length === l
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLength(l)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                    active
                      ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {LENGTH_LABEL[l]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Sort Selector */}
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <span className="text-xs font-semibold text-muted-foreground shrink-0">
            مرتب‌سازی:
          </span>
          <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background/50 p-1">
            {SORT_LABELS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSort(s.key)}
                aria-pressed={sort === s.key}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                  sort === s.key
                    ? 'bg-gold-500/15 text-gold-700 dark:text-gold-300 font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {s.label}
              </button>
            ))}
            {sort === 'random' && (
              <button
                type="button"
                onClick={onReshuffle}
                aria-label="بُرش تصادفی دوباره"
                title="بُرش تصادفی دوباره"
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
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
        'inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all active:scale-95 cursor-pointer',
        active
          ? activeClass ??
              'border-gold-400/40 bg-gold-400/15 text-gold-700 dark:text-gold-300 font-bold shadow-xs'
          : 'border-border/60 bg-background/50 text-muted-foreground hover:bg-accent/80 hover:text-foreground hover:border-border',
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
  reactions: Record<string, ReactionData>
  onVote: (quoteId: string, type: 'like' | 'dislike') => void
  onOpenStudio: (quote: CuratedQuote, book?: BookListItem) => void
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
  reactions,
  onVote,
  onOpenStudio,
  onShare,
  onToggleSave,
  prefersReduced,
  toPersianDigits,
  savedMode = false,
}: QuoteMasonryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
      {quotes.map((q, i) => (
        <QuoteCard
          key={q.id}
          quote={q}
          book={bookLookup[q.bookSlug]}
          isSaved={savedSet.has(q.id)}
          reaction={reactions[q.id]}
          onVote={(t) => onVote(q.id, t)}
          onOpenStudio={() => onOpenStudio(q, bookLookup[q.bookSlug])}
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
  reaction?: ReactionData
  onVote: (type: 'like' | 'dislike') => void
  onOpenStudio: () => void
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
  reaction,
  onVote,
  onOpenStudio,
  onShare,
  onToggleSave,
  prefersReduced: _prefersReduced,
  toPersianDigits,
  index,
}: QuoteCardProps) {
  const likesCount = reaction?.likes ?? (12 + (index % 15))
  const userVote = reaction?.userVote

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
      className={cn(
        'group flex h-full flex-col justify-between gap-4 rounded-2xl border bg-card/70 p-5',
        'shadow-xs transition-all duration-300 hover:-translate-y-1 active:scale-[0.99]',
        'border-border/60 hover:border-gold-400/50 hover:shadow-md hover:shadow-gold-500/10',
        'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 fill-mode-both',
      )}
    >
      {/* Top section: Header + Quotes */}
      <div className="space-y-3.5 flex-1">
        {/* Decorative quote mark + Creator info + theme badges */}
        <div className="flex items-center justify-between gap-2 pb-0.5">
          <div className="flex items-center gap-2">
            <QuoteIcon
              aria-hidden="true"
              className="h-6 w-6 shrink-0 text-gold-500/40"
              strokeWidth={1.5}
            />
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/80 font-medium bg-muted/50 px-2 py-0.5 rounded-full border border-border/40">
              <User className="h-2.5 w-2.5 text-gold-600 dark:text-gold-400" />
              {quote.isPublic ? 'کاربر بوکزی' : 'بوکزی'}
            </span>
          </div>

          <div className="flex flex-wrap justify-end gap-1">
            {quote.theme.slice(0, 2).map((t) => {
              const Icon = THEME_ICON[t]
              return (
                <Badge
                  key={t}
                  variant="outline"
                  className={cn('gap-1 rounded-full border px-1.5 py-0 text-[10px]', THEME_TINT[t])}
                >
                  <Icon className="h-2.5 w-2.5" aria-hidden="true" />
                  {t}
                </Badge>
              )
            })}
          </div>
        </div>

        {/* English text */}
        <blockquote dir="ltr" className="font-serif text-base font-medium leading-relaxed text-foreground">
          “{quote.text}”
        </blockquote>

        {/* Farsi translation */}
        <p dir="rtl" className="text-sm leading-relaxed text-muted-foreground">
          {quote.textFa}
        </p>
      </div>

      {/* Bottom section: Attribution + Actions */}
      <div className="space-y-3 pt-2">
        {/* Book attribution */}
        <div className="flex items-center gap-2.5 border-t border-border/40 pt-3">
          {book ? (
            <Link
              href={`/books/read/${quote.bookSlug}`}
              className="flex shrink-0 items-center gap-2"
              aria-label={`جلد کتاب ${quote.bookTitle}`}
            >
              <div className="h-12 w-8 shrink-0 overflow-hidden rounded-sm shadow-xs ring-1 ring-gold-400/15 transition-transform group-hover:scale-105">
                <BookCover
                  title={book.title}
                  author={book.author}
                  from={book.coverFrom}
                  imageUrl={book.coverImageUrl || book.coverImage || undefined}
                  blurhash={book.coverBlurhash || undefined}
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
            <span className="truncate text-[11px] text-muted-foreground" dir="ltr">
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

        {/* Action Buttons Bar */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-border/30">
          {/* Like Button */}
          <button
            type="button"
            onClick={() => onVote('like')}
            className={cn(
              'flex items-center gap-1 text-xs py-1 px-2 rounded-lg transition-colors',
              userVote === 'like'
                ? 'text-rose-600 bg-rose-500/10 font-bold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
            title="پسندیدن"
            aria-label={`پسندیدن، ${toPersianDigits(likesCount)} پسند`}
          >
            <Heart className={cn('h-3.5 w-3.5', userVote === 'like' && 'fill-rose-500 text-rose-500')} />
            <span>{toPersianDigits(likesCount)}</span>
          </button>

          {/* Studio Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenStudio}
            className="h-8 gap-1 px-2 text-xs text-gold-700 hover:text-gold-800 dark:text-gold-400 dark:hover:text-gold-300 hover:bg-gold-500/10 rounded-lg"
            title="طراحی و ساخت کارت استوری"
          >
            <Palette className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">کارت استوری</span>
          </Button>

          {/* Share Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="h-8 px-2 text-xs rounded-lg"
            title="اشتراک‌گذاری"
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>

          {/* Bookmark Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSave}
            aria-pressed={isSaved}
            className={cn(
              'h-8 px-2 text-xs rounded-lg',
              isSaved && 'text-amber-700 hover:text-amber-800 dark:text-amber-300',
            )}
            title={isSaved ? 'حذف از ذخیره‌شده‌ها' : 'ذخیره کوت'}
            aria-label={isSaved ? 'حذف کوت از ذخیره‌شده‌ها' : 'ذخیره کوت'}
          >
            {isSaved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Highlights tab (کوت‌های من — گرید کارت‌های شخصی)
// ---------------------------------------------------------------------------

interface HighlightsTabProps {
  highlights: Array<Highlight & { bookSlug: string }>
  bookLookup: Record<string, BookListItem>
  privateHlSet: Set<string>
  onTogglePublic: (id: string) => void
  onDeleteHighlight: (id: string, slug: string) => void
  onOpenStudio: (
    q: {
      id: string
      text: string
      textFa?: string
      pageNumber?: number
      bookSlug?: string
      bookTitle?: string
      bookAuthor?: string
      highlightColor?: string
    },
    b?: BookListItem,
  ) => void
  onShare: (q: { text: string; bookAuthor?: string; bookTitle?: string }) => void
  toPersianDigits: (n: string | number) => string
}

function HighlightsTab({
  highlights,
  bookLookup,
  privateHlSet,
  onTogglePublic,
  onDeleteHighlight,
  onOpenStudio,
  onShare,
  toPersianDigits,
}: HighlightsTabProps) {
  const [hlSearch, setHlSearch] = React.useState('')
  const [selectedColor, setSelectedColor] = React.useState<string | 'all'>('all')

  const totalCount = highlights.length

  // Filter highlights
  const filtered = React.useMemo(() => {
    return highlights.filter((h) => {
      if (selectedColor !== 'all' && h.color !== selectedColor) return false
      if (hlSearch.trim()) {
        const q = hlSearch.trim().toLowerCase()
        const matchText = h.text.toLowerCase().includes(q)
        const matchNote = (h.note || '').toLowerCase().includes(q)
        const book = bookLookup[h.bookSlug]
        const matchBook = book?.title.toLowerCase().includes(q) || false
        const matchAuthor = book?.author.toLowerCase().includes(q) || false
        if (!matchText && !matchNote && !matchBook && !matchAuthor) return false
      }
      return true
    })
  }, [highlights, selectedColor, hlSearch, bookLookup])

  const hasActiveFilters = hlSearch.trim() !== '' || selectedColor !== 'all'

  const handleResetFilters = () => {
    setHlSearch('')
    setSelectedColor('all')
  }

  if (totalCount === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="هنوز کوتی از کتاب‌ها ثبت نکرده‌اید"
        hint="هنگام مطالعه هر کتابی، متن دلخواهتان را انتخاب و هایلایت کنید تا کوت‌های شخصی شما با طراحی زیبا اینجا نمایش داده شوند."
        cta={
          <Button asChild variant="glow" size="sm">
            <Link href="/library">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              شروع مطالعه در کتابخانه
            </Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* ─── 1. Search Bar + Active Count & Reset ─── */}
      <div className="w-full space-y-3.5 rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5 shadow-xs backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={hlSearch}
              onChange={(e) => setHlSearch(e.target.value)}
              placeholder="جستجو در کوت‌های من، یادداشت‌ها، نام کتاب یا نویسنده..."
              className="h-10 pr-10 pl-9 text-sm rounded-xl bg-background/60 border-border/70 focus-visible:ring-gold-500/30"
            />
            {hlSearch && (
              <button
                type="button"
                onClick={() => setHlSearch('')}
                aria-label="پاک کردن جستجو"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <Badge
              variant="outline"
              className="h-9 px-3 rounded-xl border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 font-semibold text-xs shrink-0"
            >
              {toPersianDigits(filtered.length)} کوت
            </Badge>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 gap-1.5 px-3 rounded-xl text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 font-medium transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>پاکسازی فیلترها</span>
              </Button>
            )}
          </div>
        </div>

        {/* ─── 2. Highlight Color Categories ─── */}
        <div className="space-y-2 border-t border-border/40 pt-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Highlighter className="h-3.5 w-3.5 text-emerald-500" />
              فیلتر بر اساس رنگ هایلایت:
            </span>
            {selectedColor !== 'all' && (
              <span className="text-[11px] text-muted-foreground">
                رنگ انتخابی: <strong className="text-foreground font-bold">{HIGHLIGHT_LABELS[selectedColor as HighlightColor] || selectedColor}</strong>
              </span>
            )}
          </div>

          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-1 sm:flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedColor('all')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer border',
                selectedColor === 'all'
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500/30'
                  : 'border-border/60 bg-card/60 text-muted-foreground hover:border-emerald-400/40 hover:text-foreground',
              )}
            >
              همه رنگ‌ها
              <span className="ms-1 rounded-full bg-foreground/10 px-1.5 py-0.2 text-[10px]">
                {toPersianDigits(totalCount)}
              </span>
            </button>

            {(['yellow', 'green', 'pink', 'blue', 'orange', 'gold'] as HighlightColor[]).map((c) => {
              const active = selectedColor === c
              const count = highlights.filter((h) => h.color === c).length
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all cursor-pointer border',
                    active
                      ? 'border-foreground/80 bg-accent text-foreground shadow-sm ring-2 ring-foreground/20 font-bold'
                      : 'border-border/60 bg-card/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                  )}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full ring-1 ring-black/20 shrink-0"
                    style={{ background: HIGHLIGHT_SWATCHES[c]?.bg || '#facc15' }}
                  />
                  <span>{HIGHLIGHT_LABELS[c]}</span>
                  {count > 0 && (
                    <span className="text-[10px] opacity-70">
                      ({toPersianDigits(count)})
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Grid of Personal Quotes */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="کوتی با این مشخصات پیدا نشد"
          hint="فیلتر رنگ یا عبارت جستجو را تغییر دهید."
          cta={
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
            >
              پاکسازی فیلترها
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {filtered.map((h, i) => {
            const book = bookLookup[h.bookSlug]
            const isPublic = !privateHlSet.has(h.id)

            return (
              <PersonalQuoteCard
                key={h.id}
                highlight={h}
                book={book}
                isPublic={isPublic}
                onTogglePublic={() => onTogglePublic(h.id)}
                onDelete={() => onDeleteHighlight(h.id, h.bookSlug)}
                onOpenStudio={() =>
                  onOpenStudio(
                    {
                      id: h.id,
                      text: h.text,
                      textFa: h.note || undefined,
                      bookSlug: h.bookSlug,
                      bookTitle: book?.title || h.bookSlug,
                      bookAuthor: book?.author || '',
                      pageNumber: h.page + 1,
                      highlightColor: h.color,
                    },
                    book,
                  )
                }
                onShare={() =>
                  onShare({
                    text: h.text,
                    bookTitle: book?.title || h.bookSlug,
                    bookAuthor: book?.author || '',
                  })
                }
                toPersianDigits={toPersianDigits}
                index={i}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function PersonalQuoteCard({
  highlight,
  book,
  isPublic,
  onTogglePublic,
  onOpenStudio,
  onShare,
  onDelete,
  toPersianDigits,
  index,
}: {
  highlight: Highlight & { bookSlug: string }
  book?: BookListItem
  isPublic: boolean
  onTogglePublic: () => void
  onOpenStudio: () => void
  onShare: () => void
  onDelete: () => void
  toPersianDigits: (n: string | number) => string
  index: number
}) {
  const swatch = HIGHLIGHT_SWATCHES[highlight.color]
  const label = HIGHLIGHT_LABELS[highlight.color]

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
      className={cn(
        'group flex h-full flex-col justify-between gap-4 rounded-2xl border bg-card/70 p-5',
        'shadow-xs transition-all duration-300 hover:-translate-y-1 active:scale-[0.99]',
        'border-border/60 hover:border-gold-400/50 hover:shadow-md hover:shadow-gold-500/10',
        'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 fill-mode-both',
      )}
    >
      {/* Top section: Header + Quotes */}
      <div className="space-y-3.5 flex-1">
        {/* Decorative quote mark + Creator info + Public/Private status */}
        <div className="flex items-center justify-between gap-2 pb-0.5">
          <div className="flex items-center gap-2">
            <QuoteIcon
              aria-hidden="true"
              className="h-6 w-6 shrink-0 text-gold-500/40"
              strokeWidth={1.5}
            />
            <span className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <User className="h-2.5 w-2.5" />
              کوت شما
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onTogglePublic}
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors',
                isPublic
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-border/60 bg-muted/60 text-muted-foreground',
              )}
              title={isPublic ? 'عمومی (در بخش عمومی قابل مشاهده است)' : 'خصوصی'}
            >
              {isPublic ? (
                <>
                  <Globe className="h-2.5 w-2.5" />
                  عمومی
                </>
              ) : (
                <>
                  <Lock className="h-2.5 w-2.5" />
                  خصوصی
                </>
              )}
            </button>
            <span
              aria-hidden="true"
              className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
              style={{ background: swatch?.bg || '#facc15' }}
              title={label}
            />
          </div>
        </div>

        {/* English quote text */}
        <blockquote dir="ltr" className="font-serif text-base font-medium leading-relaxed text-foreground">
          “{highlight.text}”
        </blockquote>

        {/* User note if any */}
        {highlight.note && (
          <p dir="rtl" className="text-sm leading-relaxed text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
            <Feather className="ms-0.5 me-1.5 inline h-3.5 w-3.5 text-gold-600 align-text-bottom" />
            {highlight.note}
          </p>
        )}
      </div>

      {/* Bottom section: Book attribution + Actions */}
      <div className="space-y-3 pt-2">
        {/* Book attribution */}
        <div className="flex items-center gap-2.5 border-t border-border/40 pt-3">
          {book ? (
            <Link
              href={`/books/read/${highlight.bookSlug}`}
              className="flex shrink-0 items-center gap-2"
              aria-label={`رفتن به کتاب ${book.title}`}
            >
              <div className="h-12 w-8 shrink-0 overflow-hidden rounded-sm shadow-xs ring-1 ring-gold-400/15 transition-transform group-hover:scale-105">
                <BookCover
                  title={book.title}
                  author={book.author}
                  from={book.coverFrom}
                  imageUrl={book.coverImageUrl || book.coverImage || undefined}
                  blurhash={book.coverBlurhash || undefined}
                  to={book.coverTo}
                  accent={book.coverAccent}
                  size="sm"
                />
              </div>
            </Link>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col">
            <Link
              href={`/books/read/${highlight.bookSlug}`}
              className="truncate text-xs font-semibold text-foreground hover:text-gold-700 dark:hover:text-gold-300"
              dir="ltr"
              title={book?.title || highlight.bookSlug}
            >
              {book?.title || highlight.bookSlug}
            </Link>
            <span className="truncate text-[11px] text-muted-foreground" dir="ltr">
              {book?.author || ''} · صفحه {toPersianDigits(highlight.page + 1)}
            </span>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 rounded-full border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0 text-[10px] text-emerald-700 dark:text-emerald-300"
          >
            هایلایت
          </Badge>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-border/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenStudio}
            className="h-8 gap-1 px-2.5 text-xs text-gold-700 hover:text-gold-800 dark:text-gold-400 dark:hover:text-gold-300 hover:bg-gold-500/10 rounded-lg font-bold"
            title="طراحی و ساخت کارت استوری"
          >
            <Palette className="h-3.5 w-3.5" />
            <span>کارت استوری</span>
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="h-8 px-2 text-xs rounded-lg"
              title="اشتراک‌گذاری"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 px-2 text-xs rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
              title="حذف کوت"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </article>
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
    <div className="flex w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-card/30 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-600 dark:text-gold-300">
        <Icon className="h-8 w-8" aria-hidden="true" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {hint && <p className="mx-auto max-w-md text-sm text-muted-foreground">{hint}</p>}
      </div>
      {cta}
    </div>
  )
}
