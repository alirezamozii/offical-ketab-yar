'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  BookMarked,
  BookOpen,
  Compass,
  CornerDownLeft,
  Feather,
  FileText,
  Home,
  Keyboard,
  LayoutDashboard,
  Library,
  LibraryBig,
  type LucideIcon,
  Medal,
  Moon,
  Quote,
  Search,
  Settings,
  Sparkles,
  Target,
  Trophy,
  User,
  Volume2,
  Wand2,
  X,
  Headphones,
  PencilLine,
  BarChart3,
} from 'lucide-react'
// NOTE: `Compass` is kept for the /library/genres entry below. The
// `/discover` route was deleted (it redirects to /library); the command
// palette entry for it was removed in R1-E.
import { toast } from 'sonner'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { getLocalProgress } from '@/hooks/reader/use-local-progress'
import { STORAGE_KEYS } from '@/lib/storage-keys'

/** Public event the header trigger dispatches to open the palette. */
export const CMDK_OPEN_EVENT = 'ky:cmdk-open'

interface QuickLink {
  href: string
  label: string
  icon: LucideIcon
  hint?: string
}

const PAGES: QuickLink[] = [
  { href: '/', label: 'خانه', icon: Home, hint: 'H' },
  { href: '/library', label: 'کتابخانه', icon: Library, hint: 'L' },
  { href: '/collections', label: 'پلی‌لیست‌های من', icon: LibraryBig, hint: 'C' },
  { href: '/library/genres', label: 'ژانرها', icon: Compass, hint: 'G' },
  { href: '/authors', label: 'نویسندگان', icon: Feather, hint: 'A' },
  { href: '/quotes', label: 'نقل‌قول‌ها و هایلایت‌ها', icon: Quote, hint: 'Q' },
  { href: '/leaderboard', label: 'لیدربورد', icon: Trophy, hint: 'B' },
  { href: '/achievements', label: 'دستاوردها', icon: Medal, hint: 'A' },
  { href: '/goals', label: 'اهداف مطالعه', icon: Target, hint: 'O' },
  { href: '/stats', label: 'آمار مطالعه', icon: BarChart3, hint: 'T' },
  { href: '/dashboard', label: 'داشبورد', icon: Sparkles, hint: 'D' },
  { href: '/profile', label: 'پروفایل', icon: User, hint: 'P' },
  { href: '/settings', label: 'تنظیمات', icon: Settings, hint: ',' },
  { href: '/about', label: 'درباره ما', icon: BookOpen },
  { href: '/help', label: 'سوالات متداول', icon: BookMarked },
]

const VOCAB: QuickLink[] = [
  { href: '/vocabulary', label: 'واژگان من', icon: BookMarked },
  { href: '/vocabulary/practice', label: 'تمرین واژگان (فلش‌کارت)', icon: Wand2 },
  { href: '/vocabulary/game', label: 'بازی تطبیق واژگان', icon: Sparkles },
  { href: '/vocabulary/listen', label: 'بازی شنیداری', icon: Headphones },
  { href: '/vocabulary/spell', label: 'بازی املایی', icon: PencilLine },
]

