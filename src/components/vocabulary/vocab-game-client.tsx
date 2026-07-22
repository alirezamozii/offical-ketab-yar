'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Gamepad2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVocabGame } from '@/hooks/reader/use-vocab-game'
import { GameEmpty, GameLoading } from '@/components/vocabulary/game-states'
import { GameHud } from '@/components/vocabulary/game-hud'
import { GameIntro } from '@/components/vocabulary/game-intro'
import { GameResult } from '@/components/vocabulary/game-result'
import {
  shuffle,
  type VocabWord,
} from '@/components/vocabulary/game-utils'

interface Question {
  word: VocabWord
  options: string[] // 4 translations, 1 correct
  correct: string
}

const QUESTIONS_PER_GAME = 10
const SECONDS_PER_QUESTION = 10
const XP_PER_CORRECT = 15
const XP_TIME_BONUS = 2 // per remaining second

function buildQuestions(words: VocabWord[]): Question[] {
  const withTranslation = words.filter(
    (w) => w.translation && w.translation.trim(),
  )
  if (withTranslation.length < 4) return []
  const pool = shuffle(withTranslation)
  const count = Math.min(QUESTIONS_PER_GAME, pool.length)
  const questions: Question[] = []
  for (let i = 0; i < count; i++) {
    const word = pool[i]
    const distractors = shuffle(
      withTranslation.filter((w) => w.id !== word.id),
    )
      .slice(0, 3)
      .map((w) => w.translation)
    const options = shuffle([word.translation, ...distractors])
    questions.push({ word, options, correct: word.translation })
  }
  return questions
}

export function VocabGameClient() {
  const game = useVocabGame<Question>({
    questionsPerGame: QUESTIONS_PER_GAME,
    secondsPerQuestion: SECONDS_PER_QUESTION,
    xpPerCorrect: XP_PER_CORRECT,
    xpTimeBonus: XP_TIME_BONUS,
    timeoutDelayMs: 1200,
    wrongDelayMs: 1300,
    correctDelayMs: 1300,
    emptyMessage: 'حداقل ۴ واژه با ترجمه لازم است',
    wordFilter: (w) => !!w.translation,
    buildQuestions,
    checkCorrect: (q, value) => value === q.correct,
    getWordId: (q) => q.word.id,
    gameMode: 'match',
  })

  if (game.loading) {
    return <GameLoading />
  }

  if (!game.hasEnoughWords) {
    return (
      <GameEmpty
        icon={<Gamepad2 className="h-7 w-7" />}
        message={
          'برای بازی حداقل ۴ واژه با ترجمه لازم است. هنگام مطالعه کلمات را ذخیره کنید یا دستی اضافه کنید (معنی خودکار گرفته می‌شود).'
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
          {
            label: 'XP',
            value: `+${game.totalXP}`,
            highlight: 'gold',
          },
          { label: 'best streak', value: String(game.bestStreak) },
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
        icon={<Gamepad2 className="h-8 w-8" />}
        title="بازی واژگان"
        description="معنی هر کلمه را سریع انتخاب کن — هر پاسخ درست XP می‌آورد و با ترکیب پشت سر هم، ضریب امتیاز بالا می‌رود!"
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
      />
    )
  }

  // PLAYING state
  const q = game.currentQuestion
  if (!q) return null

  const showState = game.feedback !== 'none'

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <GameHud
        lives={game.lives}
        totalXP={game.totalXP}
        streak={game.streak}
        qIndex={game.qIndex}
        totalQuestions={game.questions.length}
        timeLeft={game.timeLeft}
        showClock
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
          {/* Word */}
          <div className="mb-6 rounded-2xl border-2 border-border/60 bg-card p-8 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              معنی این کلمه چیست؟
            </p>
            <h2 className="mt-3 text-4xl font-extrabold" dir="ltr">
              {q.word.word}
            </h2>
          </div>

          {/* Options */}
          <div className="grid gap-3 sm:grid-cols-2">
            {q.options.map((opt, i) => {
              const isCorrect = opt === q.correct
              const isPicked = opt === game.picked
              return (
                <motion.button
                  key={i}
                  whileHover={!showState ? { scale: 1.02 } : {}}
                  whileTap={!showState ? { scale: 0.98 } : {}}
                  onClick={() => game.answer(opt)}
                  disabled={showState}
                  className={cn(
                    'flex items-center justify-between rounded-xl border-2 p-4 text-start font-medium transition-[transform,opacity,colors,border-color,background-color]',
                    !showState && 'border-border bg-card hover:border-primary/50',
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
                      'border-border bg-card opacity-50',
                  )}
                >
                  <span>{opt}</span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Feedback banner */}
      <AnimatePresence>
        {game.feedback !== 'none' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              'mt-5 rounded-xl p-3 text-center font-bold',
              game.feedback === 'correct'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-500/10 text-red-700 dark:text-red-400',
            )}
          >
            {game.feedback === 'correct'
              ? `✓ درست! +${Math.round(
                  (XP_PER_CORRECT + game.timeLeft * XP_TIME_BONUS) *
                    game.multiplier,
                )} XP${game.multiplier > 1 ? ` (×${game.multiplier})` : ''}`
              : '✗ نادرست'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
