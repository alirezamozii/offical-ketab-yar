'use client'

/**
 * MatchGameClient — "تطبیق کلمات" (word matching) game mode.
 *
 * 5 English words + 5 Persian translations are shown in a 2-column
 * grid (shuffled independently). Click an English word, then click
 * its matching Persian translation — a correct pair locks in green,
 * a wrong pair flashes red and clears. Beat the timer to earn XP
 * (combo multiplier applies for streaks of correct matches).
 *
 * Difficulty scales the pair count (easy 4 / medium 5 / hard 6) and
 * the timer (easy 60s / medium 50s / hard 40s).
 *
 * Lives: each wrong match costs a heart; running out ends the game.
 * Each correct pair awards XP scaled by the current combo multiplier.
 */

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, Layers, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  GameEmpty,
  GameLoading,
} from '@/components/vocabulary/game-states'
import { GameIntro } from '@/components/vocabulary/game-intro'
import { GameResult } from '@/components/vocabulary/game-result'
import { useVocabSounds } from '@/components/vocabulary/use-vocab-sounds'
import { recordVocabReview } from '@/components/vocabulary/use-vocab-activity'
import { useSrs } from '@/hooks/reader/use-srs'
import { postXP } from '@/lib/xp-events'
import {
  shuffle,
  type VocabWord,
} from '@/components/vocabulary/game-utils'
import type { Difficulty } from '@/hooks/reader/use-vocab-game'
import { Button } from '@/components/ui/button'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { cn } from '@/lib/utils'

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { pairs: number; seconds: number; xpPerPair: number }
> = {
  easy: { pairs: 4, seconds: 60, xpPerPair: 20 },
  medium: { pairs: 5, seconds: 50, xpPerPair: 25 },
  hard: { pairs: 6, seconds: 40, xpPerPair: 30 },
}

const MAX_HEARTS = 3
const PREFS_KEY = `${STORAGE_KEYS.vocabGamePrefs}:matching`

function loadPrefs(): { difficulty: Difficulty; soundEnabled: boolean } {
  if (typeof window === 'undefined')
    return { difficulty: 'medium', soundEnabled: true }
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return { difficulty: 'medium', soundEnabled: true }
    const v = JSON.parse(raw)
    return {
      difficulty:
        v?.difficulty === 'easy' ||
        v?.difficulty === 'medium' ||
        v?.difficulty === 'hard'
          ? v.difficulty
          : 'medium',
      soundEnabled: typeof v?.soundEnabled === 'boolean' ? v.soundEnabled : true,
    }
  } catch {
    return { difficulty: 'medium', soundEnabled: true }
  }
}

function savePrefs(p: { difficulty: Difficulty; soundEnabled: boolean }) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p))
  } catch {}
}

type CardSide = 'en' | 'fa'
type CardState = 'idle' | 'selected' | 'matched' | 'wrong'

interface Card {
  id: string // unique card id (e.g. `${wordId}-en`)
  wordId: string
  side: CardSide
  text: string
  state: CardState
}

function buildCards(words: VocabWord[], pairCount: number): Card[] {
  const withTranslation = words.filter(
    (w) => w.word && w.word.trim() && w.translation && w.translation.trim(),
  )
  if (withTranslation.length < 4) return []
  const pool = shuffle(withTranslation).slice(
    0,
    Math.min(pairCount, withTranslation.length),
  )
  const enCards: Card[] = pool.map((w) => ({
    id: `${w.id}-en`,
    wordId: w.id,
    side: 'en',
    text: w.word,
    state: 'idle',
  }))
  const faCards: Card[] = pool.map((w) => ({
    id: `${w.id}-fa`,
    wordId: w.id,
    side: 'fa',
    text: w.translation,
    state: 'idle',
  }))
  return [...shuffle(enCards), ...shuffle(faCards)]
}

