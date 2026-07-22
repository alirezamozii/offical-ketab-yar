'use client'

import { SrsDots } from '@/components/vocabulary/srs-dots'
import {
  useVocabMeta,
  DIFFICULTY_LEVELS,
  difficultyLabel,
  difficultyColor,
  categoryColorClass,
  type VocabCategory,
} from '@/components/vocabulary/use-vocab-meta'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  boxIntervalLabel,
  boxLabel,
  masteryFor,
  masteryLabel,
  useSrs,
  type SrsBox,
} from '@/hooks/reader/use-srs'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { useTTS } from '@/hooks/use-tts'
import { AudioWaveBars } from '@/components/reader/audio-wave-bars'
import {
  BookMarked,
  Check,
  ChevronDown,
  Clock,
  FolderPlus,
  Gauge,
  Loader2,
  Plus,
  Pencil,
  RotateCw,
  Sparkles,
  Square,
  SquareAsterisk,
  Volume2,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface VocabWord {
  id: string
  word: string
  definition: string
  translation: string
  context: string
  bookSlug: string
  createdAt: string
}

interface BookInfo {
  slug: string
  title: string
  author: string
}

export function WordDetailDialog({
  word,
  open,
  onOpenChange,
  onReset,
  onSaved, // fired after a successful PATCH so the parent list can refresh
}: {
  word: VocabWord | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onReset?: (id: string) => void
  onSaved?: (w: VocabWord) => void
}) {
  const srs = useSrs()
  const { toPersianDigits } = usePersianLocale()
  const tts = useTTS()
  const [book, setBook] = useState<BookInfo | null>(null)
  const [editing, setEditing] = useState(false)
  const [editTranslation, setEditTranslation] = useState('')
  const [editDefinition, setEditDefinition] = useState('')
  const [saving, setSaving] = useState(false)
  const [newSynonym, setNewSynonym] = useState('')
  const [newAntonym, setNewAntonym] = useState('')
  const [newCategory, setNewCategory] = useState('')

  // useVocabMeta with the current word's bookSlug so system book-categories
  // appear automatically. We pass just the one word to keep the auto-derive
  // list small.
  const meta = useVocabMeta(word ? [word] : undefined)

  // Fetch book title when word changes (if it has a bookSlug).
  useEffect(() => {
    if (!word?.bookSlug) {
      setBook(null)
      return
    }
    let cancelled = false
    fetch(`/api/books?slugs=${encodeURIComponent(word.bookSlug)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((arr: BookInfo[]) => {
        if (cancelled) return
        const b = arr[0] ?? null
        setBook(b)
        if (b) meta.ensureBookCategory(word.bookSlug, b.title)
      })
      .catch(() => !cancelled && setBook(null))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `meta` is intentionally omitted: we only refetch when `word.bookSlug` changes; `meta.ensureBookCategory` is a stable callback.
  }, [word?.bookSlug])

  // Reset TTS playback + editing state when the dialog closes / word changes.
  useEffect(() => {
    if (!open) {
      setEditing(false)
      setNewSynonym('')
      setNewAntonym('')
      setNewCategory('')
      tts.stop()
    }
  }, [open, tts])

  // Sync the edit fields when entering edit mode.
  useEffect(() => {
    if (editing && word) {
      setEditTranslation(word.translation || '')
      setEditDefinition(word.definition || '')
    }
  }, [editing, word])

  if (!word) return null
  const status = srs.getStatus(word.id)
  const box = status.box as SrsBox
  const mastery = masteryFor(box)
  const wordMeta = meta.getMeta(word.id)
  const wordCategories = meta.categoriesFor(word.id)

  // High-quality TTS pronunciation (via /api/tts using z-ai-web-dev-sdk).
  // Falls back to the browser's speechSynthesis for the "slow" variant
  // since the upstream TTS route doesn't expose a per-call speed dial here.
  const speakTTS = () => {
    if (!word) return
    if (tts.isPlaying || tts.isPaused) {
      tts.stop()
      return
    }
    try {
      window.speechSynthesis?.cancel()
    } catch {}
    void tts.speak(word.word, 'en')
  }

  // Slowed-down pronunciation using the built-in SpeechSynthesis API.
  // Stops any TTS playback first so the two don't overlap.
  function speakSlow(rate: number = 0.6) {
    if (!word) return
    tts.stop()
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(word.word)
      u.lang = 'en-US'
      u.rate = rate
      window.speechSynthesis.speak(u)
    } catch {}
  }

  async function saveEdit() {
    if (!word) return
    setSaving(true)
    try {
      const res = await fetch('/api/vocabulary', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: word.id,
          translation: editTranslation.trim(),
          definition: editDefinition.trim(),
        }),
      })
      if (!res.ok) throw new Error('save failed')
      const updated: VocabWord = await res.json()
      toast.success('تغییرات ذخیره شد')
      setEditing(false)
      onSaved?.(updated)
    } catch {
      toast.error('خطا در ذخیره تغییرات')
    } finally {
      setSaving(false)
    }
  }

  function addSynonym() {
    if (!word) return
    const v = newSynonym.trim()
    if (!v) return
    const cur = wordMeta.synonyms ?? []
    if (cur.includes(v)) {
      setNewSynonym('')
      return
    }
    meta.setMeta(word.id, { synonyms: [...cur, v] })
    setNewSynonym('')
  }

  function removeSynonym(v: string) {
    if (!word) return
    const cur = wordMeta.synonyms ?? []
    meta.setMeta(word.id, { synonyms: cur.filter((s) => s !== v) })
  }

  function addAntonym() {
    if (!word) return
    const v = newAntonym.trim()
    if (!v) return
    const cur = wordMeta.antonyms ?? []
    if (cur.includes(v)) {
      setNewAntonym('')
      return
    }
    meta.setMeta(word.id, { antonyms: [...cur, v] })
    setNewAntonym('')
  }

  function removeAntonym(v: string) {
    if (!word) return
    const cur = wordMeta.antonyms ?? []
    meta.setMeta(word.id, { antonyms: cur.filter((s) => s !== v) })
  }

  function createCategoryFromDialog() {
    if (!word) return
    const label = newCategory.trim()
    if (!label) return
    const id = meta.createCategory(label)
    meta.addToCategory(word.id, id)
    setNewCategory('')
    toast.success(`دسته «${label}» ساخته شد`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">جزئیات واژه</DialogTitle>
          <DialogDescription className="sr-only">
            مشاهده کامل جزئیات این واژه
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Header: word + audio + mastery chip */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={speakTTS}
                  className={cn(
                    'relative flex h-11 w-11 items-center justify-center rounded-full bg-gold-500/15 text-gold-700 transition-transform hover:scale-110 dark:text-gold-400',
                    (tts.isPlaying || tts.isLoading) &&
                      'ring-2 ring-gold-400/50 ring-offset-2 ring-offset-background',
                  )}
                  aria-label={
                    tts.isPlaying
                      ? 'توقف تلفظ'
                      : tts.isLoading
                        ? 'در حال آماده‌سازی تلفظ'
                        : 'تلفظ کلمه'
                  }
                  aria-pressed={tts.isPlaying}
                >
                  {tts.isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : tts.isPlaying ? (
                    <>
                      <Square className="h-4 w-4" />
                      <span className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2">
                        <AudioWaveBars count={3} className="h-3" />
                      </span>
                    </>
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => speakSlow(0.6)}
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                  aria-label="تلفظ آهسته"
                  disabled={tts.isLoading}
                >
                  آهسته
                </button>
              </div>
              <div>
                <h2 className="text-3xl font-extrabold leading-none" dir="ltr">
                  {word.word}
                </h2>
                {word.translation && !editing && (
                  <p className="mt-1 font-medium text-muted-foreground">
                    {word.translation}
                  </p>
                )}
                <Badge
                  variant="secondary"
                  className={cn(
                    'mt-1.5 gap-1 text-[10px]',
                    mastery === 'mastered' &&
                      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
                    mastery === 'familiar' &&
                      'bg-gold-500/15 text-gold-700 dark:text-gold-300',
                    mastery === 'learning' &&
                      'bg-amber-500/15 text-amber-700 dark:text-amber-300',
                    mastery === 'new' && 'bg-muted text-muted-foreground',
                  )}
                >
                  {masteryLabel(mastery)}
                </Badge>
              </div>
            </div>
            <SrsDots box={box} size="md" />
          </div>

          {/* Inline edit toggle / save bar */}
          {!editing ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3 w-3" />
              ویرایش معنی / ترجمه
            </Button>
          ) : (
            <div className="space-y-3 rounded-xl border border-border bg-card p-3">
              <div className="space-y-1">
                <Label htmlFor="edit-translation" className="text-xs">
                  ترجمه فارسی
                </Label>
                <Input
                  id="edit-translation"
                  value={editTranslation}
                  onChange={(e) => setEditTranslation(e.target.value)}
                  placeholder="ترجمه فارسی..."
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-definition" className="text-xs">
                  تعریف انگلیسی
                </Label>
                <Input
                  id="edit-definition"
                  value={editDefinition}
                  onChange={(e) => setEditDefinition(e.target.value)}
                  placeholder="English definition..."
                  dir="ltr"
                  className="h-9"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  لغو
                </Button>
                <Button
                  size="sm"
                  variant="glow"
                  className="h-8"
                  onClick={saveEdit}
                  disabled={saving}
                >
                  {saving ? 'در حال ذخیره...' : 'ذخیره'}
                  {!saving && <Check className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          )}

          {/* Definition */}
          {(word.definition || editing) && !editing && (
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Definition
              </p>
              <p className="text-sm leading-relaxed" dir="ltr">
                {word.definition}
              </p>
            </div>
          )}

          {/* Example in book (context) */}
          {word.context && !editing && (
            <div className="rounded-xl border-s-4 border-gold-400 bg-gold-500/5 p-3">
              <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <SquareAsterisk className="h-3 w-3" />
                نمونه در کتاب
              </p>
              <p className="text-sm italic leading-relaxed" dir="ltr">
                “{word.context}”
              </p>
            </div>
          )}

          {/* Synonyms */}
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              مترادف‌ها
            </p>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {(wordMeta.synonyms ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  هنوز مترادفی اضافه نشده.
                </p>
              ) : (
                (wordMeta.synonyms ?? []).map((s) => (
                  <Badge
                    key={s}
                    variant="secondary"
                    className="gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  >
                    <span dir="ltr">{s}</span>
                    <button
                      onClick={() => removeSynonym(s)}
                      aria-label={`حذف مترادف ${s}`}
                      className="hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSynonym}
                onChange={(e) => setNewSynonym(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSynonym()}
                placeholder="افزودن مترادف..."
                dir="ltr"
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0 px-2"
                onClick={addSynonym}
                disabled={!newSynonym.trim()}
                aria-label="افزودن مترادف"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Antonyms */}
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              متضادها
            </p>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {(wordMeta.antonyms ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  هنوز متضادی اضافه نشده.
                </p>
              ) : (
                (wordMeta.antonyms ?? []).map((s) => (
                  <Badge
                    key={s}
                    variant="secondary"
                    className="gap-1 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                  >
                    <span dir="ltr">{s}</span>
                    <button
                      onClick={() => removeAntonym(s)}
                      aria-label={`حذف متضاد ${s}`}
                      className="hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newAntonym}
                onChange={(e) => setNewAntonym(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addAntonym()}
                placeholder="افزودن متضاد..."
                dir="ltr"
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0 px-2"
                onClick={addAntonym}
                disabled={!newAntonym.trim()}
                aria-label="افزودن متضاد"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Difficulty + Category row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Difficulty selector */}
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Gauge className="h-3 w-3" />
                سطح دشواری
              </p>
              <div className="flex flex-wrap gap-1">
                {DIFFICULTY_LEVELS.map((lvl) => {
                  const active = wordMeta.difficulty === lvl
                  return (
                    <button
                      key={lvl}
                      onClick={() =>
                        meta.setMeta(word.id, {
                          difficulty: active ? undefined : lvl,
                        })
                      }
                      aria-pressed={active}
                      aria-label={`سطح ${difficultyLabel(lvl)}`}
                      className={cn(
                        'rounded-md px-2 py-1 text-xs font-bold transition-colors',
                        active
                          ? difficultyColor(lvl)
                          : 'bg-muted/40 text-muted-foreground hover:bg-muted',
                      )}
                    >
                      {lvl}
                    </button>
                  )
                })}
              </div>
              {wordMeta.difficulty && (
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {difficultyLabel(wordMeta.difficulty)}
                </p>
              )}
            </div>

            {/* Categories */}
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <FolderPlus className="h-3 w-3" />
                دسته‌ها
              </p>
              <div className="mb-2 flex flex-wrap gap-1">
                {wordCategories.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    عضو هیچ دسته‌ای نیست.
                  </p>
                ) : (
                  wordCategories.map((c: VocabCategory) => (
                    <Badge
                      key={c.id}
                      variant="secondary"
                      className={cn('gap-1', categoryColorClass(c.color))}
                    >
                      {c.label}
                      <button
                        onClick={() => meta.removeFromCategory(word.id, c.id)}
                        aria-label={`حذف از دسته ${c.label}`}
                        className="hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-full justify-between text-xs"
                  >
                    افزودن به دسته...
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>دسته‌های موجود</DropdownMenuLabel>
                  {meta.allCategories.length === 0 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      هنوز دسته‌ای نساخته‌اید.
                    </div>
                  )}
                  {meta.allCategories.map((c) => {
                    const checked = (wordMeta.categoryIds ?? []).includes(c.id)
                    return (
                      <DropdownMenuCheckboxItem
                        key={c.id}
                        checked={checked}
                        onCheckedChange={() =>
                          meta.toggleCategory(word.id, c.id)
                        }
                      >
                        <span className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full',
                              c.color === 'rose' && 'bg-rose-500',
                              c.color === 'amber' && 'bg-amber-500',
                              c.color === 'gold' && 'bg-gold-500',
                              c.color === 'emerald' && 'bg-emerald-500',
                              c.color === 'sky' && 'bg-teal-500',
                              !c.color && 'bg-muted-foreground/40',
                            )}
                          />
                          {c.label}
                          {c.system && (
                            <span className="text-[10px] text-muted-foreground">
                              (سیستمی)
                            </span>
                          )}
                        </span>
                      </DropdownMenuCheckboxItem>
                    )
                  })}
                  <DropdownMenuSeparator />
                  <div className="flex items-center gap-1 px-1 py-1">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          createCategoryFromDialog()
                        }
                      }}
                      placeholder="دسته جدید..."
                      className="h-8 text-xs"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 shrink-0 px-2"
                      onClick={createCategoryFromDialog}
                      disabled={!newCategory.trim()}
                      aria-label="ساخت دسته جدید"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Book source */}
          {word.bookSlug && (
            <div className="flex items-center gap-2 text-sm">
              <BookMarked className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">از کتاب:</span>
              {book ? (
                <Link
                  href={`/books/${book.slug}`}
                  className="font-medium text-gold-700 hover:underline dark:text-gold-400"
                >
                  {book.title}
                </Link>
              ) : (
                <span className="font-mono text-xs text-muted-foreground">
                  {word.bookSlug}
                </span>
              )}
            </div>
          )}

          {/* SRS status */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">وضعیت یادگیری</span>
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {boxIntervalLabel(box)}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <Stat label="سطح" value={toPersianDigits(`${box} / ۷`)} />
              <Stat label="مرورها" value={toPersianDigits(status.reviewCount)} />
              <Stat
                label="دقت"
                value={
                  status.reviewCount > 0
                    ? `${toPersianDigits(
                        Math.round(
                          (status.correctCount / status.reviewCount) * 100,
                        ),
                      )}٪`
                    : '—'
                }
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {boxLabel(box)} —{' '}
              {status.lastReviewedAt
                ? `آخرین مرور: ${new Date(status.lastReviewedAt).toLocaleDateString('fa-IR')}`
                : 'هنوز مرور نشده'}
            </p>
            {onReset && box > 1 && (
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 h-7 text-xs text-muted-foreground"
                onClick={() => onReset(word.id)}
              >
                <RotateCw className="h-3 w-3" />
                شروع دوباره یادگیری
              </Button>
            )}
          </div>

          {/* Created-at footer */}
          <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground/70">
            <Sparkles className="h-3 w-3" />
            ذخیره شده در {new Date(word.createdAt).toLocaleDateString('fa-IR')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background p-2">
      <div className="text-sm font-bold text-gold-700 dark:text-gold-400">
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  )
}
