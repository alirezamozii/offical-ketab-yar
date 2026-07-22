'use client'

import { SrsDots } from '@/components/vocabulary/srs-dots'
import {
  WordDetailDialog,
  type VocabWord,
} from '@/components/vocabulary/word-detail-dialog'
import { DailyWordsSection } from '@/components/vocabulary/daily-words-section'
import {
  useVocabMeta,
  categoryColorClass,
} from '@/components/vocabulary/use-vocab-meta'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  masteryFor,
  masteryLabel,
  useSrs,
} from '@/hooks/reader/use-srs'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { useTTS } from '@/hooks/use-tts'
import { AudioWaveBars } from '@/components/reader/audio-wave-bars'
import {
  ArrowDownAZ,
  ArrowUpAZ,
  BookOpen,
  CheckSquare,
  ChevronDown,
  Download,
  Ear,
  FolderPlus,
  Gamepad2,
  GraduationCap,
  MousePointerClick,
  Layers,
  Lightbulb,
  Loader2,
  Plus,
  RotateCw,
  Search,
  Sparkles,
  Square,
  Target,
  Trash2,
  Volume2,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchVocabulary, queryKeys } from '@/lib/api/queries'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Tab = 'all' | 'due' | 'learning' | 'familiar' | 'mastered' | 'new'

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'همه' },
  { id: 'due', label: 'مرور امروز' },
  { id: 'new', label: 'جدید' },
  { id: 'learning', label: 'در حال یادگیری' },
  { id: 'familiar', label: 'آشنا' },
  { id: 'mastered', label: 'تسلط یافته' },
]

type SortKey = 'newest' | 'oldest' | 'alpha-asc' | 'alpha-desc' | 'mastery-asc' | 'mastery-desc'

const SORT_OPTIONS: { id: SortKey; label: string; icon: React.ReactNode }[] = [
  { id: 'newest', label: 'جدیدترین', icon: <RotateCw className="h-3.5 w-3.5" /> },
  { id: 'oldest', label: 'قدیمی‌ترین', icon: <RotateCw className="h-3.5 w-3.5" /> },
  { id: 'alpha-asc', label: 'الفبایی (A→Z)', icon: <ArrowDownAZ className="h-3.5 w-3.5" /> },
  { id: 'alpha-desc', label: 'الفبایی (Z→A)', icon: <ArrowUpAZ className="h-3.5 w-3.5" /> },
  { id: 'mastery-desc', label: 'بیشترین تسلط', icon: <GraduationCap className="h-3.5 w-3.5" /> },
  { id: 'mastery-asc', label: 'کمترین تسلط', icon: <GraduationCap className="h-3.5 w-3.5" /> },
]

