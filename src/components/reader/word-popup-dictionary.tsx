'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { DictionaryResult } from '@/lib/ai'
import { motion } from 'framer-motion'
import {
  ArrowLeftRight,
  BookmarkPlus,
  Loader2,
  Network,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { ReaderTheme } from '@/lib/reader/types'
import { THEME_STYLES } from '@/lib/reader/types'

interface WordPopupDictionaryProps {
  word: string
  context?: string
  theme: ReaderTheme
  bookSlug?: string
  /** Controlled open state — when false the dialog is hidden. */
  open: boolean
  onClose: () => void
  onSaved?: () => void
}

const LEVEL_LABEL: Record<string, string> = {
  A1: 'A1',
  A2: 'A2',
  B1: 'B1',
  B2: 'B2',
  C1: 'C1',
  C2: 'C2',
}

const FREQ_LABEL: Record<string, string> = {
  common: 'رایج',
  uncommon: 'متوسط',
  rare: 'کم‌کاربرد',
}

function levelColor(level: string): string {
  // warm-earth palette — never indigo/blue
  if (level === 'A1' || level === 'A2') return '#4d7c5a' // muted green
  if (level === 'B1' || level === 'B2') return '#b8884a' // amber-gold
  return '#a8523c' // warm terracotta
}

function freqColor(band: string): string {
  if (band === 'common') return '#4d7c5a'
  if (band === 'uncommon') return '#b8884a'
  return '#a8523c'
}

export function WordPopupDictionary({
  word: wordProp,
  context,
  theme,
  bookSlug,
  open,
  onClose,
  onSaved,
}: WordPopupDictionaryProps) {
  const [word, setWord] = useState(wordProp)
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<DictionaryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const dark = theme === 'dark'
  const s = THEME_STYLES[theme]

  // If the parent passes a new word, switch to it.
  useEffect(() => {
    setWord(wordProp)
  }, [wordProp])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setResult(null)
    fetch('/api/dictionary', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ word, context }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return
        if (data.error) {
          setError(data.error)
        } else {
          setResult(data)
        }
      })
      .catch(() => active && setError('خطا در دریافت اطلاعات.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [word, context])

  function speak() {
    try {
      const u = new SpeechSynthesisUtterance(word)
      u.lang = 'en-US'
      window.speechSynthesis.speak(u)
    } catch {}
  }

  function addToVocab() {
    if (!result) return
    fetch('/api/vocabulary', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        word: result.word,
        definition: result.definition,
        translation: result.translation,
        context,
        bookSlug,
      }),
    })
      .then(() => {
        toast.success('به واژگان اضافه شد')
        onSaved?.()
      })
      .catch(() => toast.error('افزودن ناموفق بود'))
  }

  /** Click a related word / synonym / antonym → re-query the dictionary for it. */
  function navigateToWord(w: string) {
    const clean = w.trim()
    if (!clean || clean.toLowerCase() === word.toLowerCase()) return
    setWord(clean)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-2xl border-2 p-0 sm:max-w-md"
        style={{ background: s.bg, color: s.text, borderColor: s.border }}
      >
        <DialogTitle className="sr-only">
          دیکشنری — {word}
        </DialogTitle>
        <DialogDescription className="sr-only">
          ترجمه، تعریف، مترادف، متضاد، مثال و ریشه‌شناسی کلمهٔ {word}.
        </DialogDescription>

        {/* Re-keyed motion card so the inner content re-animates when the
            user navigates to a related word. The Dialog wrapper stays
            mounted; only the inner content swaps. */}
        <motion.div
          key={word}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ borderColor: s.border }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={speak}
                className="flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-110"
                style={{ background: s.accent + '22', color: s.accent }}
                aria-label="تلفظ"
              >
                <Volume2 className="h-5 w-5" />
              </button>
              <div>
                <h3 className="text-xl font-bold" dir="ltr" lang="en">
                  {word}
                </h3>
                {result?.phonetic && (
                  <p className="text-sm opacity-70" dir="ltr" lang="en">
                    {result.phonetic}
                    {result.partOfSpeech ? ` · ${result.partOfSpeech}` : ''}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="بستن"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Body */}
          <div className="scroll-brand max-h-[60vh] space-y-4 overflow-y-auto px-5 py-4">
            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 py-10">
                <Loader2
                  className="h-7 w-7 animate-spin"
                  style={{ color: s.accent }}
                />
                <p className="text-sm opacity-70">
                  در حال جست‌وجو در دیکشنری هوشمند...
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="py-8 text-center">
                <p className="text-sm opacity-80">{error}</p>
              </div>
            )}

            {result && !loading && (
              <>
                {/* Level + Frequency chips */}
                {(result.difficultyLevel || result.frequencyBand) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {result.difficultyLevel && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{
                          background: levelColor(result.difficultyLevel) + '1f',
                          color: levelColor(result.difficultyLevel),
                          border: `1px solid ${levelColor(result.difficultyLevel)}55`,
                        }}
                        title="سطح CEFR"
                      >
                        سطح{' '}
                        {LEVEL_LABEL[result.difficultyLevel] ||
                          result.difficultyLevel}
                      </span>
                    )}
                    {result.frequencyBand && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{
                          background: freqColor(result.frequencyBand) + '1f',
                          color: freqColor(result.frequencyBand),
                          border: `1px solid ${freqColor(result.frequencyBand)}55`,
                        }}
                        title="میزان کاربرد"
                      >
                        کاربرد:{' '}
                        {FREQ_LABEL[result.frequencyBand] ||
                          result.frequencyBand}
                      </span>
                    )}
                  </div>
                )}

                {result.translation && (
                  <Section label="ترجمه فارسی" dark={dark} accent={s.accent}>
                    <p className="text-base font-medium leading-relaxed">
                      {result.translation}
                    </p>
                  </Section>
                )}
                {result.definition && (
                  <Section label="English definition" dark={dark} accent={s.accent}>
                    <p className="text-sm leading-relaxed" dir="ltr" lang="en">
                      {result.definition}
                    </p>
                  </Section>
                )}

                {result.synonyms && result.synonyms.length > 0 && (
                  <Section
                    label="مترادف‌ها"
                    dark={dark}
                    accent={s.accent}
                    icon={ArrowLeftRight}
                  >
                    <WordChips
                      words={result.synonyms}
                      onClick={navigateToWord}
                      accent={s.accent}
                      border={s.border}
                      tone="syn"
                    />
                  </Section>
                )}

                {result.antonyms && result.antonyms.length > 0 && (
                  <Section
                    label="متضادها"
                    dark={dark}
                    accent={s.accent}
                    icon={ArrowLeftRight}
                  >
                    <WordChips
                      words={result.antonyms}
                      onClick={navigateToWord}
                      accent={s.accent}
                      border={s.border}
                      tone="ant"
                    />
                  </Section>
                )}

                {result.example && (
                  <Section label="مثال" dark={dark} accent={s.accent}>
                    <p
                      className="border-s-2 ps-3 text-sm italic leading-relaxed"
                      style={{ borderColor: s.accent }}
                      dir="ltr"
                      lang="en"
                    >
                      {result.example}
                    </p>
                  </Section>
                )}

                {result.relatedWords && result.relatedWords.length > 0 && (
                  <Section
                    label="کلمات مرتبط"
                    dark={dark}
                    accent={s.accent}
                    icon={Network}
                  >
                    <WordChips
                      words={result.relatedWords}
                      onClick={navigateToWord}
                      accent={s.accent}
                      border={s.border}
                      tone="rel"
                    />
                  </Section>
                )}

                {result.etymology && result.etymology.trim() && (
                  <Section
                    label="ریشه‌شناسی"
                    dark={dark}
                    accent={s.accent}
                  >
                    <p className="text-xs italic leading-relaxed opacity-80" dir="auto">
                      {result.etymology}
                    </p>
                  </Section>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-2 border-t px-5 py-3"
            style={{ borderColor: s.border }}
          >
            <Button variant="ghost" onClick={onClose}>
              بستن
            </Button>
            <Button
              onClick={addToVocab}
              disabled={!result}
              className="gap-2"
              style={
                !dark ? { background: s.accent, color: '#fff' } : undefined
              }
            >
              <BookmarkPlus className="h-4 w-4" />
              افزودن به واژگان
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

function Section({
  label,
  children,
  dark,
  accent,
  icon: Icon,
}: {
  label: string
  children: React.ReactNode
  dark: boolean
  accent: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {Icon ? (
          <Icon
            className={cn('h-3.5 w-3.5', dark ? 'text-gold-400' : 'text-gold-600')}
          />
        ) : (
          <Sparkles
            className={cn('h-3.5 w-3.5', dark ? 'text-gold-400' : 'text-gold-600')}
            style={{ color: accent }}
          />
        )}
        <span className="text-xs font-bold uppercase tracking-wide opacity-70">
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}

function WordChips({
  words,
  onClick,
  accent,
  border,
  tone,
}: {
  words: string[]
  onClick: (w: string) => void
  accent: string
  border: string
  tone: 'syn' | 'ant' | 'rel'
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {words.map((w, i) => (
        <button
          key={`${w}-${i}`}
          onClick={() => onClick(w)}
          className="rounded-full border px-2.5 py-1.5 text-xs font-medium transition-[transform,opacity,colors,border-color,background-color] hover:scale-105 tap-target"
          style={{
            borderColor: border,
            background:
              tone === 'ant'
                ? accent + '0f'
                : tone === 'rel'
                  ? accent + '18'
                  : accent + '12',
            color: 'inherit',
          }}
          dir="ltr"
          lang="en"
          aria-label={`جست‌وجوی «${w}» در دیکشنری`}
          title={`جست‌وجوی «${w}» در دیکشنری`}
        >
          {w}
        </button>
      ))}
    </div>
  )
}
