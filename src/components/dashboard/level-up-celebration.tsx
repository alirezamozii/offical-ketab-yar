'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toPersianNumber } from '@/lib/gamification'
import { onXPUpdate } from '@/lib/xp-events'
import { STORAGE_KEYS } from '@/lib/storage-keys'

interface LevelUpDetail {
  level: number
  title: string
  totalXP: number
}

interface XPStatsResponse {
  level: number
  levelTitle: string
  totalXP: number
}

interface ConfettiPiece {
  id: number
  x: number
  y: number
  rotation: number
  color: string
  delay: number
  size: number
}

const COLORS = [
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#8a6847', // gold-700 — replaces violet (#8b5cf6) per color-discipline audit
  '#10b981',
  '#fde047',
  '#b8956a',
]

const LAST_LEVEL_KEY = STORAGE_KEYS.lastLevel

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    rotation: Math.random() * 360,
    color: COLORS[i % COLORS.length],
    delay: Math.random() * 0.4,
    size: 6 + Math.random() * 8,
  }))
}

function getLastLevel(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LAST_LEVEL_KEY)
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

function saveLastLevel(level: number) {
  try {
    localStorage.setItem(LAST_LEVEL_KEY, String(level))
  } catch {}
}

/**
 * Full-screen confetti + modal that fires when the XP API returns
 * `leveledUp: true`. The component does three things:
 *
 *  1. On mount, fetches /api/xp (GET) and compares the current level to the
 *     last-known level stored in localStorage. If the current level is
 *     higher (e.g. the user read a book in another tab/page and just
 *     navigated here), fire the celebration. Always updates the baseline.
 *  2. Subscribes to `ky-xp-update` events dispatched by `postXP()` (see
 *     `src/lib/xp-events.ts`). If the response contains `leveledUp: true`,
 *     fire immediately. Replaces the previous window.fetch monkey-patch
 *     that was fragile under sibling-unmount ordering.
 *  3. Listens for a custom `ky:level-up` event so other code paths can
 *     trigger it manually.
 */
export function LevelUpCelebration() {
  const [show, setShow] = useState(false)
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([])
  const [detail, setDetail] = useState<LevelUpDetail | null>(null)

  function trigger(d: LevelUpDetail) {
    setDetail(d)
    setConfetti(generateConfetti(80))
    setShow(true)
    saveLastLevel(d.level)
  }

  // 1. On mount, check for cross-page level changes via GET.
  useEffect(() => {
    let alive = true
    fetch('/api/xp', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: XPStatsResponse | null) => {
        if (!alive || !data) return
        const last = getLastLevel()
        if (last !== null && data.level > last) {
          trigger({
            level: data.level,
            title: data.levelTitle,
            totalXP: data.totalXP,
          })
        } else {
          saveLastLevel(data.level)
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  // 2 + 3. Subscribe to XP-update events + listen for custom event.
  useEffect(() => {
    const onCustom = (e: Event) => {
      const ce = e as CustomEvent<LevelUpDetail>
      if (ce.detail) trigger(ce.detail)
    }
    window.addEventListener('ky:level-up', onCustom as EventListener)

    const unsubscribe = onXPUpdate(({ response }) => {
      if (!response.leveledUp) return
      const lvl = response.newLevel ?? response.level ?? 0
      if (lvl > 0) {
        trigger({
          level: lvl,
          title: response.levelTitle || '',
          totalXP: response.totalXP ?? 0,
        })
      }
    })

    return () => {
      window.removeEventListener('ky:level-up', onCustom as EventListener)
      unsubscribe()
    }
  }, [])

  // Auto-dismiss after 7s
  useEffect(() => {
    if (!show) return
    const t = setTimeout(() => setShow(false), 7000)
    return () => clearTimeout(t)
  }, [show])

  return (
    <AnimatePresence>
      {show && detail && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[210] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="ارتقای سطح"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Confetti */}
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
                  duration: 3.5 + Math.random() * 1.5,
                  delay: c.delay,
                  ease: 'easeOut',
                }}
                className="absolute rounded-sm"
                style={{
                  background: c.color,
                  width: `${c.size}px`,
                  height: `${c.size}px`,
                }}
              />
            ))}
          </div>

          {/* Radial gold glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/20 blur-3xl" />
          </div>

          {/* Card */}
          <motion.div
            initial={{ scale: 0.5, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.5, y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 250, damping: 20 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border-2 border-gold-400 bg-gradient-to-br from-gold-500/10 via-card to-card p-8 text-center shadow-2xl"
          >
            <button
              onClick={() => setShow(false)}
              className="absolute end-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="بستن"
            >
              <X className="h-5 w-5" />
            </button>

            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gold-500/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-gold-700 dark:text-gold-400"
            >
              <Sparkles className="h-3.5 w-3.5" />
              ارتقای سطح
            </motion.div>

            {/* Level badge */}
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
              className="relative mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 text-white shadow-2xl shadow-gold-500/40"
            >
              <div className="absolute inset-0 rounded-full bg-white/20 blur-md" />
              <div className="relative flex flex-col items-center leading-none">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                  LVL
                </span>
                <span className="text-4xl font-extrabold tabular-nums">
                  {toPersianNumber(detail.level)}
                </span>
              </div>
              {/* Sparkle pulse */}
              <motion.span
                className="absolute -end-1 -top-1 text-2xl"
                animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✨
              </motion.span>
            </motion.div>

            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-extrabold"
            >
              تبریک!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-1 text-lg font-bold text-gold-700 dark:text-gold-400"
            >
              {detail.title}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-2 text-sm text-muted-foreground"
            >
              به سطح {toPersianNumber(detail.level)} رسیدی —{' '}
              {toPersianNumber(detail.totalXP)} XP جمع‌آوری کرده‌ای. به مطالعه
              ادامه بده!
            </motion.p>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.6 }}
              className="mx-auto mt-5 h-1 w-20 origin-center rounded-full bg-gradient-to-r from-gold-400 to-gold-600"
            />

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              onClick={() => setShow(false)}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-gold-500 to-gold-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-gold-500/30 transition-transform hover:scale-[1.02]"
            >
              ادامه
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