export function VocabularyClient() {
  const srs = useSrs()
  const { toPersianDigits } = usePersianLocale()
  const tts = useTTS()
  const meta = useVocabMeta()
  const queryClient = useQueryClient()
  const [words, setWords] = useState<VocabWord[]>([])
  const [q, setQ] = useState('')
  const [newWord, setNewWord] = useState('')
  const [adding, setAdding] = useState(false)
  const [tab, setTab] = useState<Tab>('all')
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('newest')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detailWord, setDetailWord] = useState<VocabWord | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  // Delete-confirmation state.
  const [pendingDelete, setPendingDelete] = useState<VocabWord | null>(null)
  const [pendingDeleteMany, setPendingDeleteMany] = useState<VocabWord[] | null>(null)
  // New-category dialog state (inline).
  const [newCategoryLabel, setNewCategoryLabel] = useState('')
  
  const { data: vocabWords = [], isLoading: loading } = useQuery<VocabWord[]>({
    queryKey: queryKeys.vocabulary,
    queryFn: async () => {
      const data = await fetchVocabulary()
      return data as VocabWord[]
    },
    staleTime: 60 * 1000,
  })

  useEffect(() => {
    if (vocabWords.length > 0) {
      setWords(vocabWords)
    }
  }, [vocabWords])

  async function addManual() {
    const w = newWord.trim()
    if (!w || adding) return
    setAdding(true)
    try {
      let definition = ''
      let translation = ''
      try {
        const dictRes = await fetch('/api/dictionary', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ word: w, context: '' }),
        })
        if (dictRes.ok) {
          const dict = await dictRes.json()
          definition = dict.definition || ''
          translation = dict.translation || ''
        }
      } catch {
        // dictionary fetch failed — save word without definition
      }
      const res = await fetch('/api/vocabulary', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ word: w, definition, translation }),
      })
      if (!res.ok) throw new Error('save failed')
      setNewWord('')
      toast.success(
        translation
          ? `«${w}» با معنی «${translation}» اضافه شد`
          : `«${w}» اضافه شد`,
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.vocabulary })
    } catch {
      toast.error('خطا در افزودن واژه')
    } finally {
      setAdding(false)
    }
  }

  function removeConfirmed(id: string) {
    fetch(`/api/vocabulary?id=${id}`, { method: 'DELETE' })
      .then(() => {
        setWords((prev) => prev.filter((w) => w.id !== id))
        srs.resetWord(id)
        setSelected((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        toast.success('حذف شد')
        queryClient.invalidateQueries({ queryKey: queryKeys.vocabulary })
      })
      .catch(() => toast.error('خطا'))
  }

  function removeManyConfirmed(ids: string[]) {
    if (ids.length === 0) return
    Promise.all(
      ids.map((id) =>
        fetch(`/api/vocabulary?id=${id}`, { method: 'DELETE' }),
      ),
    )
      .then(() => {
        setWords((prev) => prev.filter((w) => !ids.includes(w.id)))
        ids.forEach((id) => srs.resetWord(id))
        setSelected(new Set())
        toast.success(`${toPersianDigits(ids.length)} واژه حذف شد`)
        queryClient.invalidateQueries({ queryKey: queryKeys.vocabulary })
      })
      .catch(() => toast.error('خطا در حذف'))
  }

  // High-quality TTS pronunciation via /api/tts (z-ai-web-dev-sdk).
  // The previous implementation used SpeechSynthesisUtterance directly;
  // we keep that as an internal fallback if the TTS service is unreachable.
  async function speak(w: string) {
    if (!w) return
    // If the same word is currently playing, stop instead of replaying.
    if (tts.currentText === w && (tts.isPlaying || tts.isPaused)) {
      tts.stop()
      return
    }
    try {
      window.speechSynthesis?.cancel()
    } catch {}
    await tts.speak(w, 'en')
  }

  function openDetail(w: VocabWord) {
    setDetailWord(w)
    setDetailOpen(true)
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll(list: VocabWord[]) {
    setSelected((prev) => {
      const allSelected = list.every((w) => prev.has(w.id))
      const next = new Set(prev)
      if (allSelected) {
        list.forEach((w) => next.delete(w.id))
      } else {
        list.forEach((w) => next.add(w.id))
      }
      return next
    })
  }

  function exportWords(list: VocabWord[]) {
    if (list.length === 0) {
      toast.error('واژه‌ای برای خروجی نیست')
      return
    }
    const rows = list.map((w) => {
      const m = meta.getMeta(w.id)
      const status = srs.getStatus(w.id)
      return {
        word: w.word,
        translation: w.translation,
        definition: w.definition,
        context: w.context,
        bookSlug: w.bookSlug,
        createdAt: w.createdAt,
        mastery: masteryLabel(masteryFor(status.box)),
        box: status.box,
        difficulty: m.difficulty ?? '',
        synonyms: (m.synonyms ?? []).join(', '),
        antonyms: (m.antonyms ?? []).join(', '),
        categories: meta
          .categoriesFor(w.id)
          .map((c) => c.label)
          .join(', '),
      }
    })
    // CSV — prepend BOM so Excel reads the Persian/UTF-8 correctly.
    const headers = Object.keys(rows[0])
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        headers
          .map((h) => {
            const v = String((r as Record<string, unknown>)[h] ?? '')
            return `"${v.replace(/"/g, '""')}"`
          })
          .join(','),
      ),
    ].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ketab-yar-vocabulary-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`${toPersianDigits(list.length)} واژه خروجی گرفته شد`)
  }

  /** Apply search + tab filter + category filter. */
  const baseFiltered = useMemo(() => {
    const search = q.trim().toLowerCase()
    return words.filter((w) => {
      if (
        search &&
        !w.word.toLowerCase().includes(search) &&
        !w.translation.includes(search)
      ) {
        return false
      }
      if (activeCategoryId) {
        const m = meta.getMeta(w.id)
        if (!(m.categoryIds ?? []).includes(activeCategoryId)) return false
      }
      if (tab === 'all') return true
      const status = srs.getStatus(w.id)
      const due = srs.isDue(w.id)
      const mastery = masteryFor(status.box)
      if (tab === 'due') return due
      if (tab === 'new') return srs.isNew(w.id) || mastery === 'new'
      if (tab === 'learning') return mastery === 'learning' && !due
      if (tab === 'familiar') return mastery === 'familiar' && !due
      if (tab === 'mastered') return mastery === 'mastered'
      return true
    })
  }, [words, q, tab, activeCategoryId, srs, meta])

  /** Then sort. */
  const filtered = useMemo(() => {
    const arr = [...baseFiltered]
    switch (sort) {
      case 'newest':
        arr.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        break
      case 'oldest':
        arr.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
        break
      case 'alpha-asc':
        arr.sort((a, b) => a.word.localeCompare(b.word, 'en'))
        break
      case 'alpha-desc':
        arr.sort((a, b) => b.word.localeCompare(a.word, 'en'))
        break
      case 'mastery-desc':
        arr.sort(
          (a, b) => srs.getStatus(b.id).box - srs.getStatus(a.id).box,
        )
        break
      case 'mastery-asc':
        arr.sort(
          (a, b) => srs.getStatus(a.id).box - srs.getStatus(b.id).box,
        )
        break
    }
    return arr
  }, [baseFiltered, sort, srs])

  const dueCount = useMemo(
    () => srs.getDueWordIds(words.map((w) => w.id)).length,
    [words, srs],
  )

  /** Daily review queue — used by "مرور همه" bulk action. */
  const dailyQueue = useMemo(
    () => new Set(srs.getDailyReviewQueue(words.map((w) => w.id))),
    [words, srs],
  )

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((w) => selected.has(w.id))

  const selectedWords = filtered.filter((w) => selected.has(w.id))

  return (
    <div className="space-y-6">
      {/* Daily words feature — 5 new words from the books each day */}
      <DailyWordsSection savedWords={words} onSaved={() => queryClient.invalidateQueries({ queryKey: queryKeys.vocabulary })} />

      {/* Add + search row */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 gap-2">
          <Input
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addManual()}
            placeholder="افزودن کلمه جدید (معنی خودکار گرفته می‌شود)..."
            dir="ltr"
            disabled={adding}
            className="h-10"
            aria-label="افزودن کلمه جدید"
          />
          <Button
            onClick={addManual}
            size="icon"
            disabled={adding}
            aria-label="افزودن"
            className="size-10 shrink-0"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="relative sm:w-64">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجو در واژگان..."
            className="h-10 ps-9"
            aria-label="جستجو در واژگان"
          />
        </div>
      </div>

      {/* Per user feedback: removed the duplicate VocabStatsCard here.
          These stats were duplicating what's already on the Dashboard
          (streak, total words, etc.). The Vocabulary page should focus
          on its core purpose: playing word games and learning words.
          The stats now live ONLY on the dashboard. */}

      {/* Tabs + action buttons row */}
      {words.length > 0 && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="scroll-x-mobile flex flex-nowrap gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-sm sm:flex-wrap sm:overflow-visible">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-pressed={tab === t.id}
                className={cn(
                  'tap-feedback relative shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors sm:shrink',
                  tab === t.id
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t.label}
                {t.id === 'due' && dueCount > 0 && (
                  <span className="ms-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-white">
                    {toPersianDigits(dueCount)}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="scroll-x-mobile flex flex-nowrap gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
            {/* Sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0 gap-1">
                  <Layers className="h-4 w-4" />
                  مرتب‌سازی
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>مرتب‌سازی بر اساس</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={sort}
                  onValueChange={(v) => setSort(v as SortKey)}
                >
                  {SORT_OPTIONS.map((o) => (
                    <DropdownMenuRadioItem key={o.id} value={o.id}>
                      <span className="flex items-center gap-2">
                        {o.icon}
                        {o.label}
                      </span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Category filter dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={activeCategoryId ? 'default' : 'outline'}
                  size="sm"
                  className="shrink-0 gap-1"
                  aria-label="فیلتر بر اساس دسته"
                >
                  <FolderPlus className="h-4 w-4" />
                  {activeCategoryId
                    ? meta.allCategories.find((c) => c.id === activeCategoryId)
                        ?.label ?? 'دسته'
                    : 'دسته‌ها'}
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>فیلتر بر اساس دسته</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveCategoryId(null)}>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    همه دسته‌ها
                  </span>
                </DropdownMenuItem>
                {meta.allCategories.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    هنوز دسته‌ای نساخته‌اید.
                  </div>
                )}
                {meta.allCategories.map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    onClick={() => setActiveCategoryId(c.id)}
                  >
                    <span className="flex items-center gap-2">
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
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <div className="flex items-center gap-1 px-1 py-1">
                  <Input
                    value={newCategoryLabel}
                    onChange={(e) => setNewCategoryLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newCategoryLabel.trim()) {
                        e.preventDefault()
                        const id = meta.createCategory(newCategoryLabel.trim())
                        setNewCategoryLabel('')
                        setActiveCategoryId(id)
                        toast.success('دسته ساخته شد')
                      }
                    }}
                    placeholder="دسته جدید..."
                    className="h-8 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 shrink-0 px-2"
                    onClick={() => {
                      if (!newCategoryLabel.trim()) return
                      const id = meta.createCategory(newCategoryLabel.trim())
                      setNewCategoryLabel('')
                      setActiveCategoryId(id)
                      toast.success('دسته ساخته شد')
                    }}
                    disabled={!newCategoryLabel.trim()}
                    aria-label="ساخت دسته جدید"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Bulk actions when selection */}
            {selected.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1"
                onClick={() => exportWords(selectedWords)}
                aria-label="خروجی گرفتن از انتخاب‌شده‌ها"
              >
                <Download className="h-4 w-4" />
                خروجی ({toPersianDigits(selected.size)})
              </Button>
            )}
            {selected.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="shrink-0 gap-1"
                onClick={() => setPendingDeleteMany(selectedWords)}
              >
                <Trash2 className="h-4 w-4" />
                حذف {toPersianDigits(selected.size)} واژه
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1"
              onClick={() => exportWords(filtered)}
              disabled={filtered.length === 0}
              aria-label="خروجی گرفتن از همه"
            >
              <Download className="h-4 w-4" />
              خروجی
            </Button>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href="/vocabulary/practice">
                <BookOpen className="h-4 w-4" />
                تمرین
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href="/vocabulary/spell">
                <Sparkles className="h-4 w-4" />
                هجی‌کردن
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href="/vocabulary/listen">
                <Ear className="h-4 w-4" />
                شنیداری
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href="/vocabulary/match">
                <Layers className="h-4 w-4" />
                تطبیق
              </Link>
            </Button>
            <Button asChild variant="glow" size="sm" className="shrink-0">
              <Link href="/vocabulary/game">
                <Gamepad2 className="h-4 w-4" />
                بازی واژگان
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Daily-review banner — surfaces the daily queue size + a one-click
          "review all" CTA. */}
      {!loading && dailyQueue.size > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-gold-400/40 bg-gradient-to-r from-gold-500/10 via-card to-gold-700/5 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500/20 text-gold-700 dark:text-gold-300">
              <Target className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">
                بررسی روزانه: {toPersianDigits(dailyQueue.size)} واژه برای مرور
              </p>
              <p className="text-xs text-muted-foreground">
                شامل واژگان سررسیدشده و کلمات جدید امروز
              </p>
            </div>
          </div>
          <Button asChild variant="glow" size="sm" className="shrink-0 gap-1">
            <Link href="/vocabulary/practice">
              <RotateCw className="h-4 w-4" />
              مرور همه
            </Link>
          </Button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          wordsCount={words.length}
          tab={tab}
          hasSearch={q.trim().length > 0}
          hasCategoryFilter={!!activeCategoryId}
        />
      ) : (
        <>
          {/* Bulk-select toggle */}
          <div className="flex items-center justify-between text-sm">
            <button
              onClick={() => toggleSelectAll(filtered)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              {allFilteredSelected ? (
                <Square className="h-4 w-4 fill-primary text-primary" />
              ) : (
                <CheckSquare className="h-4 w-4" />
              )}
              {allFilteredSelected ? 'لغو انتخاب همه' : 'انتخاب همه'}
            </button>
            <span className="text-xs text-muted-foreground">
              {toPersianDigits(filtered.length)} واژه
            </span>
          </div>

          <div className="stagger-in grid gap-3 sm:grid-cols-2">
            {filtered.map((w) => {
              const status = srs.getStatus(w.id)
              const isSelected = selected.has(w.id)
              const due = srs.isDue(w.id)
              const mastery = masteryFor(status.box)
              const m = meta.getMeta(w.id)
              const cats = meta.categoriesFor(w.id)
              return (
                <div
                  key={w.id}
                  className={cn(
                    'group relative cursor-pointer rounded-2xl border bg-card p-3 shadow-sm transition-[transform,opacity,colors,border-color,background-color] hover:shadow-md sm:p-4',
                    isSelected
                      ? 'border-primary ring-1 ring-primary/30'
                      : 'border-border/60',
                    due && !isSelected && 'border-gold-400/50',
                  )}
                  onClick={() => openDetail(w)}
                >
                  <div
                    className="absolute end-3 top-3 z-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleSelect(w.id)
                    }}
                  >
                    <Checkbox checked={isSelected} aria-label="انتخاب" />
                  </div>

                  <div className="mb-2 flex items-start justify-between gap-2 pe-8">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          void speak(w.word)
                        }}
                        className={cn(
                          'tap-feedback relative flex h-9 w-9 items-center justify-center rounded-full bg-gold-500/15 text-gold-700 transition-transform hover:scale-110 dark:text-gold-400',
                          tts.currentText === w.word &&
                            (tts.isPlaying || tts.isLoading) &&
                            'ring-2 ring-gold-400/50',
                          // Mobile: always visible. Desktop: appear on hover.
                          'md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100',
                        )}
                        aria-label={
                          tts.currentText === w.word && tts.isPlaying
                            ? 'توقف تلفظ'
                            : 'تلفظ کلمه'
                        }
                        aria-pressed={tts.currentText === w.word && tts.isPlaying}
                      >
                        {tts.currentText === w.word && tts.isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : tts.currentText === w.word && tts.isPlaying ? (
                          <>
                            <Square className="h-3.5 w-3.5" />
                            <span className="pointer-events-none absolute -bottom-0.5 left-1/2 -translate-x-1/2">
                              <AudioWaveBars count={3} className="h-2.5" />
                            </span>
                          </>
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </button>
                      <div>
                        <h3 className="text-base font-bold leading-none sm:text-lg" dir="ltr">
                          {w.word}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <Badge
                            variant="secondary"
                            className={cn(
                              'h-4 px-1.5 text-[10px] font-bold',
                              mastery === 'mastered' &&
                                'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
                              mastery === 'familiar' &&
                                'bg-gold-500/15 text-gold-700 dark:text-gold-300',
                              mastery === 'learning' &&
                                'bg-amber-500/15 text-amber-700 dark:text-amber-300',
                              mastery === 'new' &&
                                'bg-muted text-muted-foreground',
                            )}
                          >
                            {masteryLabel(mastery)}
                          </Badge>
                          {due && (
                            <Badge
                              variant="secondary"
                              className="h-4 bg-gold-500/20 px-1.5 text-[10px] text-gold-700 dark:text-gold-300"
                            >
                              مرور امروز
                            </Badge>
                          )}
                          {m.difficulty && (
                            <Badge
                              variant="secondary"
                              className="h-4 bg-muted px-1.5 text-[10px] text-muted-foreground"
                            >
                              {m.difficulty}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <SrsDots box={status.box} />
                  </div>

                  {w.translation && (
                    <p className="mb-1 text-sm font-medium leading-relaxed sm:text-base">
                      {w.translation}
                    </p>
                  )}
                  {w.definition && (
                    <p
                      className="line-clamp-2 text-xs text-muted-foreground sm:text-sm"
                      dir="ltr"
                    >
                      {w.definition}
                    </p>
                  )}
                  {w.context && (
                    <p
                      className="mt-2 border-s-2 ps-2 text-xs italic text-muted-foreground line-clamp-1"
                      dir="ltr"
                    >
                      {w.context}
                    </p>
                  )}

                  {/* Category chips */}
                  {cats.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {cats.slice(0, 4).map((c) => (
                        <span
                          key={c.id}
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-medium',
                            categoryColorClass(c.color),
                          )}
                        >
                          {c.label}
                        </span>
                      ))}
                      {cats.length > 4 && (
                        <span className="px-1 text-[10px] text-muted-foreground">
                          +{toPersianDigits(cats.length - 4)}
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setPendingDelete(w)
                    }}
                    className="tap-feedback absolute bottom-3 end-3 flex h-8 w-8 items-center justify-center rounded-md text-red-500 opacity-100 transition-opacity hover:bg-red-500/10 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}

      <WordDetailDialog
        word={detailWord}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onReset={(id) => {
          srs.resetWord(id)
          setDetailOpen(false)
          toast.success('سطح یادگیری بازنشانی شد')
        }}
        onSaved={(updated) => {
          setWords((prev) =>
            prev.map((w) => (w.id === updated.id ? { ...w, ...updated } : w)),
          )
          setDetailWord((prev) =>
            prev && prev.id === updated.id ? { ...prev, ...updated } : prev,
          )
        }}
      />

      {/* Single-word delete confirmation */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف واژه؟</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف «{pendingDelete?.word}» مطمئن هستید؟ این عمل قابل بازگشت
              نیست. وضعیت یادگیری آن هم پاک می‌شود.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>لغو</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                if (pendingDelete) {
                  removeConfirmed(pendingDelete.id)
                  setPendingDelete(null)
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              حذف کن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation */}
      <AlertDialog
        open={!!pendingDeleteMany}
        onOpenChange={(o) => !o && setPendingDeleteMany(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              حذف {toPersianDigits(pendingDeleteMany?.length ?? 0)} واژه؟
            </AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف این واژگان مطمئن هستید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>لغو</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                if (pendingDeleteMany) {
                  removeManyConfirmed(pendingDeleteMany.map((w) => w.id))
                  setPendingDeleteMany(null)
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              حذف همه
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EmptyState({
  wordsCount,
  tab,
  hasSearch,
  hasCategoryFilter,
}: {
  wordsCount: number
  tab: Tab
  hasSearch: boolean
  hasCategoryFilter: boolean
}) {
  const isTrulyEmpty = wordsCount === 0
  let title = 'نتیجه‌ای یافت نشد'
  let body = 'فیلتر یا جستجو را تغییر دهید.'

  if (isTrulyEmpty) {
    title = 'هنوز واژه‌ای ذخیره نکرده‌اید'
    body =
      'کلمات جدید را هنگام مطالعه اضافه کنید — روی هر کلمه ناشناخته در کتاب بزنید تا به واژگان اضافه شود.'
  } else if (tab === 'due') {
    title = 'هیچ واژه‌ای برای مرور امروز نیست 🎉'
    body = 'عالیه! بعداً کلمات بیشتری برای مرور اضافه می‌شوند.'
  } else if (tab === 'mastered') {
    title = 'هنوز واژه‌ای به سطح «تسلط» نرسیده'
    body = 'با تمرین منظم و پاسخ‌های درست، واژگان به مرور به تسلط می‌رسند.'
  } else if (tab === 'familiar') {
    title = 'هنوز واژه‌ای به سطح «آشنا» نرسیده'
    body = 'با پاسخ درست به مرورهای بعدی، واژگان به این سطح می‌رسند.'
  } else if (hasSearch) {
    title = 'نتیجه‌ای یافت نشد'
    body = 'عبارت جستجو یا فیلتر را تغییر دهید.'
  } else if (hasCategoryFilter) {
    title = 'این دسته خالی است'
    body = 'واژگان بیشتری را به این دسته اضافه کنید.'
  }

  return (
    <div className="relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-dashed border-border py-16 text-center">
      {/* Soft gold halo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 left-1/2 -z-10 h-36 w-36 -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl"
      />
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/20">
        <BookOpen className="h-7 w-7" />
      </div>
      <p className="font-semibold">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{body}</p>

      {/* Helpful tip — only when truly empty (no words saved yet) */}
      {isTrulyEmpty && (
        <div className="mt-1 flex max-w-md items-start gap-2.5 rounded-xl border border-gold-500/25 bg-gold-500/5 p-3 text-right">
          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold-500/15 text-gold-700 dark:text-gold-400">
            <MousePointerClick className="h-4 w-4" />
          </span>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold leading-snug">
              <Lightbulb className="me-1 inline h-3 w-3 text-gold-500" />
              هنگام مطالعه کلمات جدید را با دابل‌کلیک ذخیره کنید
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              در صفحه مطالعه، روی هر کلمه ناشناخته دابل‌کلیک (یا دوبار لمس) کنید تا
              معنی آن را ببینید و با یک کلیک به واژگان خود اضافه کنید.
            </p>
          </div>
        </div>
      )}

      {isTrulyEmpty && (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Button asChild variant="glow">
            <Link href="/library">رفتن به کتابخانه</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/vocabulary/game">
              <Gamepad2 className="h-4 w-4" />
              بازی واژگان
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
