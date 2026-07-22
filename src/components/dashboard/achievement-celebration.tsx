'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, X, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAchievements } from '@/hooks/reader/use-achievements'
import { toPersianNumber } from '@/lib/gamification'

interface ConfettiPiece {
  id: number
  x: number
  y: number
  rotation: number
  color: string
  delay: number
  size: number
  shape: 'square' | 'circle' | 'star' | 'gold-bar'
  duration: number
}

const COLORS = [
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#b8956a', // gold-500 — replaces violet (#8b5cf6) per color-discipline audit
  '#6d523a', // gold-800 — replaces blue (#3b82f6) per color-discipline audit
  '#10b981',
  '#fde047',
]

const GOLD_TONES = ['#fde047', '#facc15', '#eab308', '#f59e0b', '#fbbf24', '#fcd34d']

function rng(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => {
    const isGold = i % 3 === 0 // 1/3 are gold-tone
    const palette = isGold ? GOLD_TONES : COLORS
    const shapeRoll = Math.random()
    const shape: ConfettiPiece['shape'] =
      isGold && shapeRoll < 0.4
        ? 'gold-bar'
        : shapeRoll < 0.55
          ? 'star'
          : shapeRoll < 0.8
            ? 'square'
            : 'circle'
    return {
      id: i,
      x: rng(0, 100),
      y: -10 - Math.random() * 25,
      rotation: Math.random() * 360,
      color: palette[i % palette.length],
      delay: Math.random() * 0.4,
      size: 6 + Math.random() * (isGold ? 14 : 8),
      shape,
      duration: 3 + Math.random() * 1.8,
    }
  })
}

/** Estimated XP gained from unlocking an achievement. Tied to achievement id. */
const ACHIEVEMENT_XP: Record<string, number> = {
  'first-book': 50,
  'first-finish': 250,
  'streak-3': 100,
  'streak-7': 200,
  'streak-30': 600,
  'reader-10': 250,
  'books-5': 200,
  'books-finish-3': 400,
  'vocab-50': 350,
  'games-5': 200,
  'streak-30-cur': 600,
  'books-10-start': 300,
}

