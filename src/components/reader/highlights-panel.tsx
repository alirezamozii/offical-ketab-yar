'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Copy,
  Download,
  FileText,
  Highlighter,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Highlight, ReaderTheme } from '@/lib/reader/types'
import {
  HIGHLIGHT_COLORS,
  HIGHLIGHT_LABELS,
  THEME_STYLES,
  toPersianDigits,
} from '@/lib/reader/types'

interface HighlightsPanelProps {
  highlights: Highlight[]
  currentPage: number
  theme: ReaderTheme
  /** ID of the highlight whose inline note editor is open (or null). */
  editingHighlightId: string | null
  /** Open the inline note editor for a highlight. */
  onEditNote: (id: string | null) => void
  /** Persist a (possibly empty) note on a highlight. */
  onSaveNote: (id: string, note: string) => void
  open: boolean
  onClose: () => void
  onDelete: (id: string) => void
  onClearAll: () => void
  onCopy: (text: string) => void
  onJumpToPage: (page: number) => void
}

const COLOR_FILTERS: Highlight['color'][] = [
  'yellow',
  'orange',
  'gold',
  'green',
  'pink',
  'blue',
]

export function HighlightsPanel({
  highlights,
  currentPage,
  theme,
  editingHighlightId,
  onEditNote,
  onSaveNote,
  open,
  onClose,
  onDelete,
  onClearAll,
  onCopy,
  onJumpToPage,
}: HighlightsPanelProps) {
  const s = THEME_STYLES[theme]
  const [query, setQuery] = useState('')
  const [activeColor, setActiveColor] = useState<Highlight['color'] | null>(
    null,
  )
  const [draftNote, setDraftNote] = useState('')

  const sorted = useMemo(
    () => [...highlights].sort((a, b) => b.timestamp - a.timestamp),
    [highlights],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sorted.filter((h) => {
      if (activeColor && h.color !== activeColor) return false
      if (!q) return true
      return (
        h.text.toLowerCase().includes(q) ||
        (h.note ?? '').toLowerCase().includes(q)
      )
    })
  }, [sorted, query, activeColor])

  const handleExport = (format: 'text' | 'json') => {
    if (highlights.length === 0) return
    let blob: Blob
    let filename: string
    if (format === 'json') {
      blob = new Blob([JSON.stringify(highlights, null, 2)], {
        type: 'application/json',
      })
      filename = 'highlights.json'
    } else {
      const lines = highlights.map(
        (h) =>
          `• [${HIGHLIGHT_LABELS[h.color]}] صفحه ${h.page + 1}\n  ${h.text}${
            h.note ? `\n  یادداشت: ${h.note}` : ''
          }`,
      )
      blob = new Blob([lines.join('\n\n')], { type: 'text/plain' })
      filename = 'highlights.txt'
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="gap-0 border-s-2 p-0 sm:max-w-md"
        style={{ background: s.bg, color: s.text, borderColor: s.border }}
      >
        <SheetTitle className="sr-only">هایلایت‌ها</SheetTitle>
        <SheetDescription className="sr-only">
          فهرست متن‌های هایلایت‌شده با یادداشت‌ها — برای پرش به متن اصلی روی هر آیتم کلیک کنید.
        </SheetDescription>

        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between border-b px-5 py-4"
          style={{ borderColor: s.border }}
        >
          <div className="flex items-center gap-2">
            <Highlighter className="h-5 w-5" style={{ color: s.accent }} />
            <h2 className="text-lg font-bold" aria-hidden>هایلایت‌ها</h2>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-bold"
              style={{ background: s.accent + '22', color: s.accent }}
            >
              {toPersianDigits(highlights.length)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              onClick={() => handleExport('text')}
              aria-label="صادرات متنی"
              title="صادرات متنی"
              disabled={highlights.length === 0}
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              onClick={() => handleExport('json')}
              aria-label="صادرات JSON"
              title="صادرات JSON"
              disabled={highlights.length === 0}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="بستن"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* ---- Search + color filter ---- */}
        <div
          className="flex shrink-0 flex-col gap-2 border-b px-4 py-3"
          style={{ borderColor: s.border }}
        >
          <div className="relative">
            <Search
              className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجو در هایلایت‌ها…"
              className="ps-8"
              aria-label="جستجو در هایلایت‌ها"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveColor(null)}
              className="rounded-full px-2 py-1 text-[11px] font-bold transition-colors tap-target"
              style={
                activeColor === null
                  ? { background: s.accent + '22', color: s.accent }
                  : { color: s.muted }
              }
              aria-pressed={activeColor === null}
            >
              همه
            </button>
            {COLOR_FILTERS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveColor((prev) => (prev === c ? null : c))}
                className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] transition-transform hover:scale-105 tap-target"
                style={{
                  background:
                    activeColor === c ? HIGHLIGHT_COLORS[c] : 'transparent',
                  border: `1px solid ${HIGHLIGHT_COLORS[c]}`,
                }}
                aria-pressed={activeColor === c}
                aria-label={`فیلتر رنگ ${HIGHLIGHT_LABELS[c]}`}
                title={HIGHLIGHT_LABELS[c]}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: HIGHLIGHT_COLORS[c] }}
                />
              </button>
            ))}
          </div>
        </div>

        <div
          className="flex-1 space-y-3 overflow-y-auto scroll-warm px-4 py-4 pb-safe"
          style={{ maxHeight: 'calc(100dvh - 16rem)' }}
        >
          {filtered.length === 0 && (
            <div className="py-12 text-center opacity-60">
              <Highlighter className="mx-auto mb-3 h-10 w-10 opacity-50" />
              <p className="text-sm">
                {highlights.length === 0
                  ? 'هنوز هایلایتی ثبت نشده.'
                  : 'نتیجه‌ای یافت نشد.'}
              </p>
              <p className="mt-1 text-xs opacity-70">
                {highlights.length === 0
                  ? 'متنی را انتخاب کنید و رنگ هایلایت را بزنید.'
                  : 'عبارت یا رنگ دیگری را امتحان کنید.'}
              </p>
            </div>
          )}

          {filtered.map((h) => {
            const isEditing = editingHighlightId === h.id
            return (
              <div
                key={h.id}
                className="rounded-xl border p-3 shadow-sm transition-colors"
                style={{
                  borderColor: s.border,
                  background:
                    h.page === currentPage ? s.accent + '12' : 'transparent',
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium opacity-70">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: HIGHLIGHT_COLORS[h.color] }}
                    />
                    صفحه {toPersianDigits(h.page + 1)}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11"
                      onClick={() => {
                        if (isEditing) {
                          onSaveNote(h.id, draftNote)
                          onEditNote(null)
                        } else {
                          setDraftNote(h.note ?? '')
                          onEditNote(h.id)
                        }
                      }}
                      aria-label={
                        isEditing ? 'ذخیره یادداشت' : 'افزودن یادداشت'
                      }
                      title={isEditing ? 'ذخیره یادداشت' : 'یادداشت'}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11"
                      onClick={() => onCopy(h.text)}
                      aria-label="کپی"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 text-red-500 hover:text-red-600"
                      onClick={() => onDelete(h.id)}
                      aria-label="حذف"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <button
                  onClick={() => onJumpToPage(h.page)}
                  className="line-clamp-3 text-end text-sm leading-relaxed transition-opacity hover:opacity-80"
                  dir="auto"
                >
                  {h.text}
                </button>

                {/* ---- Existing note (read view) ---- */}
                {h.note && !isEditing && (
                  <div
                    className="mt-2 rounded-lg border px-2.5 py-1.5 text-xs leading-relaxed opacity-80"
                    style={{
                      borderColor: s.border,
                      background: s.accent + '0e',
                    }}
                    dir="auto"
                  >
                    <span
                      className="mb-0.5 block text-[10px] font-bold opacity-60"
                    >
                      یادداشت
                    </span>
                    {h.note}
                  </div>
                )}

                {/* ---- Inline note editor ---- */}
                <AnimatePresence initial={false}>
                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <textarea
                        value={draftNote}
                        onChange={(e) => setDraftNote(e.target.value)}
                        placeholder="یادداشت خود را بنویسید…"
                        dir="auto"
                        rows={2}
                        className="mt-2 w-full resize-none rounded-lg border bg-transparent px-2.5 py-1.5 text-xs leading-relaxed outline-none focus-visible:ring-1"
                        style={{ borderColor: s.border }}
                        aria-label="ویرایش یادداشت"
                      />
                      <div className="mt-1 flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 px-2 text-xs"
                          onClick={() => {
                            onEditNote(null)
                          }}
                        >
                          لغو
                        </Button>
                        <Button
                          size="sm"
                          className="h-9 px-3 text-xs"
                          style={{
                            background: s.accent,
                            color: '#fff',
                          }}
                          onClick={() => {
                            onSaveNote(h.id, draftNote)
                            onEditNote(null)
                          }}
                        >
                          ذخیره
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        {/* ---- Footer: clear-all ---- */}
        {highlights.length > 0 && (
          <div
            className="flex shrink-0 items-center justify-between border-t px-4 py-3"
            style={{ borderColor: s.border }}
          >
            <span className="text-[11px] opacity-60">
              {toPersianDigits(highlights.length)} هایلایت
            </span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-1.5 px-2 text-xs text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  حذف همه
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>حذف همه هایلایت‌ها؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    این عمل قابل بازگشت نیست. همهٔ هایلایت‌ها و یادداشت‌های این
                    کتاب پاک خواهد شد.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onClearAll}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    حذف همه
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
