'use client'

/**
 * BookCompletionCelebration — listens for `ky:book-completed` CustomEvents
 * (dispatched by use-reader-xp when the user reaches the last page) and
 * shows a premium full-screen confetti celebration + a congratulations modal.
 *
 * Features:
 *   • Gold-themed confetti burst (60 pieces, gravity + rotation)
 *   • Modal with the book title, a trophy icon, and motivational copy
 *   • "ادامه مطالعه" (Continue) + "رفتن به داشبورد" (Go to dashboard) CTAs
 *   • Respects `useReducedMotion` — skips confetti animation
 *   • Auto-dismisses after 8s, or on CTA click, or on Escape
 *   • Persists dismissal in a ref so it only fires once per book per session
 *
 * Rendered inside the reader page (not the root layout) so it only loads
 * its confetti bundle when the reader is open.
 */

// cn not needed — classNames are inline
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { BookOpen, Sparkles, Trophy, X } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

interface CompletionDetails {
  bookSlug: string
  bookTitle: string
  bookLevel?: string
}

/** A single confetti piece with random position/rotation/color. */
interface ConfettiPiece {
  id: number
  x: number // initial x (% of viewport width)
  delay: number // seconds
  duration: number // seconds
  rotation: number // degrees
  color: string
  size: number // px
}

const CONFETTI_COLORS = [
  '#b8956a', // gold-500
  '#a67f56', // gold-600
  '#cdb89a', // gold-400
  '#d4af37', // gold (classic)
  '#8a6847', // gold-700
  '#faf9f7', // gold-50 (cream)
]

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 2 + Math.random() * 1.5,
    rotation: Math.random() * 720 - 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.random() * 8,
  }))
}

export function BookCompletionCelebration() {
  const [details, setDetails] = useState<CompletionDetails | null>(null)
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([])
  const reduceMotion = useReducedMotion()
  const shownFor = useRef<Set<string>>(new Set())

  const dismiss = useCallback(() => {
    setDetails(null)
    setConfetti([])
  }, [])

  useEffect(() => {
    const onCompleted = (e: Event) => {
      const ce = e as CustomEvent<CompletionDetails>
      const d = ce.detail
      if (!d?.bookSlug) return
      // Only fire once per book per reader session.
      if (shownFor.current.has(d.bookSlug)) return
      shownFor.current.add(d.bookSlug)

      setDetails(d)
      if (!reduceMotion) {
        setConfetti(generateConfetti(60))
      }

      // Auto-dismiss after 8 seconds.
      const t = setTimeout(dismiss, 8000)
      return () => clearTimeout(t)
    }

    window.addEventListener('ky:book-completed', onCompleted)
    return () => window.removeEventListener('ky:book-completed', onCompleted)
  }, [reduceMotion, dismiss])

  // Escape to dismiss.
  useEffect(() => {
    if (!details) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [details, dismiss])

  return (
    <AnimatePresence>
      {details && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="book-completion-title"
        >
          {/* Backdrop — dark with gold tint */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Confetti layer */}
          {!reduceMotion && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {confetti.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{
                    x: `${p.x}vw`,
                    y: '-10vh',
                    rotate: 0,
                    opacity: 1,
                  }}
                  animate={{
                    y: '110vh',
                    rotate: p.rotation,
                    opacity: [1, 1, 0.8, 0],
                  }}
                  transition={{
                    duration: p.duration,
                    delay: p.delay,
                    ease: [0.25, 0.46, 0.45, 0.94], // ease-in for gravity
                  }}
                  style={{
                    position: 'absolute',
                    width: p.size,
                    height: p.size * 0.6,
                    backgroundColor: p.color,
                    borderRadius: '2px',
                  }}
                />
              ))}
            </div>
          )}

          {/* Modal card */}
          <motion.div
            initial={reduceMotion ? false : { scale: 0.85, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border-2 border-gold-400/50 bg-gradient-to-br from-gold-50 via-card to-gold-100/50 p-8 text-center shadow-2xl shadow-gold-800/30 dark:from-background dark:via-card dark:to-gold-900/20"
          >
            {/* Top gradient accent bar */}
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-l from-gold-500 via-gold-700 to-gold-800" />

            {/* Close button */}
            <button
              onClick={dismiss}
              aria-label="بستن"
              className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Trophy icon with glow */}
            <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center">
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-gold-500/30 blur-xl"
              />
              <motion.div
                initial={reduceMotion ? false : { scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-700 shadow-lg shadow-gold-600/40"
              >
                <Trophy className="h-10 w-10 text-white" strokeWidth={2} />
              </motion.div>
            </div>

            {/* Title + sparkles */}
            <div className="mb-2 flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-gold-600 dark:text-gold-400" />
              <h2
                id="book-completion-title"
                className="text-xl font-extrabold text-foreground"
              >
                تبریک! کتاب را کامل کردید
              </h2>
              <Sparkles className="h-5 w-5 text-gold-600 dark:text-gold-400" />
            </div>

            {/* Book title */}
            <p className="mb-1 text-sm text-muted-foreground">
              شما با موفقیت خواندن این کتاب را به پایان رساندید:
            </p>
            <p className="mb-6 text-lg font-bold leading-snug text-gold-700 dark:text-gold-300">
              {details.bookTitle}
            </p>

            {/* Encouraging message */}
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              هر کتابی که می‌خوانید، یک گام به تسلط زبان انگلیسی نزدیک‌تر می‌شوید.
              به زنجیره مطالعه خود ادامه دهید و کتاب بعدی را کشف کنید!
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={dismiss}
                className="flex-1 rounded-xl bg-gradient-to-r from-gold-500 to-gold-700 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-gold-600/30 transition-[transform,opacity,colors,border-color,background-color] hover:shadow-lg hover:shadow-gold-600/40 active:scale-95"
              >
                ادامه مطالعه
              </button>
              <Link
                href="/dashboard"
                onClick={dismiss}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/50 px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-gold-400/60 hover:bg-gold-500/5"
              >
                <BookOpen className="h-4 w-4" />
                داشبورد
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
