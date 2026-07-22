'use client'

/**
 * useVocabGame — generic game-state hook for the vocabulary mini-games
 * (match / listen / spell / matching / sentence). Encapsulates the
 * shared state machine:
 *
 *   idle → playing → finished
 *
 * Handles: lives (3 hearts), score, streak/best-streak, total XP,
 * per-question countdown timer, question queue management, answer
 * evaluation (correct/wrong feedback), XP awarding via /api/xp, SRS
 * integration (calls srs.review on each answer), combo multiplier
 * (every 3 correct in a row bumps the XP multiplier), difficulty
 * levels (easy/medium/hard affecting timer + word pool), and Web
 * Audio sound effects (correct/wrong/streak/gameover).
 *
 * Game-specific concerns (building questions, checking correctness,
 * speech-synthesis side effects) are supplied via options so each game
 * file only keeps what makes it unique.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useSrs } from '@/hooks/reader/use-srs'
import { postXP } from '@/lib/xp-events'
import { recordVocabReview } from '@/components/vocabulary/use-vocab-activity'
import {
  useVocabSounds,
  type UseVocabSoundsReturn,
} from '@/components/vocabulary/use-vocab-sounds'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import type { VocabWord } from '@/components/vocabulary/game-utils'

export type GameState = 'idle' | 'playing' | 'finished'
export type Feedback = 'none' | 'correct' | 'wrong'
export type Difficulty = 'easy' | 'medium' | 'hard'

/** Per-game prefs persisted across sessions. */
interface VocabGamePrefs {
  difficulty: Difficulty
  soundEnabled: boolean
}

const PREFS_KEY = STORAGE_KEYS.vocabGamePrefs