const QUICK_ACTIONS: QuickLink[] = [
  { href: '/library', label: 'رفتن به کتابخانه', icon: Library },
  { href: '/collections', label: 'پلی‌لیست‌های من (قفسه‌ها)', icon: LibraryBig },
  { href: '/dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { href: '/stats', label: 'مرور سال (آمار مطالعه)', icon: BarChart3 },
  { href: '/goals', label: 'اهداف و آمار مطالعه', icon: Target },
  { href: '/achievements', label: 'گالری دستاوردها', icon: Trophy },
  { href: '/vocabulary', label: 'واژگان', icon: BookMarked },
]

interface SearchHit {
  bookSlug: string
  bookTitle: string
  bookAuthor: string
  pageNumber: number
  matchType: 'english' | 'farsi'
  type: 'book' | 'page' | 'author'
  highlight: string
  score: number
}

interface SearchResponse {
  hits: SearchHit[]
  total: number
  bookCount: number
  took: number
  fuzzy: boolean
}

interface RecentPageEntry {
  slug: string
  title: string
  author: string
  page: number
  percent: number
  ts: number
}

const MAX_RECENT_PAGES = 5
const RECENT_PAGES_KEY = STORAGE_KEYS.recentPages

/**
 * Read recently-read books from `ky_progress` (the reader's per-book progress
 * map) and convert them into a `RecentPageEntry[]` sorted by last-read time.
 *
 * We don't separately track "recently visited pages" — the reader's progress
 * map already records `lastReadAt` per book, which is exactly what users mean
 * when they say "recently read pages".
 */
function readRecentPages(): RecentPageEntry[] {
  if (typeof window === 'undefined') return []
  try {
    // First, try the explicit `ky_recent_pages` list (set by the reader).
    const raw = localStorage.getItem(RECENT_PAGES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const explicit = parsed
          .filter(
            (x): x is RecentPageEntry =>
              x &&
              typeof x === 'object' &&
              typeof x.slug === 'string' &&
              typeof x.title === 'string',
          )
          .slice(0, MAX_RECENT_PAGES)
        if (explicit.length > 0) return explicit
      }
    }
  } catch {
    /* ignore corrupt JSON */
  }

  // Fall back to deriving recent pages from the progress map.
  try {
    const progress = getLocalProgress()
    const entries: RecentPageEntry[] = Object.entries(progress).map(
      ([slug, p]) => ({
        slug,
        title: slug,
        author: '',
        page: p.currentPage,
        percent: p.percent,
        ts: p.ts ?? 0,
      }),
    )
    return entries
      .sort((a, b) => b.ts - a.ts)
      .slice(0, MAX_RECENT_PAGES)
  } catch {
    return []
  }
}

/**
 * CommandPalette — global ⌘K / Ctrl+K palette.
 *
 * Mounted once in `layout.tsx`. Registers a keydown listener for the
 * Cmd/Ctrl+K shortcut and a window-event listener so the header trigger
 * (an icon button) can open the dialog without prop drilling.
 *
 * Sections (top → bottom):
 *  - Recent pages (when no query) — from the reader's progress map.
 *  - Quick actions — library / dashboard / vocabulary shortcuts.
 *  - Pages — every main app route.
 *  - Vocabulary — vocab sub-routes.
 *  - Search results (when query ≥ 2 chars) — full-text hits from /api/search.
 *  - Advanced search — opens /search?q=<query> for filterable searching.
 *  - Display — theme toggle.
 *  - Action — close current page.
 */
