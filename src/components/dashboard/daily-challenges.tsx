'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  dateKey,
  toPersianNumber,
  type ChallengeDef,
} from '@/lib/gamification'
import { onXPUpdate, postXP } from '@/lib/xp-events'
import { useReadingStreak } from '@/hooks/reader/use-reading-streak'
import { getLocalProgress } from '@/hooks/reader/use-local-progress'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Gift, Sparkles, Trophy } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS, getStorageKey } from '@/lib/storage-keys'

interface ChallengesResponse {
  date: string
  challenges: ChallengeDef[]
  pool: ChallengeDef[]
}

interface ChallengeState {
  /** raw progress value (in the challenge's natural unit) */
  progress: number
  claimed: boolean
}

type StateMap = Record<string, ChallengeState>

const ALL_DONE_BONUS = 50

function stateKey(date: string) {
  return getStorageKey('challenges', date)
}

function loadState(date: string): StateMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(stateKey(date))
    if (!raw) return {}
    const v = JSON.parse(raw)
    return v && typeof v === 'object' ? (v as StateMap) : {}
  } catch {
    return {}
  }
}

function saveState(date: string, state: StateMap) {
  try {
    localStorage.setItem(stateKey(date), JSON.stringify(state))
  } catch {}
}

/** Stable per-day vocab baseline so "X new words today" = current − baseline. */
function vocabBaselineKey(date: string) {
  return getStorageKey('vocabBaseline', date)
}

function loadVocabBaseline(date: string): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(vocabBaselineKey(date))
    if (raw == null) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

function saveVocabBaseline(date: string, n: number) {
  try {
    localStorage.setItem(vocabBaselineKey(date), String(n))
  } catch {}
}

/** Pages-read-today baseline (sum of currentPage across all books at midnight). */
function pagesBaselineKey(date: string) {
  return getStorageKey('pagesBaseline', date)
}

function loadPagesBaseline(date: string): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(pagesBaselineKey(date))
    if (raw == null) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

function savePagesBaseline(date: string, n: number) {
  try {
    localStorage.setItem(pagesBaselineKey(date), String(n))
  } catch {}
}

/** Sum of currentPage across all entries in the local progress map. */
function totalPagesRead(): number {
  const map = getLocalProgress()
  return Object.values(map).reduce((s, p) => s + (p.currentPage || 0), 0)
}