function loadGamePrefs(): VocabGamePrefs {
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

/** Multiplier applied to secondsPerQuestion for each difficulty. */
const DIFFICULTY_TIME_SCALE: Record<Difficulty, number> = {
  easy: 1.4,
  medium: 1.0,
  hard: 0.75,
}

/** Word-pool size scaling per difficulty (used by the hook when
 * filtering words before passing to buildQuestions). */
const DIFFICULTY_QUESTIONS_SCALE: Record<Difficulty, number> = {
  easy: 0.7,
  medium: 1.0,
  hard: 1.0,
}

export interface UseVocabGameOptions<TQuestion> {
  /** Number of questions to aim for per game (medium difficulty). */
  questionsPerGame: number
  /** Countdown seconds awarded per fresh question (medium difficulty). */
  secondsPerQuestion: number
  /** Base XP awarded for a correct answer (before multiplier). */
  xpPerCorrect: number
  /** Bonus XP per remaining second on a correct answer. */
  xpTimeBonus: number
  /** Starting lives (hearts). Default 3. */
  maxHearts?: number
  /** Delay (ms) after a timeout before advancing/finishing. */
  timeoutDelayMs: number
  /** Delay (ms) after a wrong answer before advancing/finishing. */
  wrongDelayMs: number
  /** Delay (ms) after a correct answer before advancing. */
  correctDelayMs: number
  /** Toast message shown when there aren't enough words to start. */
  emptyMessage: string
  /** Filter deciding which words are "usable" (for the empty-state check). */
  wordFilter: (w: VocabWord) => boolean
  /** Build the question queue from the full word list. Return [] if not enough. */
  buildQuestions: (words: VocabWord[]) => TQuestion[]
  /**
   * Optional: filter the word pool based on difficulty. Default = no
   * filtering (all words pass).
   */
  wordDifficultyFilter?: (w: VocabWord, difficulty: Difficulty) => boolean
  /** Return true if `value` is the correct answer for `q`. */
  checkCorrect: (q: TQuestion, value: string) => boolean
  /** SRS word id for a given question (used by srs.review). */
  getWordId: (q: TQuestion) => string
  /** Called once when the game starts, with the first question. */
  onStart?: (q: TQuestion) => void
  /** Called when advancing to a new question (for speech/focus side effects). */
  onAdvance?: (q: TQuestion) => void
  /** Called when the user answers wrong (e.g. speak the correct word). */
  onWrong?: (q: TQuestion) => void
  /** Called when the combo multiplier increases. */
  onMultiplierUp?: (multiplier: number) => void
  /**
   * Game-mode key (used to namespace per-game prefs). E.g. 'match',
   * 'spell', 'listen', 'matching', 'sentence'.
   */
  gameMode?: string
}

export interface UseVocabGameReturn<TQuestion> {
  // data
  words: VocabWord[]
  loading: boolean
  hasEnoughWords: boolean
  state: GameState
  questions: TQuestion[]
  qIndex: number
  currentQuestion: TQuestion | undefined
  // HUD state
  lives: number
  score: number
  streak: number
  bestStreak: number
  totalXP: number
  timeLeft: number
  feedback: Feedback
  /** The user's current pick — '' until they answer (choice games) or type (typed games). */
  picked: string
  learnedCount: number
  xpPerCorrect: number
  xpTimeBonus: number
  /** Current combo multiplier (1, 1.5, 2, 2.5, 3 — capped at 3). */
  multiplier: number
  bestMultiplier: number
  // difficulty + sound
  difficulty: Difficulty
  setDifficulty: (d: Difficulty) => void
  sound: UseVocabSoundsReturn
  // actions
  startGame: () => void
  /** Choice games: submit `value` as the answer. No-op if already answered. */
  answer: (value: string) => void
  /** Typed games: submit the current `picked` value. No-op if empty or already answered. */
  submit: () => void
  /** Update `picked` (typed games bind this to the input). */
  setPicked: (value: string) => void
  resetGame: () => void
}

export function useVocabGame<TQuestion>(
  opts: UseVocabGameOptions<TQuestion>,
): UseVocabGameReturn<TQuestion> {
  const {
    secondsPerQuestion,
    xpPerCorrect,
    xpTimeBonus,
    maxHearts = 3,
    timeoutDelayMs,
    wrongDelayMs,
    correctDelayMs,
    emptyMessage,
    wordFilter,
    buildQuestions,
    wordDifficultyFilter,
    checkCorrect,
    getWordId,
    onStart,
    onAdvance,
    onWrong,
    onMultiplierUp,
    gameMode = 'default',
  } = opts

  const srs = useSrs()
  const sound = useVocabSounds()

  // Per-game-mode persisted prefs (difficulty + sound on/off). We
  // namespace the localStorage value by `gameMode` so each game keeps
  // its own preference.
  const prefsKey = `${PREFS_KEY}:${gameMode}`
  const [difficulty, setDifficultyState] = useState<Difficulty>('medium')

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(prefsKey)
      if (!raw) {
        const base = loadGamePrefs()
        setDifficultyState(base.difficulty)
        return
      }
      const v = JSON.parse(raw)
      setDifficultyState(
        v?.difficulty === 'easy' ||
          v?.difficulty === 'medium' ||
          v?.difficulty === 'hard'
          ? v.difficulty
          : 'medium',
      )
    } catch {
      /* keep default */
    }
  }, [prefsKey])

  const setDifficulty = useCallback(
    (d: Difficulty) => {
      setDifficultyState(d)
      try {
        const raw = localStorage.getItem(prefsKey)
        const cur = raw ? JSON.parse(raw) : {}
        localStorage.setItem(
          prefsKey,
          JSON.stringify({ ...cur, difficulty: d, soundEnabled: sound.enabled }),
        )
      } catch {}
    },
    [prefsKey, sound.enabled],
  )

  // Keep sound preference in sync with storage too (separate from
  // useVocabSounds' own internal storage — we mirror it into the
  // per-game prefs object so loading + toggling stay consistent).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(prefsKey)
      const cur = raw ? JSON.parse(raw) : {}
      if (cur?.soundEnabled !== sound.enabled) {
        localStorage.setItem(
          prefsKey,
          JSON.stringify({ ...cur, difficulty, soundEnabled: sound.enabled }),
        )
      }
    } catch {}
  }, [prefsKey, difficulty, sound.enabled])

  // Effective seconds-per-question for the current difficulty.
  const effectiveSeconds = Math.max(
    3,
    Math.round(secondsPerQuestion * DIFFICULTY_TIME_SCALE[difficulty]),
  )
  const effectiveQuestionsCount = Math.max(
    1,
    Math.round(opts.questionsPerGame * DIFFICULTY_QUESTIONS_SCALE[difficulty]),
  )

  const [words, setWords] = useState<VocabWord[]>([])
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<GameState>('idle')
  const [questions, setQuestions] = useState<TQuestion[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(maxHearts)
  const [timeLeft, setTimeLeft] = useState(effectiveSeconds)
  const [feedback, setFeedback] = useState<Feedback>('none')
  const [picked, setPicked] = useState<string>('')
  const [totalXP, setTotalXP] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [learnedCount, setLearnedCount] = useState(0)
  const [multiplier, setMultiplier] = useState(1)
  const [bestMultiplier, setBestMultiplier] = useState(1)

  // Refs mirror the latest committed state so setTimeout / useEffect
  // callbacks can read fresh values without going stale.
  const livesRef = useRef(lives)
  const qIndexRef = useRef(qIndex)
  const questionsRef = useRef(questions)
  const totalXPRef = useRef(totalXP)
  const pickedRef = useRef(picked)
  const feedbackRef = useRef(feedback)
  const timeLeftRef = useRef(timeLeft)
  const streakRef = useRef(streak)
  const multiplierRef = useRef(multiplier)
  const onStartRef = useRef(onStart)
  const onAdvanceRef = useRef(onAdvance)
  const onWrongRef = useRef(onWrong)
  const onMultiplierUpRef = useRef(onMultiplierUp)
  const checkCorrectRef = useRef(checkCorrect)
  const getWordIdRef = useRef(getWordId)
  const srsReviewRef = useRef(srs.review)
  const soundRef = useRef(sound)
  const difficultyRef = useRef(difficulty)
  const wordDifficultyFilterRef = useRef(wordDifficultyFilter)

  useEffect(() => {
    livesRef.current = lives
  }, [lives])
  useEffect(() => {
    qIndexRef.current = qIndex
  }, [qIndex])
  useEffect(() => {
    questionsRef.current = questions
  }, [questions])
  useEffect(() => {
    totalXPRef.current = totalXP
  }, [totalXP])
  useEffect(() => {
    pickedRef.current = picked
  }, [picked])
  useEffect(() => {
    feedbackRef.current = feedback
  }, [feedback])
  useEffect(() => {
    timeLeftRef.current = timeLeft
  }, [timeLeft])
  useEffect(() => {
    streakRef.current = streak
  }, [streak])
  useEffect(() => {
    multiplierRef.current = multiplier
  }, [multiplier])
  useEffect(() => {
    onStartRef.current = onStart
  }, [onStart])
  useEffect(() => {
    onAdvanceRef.current = onAdvance
  }, [onAdvance])
  useEffect(() => {
    onWrongRef.current = onWrong
  }, [onWrong])
  useEffect(() => {
    onMultiplierUpRef.current = onMultiplierUp
  }, [onMultiplierUp])
  useEffect(() => {
    checkCorrectRef.current = checkCorrect
  }, [checkCorrect])
  useEffect(() => {
    getWordIdRef.current = getWordId
  }, [getWordId])
  useEffect(() => {
    srsReviewRef.current = srs.review
  }, [srs.review])
  useEffect(() => {
    soundRef.current = sound
  }, [sound])
  useEffect(() => {
    difficultyRef.current = difficulty
  }, [difficulty])
  useEffect(() => {
    wordDifficultyFilterRef.current = wordDifficultyFilter
  }, [wordDifficultyFilter])

  // Load the vocabulary list once on mount.
  useEffect(() => {
    fetch('/api/vocabulary')
      .then((r) => (r.ok ? r.json() : []))
      .then((d: VocabWord[]) => setWords(d))
      .catch(() => setWords([]))
      .finally(() => setLoading(false))
  }, [])

  // The pool of words usable for the current difficulty (used for the
  // empty-state check + as the input to buildQuestions). We use the
  // raw state values (not refs) here because this runs during render
  // — refs are for callbacks only.
  const usableWords = words.filter((w) => {
    if (!wordFilter(w)) return false
    if (wordDifficultyFilter) {
      return wordDifficultyFilter(w, difficulty)
    }
    return true
  })

  const hasEnoughWords = usableWords.length >= 4

  function awardXP() {
    if (totalXPRef.current > 0) {
      postXP({
        pagesRead: 0,
        completedBook: false,
        bookLevel: 'beginner',
        isFirstReadToday: false,
        vocabGameXP: totalXPRef.current,
      }).catch(() => {})
    }
  }

  function finishGame() {
    setState('finished')
    awardXP()
    soundRef.current.play('gameover')
  }

  function nextQuestion() {
    if (qIndexRef.current + 1 >= questionsRef.current.length) {
      finishGame()
      return
    }
    const ni = qIndexRef.current + 1
    setQIndex(ni)
    setFeedback('none')
    setPicked('')
    setTimeLeft(effectiveSeconds)
    onAdvanceRef.current?.(questionsRef.current[ni])
  }

  function startGame() {
    // Apply difficulty filter before building questions. Use the same
    // pool the render computed (it's recomputed each render via
    // `usableWords` so it's already up to date with the latest
    // difficulty + wordDifficultyFilter).
    const pool = usableWords
    const qs = (() => {
      // buildQuestions is opaque to us — just pass the filtered pool.
      // Most implementations take QUESTIONS_PER_GAME from the outer
      // closure, so the difficulty-scaled count is applied via the
      // `effectiveQuestionsCount` slice below.
      try {
        return buildQuestions(pool)
      } catch {
        return buildQuestions(pool)
      }
    })()
    if (qs.length === 0) {
      toast.error(emptyMessage)
      return
    }
    // Truncate to difficulty-scaled count.
    const truncated = qs.slice(0, effectiveQuestionsCount)
    setQuestions(truncated)
    setQIndex(0)
    setScore(0)
    setLives(maxHearts)
    setStreak(0)
    setBestStreak(0)
    setLearnedCount(0)
    setTotalXP(0)
    setMultiplier(1)
    setBestMultiplier(1)
    setFeedback('none')
    setPicked('')
    setTimeLeft(effectiveSeconds)
    setState('playing')
    onStartRef.current?.(truncated[0])
  }

  function resetGame() {
    setState('idle')
    setQuestions([])
    setQIndex(0)
    setScore(0)
    setLives(maxHearts)
    setStreak(0)
    setBestStreak(0)
    setLearnedCount(0)
    setTotalXP(0)
    setMultiplier(1)
    setBestMultiplier(1)
    setFeedback('none')
    setPicked('')
    setTimeLeft(effectiveSeconds)
  }

  function evaluate(value: string) {
    const q = questionsRef.current[qIndexRef.current]
    if (!q) return
    const correct = checkCorrectRef.current(q, value)
    if (correct) {
      setFeedback('correct')
      const newStreak = streakRef.current + 1
      setStreak(newStreak)
      setBestStreak((b) => Math.max(b, newStreak))
      // Combo multiplier: bump 0.5 every 3 correct answers, cap at 3×.
      const newMultiplier = Math.min(3, 1 + Math.floor(newStreak / 3) * 0.5)
      if (newMultiplier > multiplierRef.current) {
        setMultiplier(newMultiplier)
        setBestMultiplier((b) => Math.max(b, newMultiplier))
        onMultiplierUpRef.current?.(newMultiplier)
        soundRef.current.play('streak')
      }
      const baseGained =
        xpPerCorrect + timeLeftRef.current * xpTimeBonus
      const gained = Math.round(baseGained * newMultiplier)
      setScore((s) => s + 1)
      setTotalXP((x) => x + gained)
      soundRef.current.play('correct')
      // Record practice activity for the daily-goal + streak tracker.
      recordVocabReview(1)
      const result = srsReviewRef.current(getWordIdRef.current(q), true)
      if (result.leveledToMastered || result.leveledTo5)
        setLearnedCount((c) => c + 1)
      setTimeout(() => {
        nextQuestion()
      }, correctDelayMs)
    } else {
      setFeedback('wrong')
      setLives((l) => l - 1)
      setStreak(0)
      setMultiplier(1)
      soundRef.current.play('wrong')
      // Record practice activity for the daily-goal + streak tracker.
      recordVocabReview(1)
      srsReviewRef.current(getWordIdRef.current(q), false)
      onWrongRef.current?.(q)
      setTimeout(() => {
        if (livesRef.current <= 0) {
          finishGame()
        } else {
          nextQuestion()
        }
      }, wrongDelayMs)
    }
  }

  function answer(value: string) {
    if (feedbackRef.current !== 'none' || pickedRef.current !== '') return
    setPicked(value)
    evaluate(value)
  }

  function submit() {
    if (feedbackRef.current !== 'none') return
    const value = pickedRef.current
    if (!value.trim()) return
    evaluate(value)
  }

  // Countdown timer — ticks every second while playing and no feedback shown.
  // When time runs out, mark wrong + lose a life + reset streak (no SRS review
  // on timeout). The advance itself is handled by the timeout effect below.
  useEffect(() => {
    if (state !== 'playing' || feedback !== 'none') return
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setFeedback('wrong')
          setLives((l) => Math.max(0, l - 1))
          setStreak(0)
          setMultiplier(1)
          soundRef.current.play('timeout')
          recordVocabReview(1)
          return 0
        }
        // Subtle tick on the last 3 seconds.
        if (t <= 3) soundRef.current.play('tick')
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [state, feedback, qIndex])

  // Wrong-from-timeout advance: when feedback becomes 'wrong' without the user
  // having picked an answer (picked is empty), advance after a short delay.
  // NOTE: if the user typed something but didn't submit (typed games), picked
  // is non-empty and this effect bails — preserving the original "stuck"
  // behaviour of listen/spell when the timer runs out mid-typing.
  useEffect(() => {
    if (feedback !== 'wrong' || picked !== '') return
    const id = setTimeout(() => {
      if (livesRef.current <= 0) {
        finishGame()
      } else {
        nextQuestion()
      }
    }, timeoutDelayMs)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- finishGame/nextQuestion are stable function declarations that close over current state via refs; adding them would cause the timer to reset on every render.
  }, [feedback, picked, timeoutDelayMs])

  // When difficulty changes mid-idle, refresh the timer baseline.
  useEffect(() => {
    if (state === 'idle') {
      setTimeLeft(effectiveSeconds)
    }
  }, [difficulty, effectiveSeconds, state])

  return {
    words,
    loading,
    hasEnoughWords,
    state,
    questions,
    qIndex,
    currentQuestion: questions[qIndex],
    lives,
    score,
    streak,
    bestStreak,
    totalXP,
    timeLeft,
    feedback,
    picked,
    learnedCount,
    xpPerCorrect,
    xpTimeBonus,
    multiplier,
    bestMultiplier,
    difficulty,
    setDifficulty,
    sound,
    startGame,
    answer,
    submit,
    setPicked,
    resetGame,
  }
}
