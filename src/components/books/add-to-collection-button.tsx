'use client'

/**
 * AddToCollectionButton — dropdown that lets the user add/remove the current
 * book to/from any of their collections, and create a brand-new collection
 * on the fly.
 *
 * Used on:
 *   • Book detail page (next to the favorite + share buttons).
 *   • BookCard hover preview.
 *
 * Behavior:
 *   • Dropdown lists every collection with a checkmark if the book is in it.
 *   • Clicking a collection toggles membership (add or remove).
 *   • A "پلی‌لیست جدید" item at the bottom opens a lightweight create dialog.
 *   • Toast feedback on every action.
 *   • Cross-tab and server sync handled via useCollections hook.
 *
 * Color discipline: gold/amber/emerald/rose/stone/teal — zero indigo/blue.
 */

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  COLLECTION_COLORS,
  COLLECTION_COLOR_LIST,
  COLLECTION_ICON_LABELS,
  COLLECTION_ICON_LIST,
  CollectionIcon as CollectionIconComp,
  useCollections,
  type CollectionColor,
  type CollectionIconName,
} from '@/lib/collections-client'
import { cn } from '@/lib/utils'
import { Check, Library, Plus, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface AddToCollectionButtonProps {
  bookSlug: string
  /** Optional — shown in toast feedback ("X به پلی‌لیست Y اضافه شد"). */
  bookTitle?: string
  /** Visual variant — `icon` (default, for cards) or `compact` (text + icon, for detail page). */
  variant?: 'icon' | 'compact'
  className?: string
  /** Disable stop-propagation (when used outside a Link wrapper). */
  bare?: boolean
}

export function AddToCollectionButton({
  bookSlug,
  bookTitle,
  variant = 'icon',
  className,
  bare = false,
}: AddToCollectionButtonProps) {
  const { collections, loaded, addBook, removeBook, isBookIn, create } =
    useCollections()
  const [createOpen, setCreateOpen] = useState(false)
  const [open, setOpen] = useState(false)

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!bare) {
        e.stopPropagation()
      }
    },
    [bare],
  )

  const handleToggle = useCallback(
    (collectionId: string, name: string) => {
      const inCollection = isBookIn(collectionId, bookSlug)
      if (inCollection) {
        removeBook(collectionId, bookSlug)
        toast.success(`از پلی‌لیست «${name}» حذف شد.`)
      } else {
        addBook(collectionId, bookSlug)
        toast.success(`به پلی‌لیست «${name}» اضافه شد.`)
      }
    },
    [addBook, removeBook, isBookIn, bookSlug],
  )

  const memberCount = collections.filter((c) =>
    c.bookSlugs.includes(bookSlug),
  ).length

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          {variant === 'icon' ? (
            <button
              type="button"
              onClick={handleClick}
              aria-label={`افزودن به پلی‌لیست${memberCount > 0 ? ` (${memberCount} پلی‌لیست)` : ''}`}
              aria-haspopup="menu"
              aria-expanded={open}
              className={cn(
                'relative flex items-center justify-center rounded-full border border-white/20 bg-white/95 text-gold-700 shadow-lg backdrop-blur-md transition-colors hover:bg-white dark:bg-gray-900/95 dark:text-gold-400',
                'h-11 w-11',
                className,
              )}
            >
              <Library className="h-4 w-4" />
              {memberCount > 0 && (
                <span
                  className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-600 px-1 text-[9px] font-bold text-white"
                  aria-hidden="true"
                >
                  {memberCount}
                </span>
              )}
            </button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={handleClick}
              aria-label={`افزودن به پلی‌لیست${memberCount > 0 ? ` (${memberCount} پلی‌لیست)` : ''}`}
              aria-haspopup="menu"
              aria-expanded={open}
              className={cn('gap-2', className)}
            >
              <Library className="h-4 w-4" />
              <span>پلی‌لیست</span>
              {memberCount > 0 && (
                <span className="rounded-full bg-gold-500/20 px-1.5 text-[11px] font-bold text-gold-700 dark:text-gold-300">
                  {memberCount}
                </span>
              )}
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="w-64 max-w-[85vw] p-1.5"
        >
          <DropdownMenuLabel className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs text-muted-foreground">
            <span>افزودن به پلی‌لیست</span>
            {bookTitle && (
              <span className="max-w-[120px] truncate text-[10px]" dir="ltr" title={bookTitle}>
                {bookTitle}
              </span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!loaded ? (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              در حال بارگذاری...
            </div>
          ) : collections.length === 0 ? (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              هنوز پلی‌لیستی وجود ندارد.
            </div>
          ) : (
            <div role="group" aria-label="پلی‌لیست‌ها" className="max-h-60 overflow-y-auto">
              {collections.map((c) => {
                const tokens = COLLECTION_COLORS[c.color]
                const inCollection = c.bookSlugs.includes(bookSlug)
                return (
                  <DropdownMenuItem
                    key={c.id}
                    onSelect={(e) => {
                      e.preventDefault()
                      handleToggle(c.id, c.name)
                    }}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-accent"
                    aria-pressed={inCollection}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-xs',
                          tokens.gradient,
                        )}
                      >
                        <CollectionIconComp name={c.icon} className="h-4 w-4" />
                      </span>
                      <span className="truncate text-sm font-medium">{c.name}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {c.bookSlugs.length}
                      </span>
                      <div
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-md border transition-all',
                          inCollection
                            ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                            : 'border-muted-foreground/30 bg-transparent',
                        )}
                      >
                        {inCollection && <Check className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </div>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              setOpen(false)
              setTimeout(() => {
                setCreateOpen(true)
              }, 80)
            }}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 font-medium text-primary hover:bg-primary/10 focus:text-primary"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-primary/50 text-primary">
              <Plus className="h-4 w-4" />
            </span>
            <span className="flex-1 text-sm font-semibold">پلی‌لیست جدید</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateInlineDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={(name, _description, color, icon) => {
          const c = create(name, _description, color, icon)
          if (c) {
            // Auto-add the current book to the freshly-created collection.
            addBook(c.id, bookSlug)
            toast.success(`پلی‌لیست «${c.name}» ایجاد شد و کتاب به آن اضافه شد.`)
            setCreateOpen(false)
          } else {
            toast.error('ایجاد پلی‌لیست ناموفق بود.')
          }
        }}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// CreateInlineDialog — minimal create dialog (name + color + icon) used by
// the inline "پلی‌لیست جدید" action.
// ---------------------------------------------------------------------------

function CreateInlineDialog({
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
  const [color, setColor] = useState<CollectionColor>('gold')
  const [icon, setIcon] = useState<CollectionIconName>('Bookmark')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let t: number | undefined
    if (!open) {
      t = window.setTimeout(() => {
        setName('')
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

  const tokens = COLLECTION_COLORS[color]

  const submit = () => {
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setError('نام پلی‌لیست نمی‌تواند خالی باشد.')
      return
    }
    if (trimmed.length > 60) {
      setError('نام پلی‌لیست نمی‌تواند بیشتر از ۶۰ کاراکتر باشد.')
      return
    }
    setSubmitting(true)
    try {
      onCreate(trimmed, '', color, icon)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ایجاد پلی‌لیست ناموفق بود.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-md gap-0 p-0 overflow-hidden rounded-3xl border shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>پلی‌لیست جدید</DialogTitle>
          <DialogDescription>ایجاد یک پلی‌لیست جدید برای کتاب‌ها</DialogDescription>
        </DialogHeader>

        {/* Header Banner */}
        <div
          className={cn(
            'relative flex items-center justify-between gap-4 bg-gradient-to-br p-5 text-white shadow-sm',
            tokens.gradient,
          )}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/40 shadow-inner backdrop-blur-md">
              <CollectionIconComp name={icon} className="h-6 w-6 text-white" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold leading-tight text-white drop-shadow-xs">
                پلی‌لیست جدید
              </h3>
              <p className="mt-0.5 text-xs text-white/85 truncate">
                {name.trim() || 'نام پلی‌لیست را وارد کنید'}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="بستن"
            className="h-8 w-8 rounded-full text-white/90 hover:bg-white/20 hover:text-white shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 p-5">
          <div className="space-y-1.5">
            <label htmlFor="col-inline-name" className="text-xs font-bold text-foreground/90">
              نام پلی‌لیست <span className="text-rose-500">*</span>
            </label>
            <Input
              id="col-inline-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: فانتزی محبوب من"
              maxLength={60}
              autoFocus
              className="rounded-xl"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !submitting) submit()
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground/90">رنگ اختصاصی</label>
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
                      'relative h-8 w-8 rounded-full transition-transform active:scale-95',
                      t.swatch,
                      selected
                        ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110 shadow-md'
                        : 'opacity-85 hover:opacity-100 hover:scale-105',
                    )}
                  >
                    {selected && (
                      <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-md stroke-[3]" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground/90">نماد پلی‌لیست</label>
            <div className="grid grid-cols-8 gap-2">
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
                      'flex aspect-square items-center justify-center rounded-xl border transition-all active:scale-90',
                      selected
                        ? cn('border-transparent bg-gradient-to-br text-white shadow-sm ring-2 ring-primary/40', tokens.gradient)
                        : 'border-border/60 bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/70',
                    )}
                  >
                    <CollectionIconComp name={name} className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-rose-600 dark:text-rose-400 font-medium">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted/20 px-5 py-3.5 gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="rounded-xl">
            انصراف
          </Button>
          <Button
            variant="glow"
            onClick={submit}
            disabled={submitting || !name.trim()}
            className="gap-2 rounded-xl"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                در حال ایجاد...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                ایجاد و افزودن
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