export function CommandPalette() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchHits, setSearchHits] = useState<SearchHit[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [recentPages, setRecentPages] = useState<RecentPageEntry[]>([])
  const [mounted, setMounted] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // ---- open listeners ----
  useEffect(() => {
    setMounted(true)
    const isMac =
      typeof navigator !== 'undefined' &&
      /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)

    const onKey = (e: KeyboardEvent) => {
      const mod = isMac ? e.metaKey : e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    const onCustom = () => setOpen(true)

    window.addEventListener('keydown', onKey)
    window.addEventListener(CMDK_OPEN_EVENT, onCustom as EventListener)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(CMDK_OPEN_EVENT, onCustom as EventListener)
    }
  }, [])

  // ---- refresh recent pages whenever the palette opens ----
  useEffect(() => {
    if (open) {
      setRecentPages(readRecentPages())
    }
  }, [open])

  // ---- debounced full-text search against /api/search ----
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setSearchHits([])
      setLoadingSearch(false)
      abortRef.current?.abort()
      return
    }
    setLoadingSearch(true)
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const handle = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&limit=8`,
          { signal: controller.signal },
        )
        if (!res.ok) throw new Error('failed')
        const data = (await res.json()) as SearchResponse
        setSearchHits(data.hits || [])
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setSearchHits([])
      } finally {
        setLoadingSearch(false)
      }
    }, 250)
    return () => {
      window.clearTimeout(handle)
      controller.abort()
    }
  }, [query])

  // ---- navigation ----
  const go = useCallback(
    (href: string) => {
      setOpen(false)
      setQuery('')
      router.push(href)
    },
    [router],
  )

  const openAdvancedSearch = useCallback(() => {
    const q = query.trim()
    setOpen(false)
    setQuery('')
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }, [query, router])

  const closePalette = useCallback(() => {
    setOpen(false)
    toast.info('برای بستن زبانه مرورگر، از Ctrl+W استفاده کنید.', {
      description: 'این یک پنل درون‌برنامه‌ای است.',
    })
  }, [])

  // Reset query + abort in-flight search when palette closes.
  useEffect(() => {
    if (!open) {
      setQuery('')
      setSearchHits([])
      abortRef.current?.abort()
    }
  }, [open])

  const hasSearchResults = useMemo(() => searchHits.length > 0, [searchHits])
  const hasQuery = query.trim().length >= 2
  const isMac = useMemo(
    () =>
      typeof navigator !== 'undefined' &&
      /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent),
    [],
  )

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="پنل فرمان کتاب‌یار"
      description="برای جستجوی صفحه یا کتاب، تایپ کنید. کلید Escape برای بستن."
      className="scale-in sm:max-w-xl"
    >
      <CommandInput
        placeholder="جستجوی صفحه، کتاب یا متن..."
        aria-label="جستجو در پنل فرمان"
        aria-describedby="cmdk-description"
        value={query}
        onValueChange={setQuery}
      />
      {/* sr-only description — pairs with aria-describedby on the input
          so screen readers announce the helper text on focus. */}
      <p id="cmdk-description" className="sr-only">
        برای جابه‌جایی بین نتایج از کلیدهای بالا و پایین استفاده کنید. برای
        انتخاب، Enter را بفشارید. برای بستن، Escape.
      </p>
      <CommandList aria-busy={loadingSearch} className="max-h-[60vh]">
        <CommandEmpty>نتیجه‌ای یافت نشد.</CommandEmpty>

        {/* Recent pages — only when no query */}
        {!hasQuery && mounted && recentPages.length > 0 && (
          <CommandGroup heading="صفحات اخیر">
            {recentPages.map((rp) => (
              <CommandItem
                key={rp.slug}
                value={`${rp.title} ${rp.slug} recent`}
                onSelect={() => go(`/books/read/${rp.slug}`)}
                className="gap-2"
              >
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 truncate" dir="ltr">
                  {rp.title}
                </span>
                {rp.page > 0 && (
                  <span className="ms-auto rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    صفحه {toFaDigits(rp.page + 1)}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Quick actions */}
        {!hasQuery && (
          <CommandGroup heading="دسترسی سریع">
            {QUICK_ACTIONS.map((item) => (
              <CommandItem
                key={item.href}
                value={`${item.label} quick action`}
                onSelect={() => go(item.href)}
                className="gap-2"
              >
                <item.icon className="h-4 w-4 text-gold-600 dark:text-gold-400" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Pages — always visible, filtered by cmdk against the query */}
        <CommandGroup heading="صفحات">
          {PAGES.map((item) => (
            <CommandItem
              key={item.href}
              value={`${item.label} page ${item.hint ?? ''}`}
              onSelect={() => go(item.href)}
              className="gap-2"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span>{item.label}</span>
              {item.hint && (
                <span className="ms-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {item.hint}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Vocabulary sub-routes */}
        <CommandGroup heading="واژگان">
          {VOCAB.map((item) => (
            <CommandItem
              key={item.href}
              value={`${item.label} vocab`}
              onSelect={() => go(item.href)}
              className="gap-2"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Full-text search results — only when query ≥ 2 chars */}
        {(loadingSearch || hasSearchResults) && <CommandSeparator />}
        {loadingSearch && (
          <CommandGroup
            heading="نتایج جستجو"
            // `role="status"` + `aria-live="polite"` announces the
            // loading state to screen readers as soon as it appears,
            // and again when results arrive.
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <CommandItem disabled className="gap-2">
              <Volume2 aria-hidden="true" className="h-4 w-4 animate-pulse text-muted-foreground" />
              <span className="text-muted-foreground">در حال جستجو...</span>
            </CommandItem>
          </CommandGroup>
        )}
        {!loadingSearch && hasSearchResults && (
          <CommandGroup
            heading="نتایج جستجو"
            // Live region announces "N results found" once loading settles.
            aria-live="polite"
          >
            {searchHits.map((h, i) => (
              <CommandItem
                key={`${h.bookSlug}-${h.pageNumber}-${h.matchType}-${i}`}
                value={`${h.bookTitle} ${h.bookAuthor} ${h.type} search hit`}
                onSelect={() => go(`/books/read/${h.bookSlug}`)}
                aria-label={`کتاب ${h.bookTitle} از ${h.bookAuthor}${
                  h.pageNumber > 0 ? `، صفحه ${toFaDigits(h.pageNumber + 1)}` : ''
                }`}
                className="gap-2"
              >
                {h.type === 'author' ? (
                  <User aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : h.type === 'book' ? (
                  <BookOpen aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <FileText aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="flex-1 truncate" dir="ltr">
                  {h.bookTitle}
                </span>
                {h.pageNumber > 0 && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    ص {toFaDigits(h.pageNumber + 1)}
                  </span>
                )}
                {/* Match-type chip — the visible label EN / FA conveys the
                    language; we add a visually-hidden label so screen readers
                    get the full word instead of the abbreviation. */}
                <span
                  className={
                    h.matchType === 'english'
                      ? 'rounded bg-gold-500/15 px-1.5 py-0.5 text-[10px] font-medium text-gold-700 dark:text-gold-400'
                      : 'rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400'
                  }
                  aria-label={
                    h.matchType === 'english' ? 'متن انگلیسی' : 'متن فارسی'
                  }
                >
                  {h.matchType === 'english' ? 'EN' : 'FA'}
                </span>
              </CommandItem>
            ))}
            <CommandItem
              value="جستجوی پیشرفته advanced search all results"
              onSelect={openAdvancedSearch}
              className="gap-2 border-t border-border/40 mt-1"
            >
              <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-gold-600 dark:text-gold-400" />
              <span className="font-medium">جستجوی پیشرفته</span>
              <span className="ms-auto text-[10px] text-muted-foreground">
                همه نتایج + فیلتر
              </span>
            </CommandItem>
          </CommandGroup>
        )}

        {/* Advanced search shortcut — always visible when there's a query but no hits */}
        {hasQuery && !loadingSearch && !hasSearchResults && (
          <>
            <CommandSeparator />
            <CommandGroup heading="جستجو">
              <CommandItem
                value="جستجوی پیشرفته advanced search page filter"
                onSelect={openAdvancedSearch}
                className="gap-2"
              >
                <Search className="h-4 w-4 shrink-0 text-gold-600 dark:text-gold-400" />
                <span className="font-medium">جستجوی پیشرفته</span>
                <span className="ms-auto text-[10px] text-muted-foreground">
                  باز کردن صفحه جستجو
                </span>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        {/* Keyboard shortcuts reference */}
        <CommandGroup heading="میانبرهای صفحه‌کلید">
          <CommandItem disabled className="gap-2 opacity-90">
            <Keyboard aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">باز/بسته کردن پنل</span>
            <kbd aria-hidden="true" className="ms-auto rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {isMac ? '⌘' : 'Ctrl'} + K
            </kbd>
          </CommandItem>
          <CommandItem disabled className="gap-2 opacity-90">
            <Keyboard aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">جابه‌جایی بین نتایج</span>
            <kbd aria-hidden="true" className="ms-auto rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ↑ ↓
            </kbd>
          </CommandItem>
          <CommandItem disabled className="gap-2 opacity-90">
            <CornerDownLeft aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">انتخاب نتیجه</span>
            <kbd aria-hidden="true" className="ms-auto rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              Enter
            </kbd>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Theme toggle quick action */}
        <CommandGroup heading="نمایش">
          <CommandItem
            value="تم تاریک روشن toggle theme"
            onSelect={() => {
              setOpen(false)
              const next = resolvedTheme === 'dark' ? 'light' : 'dark'
              setTheme(next)
              toast.success(
                next === 'dark' ? 'حالت تاریک فعال شد' : 'حالت روشن فعال شد',
              )
            }}
            className="gap-2"
          >
            <Moon aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
            <span>تغییر تم روشن/تاریک</span>
          </CommandItem>
        </CommandGroup>

        {/* Action: close current page */}
        <CommandGroup heading="عملیات">
          <CommandItem
            value="صفحه فعلی را ببند close"
            onSelect={closePalette}
            className="gap-2"
          >
            <X aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
            <span>صفحه فعلی را ببند</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

/** Convert Latin digits to Persian digits — local helper to avoid the
 *  `'use client'` usePersianLocale hook (which would pull in typography.ts). */
function toFaDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
}