export function DailyChallenges() {
  const today = useMemo(() => dateKey(new Date()), [])
  const [challenges, setChallenges] = useState<ChallengeDef[]>([])
  const [state, setState] = useState<StateMap>({})
  const [vocabCount, setVocabCount] = useState(0)
  const [gamesToday, setGamesToday] = useState(0)
  const [bookFinishedToday, setBookFinishedToday] = useState(false)
  const [allDoneBonusClaimed, setAllDoneBonusClaimed] = useState(false)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [justClaimed, setJustClaimed] = useState<{ reward: number } | null>(null)

  const { data: streakData } = useReadingStreak()
  const todaySeconds = streakData.todaySeconds
  const readToday = streakData.activeDays.includes(today)

  // Load today's challenges from the API.
  useEffect(() => {
    let alive = true
    fetch('/api/challenges', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ChallengesResponse | null) => {
        if (!alive || !data) return
        setChallenges(data.challenges)
        // load saved state for today
        const s = loadState(data.date)
        setState(s)
        setAllDoneBonusClaimed(Boolean(localStorage.getItem(getStorageKey('challengesBonus', data.date))))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [today])

  // Fetch vocab count once on mount and set baseline.
  useEffect(() => {
    let alive = true
    fetch('/api/vocabulary', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((arr: unknown[]) => {
        if (!alive) return
        const n = Array.isArray(arr) ? arr.length : 0
        setVocabCount(n)
        if (loadVocabBaseline(today) == null) {
          saveVocabBaseline(today, n)
        }
      })
      .catch(() => {})
    // refresh vocab count periodically (in case user adds words in another tab)
    const id = setInterval(() => {
      fetch('/api/vocabulary', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : []))
        .then((arr: unknown[]) => {
          if (!alive) return
          setVocabCount(Array.isArray(arr) ? arr.length : 0)
        })
        .catch(() => {})
    }, 30_000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [today])

  // Initialize pages baseline at midnight.
  useEffect(() => {
    if (loadPagesBaseline(today) == null) {
      savePagesBaseline(today, totalPagesRead())
    }
  }, [today])

  // Count games played today by listening for XP-update events whose request
  // body carried `vocabGameXP > 0` (vocab-game completion marker) or
  // `completedBook === true` (book-finished-today flag). Replaces the previous
  // window.fetch monkey-patch — see `src/lib/xp-events.ts`.
  useEffect(() => {
    const gamesKey = getStorageKey('gamesToday', today)
    const read = () => {
      try {
        const raw = localStorage.getItem(gamesKey)
        return raw ? Number(raw) || 0 : 0
      } catch {
        return 0
      }
    }
    setGamesToday(read())
    const unsubscribe = onXPUpdate(({ body }) => {
      if (Number(body.vocabGameXP) > 0) {
        const next = read() + 1
        try {
          localStorage.setItem(gamesKey, String(next))
        } catch {}
        setGamesToday(next)
      }
      if (body.completedBook) {
        setBookFinishedToday(true)
      }
    })
    return unsubscribe
  }, [today])

  // Also listen for cross-tab vocab additions and book completions.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.progress) {
        // detect book completion via percent==100 (rough check)
        try {
          const v: Record<string, { percent?: number; ts?: number }> = e.newValue
            ? JSON.parse(e.newValue)
            : {}
          const any = Object.values(v || {}).some(
            (p) => !!p && (p.percent ?? 0) >= 100 && Date.now() - (p.ts || 0) < 60_000,
          )
          if (any) setBookFinishedToday(true)
        } catch {}
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Compute live progress for each challenge.
  const liveProgress = useMemo<Record<string, number>>(() => {
    const vocabBaseline = loadVocabBaseline(today) ?? vocabCount
    const pagesBaseline = loadPagesBaseline(today) ?? totalPagesRead()
    const out: Record<string, number> = {}
    for (const c of challenges) {
      switch (c.id) {
        case 'read-10m':
        case 'read-20m':
          out[c.id] = todaySeconds
          break
        case 'learn-3':
        case 'learn-5':
          out[c.id] = Math.max(0, vocabCount - vocabBaseline)
          break
        case 'play-1':
          out[c.id] = gamesToday
          break
        case 'read-5p':
          out[c.id] = Math.max(0, totalPagesRead() - pagesBaseline)
          break
        case 'streak-check':
          out[c.id] = readToday ? 1 : 0
          break
        case 'finish-1':
          out[c.id] = bookFinishedToday ? 1 : 0
          break
        default:
          out[c.id] = 0
      }
    }
    return out
  }, [challenges, today, todaySeconds, vocabCount, gamesToday, readToday, bookFinishedToday])

  const claimedCount = challenges.filter(
    (c) => state[c.id]?.claimed,
  ).length
  const allDone = challenges.length > 0 && claimedCount === challenges.length

  const claim = useCallback(
    async (c: ChallengeDef) => {
      const existing = state[c.id]
      if (existing?.claimed) return
      const progress = liveProgress[c.id] ?? 0
      if (progress < c.target) return
      setClaiming(c.id)
      try {
        // Award XP via /api/xp (vocabGameXP channel works for any bonus XP).
        await postXP({
          pagesRead: 0,
          completedBook: false,
          bookLevel: 'beginner',
          isFirstReadToday: false,
          vocabGameXP: c.reward,
        }).catch(() => {})
        const next: StateMap = {
          ...state,
          [c.id]: { progress, claimed: true },
        }
        setState(next)
        saveState(today, next)
        setJustClaimed({ reward: c.reward })
        setTimeout(() => setJustClaimed(null), 2200)
      } finally {
        setClaiming(null)
      }
    },
    [state, liveProgress, today],
  )

  const claimAllDoneBonus = useCallback(async () => {
    if (allDoneBonusClaimed || !allDone) return
    setClaiming('__bonus__')
    try {
      await postXP({
        pagesRead: 0,
        completedBook: false,
        bookLevel: 'beginner',
        isFirstReadToday: false,
        vocabGameXP: ALL_DONE_BONUS,
      }).catch(() => {})
      try {
        localStorage.setItem(getStorageKey('challengesBonus', today), '1')
      } catch {}
      setAllDoneBonusClaimed(true)
      setJustClaimed({ reward: ALL_DONE_BONUS })
      setTimeout(() => setJustClaimed(null), 2200)
    } finally {
      setClaiming(null)
    }
  }, [allDone, allDoneBonusClaimed, today])

  if (challenges.length === 0) return null

  return (
    <Card className="overflow-hidden border-gold-500/30 bg-gradient-to-br from-gold-500/5 via-card to-card">
      <CardContent className="pt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">چالش‌های امروز</h2>
              <p className="text-xs text-muted-foreground">
                هر روز سه چالش تازه — همه را کامل کن و پاداش ویژه بگیر
              </p>
            </div>
          </div>
          <div className="rounded-full bg-gold-500/15 px-3 py-1 text-xs font-bold text-gold-700 dark:text-gold-400">
            {toPersianNumber(claimedCount)} / {toPersianNumber(challenges.length)} انجام شد
          </div>
        </div>

        <div className="space-y-3">
          {challenges.map((c, idx) => {
            const st = state[c.id]
            const claimed = st?.claimed ?? false
            const live = liveProgress[c.id] ?? 0
            const pct = Math.min(100, Math.round((live / c.target) * 100))
            const complete = live >= c.target
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className={cn(
                  'rounded-2xl border p-3 transition-colors',
                  claimed
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : complete
                      ? 'border-gold-500/60 bg-gold-500/5'
                      : 'border-border/60 bg-card/50',
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl',
                      claimed
                        ? 'bg-emerald-500/15'
                        : 'bg-muted',
                    )}
                  >
                    {claimed ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : c.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <p className="truncate text-sm font-semibold">{c.title}</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-bold text-gold-700 dark:text-gold-400">
                        <Gift className="h-3 w-3" />+{toPersianNumber(c.reward)} XP
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{c.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={pct} className="h-1.5 flex-1" />
                      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                        {toPersianNumber(Math.min(live, c.target))} / {toPersianNumber(c.target)}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {claimed ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        انجام شد
                      </span>
                    ) : complete ? (
                      <Button
                        size="sm"
                        variant="glow"
                        className="h-8 gap-1 px-3 text-xs"
                        disabled={claiming === c.id}
                        onClick={() => claim(c)}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {claiming === c.id ? 'در حال...' : 'دریافت پاداش'}
                      </Button>
                    ) : (
                      <span className="rounded-lg bg-muted px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground">
                        در حال انجام
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* All-done bonus */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div
                className={cn(
                  'flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-dashed p-3',
                  allDoneBonusClaimed
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-gold-500/60 bg-gold-500/10',
                )}
              >
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-gold-600 dark:text-gold-400" />
                  <div>
                    <p className="text-sm font-bold">پاداش تکمیل همه چالش‌ها</p>
                    <p className="text-[11px] text-muted-foreground">
                      همه‌ی چالش‌های امروز را تمام کردی! +{toPersianNumber(ALL_DONE_BONUS)} XP اضافه
                    </p>
                  </div>
                </div>
                {allDoneBonusClaimed ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    دریافت شد
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="glow"
                    className="gap-1"
                    disabled={claiming === '__bonus__'}
                    onClick={claimAllDoneBonus}
                  >
                    <Gift className="h-4 w-4" />
                    {claiming === '__bonus__' ? 'در حال...' : `دریافت +${toPersianNumber(ALL_DONE_BONUS)} XP`}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Just-claimed toast (inline, no sonner dependency here) */}
        <AnimatePresence>
          {justClaimed && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gradient-to-r from-gold-500 to-gold-700 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-gold-500/30"
            >
              +{toPersianNumber(justClaimed.reward)} XP دریافت کردی! 🎉
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
