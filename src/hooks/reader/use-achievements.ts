'use client'

import { useEffect, useMemo, useState } from 'react'
import { useReadingStreak } from '@/hooks/reader/use-reading-streak'
import { getLocalProgress } from '@/hooks/reader/use-local-progress'
import { onXPUpdate } from '@/lib/xp-events'
import { STORAGE_KEYS } from '@/lib/storage-keys'

const SEEN_KEY = STORAGE_KEYS.achievementsSeen
const GAMES_PLAYED_KEY = STORAGE_KEYS.vocabGamesPlayed

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string // emoji or lucide name key
  color: string // gradient
  unlocked: boolean
  progress?: number // 0-100 for locked achievements
}

function loadSeen(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw))
  } catch {
    return new Set()
  }
}

function saveSeen(set: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...set]))
  } catch {}
}

function loadGamesPlayed(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem(GAMES_PLAYED_KEY)
    const n = Number(raw)
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

export function useAchievements() {
  const { data: streak } = useReadingStreak()
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([])
  const [seen, setSeen] = useState<Set<string>>(() => new Set())
  const [gamesPlayed, setGamesPlayed] = useState(0)

  // compute current progress data
  const progressMap = typeof window !== 'undefined' ? getLocalProgress() : {}
  const booksStarted = Object.keys(progressMap).length
  const booksCompleted = Object.values(progressMap).filter(
    (p) => p.percent >= 100,
  ).length
  const currentStreak = streak.currentStreak
  const longestStreak = streak.longestStreak
  const totalReadingDays = streak.totalReadingDays

  const vocabCount = typeof window !== 'undefined' ? (window as unknown as { __kyVocabCount?: number }).__kyVocabCount || 0 : 0

  // load seen + games played from localStorage on mount. Also subscribe to
  // cross-tab `storage` events so achievements unlocked in another tab are
  // reflected here without a manual refresh. A `ky_progress` write in another
  // tab (e.g. the user finishing a book) also bumps `seen`/`gamesPlayed`
  // state, which triggers a re-render and re-reads `progressMap` below.
  useEffect(() => {
    setSeen(loadSeen())
    setGamesPlayed(loadGamesPlayed())
    const onStorage = (e: StorageEvent) => {
      if (e.key === SEEN_KEY) setSeen(loadSeen())
      if (e.key === GAMES_PLAYED_KEY) setGamesPlayed(loadGamesPlayed())
      // ky_progress changes flip achievement unlock state — force a re-render
      // so the memoized achievements array recomputes against fresh progress.
      if (e.key === STORAGE_KEYS.progress) {
        setSeen((s) => new Set(s))
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Detect game plays by listening for XP-update events whose request body
  // carried `vocabGameXP > 0` (the marker the vocab games POST when a session
  // ends). Replaces the previous window.fetch monkey-patch which was fragile
  // under sibling-unmount ordering. See `src/lib/xp-events.ts`.
  useEffect(() => {
    const unsubscribe = onXPUpdate(({ body }) => {
      if (Number(body.vocabGameXP) > 0) {
        const next = loadGamesPlayed() + 1
        try {
          localStorage.setItem(GAMES_PLAYED_KEY, String(next))
        } catch {}
        setGamesPlayed(next)
      }
    })
    return unsubscribe
  }, [])

  // Memoize so consumers (AchievementCelebration's effect) don't re-run
  // every render. Deps are the primitive values the array is derived from;
  // when none of them change, the array reference is stable.
  const achievements: Achievement[] = useMemo<Achievement[]>(() => [
    {
      id: 'first-book',
      title: 'آغاز سفر',
      description: 'اولین کتاب را شروع کن',
      icon: '📖',
      color: 'from-amber-400 to-orange-500',
      unlocked: booksStarted >= 1,
      progress: Math.min(100, booksStarted * 100),
    },
    {
      id: 'first-finish',
      title: 'پایان اولین کتاب',
      description: 'یک کتاب را تا انتها بخوان',
      icon: '🏆',
      color: 'from-emerald-400 to-teal-500',
      unlocked: booksCompleted >= 1,
      progress: Math.min(100, booksCompleted * 100),
    },
    {
      id: 'streak-3',
      title: 'سه روز متوالی',
      description: '۳ روز پشت سر هم بخوان',
      icon: '🔥',
      color: 'from-rose-400 to-red-500',
      unlocked: longestStreak >= 3,
      progress: Math.min(100, (longestStreak / 3) * 100),
    },
    {
      id: 'streak-7',
      title: 'یک هفته پایدار',
      description: '۷ روز متوالی مطالعه',
      icon: '⚡',
      color: 'from-violet-400 to-purple-500',
      unlocked: longestStreak >= 7,
      progress: Math.min(100, (longestStreak / 7) * 100),
    },
    {
      id: 'streak-30',
      title: 'یک ماه پایدار',
      description: '۳۰ روز متوالی مطالعه',
      icon: '👑',
      color: 'from-yellow-400 to-amber-500',
      unlocked: longestStreak >= 30,
      progress: Math.min(100, (longestStreak / 30) * 100),
    },
    {
      id: 'reader-10',
      title: 'وفادار به کتاب',
      description: 'در ۱۰ روز مختلف مطالعه کن',
      icon: '📚',
      color: 'from-sky-400 to-blue-500',
      unlocked: totalReadingDays >= 10,
      progress: Math.min(100, (totalReadingDays / 10) * 100),
    },
    {
      id: 'books-5',
      title: 'کتاب‌خوان',
      description: '۵ کتاب را شروع کن',
      icon: '🌟',
      color: 'from-fuchsia-400 to-pink-500',
      unlocked: booksStarted >= 5,
      progress: Math.min(100, (booksStarted / 5) * 100),
    },
    {
      id: 'books-finish-3',
      title: 'پایان‌بنده',
      description: '۳ کتاب را تمام کن',
      icon: '🎓',
      color: 'from-cyan-400 to-sky-500',
      unlocked: booksCompleted >= 3,
      progress: Math.min(100, (booksCompleted / 3) * 100),
    },
    // ——— A7 expansion (4 new achievements) ———
    {
      id: 'vocab-50',
      title: 'واژه‌شناس',
      description: '۵۰ واژه ذخیره کن',
      icon: '📝',
      color: 'from-lime-400 to-emerald-500',
      unlocked: vocabCount >= 50,
      progress: Math.min(100, (vocabCount / 50) * 100),
    },
    {
      id: 'games-5',
      title: 'بازی‌باز',
      description: '۵ بازی واژگان انجام بده',
      icon: '🎮',
      color: 'from-indigo-400 to-violet-500',
      unlocked: gamesPlayed >= 5,
      progress: Math.min(100, (gamesPlayed / 5) * 100),
    },
    {
      id: 'streak-30-cur',
      title: 'یک ماهه',
      description: 'استمرار فعلی ۳۰ روزه',
      icon: '🌙',
      color: 'from-amber-300 to-orange-500',
      unlocked: currentStreak >= 30,
      progress: Math.min(100, (currentStreak / 30) * 100),
    },
    {
      id: 'books-10-start',
      title: 'فصل‌خوان',
      description: '۱۰ کتاب را شروع کن',
      icon: '🗂️',
      color: 'from-rose-400 to-red-500',
      unlocked: booksStarted >= 10,
      progress: Math.min(100, (booksStarted / 10) * 100),
    },
  ], [booksStarted, booksCompleted, longestStreak, totalReadingDays, currentStreak, vocabCount, gamesPlayed])

  // detect newly unlocked achievements. We intentionally do NOT include
  // `achievements` in the dep array — it's memoized above on the same
  // primitives we already list here, so depending on the primitives is
  // sufficient (and avoids an extra reference check).
  useEffect(() => {
    const newly: string[] = []
    for (const a of achievements) {
      if (a.unlocked && !seen.has(a.id)) {
        newly.push(a.id)
      }
    }
    if (newly.length > 0) {
      setNewlyUnlocked(newly)
      const next = new Set(seen)
      newly.forEach((id) => next.add(id))
      setSeen(next)
      saveSeen(next)
    }
  }, [achievements, seen, booksStarted, booksCompleted, longestStreak, totalReadingDays, currentStreak, vocabCount, gamesPlayed])

  // Clear the "newly unlocked" notification after a 6-second delay. Lives in
  // its own effect so the timer isn't cancelled by unrelated re-renders.
  useEffect(() => {
    if (newlyUnlocked.length === 0) return
    const t = setTimeout(() => setNewlyUnlocked([]), 6000)
    return () => clearTimeout(t)
  }, [newlyUnlocked])

  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return { achievements, unlockedCount, total: achievements.length, newlyUnlocked }
}

/** Allow vocabulary count to be set from outside for achievement tracking. */
export function setVocabCount(n: number) {
  if (typeof window !== 'undefined') {
    ;(window as unknown as { __kyVocabCount?: number }).__kyVocabCount = n
  }
}
