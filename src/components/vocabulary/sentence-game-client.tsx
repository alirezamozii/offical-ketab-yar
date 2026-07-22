'use client'

/**
 * SentenceGameClient — "جمله‌سازی" (sentence building) game mode.
 *
 * A Persian translation is shown as the prompt, plus the scrambled
 * English words of the original sentence. The user clicks the tiles in
 * order to reconstruct the English sentence; a "بازگشت" button removes
 * the last placed tile and "تأیید" submits.
 *
 * Source sentences: pulled from saved vocabulary words' `context` field
 * (the example sentence captured when the word was added from a book).
 * Words whose `context` has ≥ 4 tokens are eligible. Falls back to
 * fetching sentences from `/api/vocabulary/daily-words` if no saved
 * words have contexts (so the game is still playable for new users).
 *
 * Difficulty scales timer + sentence length:
 *   easy   ≤ 6 tokens, 40s
 *   medium ≤ 8 tokens, 35s
 *   hard   ≤ 12 tokens, 30s
 */

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlignLeft, Check, Delete, X } from 'lucide-react'
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

interface SentenceQuestion {
  word: VocabWord // for SRS tracking
  sentence: string // the target English sentence
  translation: string // the Persian prompt (word.translation)
  tokens: string[] // split + cleaned tokens of `sentence`
}

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { maxTokens: number; seconds: number; xpPerCorrect: number }
> = {
  easy: { maxTokens: 6, seconds: 40, xpPerCorrect: 25 },
  medium: { maxTokens: 8, seconds: 35, xpPerCorrect: 35 },
  hard: { maxTokens: 12, seconds: 30, xpPerCorrect: 50 },
}

const MAX_HEARTS = 3
const QUESTIONS_PER_GAME = 5
const PREFS_KEY = `${STORAGE_KEYS.vocabGamePrefs}:sentence`

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

