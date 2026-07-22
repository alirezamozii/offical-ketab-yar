'use client'

/**
 * CollectionsPageClient — full client page for /collections.
 *
 * Layout (top → bottom):
 *   1. Header — Library/Bookshelf icon, "پلی‌لیست‌های من" title, subtitle,
 *      "پلی‌لیست جدید" button.
 *   2. Stats row — total collections, custom (non-default) collections,
 *      total books shelved, books in progress across all shelves.
 *   3. Collections grid — responsive 1/2/3 cols. Each card shows a
 *      colored gradient header bar, large centered icon, name,
 *      description (truncated), book-count badge, last-updated date in
 *      Persian, and hover-revealed view + delete buttons.
 *   4. Detail dialog — opens on card click. Shows all books in the
 *      collection as a responsive grid of mini cards with title/author +
 *      "حذف از پلی‌لیست" button, an "افزودن کتاب" button that opens a
 *      book-picker dialog, and an empty state when the collection has no
 *      books.
 *   5. Create dialog — name input + description textarea + 6-color
 *      swatch picker + 8-icon picker + "ایجاد پلی‌لیست" button.
 *
 * All animations gated on `useReducedMotion`. All text in Farsi. All colors
 * from the gold/amber/emerald/rose/stone/teal palette — zero indigo/blue.
 */

