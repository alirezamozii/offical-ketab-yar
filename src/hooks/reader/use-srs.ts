'use client'

/**
 * Spaced Repetition System (SRS) — Leitner 7-box algorithm.
 *
 * Box → review interval (graduated):
 *   1  new / forgotten     0 min   (review again now)
 *   2  learning            10 minutes
 *   3  learning            1 hour
 *   4  familiar            1 day
 *   5  familiar            3 days
 *   6  almost-mastered     1 week
 *   7  mastered            2 weeks
 *
 * Correct answer  → box = min(box + 1, 7)
 * Wrong answer    → box = max(1, box - 1) (Leitner "drop back one box")
 * nextReview      = now + interval[box]
 *
 * Mastery buckets:
 *   new           box 1 (or no record)
 *   learning      box 2-3
 *   familiar      box 4-5
 *   mastered      box 6-7
 *
 * All state lives in localStorage under `ky_srs`. The server stays the
 * source of truth for word *content*; the client owns scheduling.
 *
 * A "daily review queue" is computed from due words + new words (capped)
 * so the UI can present a focused review-session without surprises.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '@/lib/storage-keys'

const KEY = STORAGE_KEYS.srs
const EVENT = 'ky_srs:change'

export type SrsBox = 1 | 2 | 3 | 4 | 5 | 6 | 7

/** Coarse mastery bucket (used for charts + filter tabs). */
export type MasteryLevel = 'new' | 'learning' | 'familiar' | 'mastered'

export interface SrsRecord {
  box: SrsBox
  nextReview: number // epoch ms (0 = immediately due)
  reviewCount: number
  correctCount: number
  lastReviewedAt: number | null
  celebratedAt: number | null // when first reached box 7 (mastered)
  /** Box-5 reachedAt — kept for backward-compat celebration analytics. */
  celebratedAt5: number | null
}

export type SrsMap = Record<string, SrsRecord>

export interface SrsStats {
  /** Mastered (box 6-7). Replaces the old "learned" counter. */
  mastered: number
  /** Familiar (box 4-5). */
  familiar: number
  /** Learning (box 2-3). */
  learning: number
  /** Fresh / new (box 1 or no record). */
  fresh: number
  dueToday: number // nextReview <= now
  total: number
  /**
   * @deprecated use `mastered` instead. Kept for backward-compat with
   * older callers; equals mastered + familiar (box >= 4).
   */
  learned: number
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const INTERVALS: Record<SrsBox, number> = {
  1: 0,
  2: 10 * MINUTE,
  3: 1 * HOUR,
  4: 1 * DAY,
  5: 3 * DAY,
  6: 7 * DAY,
  7: 14 * DAY,
}

/** Default daily-review-queue cap — surfaced via `getDailyReviewQueue`. */
const DEFAULT_DAILY_REVIEW_LIMIT = 20

function defaultRecord(): SrsRecord {
  return {
    box: 1,
    nextReview: 0,
    reviewCount: 0,
    correctCount: 0,
    lastReviewedAt: null,
    celebratedAt: null,
    celebratedAt5: null,
  }
}

function read(): SrsMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const v = JSON.parse(raw)
    if (!v || typeof v !== 'object') return {}
    // sanitize
    const out: SrsMap = {}
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (!val || typeof val !== 'object') continue
      const r = val as Partial<SrsRecord>
      const box = clampBox(r.box)
      out[k] = {
        box,
        nextReview: Number(r.nextReview) || 0,
        reviewCount: Math.max(0, Math.floor(Number(r.reviewCount) || 0)),
        correctCount: Math.max(0, Math.floor(Number(r.correctCount) || 0)),
        lastReviewedAt:
          r.lastReviewedAt == null ? null : Number(r.lastReviewedAt) || null,
        celebratedAt:
          r.celebratedAt == null ? null : Number(r.celebratedAt) || null,
        celebratedAt5:
          r.celebratedAt5 == null
            ? r.celebratedAt == null
              ? null
              : Number(r.celebratedAt) || null
            : Number(r.celebratedAt5) || null,
      }
    }
    return out
  } catch {
    return {}
  }
}

function clampBox(b: unknown): SrsBox {
  const n = Math.floor(Number(b) || 1)
  if (n < 1) return 1
  if (n > 7) return 7
  return n as SrsBox
}

function write(map: SrsMap) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
    // Broadcast a custom event so other hook instances on the page update too.
    window.dispatchEvent(new CustomEvent(EVENT))
  } catch {}
}

export interface ReviewResult {
  record: SrsRecord
  /** Box just became 7 (mastered) for the first time. */
  leveledToMastered: boolean
  /** Box just became 5 (familiar) for the first time — kept for back-compat. */
  leveledTo5: boolean
  previousBox: SrsBox
}