/** Split an English sentence into clean word tokens (punctuation stripped). */
function tokenize(s: string): string[] {
  return (s || '')
    .replace(/['".,!?;:()[]{}—–-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

/** Reconstruct the normalised sentence from tokens for comparison. */
function joinTokens(tokens: string[]): string {
  return tokens.map((t) => t.toLowerCase()).join(' ')
}

function buildQuestions(
  words: VocabWord[],
  difficulty: Difficulty,
): SentenceQuestion[] {
  const cfg = DIFFICULTY_CONFIG[difficulty]
  const eligible = words.filter((w) => {
    if (!w.context || !w.context.trim()) return false
    const tokens = tokenize(w.context)
    return tokens.length >= 4 && tokens.length <= cfg.maxTokens
  })
  if (eligible.length < 3) return []
  const pool = shuffle(eligible)
  const count = Math.min(QUESTIONS_PER_GAME, pool.length)
  return pool.slice(0, count).map((w) => {
    // We've already filtered out words without a non-empty context.
    const ctx = (w.context ?? '').trim()
    const tokens = tokenize(ctx)
    return {
      word: w,
      sentence: ctx,
      translation: w.translation || '(بدون ترجمه)',
      tokens,
    }
  })
}

export function SentenceGameClient() {
  const srs = useSrs()
  const sound = useVocabSounds()
  const reduceMotion = useReducedMotion()

  const [words, setWords] = useState<VocabWord[]>([])
  const [loading, setLoading] = useState(true)
  const [difficulty, setDifficultyState] = useState<Difficulty>('medium')
  const [state, setState] = useState<'idle' | 'playing' | 'finished'>('idle')
  const [questions, setQuestions] = useState<SentenceQuestion[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [hearts, setHearts] = useState(MAX_HEARTS)
  const [timeLeft, setTimeLeft] = useState(35)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [, setBestStreak] = useState(0)
  const [multiplier, setMultiplier] = useState(1)
  const [bestMultiplier, setBestMultiplier] = useState(1)
  const [totalXP, setTotalXP] = useState(0)
  const [learnedCount, setLearnedCount] = useState(0)
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none')

  // The order the user has clicked tiles in (indexes into `shuffledTokens`).
  const [placedOrder, setPlacedOrder] = useState<number[]>([])
  // The shuffled token layout (stable per question).
  const [shuffledTokens, setShuffledTokens] = useState<string[]>([])

  const stateRef = useRef(state)
  const heartsRef = useRef(hearts)
  const soundRef = useRef(sound)
  const difficultyRef = useRef(difficulty)
  const srsReviewRef = useRef(srs.review)
  const feedbackRef = useRef(feedback)
  const qIndexRef = useRef(qIndex)
  const questionsRef = useRef(questions)
  const placedRef = useRef(placedOrder)
  const multiplierRef = useRef(multiplier)
  const streakRef = useRef(streak)
  const cfgRef = useRef(DIFFICULTY_CONFIG[difficulty])

  useEffect(() => {
    stateRef.current = state
  }, [state])
  useEffect(() => {
    heartsRef.current = hearts
  }, [hearts])
  useEffect(() => {
    soundRef.current = sound
  }, [sound])
  useEffect(() => {
    difficultyRef.current = difficulty
    cfgRef.current = DIFFICULTY_CONFIG[difficulty]
  }, [difficulty])
  useEffect(() => {
    srsReviewRef.current = srs.review
  }, [srs.review])
  useEffect(() => {
    feedbackRef.current = feedback
  }, [feedback])
  useEffect(() => {
    qIndexRef.current = qIndex
  }, [qIndex])
  useEffect(() => {
    questionsRef.current = questions
  }, [questions])
  useEffect(() => {
    placedRef.current = placedOrder
  }, [placedOrder])
  useEffect(() => {
    multiplierRef.current = multiplier
  }, [multiplier])
  useEffect(() => {
    streakRef.current = streak
  }, [streak])

  // Load prefs + words on mount.
  useEffect(() => {
    const p = loadPrefs()
    setDifficultyState(p.difficulty)
    fetch('/api/vocabulary')
      .then((r) => (r.ok ? r.json() : []))
      .then((d: VocabWord[]) => setWords(d))
      .catch(() => setWords([]))
      .finally(() => setLoading(false))
  }, [])

  const cfg = DIFFICULTY_CONFIG[difficulty]

  const hasEnoughWords = useMemo(() => {
    return (
      words.filter((w) => {
        if (!w.context || !w.context.trim()) return false
        const tokens = tokenize(w.context)
        return tokens.length >= 4 && tokens.length <= cfg.maxTokens
      }).length >= 3
    )
  }, [words, cfg])

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

  const current = questions[qIndex]

  const loadQuestion = useCallback((q: SentenceQuestion) => {
    // Shuffle the tokens for display. Keep the original `q.tokens` for
    // answer-checking.
    setShuffledTokens(shuffle(q.tokens))
    setPlacedOrder([])
    setFeedback('none')
    setTimeLeft(cfgRef.current.seconds)
  }, [])

  const startGame = useCallback(() => {
    const qs = buildQuestions(words, difficulty)
    if (qs.length === 0) {
      toast.error('جمله‌های کافی نیست — هنگام مطالعه کلمات را ذخیره کنید')
      return
    }
    setQuestions(qs)
    setQIndex(0)
    setHearts(MAX_HEARTS)
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setMultiplier(1)
    setBestMultiplier(1)
    setTotalXP(0)
    setLearnedCount(0)
    setFeedback('none')
    setState('playing')
    loadQuestion(qs[0])
  }, [words, difficulty, loadQuestion])

  // Countdown timer.
  useEffect(() => {
    if (state !== 'playing' || feedback !== 'none') return
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          return 0
        }
        if (t <= 3) soundRef.current.play('tick')
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [state, feedback, qIndex])

  // Advance to next question, or finish if there are no more.
  const advanceOrFinish = useCallback(() => {
    if (qIndexRef.current + 1 >= questionsRef.current.length) {
      finishGame()
      return
    }
    const ni = qIndexRef.current + 1
    setQIndex(ni)
    loadQuestion(questionsRef.current[ni])
  }, [finishGame, loadQuestion])

  // Timeout: count as wrong + advance.
  useEffect(() => {
    if (state !== 'playing' || feedback !== 'none') return
    if (timeLeft > 0) return
    // Time's up — mark wrong (no SRS review on timeout).
    setFeedback('wrong')
    setStreak(0)
    setMultiplier(1)
    setHearts((h) => Math.max(0, h - 1))
    soundRef.current.play('timeout')
    recordVocabReview(1)
    const id = setTimeout(() => advanceOrFinish(), 1800)
    return () => clearTimeout(id)
  }, [timeLeft, state, feedback, advanceOrFinish])

  // End game when hearts hit 0.
  useEffect(() => {
    if (state !== 'playing') return
    if (hearts <= 0 && feedback === 'none') {
      finishGame()
    }
  }, [hearts, state, feedback, finishGame])

  function clickTile(tileIdx: number) {
    if (feedback !== 'none') return
    if (placedOrder.includes(tileIdx)) return
    setPlacedOrder((prev) => [...prev, tileIdx])
  }

  function removeLast() {
    if (feedback !== 'none') return
    setPlacedOrder((prev) => prev.slice(0, -1))
  }

  function submit() {
    if (feedback !== 'none' || !current) return
    const arranged = placedOrder.map((i) => shuffledTokens[i])
    const userAnswer = joinTokens(arranged)
    const target = joinTokens(current.tokens)
    if (userAnswer !== target) {
      setFeedback('wrong')
      setStreak(0)
      setMultiplier(1)
      setHearts((h) => Math.max(0, h - 1))
      soundRef.current.play('wrong')
      recordVocabReview(1)
      srsReviewRef.current(current.word.id, false)
      setTimeout(() => advanceOrFinish(), 2200)
      return
    }
    // Correct!
    const newStreak = streakRef.current + 1
    const newMultiplier = Math.min(3, 1 + Math.floor(newStreak / 3) * 0.5)
    const gained = Math.round(cfgRef.current.xpPerCorrect * newMultiplier)
    setStreak(newStreak)
    setBestStreak((b) => Math.max(b, newStreak))
    if (newMultiplier > multiplierRef.current) {
      setMultiplier(newMultiplier)
      setBestMultiplier((b) => Math.max(b, newMultiplier))
      soundRef.current.play('streak')
    }
    setScore((s) => s + 1)
    setTotalXP((x) => x + gained)
    setFeedback('correct')
    soundRef.current.play('correct')
    recordVocabReview(1)
    const result = srsReviewRef.current(current.word.id, true)
    if (result.leveledTo5 || result.leveledToMastered) {
      setLearnedCount((c) => c + 1)
    }
    setTimeout(() => advanceOrFinish(), 1500)
  }

  if (loading) {
    return <GameLoading />
  }

  if (!hasEnoughWords) {
    return (
      <GameEmpty
        icon={<AlignLeft className="h-7 w-7" />}
        message={
          'برای بازی جمله‌سازی، حداقل ۳ واژه با جملهٔ نمونه لازم است. هنگام مطالعه کلمات را از داخل کتاب به واژگان اضافه کنید (جملهٔ نمونه خودکار ذخیره می‌شود).'
        }
      />
    )
  }

  if (state === 'finished') {
    const acc =
      questions.length > 0
        ? Math.round((score / questions.length) * 100)
        : 0
    return (
      <GameResult
        title="بازی تمام شد!"
        subtitle={`${score} از ${questions.length} جمله ساخته شد`}
        stats={[
          { label: 'امتیاز', value: `${score}/${questions.length}` },
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
        icon={<AlignLeft className="h-8 w-8" />}
        title="جمله‌سازی"
        description="ترجمه فارسی را ببین، کلمات انگلیسی را به ترتیب درست بچین تا جمله بسازی. هر جمله درست XP می‌آورد و با زنجیره درست، ضریب امتیاز بالا می‌رود!"
        stats={[
          { value: String(QUESTIONS_PER_GAME), label: 'جمله', color: 'gold' },
          { value: String(MAX_HEARTS), label: 'جان', color: 'red' },
          {
            value: `+${cfg.xpPerCorrect}`,
            label: 'XP هر درست',
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
  if (!current) return null
  const arranged = placedOrder.map((i) => shuffledTokens[i])
  const showState = feedback !== 'none'
  const userAnswerStr = arranged.join(' ')
  const targetStr = current.tokens.join(' ')

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
        {Array.from({ length: questions.length }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-[transform,opacity,colors,border-color,background-color]',
              i === qIndex
                ? 'w-6 bg-gold-500'
                : i < qIndex
                  ? 'w-1.5 bg-emerald-500'
                  : 'w-1.5 bg-muted',
            )}
          />
        ))}
      </div>
      <div className="mb-4 flex items-center justify-center gap-2 text-sm">
        <span
          className={cn(
            'font-bold tabular-nums',
            timeLeft <= 5 ? 'text-red-500' : '',
          )}
        >
          {timeLeft}ث
        </span>
        <span className="text-muted-foreground">
          · جمله {qIndex + 1} از {questions.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={qIndex}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
        >
          {/* Translation prompt */}
          <div
            className={cn(
              'mb-6 rounded-2xl border-2 p-6 text-center shadow-sm',
              showState && feedback === 'correct'
                ? 'border-emerald-500 bg-emerald-500/10'
                : showState && feedback === 'wrong'
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-border/60 bg-card',
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              این جمله را بساز
            </p>
            <h2 className="mt-3 text-xl font-extrabold leading-tight sm:text-2xl">
              {current.translation}
            </h2>
          </div>

          {/* Build area (the arranged tiles) */}
          <div
            className={cn(
              'mb-4 min-h-16 rounded-xl border-2 border-dashed p-3 transition-colors',
              showState && feedback === 'correct'
                ? 'border-emerald-500 bg-emerald-500/5'
                : showState && feedback === 'wrong'
                  ? 'border-red-500 bg-red-500/5'
                  : 'border-border bg-muted/30',
            )}
            dir="ltr"
          >
            {arranged.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">
                کلمات را به ترتیب کلیک کن…
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {arranged.map((tok, i) => (
                  <span
                    key={`${tok}-${i}`}
                    className="rounded-lg bg-gold-500/20 px-2.5 py-1 text-sm font-bold text-gold-700 dark:text-gold-300"
                  >
                    {tok}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Tile pool */}
          {!showState && (
            <div className="flex flex-wrap justify-center gap-2" dir="ltr">
              {shuffledTokens.map((tok, i) => {
                const used = placedOrder.includes(i)
                return (
                  <motion.button
                    key={`pool-${i}`}
                    whileHover={!used ? { scale: 1.05 } : {}}
                    whileTap={!used ? { scale: 0.95 } : {}}
                    onClick={() => clickTile(i)}
                    disabled={used}
                    className={cn(
                      'rounded-xl border-2 px-3 py-2 text-sm font-bold transition-[transform,opacity,colors,border-color,background-color]',
                      used
                        ? 'border-muted bg-muted/40 text-muted-foreground/40 line-through'
                        : 'border-border bg-card hover:border-primary/50',
                    )}
                  >
                    {tok}
                  </motion.button>
                )
              })}
            </div>
          )}

          {/* Action buttons */}
          {!showState && (
            <div className="mt-5 flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={removeLast}
                disabled={placedOrder.length === 0}
                className="gap-1"
              >
                <Delete className="h-4 w-4" />
                بازگشت
              </Button>
              <Button
                variant="glow"
                onClick={submit}
                disabled={
                  placedOrder.length !== shuffledTokens.length ||
                  shuffledTokens.length === 0
                }
                className="gap-1"
              >
                <Check className="h-4 w-4" />
                تأیید
              </Button>
            </div>
          )}

          {/* Feedback */}
          {showState && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'mt-4 rounded-xl p-4 text-center',
                feedback === 'correct'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'bg-red-500/10 text-red-700 dark:text-red-400',
              )}
            >
              <p className="flex items-center justify-center gap-2 font-bold">
                {feedback === 'correct' ? (
                  <>
                    <Check className="h-4 w-4" />
                    {`آفرین! +${Math.round(
                      cfg.xpPerCorrect * multiplier,
                    )} XP${multiplier > 1 ? ` (×${multiplier})` : ''}`}
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    نادرست
                  </>
                )}
              </p>
              {feedback === 'wrong' && (
                <p className="mt-2 text-sm" dir="ltr">
                  <span className="text-xs text-muted-foreground">
                    جمله درست:
                  </span>{' '}
                  <span className="font-bold">{targetStr}</span>
                </p>
              )}
              {feedback === 'wrong' && userAnswerStr && (
                <p className="mt-1 text-xs" dir="ltr">
                  <span className="text-muted-foreground">پاسخ تو:</span>{' '}
                  <span>{userAnswerStr}</span>
                </p>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <a href="/vocabulary">بازگشت به واژگان</a>
        </Button>
      </div>
    </div>
  )
}