import { BookCard } from '@/components/books/book-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import {
  COLLECTION_COLORS,
  COLLECTION_COLOR_LIST,
  COLLECTION_ICON_LABELS,
  COLLECTION_ICON_LIST,
  CollectionIcon as CollectionIconGlyph,
  useCollections,
  type Collection,
  type CollectionColor,
  type CollectionIconName,
} from '@/lib/collections-client'
import { cn } from '@/lib/utils'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion'
import {
  AlertCircle,
  BookMarked,
  Bookmark,
  Check,
  CheckCircle,
  ChevronLeft,
  Clock,
  Heart,
  Library,
  Layers,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { BookListItem } from '@/lib/data'

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CollectionsPageClient() {
  const locale = usePersianLocale()
  const reduceMotion = useReducedMotion()
  const {
    collections,
    loaded,
    create,
    remove,
    addBook,
    removeBook,
  } = useCollections()

  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(
    null,
  )
  const [createOpen, setCreateOpen] = useState(false)
  const [pickerForCollection, setPickerForCollection] = useState<string | null>(
    null,
  )

  const activeCollection = useMemo(
    () => collections.find((c) => c.id === activeCollectionId) ?? null,
    [collections, activeCollectionId],
  )

  // Stats
  const totalBooks = useMemo(
    () =>
      collections.reduce(
        (sum, c) => sum + c.bookSlugs.length,
        0,
      ),
    [collections],
  )
  const customCount = useMemo(
    () => collections.filter((c) => !c.isDefault).length,
    [collections],
  )
  const mostBooksInOne = useMemo(
    () => collections.reduce((m, c) => Math.max(m, c.bookSlugs.length), 0),
    [collections],
  )

  const handleDelete = useCallback(
    (c: Collection) => {
      if (c.isDefault) {
        toast.error('پلی‌لیست‌های پیش‌فرض قابل حذف نیستند.')
        return
      }
      remove(c.id)
      toast.success(`پلی‌لیست «${c.name}» حذف شد.`)
    },
    [remove],
  )

  return (
    <div className="space-y-8">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <motion.span
            aria-hidden="true"
            initial={reduceMotion ? undefined : { scale: 0.85, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-lg shadow-gold-500/30"
          >
            <Library className="h-7 w-7" />
          </motion.span>
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
              پلی‌لیست‌های من
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              کتاب‌های خود را در پلی‌لیست‌های شخصی دسته‌بندی کنید
            </p>
          </div>
        </div>
        <Button
          variant="glow"
          size="lg"
          onClick={() => setCreateOpen(true)}
          className="gap-2"
        >
          <Plus className="h-5 w-5" />
          پلی‌لیست جدید
        </Button>
      </header>

      {/* ─── Stats row ──────────────────────────────────────────────── */}
      <section
        aria-label="آمار پلی‌لیست‌ها"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
      >
        <StatCard
          icon={<Library className="h-5 w-5" />}
          label="کل پلی‌لیست‌ها"
          value={locale.toPersianDigits(collections.length)}
          tone="gold"
        />
        <StatCard
          icon={<Sparkles className="h-5 w-5" />}
          label="پلی‌لیست‌های سفارشی"
          value={locale.toPersianDigits(customCount)}
          tone="emerald"
        />
        <StatCard
          icon={<BookMarked className="h-5 w-5" />}
          label="کتاب‌های قفسه‌بندی‌شده"
          value={locale.toPersianDigits(totalBooks)}
          tone="amber"
        />
        <StatCard
          icon={<Layers className="h-5 w-5" />}
          label="بیشترین کتاب در یک پلی‌لیست"
          value={locale.toPersianDigits(mostBooksInOne)}
          tone="teal"
        />
      </section>

      {/* ─── Collections grid ───────────────────────────────────────── */}
      {!loaded ? (
        <CollectionsGridSkeleton />
      ) : collections.length === 0 ? (
        <EmptyCollections
          onCreate={() => setCreateOpen(true)}
          onCreateNamed={(name, description, color, icon) => {
            const c = create(name, description, color, icon)
            if (c) {
              toast.success(`پلی‌لیست «${c.name}» ایجاد شد.`)
              setActiveCollectionId(c.id)
            } else {
              toast.error('ایجاد پلی‌لیست ناموفق بود.')
            }
          }}
        />
      ) : (
        <div
          role="list"
          aria-label="پلی‌لیست‌های شما"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {collections.map((c, idx) => (
            <CollectionCardItem
              key={c.id}
              collection={c}
              index={idx}
              onOpen={() => setActiveCollectionId(c.id)}
              onDelete={() => handleDelete(c)}
            />
          ))}
        </div>
      )}

      {/* ─── Detail dialog ─────────────────────────────────────────── */}
      <CollectionDetailDialog
        collection={activeCollection}
        open={Boolean(activeCollectionId)}
        onOpenChange={(o) => !o && setActiveCollectionId(null)}
        onAddBook={() => setPickerForCollection(activeCollectionId)}
        onRemoveBook={(slug) => {
          if (!activeCollectionId) return
          removeBook(activeCollectionId, slug)
          toast.success('کتاب از پلی‌لیست حذف شد.')
        }}
      />

      {/* ─── Create dialog ─────────────────────────────────────────── */}
      <CreateCollectionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={(name, description, color, icon) => {
          const c = create(name, description, color, icon)
          if (c) {
            toast.success(`پلی‌لیست «${c.name}» ایجاد شد.`)
            setCreateOpen(false)
            setActiveCollectionId(c.id)
          } else {
            toast.error('ایجاد پلی‌لیست ناموفق بود.')
          }
        }}
      />

      {/* ─── Book picker dialog ────────────────────────────────────── */}
      <BookPickerDialog
        open={Boolean(pickerForCollection)}
        onOpenChange={(o) => !o && setPickerForCollection(null)}
        onPick={(slug) => {
          if (!pickerForCollection) return
          addBook(pickerForCollection, slug)
          toast.success('کتاب به پلی‌لیست اضافه شد.')
        }}
        existingSlugs={
          collections.find((c) => c.id === pickerForCollection)?.bookSlugs ??
          []
        }
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

type StatTone = 'gold' | 'amber' | 'emerald' | 'rose' | 'teal' | 'stone'

const STAT_TONE_CLASSES: Record<StatTone, string> = {
  gold: 'from-gold-500/15 to-gold-500/5 text-gold-700 dark:text-gold-300 ring-gold-500/20',
  amber:
    'from-amber-500/15 to-amber-500/5 text-amber-700 dark:text-amber-300 ring-amber-500/20',
  emerald:
    'from-emerald-500/15 to-emerald-500/5 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20',
  rose: 'from-rose-500/15 to-rose-500/5 text-rose-700 dark:text-rose-300 ring-rose-500/20',
  teal: 'from-teal-500/15 to-teal-500/5 text-teal-700 dark:text-teal-300 ring-teal-500/20',
  stone:
    'from-stone-500/15 to-stone-500/5 text-stone-700 dark:text-stone-300 ring-stone-500/20',
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone: StatTone
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-sm-warm">
      <div
        className={cn(
          'mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ring-1',
          STAT_TONE_CLASSES[tone],
        )}
      >
        {icon}
      </div>
      <div className="text-2xl font-extrabold leading-none">{value}</div>
      <div className="mt-1 text-[11px] font-medium text-muted-foreground sm:text-xs">
        {label}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CollectionCardItem
// ---------------------------------------------------------------------------

function CollectionCardItem({
  collection,
  index,
  onOpen,
  onDelete,
}: {
  collection: Collection
  index: number
  onOpen: () => void
  onDelete: () => void
}) {
  const locale = usePersianLocale()
  const reduceMotion = useReducedMotion()
  const tokens = COLLECTION_COLORS[collection.color]
  const bookCount = collection.bookSlugs.length
  const updatedLabel = locale.formatRelativeTime(collection.updatedAt)

  return (
    <motion.div
      role="listitem"
      initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
        delay: Math.min(index * 0.04, 0.4),
      }}
      whileHover={reduceMotion ? undefined : { y: -6 }}
      className="group relative h-full"
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`مشاهده پلی‌لیست ${collection.name} با ${locale.toPersianDigits(bookCount)} کتاب`}
        className={cn(
          'block h-full w-full overflow-hidden rounded-2xl border-2 border-border/70 bg-card text-right shadow-md-warm',
          'transition-[transform,opacity,colors,border-color,background-color] duration-300 ease-out-expo',
          tokens.border,
          'hover:shadow-book focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        {/* Colored gradient header bar with centered icon */}
        <div
          className={cn(
            'relative flex h-28 items-center justify-center bg-gradient-to-br',
            tokens.gradient,
          )}
        >
          {/* Decorative diagonal sheen */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/15 to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-sm">
            <CollectionIconGlyph name={collection.icon} className="h-7 w-7" />
          </span>
          {/* Default-collection ribbon */}
          {collection.isDefault && (
            <span className="absolute end-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              پیش‌فرض
            </span>
          )}
          {/* Book-count badge */}
          <span
            className={cn(
              'absolute bottom-2 start-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm',
              'bg-black/40 text-white',
            )}
          >
            <BookMarked className="h-3 w-3" />
            {locale.toPersianDigits(bookCount)} کتاب
          </span>
        </div>

        {/* Meta */}
        <div className="space-y-2 p-4">
          <h3 className="line-clamp-1 text-base font-bold leading-snug transition-colors group-hover:text-primary">
            {collection.name}
          </h3>
          {collection.description ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {collection.description}
            </p>
          ) : (
            <p className="line-clamp-2 text-xs italic leading-relaxed text-muted-foreground">
              بدون توضیحات
            </p>
          )}
          <div className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>به‌روزرسانی {updatedLabel}</span>
          </div>
        </div>
      </button>

      {/* Hover-revealed action buttons — view (ChevronLeft) and delete (Trash2) */}
      <div className="pointer-events-none absolute end-3 top-3 z-10 flex translate-y-1 items-center gap-1.5 opacity-0 transition-[transform,opacity,colors,border-color,background-color] duration-300 ease-out-expo group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpen()
          }}
          aria-label={`مشاهده ${collection.name}`}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-gold-700 shadow-lg backdrop-blur-md transition-colors hover:bg-white dark:bg-gray-900/95 dark:text-gold-300"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {!collection.isDefault && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            aria-label={`حذف ${collection.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-rose-600 shadow-lg backdrop-blur-md transition-colors hover:bg-rose-50 hover:text-rose-700 dark:bg-gray-900/95 dark:text-rose-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// CollectionsGridSkeleton
// ---------------------------------------------------------------------------

function CollectionsGridSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border-2 border-border/70 bg-card"
        >
          <Skeleton className="h-28 w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
      <span className="sr-only">در حال بارگذاری پلی‌لیست‌ها…</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// EmptyCollections — polished first-run state with SVG illustration,
// headline + description, gold-gradient CTA, and three one-tap suggestion
// cards that create a templated collection immediately.
// ---------------------------------------------------------------------------

type SuggestionTemplate = {
  name: string
  description: string
  icon: typeof Heart
  color: CollectionColor
  iconName: CollectionIconName
}

const COLLECTION_SUGGESTIONS: SuggestionTemplate[] = [
  {
    name: 'علاقه‌مندی‌ها',
    description: 'کتاب‌هایی که دوست دارید، برای همیشه نگه دارید.',
    icon: Heart,
    color: 'rose',
    iconName: 'Heart',
  },
  {
    name: 'لیست مطالعه',
    description: 'کتاب‌هایی که قصد خواندنشان را در آینده دارید.',
    icon: Bookmark,
    color: 'gold',
    iconName: 'Bookmark',
  },
  {
    name: 'کتاب‌های کامل شده',
    description: 'افتخارات مطالعاتی‌تان را جشن بگیرید.',
    icon: CheckCircle,
    color: 'emerald',
    iconName: 'CheckCircle',
  },
]

function EmptyCollections({
  onCreate,
  onCreateNamed,
}: {
  onCreate: () => void
  onCreateNamed: (
    name: string,
    description: string,
    color: CollectionColor,
    icon: CollectionIconName,
  ) => void
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl border border-dashed border-border/70 bg-card/40 px-6 py-14 text-center"
    >
      {/* Ambient gold halo — radiates from behind the illustration. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-gold-500/15 blur-3xl"
      />

      {/* Friendly bookshelf SVG illustration with gold/amber/emerald books. */}
      <motion.div
        initial={reduceMotion ? undefined : { scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1],
          delay: 0.1,
        }}
        className="relative"
      >
        <BookshelfIllustration />
      </motion.div>

      {/* Headline + description. */}
      <motion.div
        initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.45,
          ease: [0.16, 1, 0.3, 1],
          delay: 0.18,
        }}
        className="max-w-lg space-y-2"
      >
        <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          پلی‌لیست‌های خود را بسازید
        </h3>
        <p className="mx-auto text-sm leading-relaxed text-muted-foreground sm:text-base">
          کتاب‌های موردعلاقه‌تان را در پلی‌لیست‌های شخصی دسته‌بندی کنید و هر زمان
          که خواستید به آن‌ها دسترسی سریع داشته باشید.
        </p>
      </motion.div>

      {/* Prominent gold-gradient CTA. */}
      <motion.div
        initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.45,
          ease: [0.16, 1, 0.3, 1],
          delay: 0.26,
        }}
      >
        <Button
          variant="glow"
          size="lg"
          onClick={onCreate}
          className="gap-2"
        >
          <Plus className="h-5 w-5" />
          پلی‌لیست جدید بسازید
        </Button>
      </motion.div>

      {/* Three one-tap suggestion cards. */}
      <div
        className="mt-2 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3"
        aria-label="الگوهای پیشنهادی پلی‌لیست"
      >
        {COLLECTION_SUGGESTIONS.map((s, i) => {
          const Icon = s.icon
          const tokens = COLLECTION_COLORS[s.color]
          return (
            <motion.button
              key={s.name}
              type="button"
              onClick={() =>
                onCreateNamed(s.name, s.description, s.color, s.iconName)
              }
              initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.34 + i * 0.08,
              }}
              whileHover={reduceMotion ? undefined : { y: -3 }}
              whileFocus={reduceMotion ? undefined : { y: -3 }}
              aria-label={`ساخت پلی‌لیست «${s.name}» با یک کلیک`}
              className={cn(
                'group flex flex-col items-start gap-3 rounded-2xl border bg-card/60 p-4 text-right transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'hover:bg-gold-500/5',
                tokens.border,
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition-transform group-hover:scale-105',
                  tokens.gradient,
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-bold">{s.name}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {s.description}
                </p>
              </div>
              <span
                aria-hidden="true"
                className="mt-auto inline-flex items-center gap-1 text-[11px] font-medium text-gold-700 dark:text-gold-400"
              >
                <Plus className="h-3 w-3" />
                ساخت سریع
              </span>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

/**
 * BookshelfIllustration — inline SVG of a wooden shelf holding colorful
 * books (gold/amber/emerald/rose spines) with a small reading lamp glow
 * above. Purely decorative; aria-hidden by the caller.
 */
function BookshelfIllustration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 280 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-44 w-72 sm:h-48 sm:w-80"
    >
      <defs>
        {/* Wood-tone gradient for the shelf plank. */}
        <linearGradient
          id="shelf-wood"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor="#a87553" />
          <stop offset="100%" stopColor="#6b4226" />
        </linearGradient>
        {/* Warm gold glow gradient for the lamp aura. */}
        <radialGradient
          id="lamp-glow"
          cx="50%"
          cy="50%"
          r="50%"
        >
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        {/* Book spine gradients — gold, amber, emerald, rose, teal. */}
        <linearGradient id="spine-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="spine-amber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id="spine-emerald" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
        <linearGradient id="spine-rose" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#9f1239" />
        </linearGradient>
        <linearGradient id="spine-teal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#115e59" />
        </linearGradient>
      </defs>

      {/* Soft lamp glow behind the shelf. */}
      <circle cx="60" cy="36" r="62" fill="url(#lamp-glow)" />

      {/* Reading lamp — base + arm + shade. */}
      <g>
        {/* Lamp base. */}
        <ellipse
          cx="58"
          cy="150"
          rx="14"
          ry="3"
          fill="#3f3a32"
        />
        <rect
          x="55"
          y="92"
          width="6"
          height="58"
          rx="3"
          fill="#52473b"
        />
        {/* Articulated arm. */}
        <path
          d="M58 92 L42 60 L60 50"
          stroke="#52473b"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Lamp shade — gold gradient. */}
        <path
          d="M44 36 L78 36 L72 56 L50 56 Z"
          fill="url(#spine-gold)"
          stroke="#92400e"
          strokeWidth="1"
        />
        {/* Lamp bulb glow. */}
        <ellipse cx="61" cy="56" rx="9" ry="3" fill="#fef3c7" opacity="0.85" />
      </g>

      {/* Potted plant on the right of the shelf. */}
      <g>
        {/* Leaves. */}
        <path
          d="M232 132 C222 110 224 96 230 88 C236 96 238 110 232 132 Z"
          fill="#10b981"
        />
        <path
          d="M244 132 C252 112 250 98 244 90 C238 100 236 114 244 132 Z"
          fill="#34d399"
        />
        <path
          d="M238 132 C238 116 238 104 238 96 C238 104 238 116 238 132 Z"
          fill="#059669"
        />
        {/* Pot. */}
        <path
          d="M222 132 L260 132 L256 152 L226 152 Z"
          fill="#a87553"
        />
        <rect x="220" y="130" width="42" height="5" rx="2" fill="#6b4226" />
      </g>

      {/* Shelf plank (wooden). */}
      <rect
        x="10"
        y="148"
        width="260"
        height="10"
        rx="3"
        fill="url(#shelf-wood)"
      />
      <rect
        x="10"
        y="156"
        width="260"
        height="3"
        rx="1.5"
        fill="#3f2818"
        opacity="0.6"
      />

      {/* Books — varied widths, heights, and rotations for a lived-in feel. */}
      {/* Book 1 — tall gold. */}
      <rect x="18" y="68" width="14" height="80" rx="2" fill="url(#spine-gold)" />
      <rect x="20" y="76" width="10" height="2" rx="1" fill="#fff7ed" opacity="0.7" />
      <rect x="20" y="82" width="10" height="2" rx="1" fill="#fff7ed" opacity="0.5" />

      {/* Book 2 — short amber. */}
      <rect x="36" y="88" width="12" height="60" rx="2" fill="url(#spine-amber)" />

      {/* Book 3 — medium emerald, slightly tilted. */}
      <g transform="rotate(-3 56 110)">
        <rect x="50" y="58" width="16" height="90" rx="2" fill="url(#spine-emerald)" />
        <rect x="53" y="70" width="10" height="2" rx="1" fill="#d1fae5" opacity="0.7" />
        <rect x="53" y="76" width="10" height="2" rx="1" fill="#d1fae5" opacity="0.5" />
      </g>

      {/* Book 4 — tall rose. */}
      <rect x="70" y="50" width="14" height="98" rx="2" fill="url(#spine-rose)" />
      <rect x="72" y="60" width="10" height="2" rx="1" fill="#ffe4e6" opacity="0.7" />

      {/* Book 5 — wide gold with title stripe. */}
      <rect x="88" y="74" width="18" height="74" rx="2" fill="url(#spine-gold)" />
      <rect x="91" y="84" width="12" height="2" rx="1" fill="#451a03" opacity="0.55" />
      <rect x="91" y="90" width="12" height="2" rx="1" fill="#451a03" opacity="0.55" />
      <rect x="91" y="96" width="12" height="2" rx="1" fill="#451a03" opacity="0.55" />

      {/* Book 6 — short teal. */}
      <rect x="110" y="92" width="12" height="56" rx="2" fill="url(#spine-teal)" />

      {/* Book 7 — tilted amber leaning right. */}
      <g transform="rotate(6 130 120)">
        <rect x="124" y="64" width="14" height="84" rx="2" fill="url(#spine-amber)" />
        <rect x="127" y="74" width="8" height="2" rx="1" fill="#fff7ed" opacity="0.7" />
      </g>

      {/* Book 8 — medium rose. */}
      <rect x="142" y="78" width="14" height="70" rx="2" fill="url(#spine-rose)" />

      {/* Book 9 — tall emerald with stripes. */}
      <rect x="160" y="56" width="14" height="92" rx="2" fill="url(#spine-emerald)" />
      <rect x="163" y="66" width="8" height="2" rx="1" fill="#ecfdf5" opacity="0.7" />
      <rect x="163" y="72" width="8" height="2" rx="1" fill="#ecfdf5" opacity="0.5" />

      {/* Book 10 — short gold. */}
      <rect x="178" y="90" width="12" height="58" rx="2" fill="url(#spine-gold)" />

      {/* Book 11 — wide amber with title. */}
      <rect x="194" y="70" width="18" height="78" rx="2" fill="url(#spine-amber)" />
      <rect x="197" y="80" width="12" height="2" rx="1" fill="#451a03" opacity="0.55" />
      <rect x="197" y="86" width="12" height="2" rx="1" fill="#451a03" opacity="0.55" />

      {/* Book 12 — medium teal, slightly tilted. */}
      <g transform="rotate(-2 222 110)">
        <rect x="216" y="82" width="12" height="66" rx="2" fill="url(#spine-teal)" />
      </g>

      {/* A small bookmark ribbon hanging from book 4. */}
      <path
        d="M77 148 L77 162 L80 158 L83 162 L83 148 Z"
        fill="#dc2626"
        opacity="0.85"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// CollectionDetailDialog
// ---------------------------------------------------------------------------

function CollectionDetailDialog({
  collection,
  open,
  onOpenChange,
  onAddBook,
  onRemoveBook,
}: {
  collection: Collection | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddBook: () => void
  onRemoveBook: (slug: string) => void
}) {
  const locale = usePersianLocale()
  const reduceMotion = useReducedMotion()
  const [books, setBooks] = useState<BookListItem[]>([])
  // `loadedKey` tracks which collection+slugs combo is currently loaded.
  // `loading` is derived during render — no setLoading(true) in the effect
  // (which would fire react-hooks/set-state-in-effect and cause an extra render).
  const currentKey =
    !open || !collection || collection.bookSlugs.length === 0
      ? null
      : `${collection.id}:${collection.bookSlugs.join(',')}`
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const loading = currentKey !== null && loadedKey !== currentKey
  // When the dialog is closed / collection is empty, show no books.
  const displayBooks = currentKey === null ? [] : books

  useEffect(() => {
    if (currentKey === null) return
    let active = true
    const slugs = collection!.bookSlugs.join(',')
    fetch(`/api/books?slugs=${encodeURIComponent(slugs)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: BookListItem[]) => {
        if (!active) return
        // Preserve collection order
        const order = collection!.bookSlugs
        const sorted = order
          .map((s) => data.find((b) => b.slug === s))
          .filter(Boolean) as BookListItem[]
        setBooks(sorted)
        setLoadedKey(currentKey)
      })
      .catch(() => {
        if (!active) return
        setBooks([])
        setLoadedKey(currentKey)
      })
    return () => {
      active = false
    }
  }, [currentKey, collection])

  if (!collection) return null

  const tokens = COLLECTION_COLORS[collection.color]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-h-[90vh] max-w-4xl overflow-hidden p-0 sm:rounded-2xl">
        {/* Header — gradient bar with icon + name + count */}
        <div
          className={cn(
            'relative flex items-center gap-4 bg-gradient-to-br p-5 text-white',
            tokens.gradient,
          )}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/15 to-white/0"
          />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur-sm">
            <CollectionIconGlyph name={collection.icon} className="h-7 w-7" />
          </span>
          <div className="relative min-w-0 flex-1 space-y-1">
            <h2 className="truncate text-xl font-extrabold leading-tight">
              {collection.name}
            </h2>
            <p className="line-clamp-1 text-xs text-white/80">
              {collection.description || 'بدون توضیحات'} ·{' '}
              {locale.toPersianDigits(collection.bookSlugs.length)} کتاب ·
              به‌روزرسانی {locale.formatRelativeTime(collection.updatedAt)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="بستن"
            className="relative text-white hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-card/60 px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <BookMarked className="h-4 w-4 text-muted-foreground" />
            کتاب‌های این پلی‌لیست
          </div>
          <Button
            variant="glow"
            size="sm"
            onClick={onAddBook}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            افزودن کتاب
          </Button>
        </div>

        {/* Body — book grid */}
        <ScrollArea className="max-h-[60vh]" dir="rtl">
          <div className="p-5">
            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[2/3] w-full rounded-xl" />
                ))}
              </div>
            ) : displayBooks.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <BookMarked className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">هنوز کتابی به این پلی‌لیست اضافه نشده</p>
                  <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                    روی «افزودن کتاب» بزنید تا از کتابخانه انتخاب کنید.
                  </p>
                </div>
                <Button variant="glow" size="sm" onClick={onAddBook} className="gap-2">
                  <Plus className="h-4 w-4" />
                  افزودن اولین کتاب
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4',
                  reduceMotion && '[&>*]:transition-none',
                )}
              >
                <AnimatePresence mode="popLayout">
                  {displayBooks.map((book) => (
                    <motion.div
                      key={book.slug}
                      layout={!reduceMotion}
                      initial={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="group/book relative"
                    >
                      <BookCard book={book} />
                      {/* Remove-from-collection button — bottom overlay */}
                      <button
                        type="button"
                        onClick={() => onRemoveBook(book.slug)}
                        aria-label={`حذف ${book.title} از این پلی‌لیست`}
                        className={cn(
                          'absolute inset-x-0 bottom-0 z-40 flex items-center justify-center gap-1.5',
                          'bg-gradient-to-t from-rose-600/95 to-rose-500/85 py-2 text-xs font-semibold text-white',
                          'translate-y-full transition-transform duration-300 ease-out-expo',
                          'group-hover/book:translate-y-0',
                          'focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        )}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        حذف از پلی‌لیست
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// CreateCollectionDialog
// ---------------------------------------------------------------------------

function CreateCollectionDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (
    name: string,
    description: string,
    color: CollectionColor,
    icon: CollectionIconName,
  ) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState<CollectionColor>('gold')
  const [icon, setIcon] = useState<CollectionIconName>('Bookmark')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Reset form whenever the dialog closes.
  useEffect(() => {
    let t: number | undefined
    if (!open) {
      t = window.setTimeout(() => {
        setName('')
        setDescription('')
        setColor('gold')
        setIcon('Bookmark')
        setError(null)
        setSubmitting(false)
      }, 200)
    }
    return () => {
      if (t !== undefined) window.clearTimeout(t)
    }
  }, [open])

  const submit = async () => {
    setError(null)
    if (!name.trim()) {
      setError('نام پلی‌لیست نمی‌تواند خالی باشد.')
      return
    }
    if (name.trim().length > 60) {
      setError('نام پلی‌لیست نمی‌تواند بیشتر از ۶۰ کاراکتر باشد.')
      return
    }
    setSubmitting(true)
    try {
      // Validate via API first (Persian errors) — then persist via the hook.
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, color, icon }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'ایجاد پلی‌لیست ناموفق بود.')
        setSubmitting(false)
        return
      }
      onCreate(name, description, color, icon)
    } catch {
      // Network error — still call onCreate so the local hook creates it.
      // The user sees a toast either way.
      onCreate(name, description, color, icon)
    } finally {
      setSubmitting(false)
    }
  }

  // Live-preview tokens
  const tokens = COLLECTION_COLORS[color]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0 sm:rounded-2xl">
        {/* Header */}
        <div
          className={cn(
            'relative flex items-center gap-4 bg-gradient-to-br p-5 text-white',
            tokens.gradient,
          )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur-sm">
            <CollectionIconGlyph name={icon} className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-lg font-extrabold leading-tight">
              ایجاد پلی‌لیست جدید
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-white/80">
              قفسه‌ای شخصی برای دسته‌بندی کتاب‌های خود بسازید
            </DialogDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="بستن"
            className="text-white hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-5 p-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="col-name" className="text-sm font-semibold">
              نام پلی‌لیست <span className="text-rose-500">*</span>
            </label>
            <Input
              id="col-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: کلاسیک‌های ادبیات"
              maxLength={60}
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">
              {name.length} / ۶۰
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="col-desc" className="text-sm font-semibold">
              توضیحات (اختیاری)
            </label>
            <Textarea
              id="col-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="یک توضیح کوتاه درباره این پلی‌لیست..."
              maxLength={240}
              rows={3}
            />
            <p className="text-[11px] text-muted-foreground">
              {description.length} / ۲۴۰
            </p>
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">رنگ پلی‌لیست</label>
            <div className="flex flex-wrap gap-2.5">
              {COLLECTION_COLOR_LIST.map((c) => {
                const t = COLLECTION_COLORS[c]
                const selected = c === color
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`رنگ ${t.label}`}
                    aria-pressed={selected}
                    title={t.label}
                    className={cn(
                      'relative h-10 w-10 rounded-full ring-2 ring-offset-2 ring-offset-background transition-[transform,opacity,colors,border-color,background-color]',
                      t.swatch,
                      selected
                        ? 'ring-foreground scale-110'
                        : 'ring-transparent hover:scale-105',
                    )}
                  >
                    {selected && (
                      <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Icon picker */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">نماد پلی‌لیست</label>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {COLLECTION_ICON_LIST.map((name) => {
                const selected = name === icon
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setIcon(name)}
                    aria-label={`نماد ${COLLECTION_ICON_LABELS[name]}`}
                    aria-pressed={selected}
                    title={COLLECTION_ICON_LABELS[name]}
                    className={cn(
                      'flex aspect-square items-center justify-center rounded-xl border-2 transition-[transform,opacity,colors,border-color,background-color]',
                      selected
                        ? cn('border-transparent bg-gradient-to-br text-white', tokens.gradient)
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
                    )}
                  >
                    <CollectionIconGlyph name={name} className="h-5 w-5" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-border/60 px-5 py-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            انصراف
          </Button>
          <Button
            variant="glow"
            onClick={submit}
            disabled={submitting || !name.trim()}
            className="gap-2"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                در حال ایجاد...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                ایجاد پلی‌لیست
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// BookPickerDialog — lets the user pick a book to add to a collection
// ---------------------------------------------------------------------------

function BookPickerDialog({
  open,
  onOpenChange,
  onPick,
  existingSlugs,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (slug: string) => void
  existingSlugs: string[]
}) {
  const [books, setBooks] = useState<BookListItem[]>([])
  // `loadedOpen` tracks whether we've fetched the book list for the current
  // `open=true` cycle. `loading` is derived during render — no setLoading(true)
  // in the effect body (avoids react-hooks/set-state-in-effect).
  const [loadedOpen, setLoadedOpen] = useState(false)
  const loading = open && !loadedOpen
  const [query, setQuery] = useState('')
  const locale = usePersianLocale()

  useEffect(() => {
    if (!open) return
    let active = true
    fetch('/api/books?limit=100')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: BookListItem[]) => {
        if (!active) return
        setBooks(data)
        setLoadedOpen(true)
      })
      .catch(() => {
        if (!active) return
        setBooks([])
        setLoadedOpen(true)
      })
    return () => {
      active = false
    }
  }, [open])

  // When the dialog is closed, show no books and ignore the query input.
  // The filtered list is computed inside useMemo below (stable deps).

  const filtered = useMemo(() => {
    if (!open) return []
    const q = query.trim().toLowerCase()
    if (!q) return books
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.genres.some((g) => g.toLowerCase().includes(q)),
    )
  }, [open, books, query])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="border-b border-border/60 p-5">
          <DialogTitle className="flex items-center gap-2 text-lg font-extrabold">
            <Plus className="h-5 w-5 text-primary" />
            افزودن کتاب به پلی‌لیست
          </DialogTitle>
          <DialogDescription className="text-xs">
            یک کتاب از فهرست زیر انتخاب کنید. کتاب‌های قبلاً اضافه‌شده با علامت{' '}
            <Check className="inline h-3 w-3" /> نمایش داده می‌شوند.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-border/60 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی کتاب یا نویسنده..."
              className="ps-9"
              aria-label="جستجوی کتاب برای افزودن به پلی‌لیست"
            />
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]" dir="rtl">
          <div className="p-3">
            {loading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Search className="h-10 w-10 text-muted-foreground" />
                <p className="font-semibold">کتابی یافت نشد</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  عبارت دیگری را امتحان کنید یا{' '}
                  <Link href="/library" className="text-primary underline-offset-2 hover:underline">
                    از کتابخانه کامل مرور کنید
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <ul role="list" className="space-y-1.5">
                {filtered.map((b) => {
                  const inCollection = existingSlugs.includes(b.slug)
                  return (
                    <li key={b.slug}>
                      <button
                        type="button"
                        onClick={() => onPick(b.slug)}
                        disabled={inCollection}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border p-2.5 text-right transition-colors',
                          inCollection
                            ? 'cursor-default border-emerald-500/30 bg-emerald-500/5'
                            : 'border-border bg-card hover:border-primary/40 hover:bg-accent',
                        )}
                      >
                        {/* Mini cover */}
                        <span
                          className="flex h-12 w-9 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                          style={{
                            background: `linear-gradient(135deg, ${b.coverFrom}, ${b.coverTo})`,
                          }}
                          aria-hidden="true"
                        >
                          {b.title.slice(0, 1)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold" dir="ltr">
                            {b.title}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {b.author}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          <Badge
                            variant="secondary"
                            className="bg-muted text-[10px] text-muted-foreground"
                          >
                            {b.level}
                          </Badge>
                          {inCollection ? (
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              <Check className="h-4 w-4" />
                            </span>
                          ) : (
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Plus className="h-4 w-4" />
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t border-border/60 px-5 py-3">
          <span className="me-auto text-xs text-muted-foreground">
            {locale.toPersianDigits(filtered.length)} کتاب نمایش داده شد
          </span>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            بستن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