/** Map a box (1-7) to a coarse mastery bucket. */
export function masteryFor(box: SrsBox): MasteryLevel {
  if (box <= 1) return 'new'
  if (box <= 3) return 'learning'
  if (box <= 5) return 'familiar'
  return 'mastered'
}

export function useSrs() {
  const [srs, setSrs] = useState<SrsMap>({})
  const [ready, setReady] = useState(false)

  // Load on mount + subscribe to broadcast events (other hook instances).
  useEffect(() => {
    setSrs(read())
    setReady(true)
    const handler = () => setSrs(read())
    window.addEventListener(EVENT, handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener(EVENT, handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  const getStatus = useCallback(
    (wordId: string): SrsRecord => {
      return srs[wordId] ?? defaultRecord()
    },
    [srs],
  )

  const isNew = useCallback(
    (wordId: string): boolean => !srs[wordId],
    [srs],
  )

  const isDue = useCallback(
    (wordId: string): boolean => {
      const r = srs[wordId]
      if (!r) return true // never reviewed → due immediately
      return r.nextReview <= Date.now()
    },
    [srs],
  )

  const getDueWordIds = useCallback(
    (allIds: string[]): string[] => {
      const now = Date.now()
      return allIds.filter((id) => {
        const r = srs[id]
        return !r || r.nextReview <= now
      })
    },
    [srs],
  )

  /**
   * Build the daily review queue: due words first (oldest first), then
   * fresh words to introduce new vocabulary, capped at `limit`.
   *
   * This is the source of truth for the "بررسی روزانه" (daily review)
   * queue surfaced on the vocabulary page.
   */
  const getDailyReviewQueue = useCallback(
    (allIds: string[], limit: number = DEFAULT_DAILY_REVIEW_LIMIT): string[] => {
      const now = Date.now()
      const due: { id: string; nextReview: number }[] = []
      const fresh: string[] = []
      for (const id of allIds) {
        const r = srs[id]
        if (!r) {
          fresh.push(id)
          continue
        }
        if (r.nextReview <= now) {
          due.push({ id, nextReview: r.nextReview })
        }
      }
      // Oldest-due first (nextReview 0 = highest priority; lower = earlier).
      due.sort((a, b) => a.nextReview - b.nextReview)
      const dueIds = due.map((d) => d.id)
      const remaining = Math.max(0, limit - dueIds.length)
      const freshIds = fresh.slice(0, remaining)
      return [...dueIds, ...freshIds]
    },
    [srs],
  )

  const review = useCallback(
    (wordId: string, correct: boolean): ReviewResult => {
      const prev = srs[wordId] ?? defaultRecord()
      const previousBox = prev.box
      let newBox: SrsBox
      if (correct) {
        newBox = (Math.min(prev.box + 1, 7) as SrsBox)
      } else {
        // Leitner "drop back one box" (rather than full reset) — gentler.
        newBox = (Math.max(1, prev.box - 1) as SrsBox)
      }
      const now = Date.now()
      const justHit5 =
        correct && newBox === 5 && prev.celebratedAt5 == null && prev.box < 5
      const justHitMastered =
        correct && newBox === 7 && prev.celebratedAt == null && prev.box < 7
      const next: SrsRecord = {
        box: newBox,
        nextReview: now + INTERVALS[newBox],
        reviewCount: prev.reviewCount + 1,
        correctCount: prev.correctCount + (correct ? 1 : 0),
        lastReviewedAt: now,
        celebratedAt: justHitMastered ? now : prev.celebratedAt,
        celebratedAt5: justHit5 ? now : prev.celebratedAt5,
      }
      const map = { ...srs, [wordId]: next }
      write(map)
      setSrs(map)
      return {
        record: next,
        leveledToMastered: justHitMastered,
        leveledTo5: justHit5,
        previousBox,
      }
    },
    [srs],
  )

  const resetWord = useCallback(
    (wordId: string) => {
      if (!srs[wordId]) return
      const map = { ...srs }
      delete map[wordId]
      write(map)
      setSrs(map)
    },
    [srs],
  )

  const resetAll = useCallback(() => {
    write({})
    setSrs({})
  }, [])

  const statsFor = useCallback(
    (allIds: string[]): SrsStats => {
      const now = Date.now()
      let mastered = 0
      let familiar = 0
      let learning = 0
      let fresh = 0
      let dueToday = 0
      for (const id of allIds) {
        const r = srs[id]
        if (!r) {
          fresh++
          dueToday++
          continue
        }
        if (r.box >= 6) mastered++
        else if (r.box >= 4) familiar++
        else if (r.box >= 2) learning++
        else fresh++
        if (r.nextReview <= now) dueToday++
      }
      return {
        mastered,
        familiar,
        learning,
        fresh,
        dueToday,
        total: allIds.length,
        // Backward-compat: "learned" used to mean box >= 4.
        learned: mastered + familiar,
      }
    },
    [srs],
  )

  /**
   * Count words whose `celebratedAt` (mastered) or `celebratedAt5`
   * (familiar) falls within the last 7 days. Used by the stats card
   * "کلمات یاد گرفته شده این هفته" counter.
   */
  const learnedThisWeek = useCallback((): number => {
    const weekAgo = Date.now() - 7 * DAY
    let count = 0
    for (const r of Object.values(srs)) {
      const ts = r.celebratedAt ?? r.celebratedAt5
      if (ts != null && ts >= weekAgo) count++
    }
    return count
  }, [srs])

  /** Distribution of words across the 4 mastery buckets. */
  const masteryDistribution = useCallback(
    (allIds: string[]): Record<MasteryLevel, number> => {
      const out: Record<MasteryLevel, number> = {
        new: 0,
        learning: 0,
        familiar: 0,
        mastered: 0,
      }
      for (const id of allIds) {
        const r = srs[id]
        const box: SrsBox = r?.box ?? 1
        out[masteryFor(box)]++
      }
      return out
    },
    [srs],
  )

  /** Review interval (ms) for a given word — exposed for UI display. */
  const reviewIntervalFor = useCallback(
    (wordId: string): number => {
      const r = srs[wordId]
      return INTERVALS[r?.box ?? 1]
    },
    [srs],
  )

  // Memoised stats object identity isn't required, but keep `srs` stable
  // for callers that include it in their own deps.
  const api = useMemo(
    () => ({
      srs,
      isReady: ready,
      getStatus,
      isNew,
      isDue,
      getDueWordIds,
      getDailyReviewQueue,
      review,
      resetWord,
      resetAll,
      statsFor,
      learnedThisWeek,
      masteryDistribution,
      reviewIntervalFor,
    }),
    [
      srs,
      ready,
      getStatus,
      isNew,
      isDue,
      getDueWordIds,
      getDailyReviewQueue,
      review,
      resetWord,
      resetAll,
      statsFor,
      learnedThisWeek,
      masteryDistribution,
      reviewIntervalFor,
    ],
  )

  return api
}

/** Color (Tailwind class) for a given box level — used by SrsDots and others. */
export function boxColor(box: SrsBox): string {
  switch (box) {
    case 1:
      return 'bg-muted-foreground/40'
    case 2:
      return 'bg-amber-300'
    case 3:
      return 'bg-amber-500'
    case 4:
      return 'bg-gold-400'
    case 5:
      return 'bg-emerald-400'
    case 6:
      return 'bg-emerald-500'
    case 7:
      return 'bg-emerald-600'
  }
}

/** Human-readable Persian label for a box level. */
export function boxLabel(box: SrsBox): string {
  switch (box) {
    case 1:
      return 'جدید'
    case 2:
      return 'در حال یادگیری'
    case 3:
      return 'در حال یادگیری'
    case 4:
      return 'آشنا'
    case 5:
      return 'آشنا'
    case 6:
      return 'تقریباً تسلط'
    case 7:
      return 'تسلط یافته'
  }
}

/** Coarse Persian label for a mastery bucket. */
export function masteryLabel(level: MasteryLevel): string {
  switch (level) {
    case 'new':
      return 'جدید'
    case 'learning':
      return 'در حال یادگیری'
    case 'familiar':
      return 'آشنا'
    case 'mastered':
      return 'تسلط یافته'
  }
}

/** Tailwind text color class for a mastery bucket (gold/amber/emerald scale). */
export function masteryColor(level: MasteryLevel): string {
  switch (level) {
    case 'new':
      return 'text-muted-foreground'
    case 'learning':
      return 'text-amber-600 dark:text-amber-400'
    case 'familiar':
      return 'text-gold-600 dark:text-gold-400'
    case 'mastered':
      return 'text-emerald-600 dark:text-emerald-400'
  }
}

/** Tailwind bg color class for a mastery bucket dot/chip. */
export function masteryBg(level: MasteryLevel): string {
  switch (level) {
    case 'new':
      return 'bg-muted-foreground/40'
    case 'learning':
      return 'bg-amber-500'
    case 'familiar':
      return 'bg-gold-500'
    case 'mastered':
      return 'bg-emerald-500'
  }
}

/** Interval (ms) for a given box — exposed for UI display. */
export function boxIntervalMs(box: SrsBox): number {
  return INTERVALS[box]
}

/** Friendly Persian interval string. */
export function boxIntervalLabel(box: SrsBox): string {
  switch (box) {
    case 1:
      return 'همین حالا'
    case 2:
      return '۱۰ دقیقه بعد'
    case 3:
      return 'یک ساعت بعد'
    case 4:
      return 'فردا'
    case 5:
      return '۳ روز بعد'
    case 6:
      return 'هفته بعد'
    case 7:
      return 'دو هفته بعد'
  }
}
