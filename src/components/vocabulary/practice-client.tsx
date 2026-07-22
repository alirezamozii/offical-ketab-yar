'use client'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  ChevronLeft,
  Layers,
  PartyPopper,
  RotateCw,
  Sparkles,
  Target,
  Trophy,
  Volume2,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { useSrs } from '@/hooks/reader/use-srs'
import { GameResult } from '@/components/vocabulary/game-result'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { recordVocabReview } from '@/components/vocabulary/use-vocab-activity'

interface VocabWord {
  id: string
  word: string
  definition: string
  translation: string
  context: string
  bookSlug: string
}

type Mode = 'flashcard' | 'quiz'
type QuizStatus = 'idle' | 'correct' | 'wrong'

const STATS_KEY = STORAGE_KEYS.practiceStats

interface PracticeStats {
  totalSessions: number
  totalAnswered: number
  totalCorrect: number
  bestStreak: number
}

function loadStats(): PracticeStats {
  if (typeof window === 'undefined')
    return { totalSessions: 0, totalAnswered: 0, totalCorrect: 0, bestStreak: 0 }
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (!raw)
      return { totalSessions: 0, totalAnswered: 0, totalCorrect: 0, bestStreak: 0 }
    return JSON.parse(raw)
  } catch {
    return { totalSessions: 0, totalAnswered: 0, totalCorrect: 0, bestStreak: 0 }
  }
}

function saveStats(s: PracticeStats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(s))
  } catch {}
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Build a deck with due-words first, then fill with others up to size. */
function buildDeck(
  words: VocabWord[],
  dueIds: Set<string>,
  size: number,
): VocabWord[] {
  if (words.length === 0) return []
  const due = shuffle(words.filter((w) => dueIds.has(w.id)))
  const others = shuffle(words.filter((w) => !dueIds.has(w.id)))
  const deck = [...due, ...others].slice(0, Math.min(size, words.length))
  return deck
}

