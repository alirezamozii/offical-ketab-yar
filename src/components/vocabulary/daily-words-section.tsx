'use client'

/**
 * DailyWordsSection — "کلمات روزانه" widget.
 *
 * Shows a daily practice set of 5 words picked deterministically from the
 * user's OWN saved vocabulary (the words they marked as unknown while
 * reading). Nothing is auto-extracted from book text — if the user hasn't
 * saved any words, we show an empty state guiding them to the reader.
 *
 * The pick is stable for the whole day and rotates at midnight local time.
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import {
  BookOpen,
  CalendarDays,
  Sparkles,
  Volume2,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

interface SavedWord {
  id: string
  word: string
  definition: string
  translation: string
  context: string
  bookSlug: string
}

const WORDS_PER_DAY = 5

/** FNV-1a → mulberry32 deterministic PRNG from a string seed. */
function seededRandom(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let state = h >>> 0
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function DailyWordsSection({ savedWords }: { savedWords: SavedWord[] }) {
  const { toPersianDigits, formatDate } = usePersianLocale()

  // Deterministic per-day pick from the user's own saved words.
  const daily = useMemo(() => {
    if (savedWords.length === 0) return []
    const rng = seededRandom(`daily-words:${todayKey()}`)
    const pool = [...savedWords]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    return pool.slice(0, Math.min(WORDS_PER_DAY, pool.length))
  }, [savedWords])

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
            {daily.length > 0
              ? `${toPersianDigits(daily.length)} کلمه از واژه‌های ذخیره‌شده‌ات برای امروز — ${formatDate(new Date(), 'long')}`
              : `واژه‌های ذخیره‌شده‌ات برای امروز — ${formatDate(new Date(), 'long')}`}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/library">
            <BookOpen className="h-4 w-4" />
            کتابخانه
          </Link>
        </Button>
      </header>

      {daily.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          هنوز واژه‌ای ذخیره نکرده‌ای. موقع مطالعه، کلمه‌های ناآشنا رو انتخاب کن
          و به واژگانت اضافه‌شون کن تا اینجا هر روز برای مرور نمایش داده بشن.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {daily.map((dw, i) => (
            <div
              key={dw.id}
              className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-3 fill-mode-both"
              style={{
                animationDelay: `${Math.min(i * 50, 350)}ms`,
              }}
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
                  <h3 className="text-lg font-extrabold leading-none" dir="ltr">
                    {dw.word}
                  </h3>
                </div>
                {dw.translation && (
                  <Badge variant="secondary" className="max-w-[60%] truncate">
                    {dw.translation}
                  </Badge>
                )}
              </div>

              {dw.context && (
                <p
                  className="line-clamp-2 text-xs italic text-muted-foreground"
                  dir="ltr"
                >
                  “{dw.context}”
                </p>
              )}

              <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                <Link
                  href={`/books/${dw.bookSlug}`}
                  className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground hover:text-gold-700 dark:hover:text-gold-400"
                >
                  <BookOpen className="h-3 w-3 shrink-0" />
                  <span className="truncate">{dw.bookSlug}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        هر روز {toPersianDigits(WORDS_PER_DAY)} کلمه از واژه‌های ذخیره‌شده‌ی خودت
        انتخاب می‌شود.
      </p>
    </section>
  )
}
