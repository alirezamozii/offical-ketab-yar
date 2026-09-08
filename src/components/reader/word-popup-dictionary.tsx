'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
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
  A1: 'A1 (مقدماتی)',
  A2: 'A2 (پایه‌ای)',
  B1: 'B1 (متوسط)',
  B2: 'B2 (فوق متوسط)',
  C1: 'C1 (پیشرفته)',
  C2: 'C2 (تخصصی)',
}

const FREQ_LABEL: Record<string, string> = {
  common: 'بسیار پرکاربرد',
  uncommon: 'کاربرد متوسط',
  rare: 'کم‌کاربرد و خاص',
}

function levelColor(level: string): string {
  if (level === 'A1' || level === 'A2') return '#4d7c5a' // muted green
  if (level === 'B1' || level === 'B2') return '#b8884a' // amber-gold
  return '#a8523c' // warm terracotta
}

function freqColor(band: string): string {
  if (band === 'common') return '#4d7c5a'
  if (band === 'uncommon') return '#b8884a'
  return '#a8523c'
}

export function useWordPopupState(
  wordProp: string,
  context?: string,
  bookSlug?: string,
  onSaved?: () => void,
) {
  const [word, setWord] = useState(wordProp)
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<(DictionaryResult & { audioUrl?: string | null; persian?: string; pos?: string }) | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  useEffect(() => {
    setWord(wordProp)
  }, [wordProp])

  useEffect(() => {
    const clean = word.trim()
    if (!clean) {
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    setError(null)
    setResult(null)

    fetch('/api/dictionary', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ word: clean, context }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok || data.error) {
          throw new Error(data.error || 'اطلاعات واژه یافت نشد.')
        }
        return data
      })
      .then((data) => {
        if (!active) return
        setResult(data)
      })
      .catch((err) => {
        if (active) setError(err.message || 'خطا در دریافت اطلاعات دیکشنری.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [word, context])

  function speak() {
    if (!word) return
    setIsPlayingAudio(true)

    const fallbackSpeak = () => {
      try {
        window.speechSynthesis?.cancel()
        const u = new SpeechSynthesisUtterance(word)
        u.lang = 'en-US'
        u.onend = () => setIsPlayingAudio(false)
        u.onerror = () => setIsPlayingAudio(false)
        window.speechSynthesis?.speak(u)
      } catch {
        setIsPlayingAudio(false)
      }
    }

    const targetAudioUrl = result?.audioUrl || `/api/tts?text=${encodeURIComponent(word.trim())}&lang=en`
    try {
      const audio = new Audio(targetAudioUrl)
      audio.onended = () => setIsPlayingAudio(false)
      audio.onerror = () => fallbackSpeak()
      audio.play().catch(() => fallbackSpeak())
    } catch {
      fallbackSpeak()
    }
  }

  function addToVocab() {
    if (!result) return
    const translation = result.translation || result.persian || ''
    const definition = result.definition || ''

    fetch('/api/vocabulary', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        word: result.word || word,
        definition,
        translation,
        context,
        bookSlug,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed')
        toast.success(
          translation
            ? `«${result.word || word}» با معنی «${translation}» ذخیره شد`
            : `«${result.word || word}» ذخیره شد`,
        )
        onSaved?.()
      })
      .catch(() => toast.error('خطا در ذخیره واژه'))
  }

  function navigateToWord(w: string) {
    const clean = w.trim()
    if (!clean || clean.toLowerCase() === word.toLowerCase()) return
    setWord(clean)
  }

  return {
    word,
    loading,
    result,
    error,
    isPlayingAudio,
    speak,
    addToVocab,
    navigateToWord,
  }
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
  const isMobile = useIsMobile()
  const state = useWordPopupState(wordProp, context, bookSlug, onSaved)
  const s = THEME_STYLES[theme] || THEME_STYLES.light

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => { if (!o) onClose() }}>
        <DrawerContent
          className="z-[150] rounded-t-3xl border-t-2 max-h-[88vh] p-0 overflow-hidden shadow-2xl"
          style={{ background: s.bg, color: s.text, borderColor: s.border }}
        >
          <DrawerHandle className="opacity-40" style={{ background: s.accent }} />
          <DrawerTitle className="sr-only">دیکشنری — {state.word}</DrawerTitle>
          <DrawerDescription className="sr-only">ترجمه فارسی و تعاریف {state.word}</DrawerDescription>
          <DictionaryBodyContent
            {...state}
            onClose={onClose}
            theme={theme}
            isMobile
          />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-2xl border-2 p-0 shadow-2xl sm:max-w-md z-[150]"
        style={{ background: s.bg, color: s.text, borderColor: s.border }}
      >
        <DialogTitle className="sr-only">
          دیکشنری — {state.word}
        </DialogTitle>
        <DialogDescription className="sr-only">
          ترجمه فارسی، تعریف انگلیسی، مترادف، متضاد، تلفظ صوتی و مثال کلمهٔ {state.word}.
        </DialogDescription>
        <DictionaryBodyContent
          {...state}
          onClose={onClose}
          theme={theme}
          isMobile={false}
        />
      </DialogContent>
    </Dialog>
  )
}

