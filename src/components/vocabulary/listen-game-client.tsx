'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AnimatePresence, motion } from 'framer-motion'
import { Ear, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useVocabGame } from '@/hooks/reader/use-vocab-game'
import { GameEmpty, GameLoading } from '@/components/vocabulary/game-states'
import { GameHud } from '@/components/vocabulary/game-hud'
import { GameIntro } from '@/components/vocabulary/game-intro'
import { GameResult } from '@/components/vocabulary/game-result'
import {
  normalize,
  shuffle,
  type VocabWord,
} from '@/components/vocabulary/game-utils'

interface Question {
  word: VocabWord
}

const QUESTIONS_PER_GAME = 10
const SECONDS_PER_QUESTION = 15
const XP_PER_CORRECT = 20
const XP_TIME_BONUS = 1

function buildQuestions(words: VocabWord[]): Question[] {
  const withWord = words.filter((w) => w.word && w.word.trim())
  if (withWord.length < 4) return []
  const pool = shuffle(withWord)
  const count = Math.min(QUESTIONS_PER_GAME, pool.length)
  return pool.slice(0, count).map((word) => ({ word }))
}

export function ListenGameClient() {
  const [speechOk, setSpeechOk] = useState(true)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setSpeechOk('speechSynthesis' in window)
  }, [])

  function speak(text: string, opts?: { rate?: number }) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'
      u.rate = opts?.rate ?? 0.9
      window.speechSynthesis.speak(u)
    } catch {}
  }

  const game = useVocabGame<Question>({
    questionsPerGame: QUESTIONS_PER_GAME,
    secondsPerQuestion: SECONDS_PER_QUESTION,
    xpPerCorrect: XP_PER_CORRECT,
    xpTimeBonus: XP_TIME_BONUS,
    timeoutDelayMs: 1500,
    wrongDelayMs: 1800,
    correctDelayMs: 1200,
    emptyMessage: 'حداقل ۴ واژه لازم است',
    wordFilter: (w) => !!(w.word && w.word.trim()),
    buildQuestions,
    checkCorrect: (q, value) =>
      normalize(value) === normalize(q.word.word),
    getWordId: (q) => q.word.id,
    gameMode: 'listen',
    onStart: (q) => {
      // Let the UI settle on the first transition, then play + focus.
      setTimeout(() => speak(q.word.word), 350)
      setTimeout(() => inputRef.current?.focus(), 400)
    },
    onAdvance: (q) => {
      setTimeout(() => speak(q.word.word), 250)
      setTimeout(() => inputRef.current?.focus(), 300)
    },
  })

  if (game.loading) {
    return <GameLoading />
  }

  if (!game.hasEnoughWords) {
    return (
      <GameEmpty
        icon={<Ear className="h-7 w-7" />}
        message={
          'برای بازی شنیداری حداقل ۴ واژه لازم است. هنگام مطالعه کلمات را ذخیره کنید یا دستی اضافه کنید.'
        }
      />
    )
  }

  if (game.state === 'finished') {
    const accuracy =
      game.questions.length > 0
        ? Math.round((game.score / game.questions.length) * 100)
        : 0
    return (
      <GameResult
        title="بازی تمام شد!"
        subtitle={`${game.questions.length} سوال پاسخ داده شد`}
        stats={[
          { label: 'امتیاز', value: `${game.score}/${game.questions.length}` },
          { label: 'دقت', value: `${accuracy}٪` },
          { label: 'XP', value: `+${game.totalXP}`, highlight: 'gold' },
          {
            label: 'یاد گرفته',
            value: String(game.learnedCount),
            highlight: 'emerald',
          },
        ]}
        bestMultiplier={game.bestMultiplier}
        learnedContent={
          game.learnedCount > 0 ? (
            <>{game.learnedCount} واژه به سطح «یاد گرفته شد» رسید!</>
          ) : undefined
        }
        onPlayAgain={game.startGame}
        playAgainLabel="دوباره بازی"
      />
    )
  }

  if (game.state === 'idle') {
    return (
      <GameIntro
        icon={<Ear className="h-8 w-8" />}
        title="بازی شنیداری"
        description="کلمه را گوش کن، املای درست را تایپ کن — هر پاسخ درست XP می‌آورد!"
        stats={[
          { value: String(QUESTIONS_PER_GAME), label: 'سوال', color: 'gold' },
          { value: '۳', label: 'جان', color: 'red' },
          {
            value: `+${XP_PER_CORRECT}`,
            label: 'XP هر درست',
            color: 'emerald',
          },
        ]}
        difficulty={game.difficulty}
        onDifficultyChange={game.setDifficulty}
        soundEnabled={game.sound.enabled}
        onToggleSound={game.sound.toggle}
        onStart={game.startGame}
        warning={
          !speechOk ? (
            <p className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
              ⚠️ مرورگر شما از تلفظ پشتیبانی نمی‌کند. برای تجربه بهتر از Chrome
              یا Edge استفاده کنید.
            </p>
          ) : undefined
        }
      />
    )
  }

  // PLAYING state
  const q = game.currentQuestion
  if (!q) return null
  const showAnswer = game.feedback !== 'none'

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <GameHud
        lives={game.lives}
        totalXP={game.totalXP}
        streak={game.streak}
        qIndex={game.qIndex}
        totalQuestions={game.questions.length}
        timeLeft={game.timeLeft}
        multiplier={game.multiplier}
        maxTime={SECONDS_PER_QUESTION}
        onTickLow={() => game.sound.play('tick')}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={game.qIndex}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
        >
          {/* Audio prompt */}
          <div className="mb-6 rounded-2xl border-2 border-border/60 bg-card p-8 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              این کلمه را گوش کن و تایپش کن
            </p>
            <button
              onClick={() => speak(q.word.word)}
              className="mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/15 text-gold-700 transition-transform hover:scale-110 dark:text-gold-400"
              aria-label="پخش دوباره"
            >
              <Volume2 className="h-7 w-7" />
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              برای پخش دوباره روی آیکون کلیک کن
            </p>
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={game.picked}
              onChange={(e) => game.setPicked(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && game.submit()}
              placeholder="املای کلمه را اینجا بنویس..."
              dir="ltr"
              disabled={showAnswer}
              className="text-lg font-bold"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <Button
              onClick={game.submit}
              disabled={showAnswer || !game.picked.trim()}
              variant="glow"
              className="px-6"
            >
              تأیید
            </Button>
          </div>

          {/* Feedback / reveal */}
          {showAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'mt-4 rounded-xl p-4 text-center',
                game.feedback === 'correct'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'bg-red-500/10 text-red-700 dark:text-red-400',
              )}
            >
              <p className="font-bold">
                {game.feedback === 'correct'
                  ? `✓ آفرین! +${Math.round(
                      (XP_PER_CORRECT + game.timeLeft * XP_TIME_BONUS) *
                        game.multiplier,
                    )} XP${game.multiplier > 1 ? ` (×${game.multiplier})` : ''}`
                  : '✗ نادرست'}
              </p>
              {game.feedback === 'wrong' && (
                <p className="mt-1 text-sm" dir="ltr">
                  پاسخ درست:{' '}
                  <span className="font-bold">{q.word.word}</span>
                  {q.word.translation && (
                    <span className="ms-2 text-muted-foreground">
                      ({q.word.translation})
                    </span>
                  )}
                </p>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