export function MatchGameClient() {
  const srs = useSrs()
  const sound = useVocabSounds()
  const reduceMotion = useReducedMotion()

  const [words, setWords] = useState<VocabWord[]>([])
  const [loading, setLoading] = useState(true)
  const [difficulty, setDifficultyState] = useState<Difficulty>('medium')
  const [state, setState] = useState<'idle' | 'playing' | 'finished'>('idle')
  const [cards, setCards] = useState<Card[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hearts, setHearts] = useState(MAX_HEARTS)
  const [timeLeft, setTimeLeft] = useState(50)
  const [pairsMatched, setPairsMatched] = useState(0)
  const [totalXP, setTotalXP] = useState(0)
  const [streak, setStreak] = useState(0)
  const [, setBestStreak] = useState(0)
  const [multiplier, setMultiplier] = useState(1)
  const [bestMultiplier, setBestMultiplier] = useState(1)
  const [learnedCount, setLearnedCount] = useState(0)
  const [attempts, setAttempts] = useState(0)

  const stateRef = useRef(state)
  const selectedRef = useRef(selectedId)
  const heartsRef = useRef(hearts)
  const soundRef = useRef(sound)
  const difficultyRef = useRef(difficulty)
  const srsReviewRef = useRef(srs.review)

  useEffect(() => {
    stateRef.current = state
  }, [state])
  useEffect(() => {
    selectedRef.current = selectedId
  }, [selectedId])
  useEffect(() => {
    heartsRef.current = hearts
  }, [hearts])
  useEffect(() => {
    soundRef.current = sound
  }, [sound])
  useEffect(() => {
    difficultyRef.current = difficulty
  }, [difficulty])
  useEffect(() => {
    srsReviewRef.current = srs.review
  }, [srs.review])

  // Load prefs + words on mount.
  useEffect(() => {
    const p = loadPrefs()
    setDifficultyState(p.difficulty)
    if (typeof window !== 'undefined') {
      try {
        if (!p.soundEnabled) soundRef.current.setEnabled(false)
      } catch {}
    }
    fetch('/api/vocabulary')
      .then((r) => (r.ok ? r.json() : []))
      .then((d: VocabWord[]) => setWords(d))
      .catch(() => setWords([]))
      .finally(() => setLoading(false))
  }, [])

  const cfg = DIFFICULTY_CONFIG[difficulty]

  const hasEnoughWords = useMemo(() => {
    return (
      words.filter(
        (w) =>
          w.word &&
          w.word.trim() &&
          w.translation &&
          w.translation.trim(),
      ).length >= 4
    )
  }, [words])

  const setDifficulty = useCallback((d: Difficulty) => {
    setDifficultyState(d)
    savePrefs({ difficulty: d, soundEnabled: soundRef.current.enabled })
  }, [])

  const finishGame = useCallback(() => {
    setState('finished')
    if (totalXP > 0) {
      postXP({
        pagesRead: 0,
        completedBook: false,
        bookLevel: 'beginner',
        isFirstReadToday: false,
        vocabGameXP: totalXP,
      }).catch(() => {})
    }
    soundRef.current.play('gameover')
  }, [totalXP])

  const startGame = useCallback(() => {
    const built = buildCards(words, cfg.pairs)
    if (built.length === 0) {
      toast.error('حداقل ۴ واژه با ترجمه لازم است')
      return
    }
    setCards(built)
    setSelectedId(null)
    setHearts(MAX_HEARTS)
    setTimeLeft(cfg.seconds)
    setPairsMatched(0)
    setTotalXP(0)
    setStreak(0)
    setBestStreak(0)
    setMultiplier(1)
    setBestMultiplier(1)
    setLearnedCount(0)
    setAttempts(0)
    setState('playing')
  }, [words, cfg])

  // Countdown timer — only while playing.
  useEffect(() => {
    if (state !== 'playing') return
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time's up — end the game.
          return 0
        }
        if (t <= 3) soundRef.current.play('tick')
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [state])

  // End game when time runs out or hearts hit 0.
  useEffect(() => {
    if (state !== 'playing') return
    if (timeLeft <= 0 || hearts <= 0) {
      finishGame()
    }
  }, [timeLeft, hearts, state, finishGame])

  // Win condition: all pairs matched.
  useEffect(() => {
    if (state !== 'playing') return
    let id: number | undefined
    if (cards.length > 0 && pairsMatched === cfg.pairs) {
      // Tiny delay so the final match's flash is visible.
      id = window.setTimeout(() => finishGame(), 600)
    }
    return () => {
      if (id !== undefined) window.clearTimeout(id)
    }
  }, [pairsMatched, cards.length, state, cfg.pairs, finishGame])

  function clickCard(card: Card) {
    if (state !== 'playing') return
    if (card.state === 'matched' || card.state === 'wrong') return
    // Can't re-click the already-selected card.
    if (selectedId === card.id) {
      setSelectedId(null)
      setCards((prev) =>
        prev.map((c) =>
          c.id === card.id ? { ...c, state: 'idle' as CardState } : c,
        ),
      )
      return
    }

    // If no card is currently selected, just select this one.
    if (!selectedRef.current) {
      setSelectedId(card.id)
      setCards((prev) =>
        prev.map((c) =>
          c.id === card.id ? { ...c, state: 'selected' as CardState } : c,
        ),
      )
      return
    }

    // A card is already selected — this is an attempt.
    const prevCard = cards.find((c) => c.id === selectedRef.current)
    if (!prevCard) {
      setSelectedId(card.id)
      return
    }
    setAttempts((a) => a + 1)
    recordVocabReview(1)

    // Must be on opposite sides to count as a match attempt.
    if (prevCard.side === card.side) {
      // Switch selection to the newly-clicked card.
      setSelectedId(card.id)
      setCards((prev) =>
        prev.map((c) => {
          if (c.id === prevCard.id) return { ...c, state: 'idle' as CardState }
          if (c.id === card.id) return { ...c, state: 'selected' as CardState }
          return c
        }),
      )
      return
    }

    // Check match by wordId.
    if (prevCard.wordId === card.wordId) {
      // Correct!
      const newStreak = streak + 1
      const newMultiplier = Math.min(3, 1 + Math.floor(newStreak / 3) * 0.5)
      const gained = Math.round(cfg.xpPerPair * newMultiplier)
      setStreak(newStreak)
      setBestStreak((b) => Math.max(b, newStreak))
      if (newMultiplier > multiplier) {
        setMultiplier(newMultiplier)
        setBestMultiplier((b) => Math.max(b, newMultiplier))
        soundRef.current.play('streak')
      }
      setTotalXP((x) => x + gained)
      setPairsMatched((p) => p + 1)
      setSelectedId(null)
      setCards((prev) =>
        prev.map((c) =>
          c.wordId === card.wordId
            ? { ...c, state: 'matched' as CardState }
            : c,
        ),
      )
      soundRef.current.play('correct')
      // SRS: mark this word as reviewed (correct).
      const result = srsReviewRef.current(card.wordId, true)
      if (result.leveledTo5 || result.leveledToMastered) {
        setLearnedCount((c) => c + 1)
      }
    } else {
      // Wrong — flash both red, then clear.
      setStreak(0)
      setMultiplier(1)
      setHearts((h) => Math.max(0, h - 1))
      soundRef.current.play('wrong')
      srsReviewRef.current(card.wordId, false)
      // Also mark the previously-selected card's word as wrong-reviewed
      // (so the SRS reflects the failed attempt for both).
      srsReviewRef.current(prevCard.wordId, false)
      setSelectedId(null)
      setCards((prev) =>
        prev.map((c) => {
          if (c.id === prevCard.id || c.id === card.id) {
            return { ...c, state: 'wrong' as CardState }
          }
          return c
        }),
      )
      // After a brief flash, reset the wrong cards.
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.state === 'wrong' ? { ...c, state: 'idle' as CardState } : c,
          ),
        )
      }, 700)
    }
  }

  if (loading) {
    return <GameLoading />
  }

  if (!hasEnoughWords) {
    return (
      <GameEmpty
        icon={<Layers className="h-7 w-7" />}
        message={
          'برای بازی تطبیق کلمات حداقل ۴ واژه با ترجمه لازم است. هنگام مطالعه کلمات را ذخیره کنید یا دستی اضافه کنید.'
        }
      />
    )
  }

  if (state === 'finished') {
    const acc =
      attempts > 0 ? Math.round((pairsMatched / attempts) * 100) : 0
    const won = pairsMatched === cfg.pairs
    return (
      <GameResult
        title={won ? 'آفرین! همه جفت‌ها را پیدا کردی!' : 'بازی تمام شد!'}
        subtitle={`${pairsMatched} از ${cfg.pairs} جفت در ${attempts} تلاش`}
        stats={[
          { label: 'جفت‌ها', value: `${pairsMatched}/${cfg.pairs}` },
          { label: 'دقت', value: `${acc}٪` },
          { label: 'XP', value: `+${totalXP}`, highlight: 'gold' },
          {
            label: 'یاد گرفته',
            value: String(learnedCount),
            highlight: 'emerald',
          },
        ]}
        bestMultiplier={bestMultiplier}
        learnedContent={
          learnedCount > 0 ? (
            <>{learnedCount} واژه به سطح «یاد گرفته شد» رسید!</>
          ) : undefined
        }
        onPlayAgain={startGame}
        playAgainLabel="دوباره بازی"
      />
    )
  }

  if (state === 'idle') {
    return (
      <GameIntro
        icon={<Layers className="h-8 w-8" />}
        title="تطبیق کلمات"
        description="کلمات انگلیسی را به ترجمه فارسی‌شان وصل کن. هر جفت درست XP می‌آورد و با زنجیره درست، ضریب امتیاز بالا می‌رود!"
        stats={[
          { value: String(cfg.pairs), label: 'جفت', color: 'gold' },
          { value: String(MAX_HEARTS), label: 'جان', color: 'red' },
          {
            value: `+${cfg.xpPerPair}`,
            label: 'XP هر جفت',
            color: 'emerald',
          },
        ]}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        soundEnabled={sound.enabled}
        onToggleSound={sound.toggle}
        onStart={startGame}
      />
    )
  }

  // PLAYING state
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      {/* HUD */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: MAX_HEARTS }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'inline-block h-2.5 w-2.5 rounded-full transition-colors',
                i < hearts ? 'bg-red-500' : 'bg-muted-foreground/30',
              )}
              aria-label={i < hearts ? 'جان باقی' : 'جان از دست رفته'}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-gold-600 dark:text-gold-400">
            {totalXP} XP
          </span>
          {streak >= 2 && (
            <motion.span
              key={`s-${streak}`}
              initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-bold text-orange-600 dark:text-orange-400"
            >
              🔥 {streak}
            </motion.span>
          )}
          {multiplier > 1 && (
            <motion.span
              key={`m-${multiplier}`}
              initial={reduceMotion ? false : { scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 rounded-full bg-gold-500/20 px-2 py-0.5 text-xs font-extrabold text-gold-700 dark:text-gold-300"
            >
              ×{multiplier}
            </motion.span>
          )}
        </div>
      </div>
      <div className="mb-5 flex justify-center gap-1.5">
        {Array.from({ length: cfg.pairs }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-[transform,opacity,colors,border-color,background-color]',
              i < pairsMatched ? 'w-4 bg-emerald-500' : 'w-1.5 bg-muted',
            )}
          />
        ))}
      </div>
      <div className="mb-4 flex items-center justify-center gap-2 text-sm">
        <span
          className={cn(
            'font-bold tabular-nums',
            timeLeft <= 10 ? 'text-red-500' : '',
          )}
        >
          {timeLeft}ث
        </span>
        <span className="text-muted-foreground">
          · {pairsMatched} از {cfg.pairs} جفت
        </span>
      </div>

      {/* Cards grid: 2 columns (English | Persian) */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card, i) => {
          const isEn = card.side === 'en'
          return (
            <motion.button
              key={card.id}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : i * 0.03, duration: 0.25 }}
              whileHover={
                card.state === 'idle' || card.state === 'selected'
                  ? { scale: 1.02 }
                  : {}
              }
              whileTap={
                card.state === 'idle' || card.state === 'selected'
                  ? { scale: 0.98 }
                  : {}
              }
              onClick={() => clickCard(card)}
              disabled={card.state === 'matched' || card.state === 'wrong'}
              className={cn(
                'flex min-h-16 items-center justify-center rounded-2xl border-2 p-4 text-center font-bold transition-[transform,opacity,colors,border-color,background-color]',
                isEn ? 'text-base' : 'text-base',
                card.state === 'idle' &&
                  'border-border bg-card hover:border-primary/50',
                card.state === 'selected' &&
                  'border-gold-500 bg-gold-500/15 text-gold-700 dark:text-gold-300',
                card.state === 'matched' &&
                  'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
                card.state === 'wrong' &&
                  'border-red-500 bg-red-500/15 text-red-700 dark:text-red-400',
              )}
              dir={isEn ? 'ltr' : 'rtl'}
              aria-label={
                isEn
                  ? `کلمه انگلیسی ${card.text}`
                  : `ترجمه فارسی ${card.text}`
              }
            >
              <span className="flex items-center gap-1.5">
                {card.state === 'matched' && (
                  <Check className="h-4 w-4 shrink-0" />
                )}
                {card.state === 'wrong' && (
                  <X className="h-4 w-4 shrink-0" />
                )}
                <span className="line-clamp-2">{card.text}</span>
              </span>
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {selectedId && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 text-center text-xs text-muted-foreground"
          >
            یک کارت از ستون دیگر انتخاب کن تا جفت بسازی
          </motion.p>
        )}
      </AnimatePresence>

      {/* Footer actions */}
      <div className="mt-8 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <a href="/vocabulary">بازگشت به واژگان</a>
        </Button>
        <Button
          onClick={startGame}
          variant="outline"
          size="sm"
          className="gap-1"
        >
          شروع دوباره
        </Button>
      </div>
    </div>
  )
}