function DictionaryBodyContent({
  word,
  loading,
  result,
  error,
  isPlayingAudio,
  speak,
  addToVocab,
  navigateToWord,
  onClose,
  theme,
  isMobile,
}: {
  word: string
  loading: boolean
  result: (DictionaryResult & { audioUrl?: string | null; persian?: string; pos?: string }) | null
  error: string | null
  isPlayingAudio: boolean
  speak: () => void
  addToVocab: () => void
  navigateToWord: (w: string) => void
  onClose: () => void
  theme: ReaderTheme
  isMobile?: boolean
}) {
  const dark = theme === 'dark' || theme === 'high-contrast'
  const s = THEME_STYLES[theme] || THEME_STYLES.light

  const displayTranslation = result?.translation || result?.persian
  const displayPos = result?.partOfSpeech || result?.pos

  return (
    <motion.div
      key={word}
      initial={{ opacity: 0, scale: isMobile ? 1 : 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-5 py-4"
        style={{ borderColor: s.border }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={speak}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95',
              isPlayingAudio && 'ring-2 ring-gold-400 ring-offset-2',
            )}
            style={{ background: s.accent + '22', color: s.accent }}
            aria-label="پخش تلفظ صوتی"
            title="پخش تلفظ صوتی با صدای طبیعی"
          >
            {isPlayingAudio ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>
          <div>
            <h3 className="text-xl font-bold tracking-tight" dir="ltr" lang="en">
              {word}
            </h3>
            {(result?.phonetic || displayPos) && (
              <p className="text-xs opacity-75" dir="ltr" lang="en">
                {result?.phonetic ? result.phonetic : ''}
                {result?.phonetic && displayPos ? ' · ' : ''}
                {displayPos ? <span className="font-semibold">{displayPos}</span> : ''}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="بستن پنجره"
          className="h-8 w-8 rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Body */}
      <div className={cn(
        "scroll-brand space-y-4 overflow-y-auto px-5 py-4",
        isMobile ? "max-h-[62vh] pb-8" : "max-h-[62vh]"
      )}>
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <Loader2
              className="h-7 w-7 animate-spin"
              style={{ color: s.accent }}
            />
            <p className="text-xs opacity-75">
              در حال استخراج ترجمه، تعاریف و تلفظ...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="py-8 text-center">
            <p className="text-sm opacity-80">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToWord(word)}
              className="mt-3"
            >
              تلاش مجدد
            </Button>
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
                    title="سطح استاندارد زبان"
                  >
                    سطح {LEVEL_LABEL[result.difficultyLevel] || result.difficultyLevel}
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
                    title="میزان استفاده در زبان انگلیسی"
                  >
                    {FREQ_LABEL[result.frequencyBand] || result.frequencyBand}
                  </span>
                )}
              </div>
            )}

            {/* Persian Translation */}
            {displayTranslation && (
              <Section label="ترجمه فارسی" dark={dark} accent={s.accent}>
                <div
                  className="rounded-xl border p-3.5 shadow-xs"
                  style={{
                    borderColor: s.border,
                    background: dark ? '#221e1a' : '#fdf8f0',
                  }}
                >
                  <p className="text-base font-bold leading-relaxed text-gold-900 dark:text-gold-100">
                    {displayTranslation}
                  </p>
                </div>
              </Section>
            )}

            {/* English Definition */}
            {result.definition && (
              <Section label="English definition" dark={dark} accent={s.accent}>
                <p className="text-sm leading-relaxed" dir="ltr" lang="en">
                  {result.definition}
                </p>
              </Section>
            )}

            {/* Example sentence */}
            {result.example && (
              <Section label="مثال کاربردی" dark={dark} accent={s.accent}>
                <div
                  className="rounded-lg border-s-3 ps-3 py-1 text-sm italic leading-relaxed"
                  style={{ borderColor: s.accent }}
                  dir="ltr"
                  lang="en"
                >
                  “{result.example}”
                </div>
              </Section>
            )}

            {/* Synonyms */}
            {result.synonyms && result.synonyms.length > 0 && (
              <Section
                label="مترادف‌ها (کلیک برای مشاهده)"
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

            {/* Antonyms */}
            {result.antonyms && result.antonyms.length > 0 && (
              <Section
                label="متضادها (کلیک برای مشاهده)"
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

            {/* Related Words */}
            {result.relatedWords && result.relatedWords.length > 0 && (
              <Section
                label="کلمات هم‌خانواده و مرتبط"
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

            {/* Etymology */}
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
        className="flex items-center justify-between border-t px-5 py-3"
        style={{ borderColor: s.border }}
      >
        <span className="text-[11px] opacity-60">
          دیکشنری هوشمند بوکزی
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            بستن
          </Button>
          <Button
            size="sm"
            onClick={addToVocab}
            disabled={!result || loading}
            className="gap-1.5 font-medium shadow"
            style={
              !dark ? { background: s.accent, color: '#fff' } : undefined
            }
          >
            <BookmarkPlus className="h-4 w-4" />
            افزودن به واژگان
          </Button>
        </div>
      </div>
    </motion.div>
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
        <span className="text-xs font-bold uppercase tracking-wide opacity-75">
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
          className="rounded-full border px-2.5 py-1 text-xs font-medium transition-[transform,opacity,colors,border-color,background-color] hover:scale-105 active:scale-95"
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