export function AchievementCelebration() {
  const { achievements, newlyUnlocked } = useAchievements()
  const [show, setShow] = useState(false)
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([])
  const [current, setCurrent] = useState<string | null>(null)
  const [goldBurst, setGoldBurst] = useState<ConfettiPiece[]>([])

  // Fire the celebration only when `newlyUnlocked` changes — NOT every time
  // the `achievements` array reference changes (it's memoized in the hook
  // but depending on it directly risks re-triggering on unrelated renders).
  // We look up the achievement object lazily inside the effect.
  useEffect(() => {
    if (newlyUnlocked.length === 0) return
    const id = newlyUnlocked[0]
    const ach = achievements.find((a) => a.id === id)
    if (!ach) return
    // `achievements` is intentionally omitted: we only want to fire on `newlyUnlocked` changes (a new unlock), not every time the achievements array reference changes.
    setCurrent(id)
    // Bigger confetti count + dedicated gold burst for a "spectacular" feel.
    setConfetti(generateConfetti(90))
    setGoldBurst(
      Array.from({ length: 36 }, (_, i) => ({
        id: 10_000 + i,
        x: 50 + (Math.random() - 0.5) * 12,
        y: 35 + (Math.random() - 0.5) * 10,
        rotation: Math.random() * 360,
        color: GOLD_TONES[i % GOLD_TONES.length],
        delay: Math.random() * 0.2,
        size: 8 + Math.random() * 14,
        shape: Math.random() < 0.5 ? ('star' as const) : ('gold-bar' as const),
        duration: 1.8 + Math.random() * 1.2,
      })),
    )
    setShow(true)
    const t = setTimeout(() => {
      setShow(false)
      setCurrent(null)
    }, 5500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- achievements intentionally omitted: we only fire on newlyUnlocked changes (new unlock), not on achievements ref changes.
  }, [newlyUnlocked])

  const ach = current ? achievements.find((a) => a.id === current) : null
  const xpGained = useMemo(
    () => (current ? ACHIEVEMENT_XP[current] ?? 100 : 0),
    [current],
  )

  return (
    <AnimatePresence>
      {show && ach && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Radial gold glow behind the card */}
          <div className="pointer-events-none absolute inset-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 0.5, scale: 1.2 }}
              transition={{ duration: 0.7 }}
              className="absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/25 blur-3xl"
            />
          </div>

          {/* Confetti rain */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {confetti.map((c) => (
              <motion.div
                key={c.id}
                initial={{
                  x: `${c.x}vw`,
                  y: `${c.y}vh`,
                  rotate: c.rotation,
                  opacity: 1,
                }}
                animate={{
                  y: '110vh',
                  rotate: c.rotation + 720,
                  opacity: [1, 1, 0.85, 0],
                }}
                transition={{
                  duration: c.duration,
                  delay: c.delay,
                  ease: 'easeOut',
                }}
                className="absolute"
                style={{
                  width: `${c.size}px`,
                  height: `${c.size}px`,
                  background: c.shape === 'star' ? 'transparent' : c.color,
                  borderRadius: c.shape === 'circle' ? '9999px' : '2px',
                  boxShadow: c.shape === 'gold-bar' ? `0 0 10px ${c.color}` : undefined,
                }}
              >
                {c.shape === 'star' && (
                  <svg viewBox="0 0 24 24" fill={c.color} className="h-full w-full drop-shadow-[0_0_6px_currentColor]">
                    <path d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 22 12 17.27 5.79 22l2.39-8.15L2 9.36h7.61z" />
                  </svg>
                )}
              </motion.div>
            ))}
          </div>

          {/* Gold burst from center (fireworks-style) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {goldBurst.map((c) => {
              const angle = (c.id % 36) * 10 // 0..350 in 10-deg steps
              const rad = (angle * Math.PI) / 180
              const distance = 30 + Math.random() * 20 // vw distance
              const targetX = 50 + Math.cos(rad) * distance
              const targetY = 35 + Math.sin(rad) * distance
              return (
                <motion.div
                  key={c.id}
                  initial={{
                    x: `${c.x}vw`,
                    y: `${c.y}vh`,
                    scale: 0.4,
                    opacity: 1,
                    rotate: 0,
                  }}
                  animate={{
                    x: `${targetX}vw`,
                    y: `${targetY}vh`,
                    scale: [0.4, 1.4, 1, 0.6],
                    opacity: [1, 1, 0.9, 0],
                    rotate: 540,
                  }}
                  transition={{
                    duration: c.duration,
                    delay: c.delay,
                    ease: 'easeOut',
                  }}
                  className="absolute"
                  style={{
                    width: `${c.size}px`,
                    height: `${c.size}px`,
                    background: c.shape === 'star' ? 'transparent' : c.color,
                    borderRadius: c.shape === 'circle' ? '9999px' : '2px',
                    boxShadow: `0 0 12px ${c.color}, 0 0 24px ${c.color}`,
                  }}
                >
                  {c.shape === 'star' && (
                    <svg viewBox="0 0 24 24" fill={c.color} className="h-full w-full drop-shadow-[0_0_8px_currentColor]">
                      <path d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 22 12 17.27 5.79 22l2.39-8.15L2 9.36h7.61z" />
                    </svg>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Card */}
          <motion.div
            initial={{ scale: 0.5, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.5, y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 250, damping: 20 }}
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border-2 border-gold-400 bg-gradient-to-br from-gold-500/15 via-card to-card p-8 text-center shadow-2xl shadow-gold-500/30"
          >
            {/* Rotating sparkle ring behind icon */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-12 h-32 w-32 -translate-x-1/2 -translate-y-1/2"
              initial={{ rotate: 0, opacity: 0 }}
              animate={{ rotate: 360, opacity: 0.5 }}
              transition={{ rotate: { duration: 6, repeat: Infinity, ease: 'linear' }, opacity: { duration: 0.5 } }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={i}
                  className="absolute left-1/2 top-1/2 text-xs"
                  style={{
                    transform: `rotate(${i * 45}deg) translateY(-58px)`,
                    transformOrigin: '0 0',
                  }}
                >
                  ✨
                </span>
              ))}
            </motion.div>

            <button
              onClick={() => {
                setShow(false)
                setCurrent(null)
              }}
              className="absolute end-4 top-4 text-muted-foreground hover:text-foreground"
              aria-label="بستن"
            >
              <X className="h-5 w-5" />
            </button>

            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
              className={`relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${ach.color} text-5xl shadow-lg`}
            >
              <motion.span
                animate={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.6 }}
              >
                {ach.icon}
              </motion.span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-1 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gold-600 dark:text-gold-400"
            >
              <Sparkles className="h-3.5 w-3.5" />
              دستاورد جدید!
            </motion.p>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-2 text-2xl font-extrabold"
            >
              {ach.title}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-muted-foreground"
            >
              {ach.description}
            </motion.p>

            {/* XP-gained badge */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.65, type: 'spring', stiffness: 200 }}
              className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-4 py-1.5 text-sm font-bold text-white shadow-lg shadow-gold-500/40"
            >
              <Zap className="h-4 w-4" />
              +{toPersianNumber(xpGained)} XP
            </motion.div>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.75 }}
              className="mx-auto mt-5 h-1 w-16 origin-center rounded-full bg-gradient-to-r from-gold-400 to-gold-600"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
