'use client'

/**
 * DailyWordsSection — "کلمات روزانه" widget.
 *
 * Fetches 5 deterministic-per-day English words from book pages via
 * `/api/vocabulary/daily-words`. Each card shows the word, the source
 * book + the example sentence it came from, and a "یاد بگیر" button
 * that calls the dictionary API to auto-fill the translation before
 * saving the word to the user's vocabulary list.
 *
 * Already-saved words are detected by checking the loaded vocabulary
 * ids set passed in from the parent (so the button becomes a "✓ اضافه
 * شد" state).
 */

import { useVocabMeta } from '@/components/vocabulary/use-vocab-meta'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { motion, useReducedMotion } from 'framer-motion'
import {
  BookOpen,
  CalendarDays,
  Check,
  Loader2,
  Plus,
  Sparkles,
  Volume2,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface DailyWord {
  word: string
  context: string
  bookSlug: string
  bookTitle: string
  bookAuthor: string
}

interface SavedWord {
  id: string
  word: string
  definition: string
  translation: string
  context: string
  bookSlug: string
}

export function DailyWordsSection({
  savedWords,
  onSaved,
}: {
  savedWords: SavedWord[]
  onSaved?: () => void
}) {
  const { toPersianDigits, formatDate } = usePersianLocale()
  const reduceMotion = useReducedMotion()
  const [daily, setDaily] = useState<DailyWord[]>([])
  const [loading, setLoading] = useState(true)
  const [addingWord, setAddingWord] = useState<string | null>(null)
  // words just saved in this session (so the button flips immediately)
  const [justSaved, setJustSaved] = useState<Set<string>>(new Set())
  const meta = useVocabMeta()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/vocabulary/daily-words')
      .then((r) => (r.ok ? r.json() : []))
      .then((d: DailyWord[]) => {
        if (!cancelled) setDaily(d)
      })
      .catch(() => !cancelled && setDaily([]))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  /** Set of lowercase saved words for "already added" detection. */
  const savedWordsLower = new Set(
    savedWords.map((w) => w.word.toLowerCase().trim()),
  )

  async function learn(dw: DailyWord) {
    if (addingWord) return
    setAddingWord(dw.word)
    try {
      let definition = ''
      let translation = ''
      try {
        const dictRes = await fetch('/api/dictionary', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ word: dw.word, context: dw.context }),
        })
        if (dictRes.ok) {
          const dict = await dictRes.json()
          definition = dict.definition || ''
          translation = dict.translation || ''
        }
      } catch {
        /* dictionary fetch failed — save word without definition */
      }
      const res = await fetch('/api/vocabulary', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          word: dw.word,
          definition,
          translation,
          context: dw.context,
          bookSlug: dw.bookSlug,
        }),
      })
      if (!res.ok) throw new Error('save failed')
      // Auto-tag the new word with the system "from book" category so it
      // shows up in the book-filter tab.
      meta.ensureBookCategory(dw.bookSlug, dw.bookTitle)
      setJustSaved((prev) => new Set(prev).add(dw.word.toLowerCase()))
      toast.success(
        translation
          ? `«${dw.word}» با معنی «${translation}» اضافه شد`
          : `«${dw.word}» اضافه شد`,
      )
      onSaved?.()
    } catch {
      toast.error('خطا در افزودن واژه')
    } finally {
      setAddingWord(null)
    }
  }

  function speak(w: string) {
    try {
      const u = new SpeechSynthesisUtterance(w)
      u.lang = 'en-US'
      window.speechSynthesis.speak(u)
    } catch {}
  }

  return (
    <section
      aria-labelledby="daily-words-heading"
      className="rounded-3xl border border-gold-400/30 bg-gradient-to-br from-gold-500/5 via-card to-gold-700/5 p-5 shadow-sm sm:p-6"
    >
      <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="daily-words-heading"
            className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl"
          >
            <CalendarDays className="h-5 w-5 text-gold-600 dark:text-gold-400" />
            کلمات روزانه
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {toPersianDigits(5)} کلمه جدید از کتاب‌ها برای امروز —{' '}
            {formatDate(new Date(), 'long')}
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="shrink-0"
        >
          <Link href="/library">
            <BookOpen className="h-4 w-4" />
            کتابخانه
          </Link>
        </Button>
      </header>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : daily.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          هنوز کلمه روزانه‌ای موجود نیست.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {daily.map((dw, i) => {
            const isSaved =
              justSaved.has(dw.word.toLowerCase()) ||
              savedWordsLower.has(dw.word.toLowerCase())
            const isAdding = addingWord === dw.word
            return (
              <motion.div
                key={`${dw.word}-${dw.bookSlug}`}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : i * 0.05, duration: 0.3 }}
                className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => speak(dw.word)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500/15 text-gold-700 transition-transform hover:scale-110 dark:text-gold-400"
                      aria-label={`تلفظ ${dw.word}`}
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <h3
                      className="text-lg font-extrabold leading-none"
                      dir="ltr"
                    >
                      {dw.word}
                    </h3>
                  </div>
                  {isSaved && (
                    <Badge
                      variant="secondary"
                      className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    >
                      <Check className="h-3 w-3" />
                      اضافه شد
                    </Badge>
                  )}
                </div>

                <p
                  className="line-clamp-2 text-xs italic text-muted-foreground"
                  dir="ltr"
                >
                  “{dw.context}”
                </p>

                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <Link
                    href={`/books/${dw.bookSlug}`}
                    className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground hover:text-gold-700 dark:hover:text-gold-400"
                  >
                    <BookOpen className="h-3 w-3 shrink-0" />
                    <span className="truncate">{dw.bookTitle}</span>
                  </Link>
                  <Button
                    size="sm"
                    variant={isSaved ? 'secondary' : 'glow'}
                    className="h-7 shrink-0 gap-1 px-2 text-xs"
                    disabled={isSaved || isAdding}
                    onClick={() => learn(dw)}
                    aria-label={`یاد گرفتن ${dw.word}`}
                  >
                    {isAdding ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isSaved ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    {isSaved ? 'اضافه شد' : 'یاد بگیر'}
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <p className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        هر روز ساعت ۰، ۵ کلمه جدید از کتاب‌های شما انتخاب می‌شوند.
      </p>
    </section>
  )
}