export function PracticeClient() {
  const srs = useSrs()
  const [words, setWords] = useState<VocabWord[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>('flashcard')
  const [deck, setDeck] = useState<VocabWord[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set())
  const [quizStatus, setQuizStatus] = useState<QuizStatus>('idle')
  const [quizOptions, setQuizOptions] = useState<string[]>([])
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [finished, setFinished] = useState(false)
  const [stats, setStats] = useState<PracticeStats>(loadStats)
  const [celebration, setCelebration] = useState<VocabWord | null>(null)
  const [learnedCount, setLearnedCount] = useState(0)

  const buildQuiz = useCallback((d: VocabWord[], i: number) => {
    if (d.length < 4) {
      setQuizOptions([])
      return
    }
    const correct = d[i].translation || d[i].definition || d[i].word
    const pool = d.filter((_, idx) => idx !== i)
    const distractors = shuffle(pool)
      .slice(0, 3)
      .map((w) => w.translation || w.definition || w.word)
    setQuizOptions(shuffle([correct, ...distractors]))
    setQuizStatus('idle')
    setPicked(null)
  }, [])

  // Once words load + srs ready, build the initial deck (due-first).
  useEffect(() => {
    fetch('/api/vocabulary')
      .then((r) => (r.ok ? r.json() : []))
      .then((d: VocabWord[]) => {
        setWords(d)
        if (d.length > 0) {
          const dueIds = new Set(srs.getDueWordIds(d.map((w) => w.id)))
          const built = buildDeck(d, dueIds, 20)
          setDeck(built)
          buildQuiz(built, 0)
        }
      })
      .catch(() => setWords([]))
      .finally(() => setLoading(false))
  }, [srs.isReady, srs, buildQuiz])

  const current = deck[index]

  const dueTodayCount = useMemo(
    () => (words.length ? srs.getDueWordIds(words.map((w) => w.id)).length : 0),
    [words, srs],
  )

  const learnedTotal = useMemo(
    () =>
      words.filter((w) => srs.getStatus(w.id).box >= 5).length,
    [words, srs],
  )

  function restart() {
    if (words.length === 0) return
    const dueIds = new Set(srs.getDueWordIds(words.map((w) => w.id)))
    const built = buildDeck(words, dueIds, 20)
    setDeck(built)
    setIndex(0)
    setFlipped(false)
    setKnownIds(new Set())
    setScore(0)
    setStreak(0)
    setFinished(false)
    setLearnedCount(0)
    buildQuiz(built, 0)
  }

  function next() {
    if (index + 1 >= deck.length) {
      setFinished(true)
      const newStats: PracticeStats = {
        totalSessions: stats.totalSessions + 1,
        totalAnswered: stats.totalAnswered + deck.length,
        totalCorrect: stats.totalCorrect + score,
        bestStreak: Math.max(stats.bestStreak, streak),
      }
      setStats(newStats)
      saveStats(newStats)
      return
    }
    const ni = index + 1
    setIndex(ni)
    setFlipped(false)
    buildQuiz(deck, ni)
  }

  function prev() {
    if (index === 0) return
    const ni = index - 1
    setIndex(ni)
    setFlipped(false)
    buildQuiz(deck, ni)
  }

  function markKnown() {
    if (!current) return
    setKnownIds((prev) => new Set(prev).add(current.id))
    setFlipped(true)
    // SRS review (correct)
    const result = srs.review(current.id, true)
    recordVocabReview(1)
    if (result.leveledTo5 || result.leveledToMastered) {
      setCelebration(current)
      setLearnedCount((c) => c + 1)
    }
  }

  function markUnknown() {
    if (!current) return
    srs.review(current.id, false)
    recordVocabReview(1)
  }

  function speak(w: string) {
    try {
      const u = new SpeechSynthesisUtterance(w)
      u.lang = 'en-US'
      window.speechSynthesis.speak(u)
    } catch {}
  }

  // ---- Flashcard keyboard shortcuts ----
  // Space/Enter  → flip the card (only when focus is not in an input)
  // ArrowRight   → mark as known (advances SRS)
  // ArrowLeft    → mark as unknown (resets SRS box)
  // 1 / 2        → same as ArrowLeft / ArrowRight (numeric fallback)
  //
  // We intentionally do NOT auto-advance after markKnown/markUnknown —
  // the user can press "بعدی" (Next) or use Tab to focus it. This
  // mirrors the click-based flow where each card requires an explicit
  // "next" press.
  useEffect(() => {
    if (mode !== 'flashcard' || !current) return
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      // Don't hijack typing in inputs / textareas / contenteditable.
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return
      }
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault()
          setFlipped((f) => !f)
          break
        case 'ArrowRight':
          e.preventDefault()
          markKnown()
          break
        case 'ArrowLeft':
          e.preventDefault()
          markUnknown()
          break
        case '1':
          e.preventDefault()
          markUnknown()
          break
        case '2':
          e.preventDefault()
          markKnown()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, current, knownIds])

  function answer(opt: string) {
    if (quizStatus !== 'idle' || !current) return
    const correct = current.translation || current.definition || current.word
    setPicked(opt)
    if (opt === correct) {
      setQuizStatus('correct')
      setScore((s) => s + 1)
      setStreak((s) => s + 1)
      const result = srs.review(current.id, true)
      recordVocabReview(1)
      if (result.leveledTo5 || result.leveledToMastered) {
        setCelebration(current)
        setLearnedCount((c) => c + 1)
      }
    } else {
      setQuizStatus('wrong')
      setStreak(0)
      srs.review(current.id, false)
      recordVocabReview(1)
    }
  }

  const accuracy =
    stats.totalAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
      : 0

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-6 h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-600 dark:text-gold-400">
            <Brain className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-bold">واژه‌ای برای تمرین نیست</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            ابتدا هنگام مطالعه، کلمات ناشناخته را به واژگان اضافه کنید. سپس برای
            تمرین به اینجا برگردید.
          </p>
          <Button asChild variant="glow">
            <Link href="/library">
              <BookOpen className="h-4 w-4" />
              رفتن به کتابخانه
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (finished) {
    const acc = Math.round((score / deck.length) * 100)
    return (
      <GameResult
        title="تمرین تمام شد!"
        subtitle={`${deck.length} واژه مرور شد`}
        containerClassName="mx-auto max-w-3xl px-4 py-12 sm:px-6"
        trophyClassName="rounded-2xl"
        wrapTitleSubtitle
        stats={[
          { label: 'امتیاز', value: `${score}/${deck.length}` },
          { label: 'دقت', value: `${acc}٪` },
          {
            label: 'یاد گرفته شد',
            value: String(learnedCount),
            highlight: 'emerald',
          },
        ]}
        learnedContent={
          learnedCount > 0 ? (
            <>🎉 {learnedCount} واژه جدید به سطح «یاد گرفته شد» رسید!</>
          ) : undefined
        }
        onPlayAgain={restart}
        playAgainLabel="تمرین دوباره"
      />
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header + stats — SRS-aware */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            تمرین واژگان
          </h1>
          <p className="text-sm text-muted-foreground">
            {deck.length} واژه در دسته — صفحه {index + 1} از {deck.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MiniStat
            icon={<Target className="h-3.5 w-3.5" />}
            value={String(dueTodayCount)}
            label="مرور امروز"
            highlight={dueTodayCount > 0}
          />
          <MiniStat
            icon={<Sparkles className="h-3.5 w-3.5" />}
            value={String(learnedTotal)}
            label="یاد گرفته"
          />
          <MiniStat
            icon={<Trophy className="h-3.5 w-3.5" />}
            value={`${accuracy}٪`}
            label="دقت کل"
          />
        </div>
      </div>

      {/* Mode toggle */}
      <div className="mb-6 inline-flex rounded-xl border border-border bg-card p-1 shadow-sm">
        <ModeButton
          active={mode === 'flashcard'}
          onClick={() => {
            setMode('flashcard')
            setFlipped(false)
          }}
        >
          <Layers className="h-4 w-4" />
          فلش‌کارت
        </ModeButton>
        <ModeButton
          active={mode === 'quiz'}
          onClick={() => {
            setMode('quiz')
            buildQuiz(deck, index)
          }}
        >
          <Brain className="h-4 w-4" />
          آزمون
        </ModeButton>
      </div>

      {/* Flashcard mode */}
      {mode === 'flashcard' && current && (
        <div className="space-y-4">
          <div
            className="group relative h-72 cursor-pointer perspective-1000"
            onClick={() => setFlipped((f) => !f)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={flipped ? 'back' : 'front'}
                initial={{ rotateY: -90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: 90, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  'flex h-full w-full flex-col items-center justify-center rounded-3xl border-2 p-8 text-center shadow-xl',
                  flipped
                    ? 'border-gold-400 bg-gradient-to-br from-gold-500/10 to-gold-700/10'
                    : 'border-border bg-card',
                )}
              >
                {!flipped ? (
                  <>
                    <span className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      English
                    </span>
                    <h2
                      className="text-3xl font-extrabold sm:text-4xl"
                      dir="ltr"
                    >
                      {current.word}
                    </h2>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        speak(current.word)
                      }}
                      className="mt-4 flex h-10 w-10 items-center justify-center rounded-full bg-gold-500/15 text-gold-600 transition-transform hover:scale-110 dark:text-gold-400"
                      aria-label="تلفظ"
                    >
                      <Volume2 className="h-5 w-5" />
                    </button>
                    <p className="mt-6 text-xs text-muted-foreground">
                      برای دیدن ترجمه کلیک کنید
                    </p>
                  </>
                ) : (
                  <>
                    <span className="mb-2 text-xs font-bold uppercase tracking-widest text-gold-600 dark:text-gold-400">
                      فارسی
                    </span>
                    <p className="text-2xl font-bold leading-relaxed">
                      {current.translation || '—'}
                    </p>
                    {current.definition && (
                      <p
                        className="mt-3 max-w-md text-sm text-muted-foreground"
                        dir="ltr"
                      >
                        {current.definition}
                      </p>
                    )}
                    {knownIds.has(current.id) && (
                      <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <Check className="h-3 w-3" />
                        یاد گرفتم
                      </span>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={prev} disabled={index === 0}>
              <ArrowRight className="h-4 w-4" />
              قبلی
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={markUnknown}
                variant="outline"
                className="gap-2"
                title="نمی‌دانم — سطح یادگیری به ۱ بازمی‌گردد (کلید ←)"
                aria-keyshortcuts="ArrowLeft 1"
              >
                <X className="h-4 w-4" />
                نمی‌دانم
              </Button>
              <Button
                onClick={markKnown}
                variant={knownIds.has(current.id) ? 'default' : 'secondary'}
                className="gap-2"
                title="یاد گرفتم — سطح یادگیری بالا می‌رود (کلید →)"
                aria-keyshortcuts="ArrowRight 2"
              >
                <Check className="h-4 w-4" />
                {knownIds.has(current.id) ? 'یاد گرفتم' : 'تمرین کن'}
              </Button>
            </div>
            <Button onClick={next} disabled={index + 1 >= deck.length}>
              بعدی
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Keyboard hint — discoverable but unobtrusive */}
          <p className="text-center text-[11px] text-muted-foreground" dir="rtl">
            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px]">Space</kbd>{' '}
            برای برگرداندن کارت ·{' '}
            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px]">→</kbd>{' '}
            می‌دانم ·{' '}
            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px]">←</kbd>{' '}
            نمی‌دانم
          </p>
        </div>
      )}

      {/* Quiz mode */}
      {mode === 'quiz' && current && (
        <div className="space-y-5">
          {quizOptions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              برای حالت آزمون حداقل ۴ واژه نیاز است. واژگان بیشتری ذخیره کنید.
            </div>
          ) : (
            <>
              <div className="rounded-3xl border-2 border-border bg-card p-8 text-center shadow-xl">
                <span className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  معنی این کلمه چیست؟
                </span>
                <h2
                  className="text-3xl font-extrabold sm:text-4xl"
                  dir="ltr"
                >
                  {current.word}
                </h2>
                <button
                  onClick={() => speak(current.word)}
                  className="mt-3 flex h-9 w-9 items-center justify-center rounded-full bg-gold-500/15 text-gold-600 transition-transform hover:scale-110 dark:text-gold-400"
                  aria-label="تلفظ"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {quizOptions.map((opt, i) => {
                  const correct =
                    current.translation || current.definition || current.word
                  const isCorrect = opt === correct
                  const isPicked = opt === picked
                  const showState = quizStatus !== 'idle'
                  return (
                    <motion.button
                      key={i}
                      whileHover={!showState ? { scale: 1.02 } : {}}
                      whileTap={!showState ? { scale: 0.98 } : {}}
                      onClick={() => answer(opt)}
                      disabled={showState}
                      className={cn(
                        'flex items-center justify-between rounded-xl border-2 p-4 text-start font-medium transition-colors',
                        !showState &&
                          'border-border bg-card hover:border-primary/50',
                        showState &&
                          isCorrect &&
                          'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
                        showState &&
                          isPicked &&
                          !isCorrect &&
                          'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400',
                        showState &&
                          !isCorrect &&
                          !isPicked &&
                          'border-border bg-card opacity-60',
                      )}
                    >
                      <span>{opt}</span>
                      {showState && isCorrect && (
                        <Check className="h-5 w-5 text-emerald-500" />
                      )}
                      {showState && isPicked && !isCorrect && (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                    </motion.button>
                  )
                })}
              </div>

              <AnimatePresence>
                {quizStatus !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      'flex items-center justify-between rounded-xl p-4',
                      quizStatus === 'correct'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'bg-red-500/10 text-red-700 dark:text-red-400',
                    )}
                  >
                    <span className="font-bold">
                      {quizStatus === 'correct'
                        ? 'آفرین! درست بود'
                        : 'نادرست — دفعه بعد!'}
                    </span>
                    <Button onClick={next} size="sm" variant="glow">
                      {index + 1 >= deck.length ? 'پایان' : 'بعدی'}
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>امتیاز: {score}</span>
                <span>streak: {streak} 🔥</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div className="mt-8 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/vocabulary">
            <ChevronLeft className="h-4 w-4" />
            بازگشت به واژگان
          </Link>
        </Button>
        <Button onClick={restart} variant="outline" size="sm">
          <RotateCw className="h-4 w-4" />
          شروع دوباره
        </Button>
      </div>

      {/* Box-5 celebration toast */}
      <AnimatePresence>
        {celebration && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed inset-x-0 top-6 z-50 mx-auto w-fit"
            onClick={() => setCelebration(null)}
          >
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/50 bg-card px-5 py-3 shadow-2xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
                <PartyPopper className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  این واژه را یاد گرفتی! 🎉
                </p>
                <p className="text-xs text-muted-foreground" dir="ltr">
                  {celebration.word}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground shadow'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function MiniStat({
  icon,
  value,
  label,
  highlight,
}: {
  icon: React.ReactNode
  value: string
  label: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 shadow-sm',
        highlight
          ? 'border-gold-400/60 bg-gold-500/5'
          : 'border-border',
      )}
    >
      <span className="text-gold-600 dark:text-gold-400">{icon}</span>
      <div className="leading-none">
        <div className="text-sm font-bold">{value}</div>
        <div className="text-[10px] text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}


