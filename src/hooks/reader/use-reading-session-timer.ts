'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { postXP } from '@/lib/xp-events'
import { STORAGE_KEYS } from '@/lib/storage-keys'

/**
 * A single reading session summary, appended to the session-history list
 * whenever the reader unmounts (i.e. the user leaves the reader view).
 */
export interface ReaderSessionHistoryEntry {
  /** ISO string — when the session started. */
  startedAt: string
  /** ISO string — when the session ended. */
  endedAt: string
  /** Total seconds spent in the reader (paused-time excluded). */
  seconds: number
  /** Book slug for the session. */
  bookSlug: string
  /** Book title (snapshot for display in profile / dashboard). */
  bookTitle: string
}

const MAX_HISTORY = 50
/** How often (seconds) to flush time-based XP to the server. */
const XP_FLUSH_INTERVAL_SECONDS = 60
/** XP awarded per flush (≈ XP for ~6 pages, conservative). */
const XP_PER_FLUSH = 6

function toFa(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
}

export function formatSessionTime(s: number): string {
  if (s < 60) return `۰:${String(s).padStart(2, '0')}`
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m < 60) return `${toFa(m)}:${String(toFa(sec)).padStart(2, '۰')}`
  const h = Math.floor(m / 60)
  return `${toFa(h)}:${String(toFa(m % 60)).padStart(2, '۰')}:${String(toFa(sec)).padStart(2, '۰')}`
}

/**
 * Reads the persisted reader session history from localStorage. Returns an
 * empty array on parse failure or in environments without localStorage.
 */
export function readReaderSessionHistory(): ReaderSessionHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.readerSessionHistory)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ReaderSessionHistoryEntry[]) : []
  } catch {
    return []
  }
}

/**
 * Appends a session summary to the persisted history list. Keeps the list
 * capped at MAX_HISTORY entries (most-recent-first).
 */
export function appendReaderSessionHistory(
  entry: ReaderSessionHistoryEntry,
): void {
  if (typeof window === 'undefined') return
  try {
    const prev = readReaderSessionHistory()
    const next = [entry, ...prev].slice(0, MAX_HISTORY)
    localStorage.setItem(
      STORAGE_KEYS.readerSessionHistory,
      JSON.stringify(next),
    )
  } catch {
    /* ignore quota / private-mode errors */
  }
}

interface UseReadingSessionTimerOptions {
  /** Book slug — used for the saved session history entry. */
  bookSlug?: string
  /** Book title — used for the saved session history entry. */
  bookTitle?: string
  /** Disable XP flushing (e.g. in tests). Defaults to false. */
  disableXPFlush?: boolean
}

/**
 * Tracks elapsed reading time for the current session.
 *
 * Beyond the original counter behaviour (which only ticked a number every
 * second), this hook now:
 *   • Posts time-based XP to `/api/xp` every `XP_FLUSH_INTERVAL_SECONDS`
 *     seconds of *active* reading (i.e. paused/tab-hidden time excluded).
 *   • Persists a `ReaderSessionHistoryEntry` to localStorage when the
 *     component unmounts, so the profile / dashboard can show recent
 *     reading activity.
 *
 * Pauses when the tab is hidden (document.visibilityState === 'hidden').
 */
export function useReadingSessionTimer(
  options: UseReadingSessionTimerOptions = {},
) {
  const { bookSlug, bookTitle, disableXPFlush = false } = options
  const [seconds, setSeconds] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef<Date | null>(null)
  const secondsRef = useRef(0)
  const sinceLastFlushRef = useRef(0)
  const xpFlushInFlightRef = useRef(false)
  // Snapshot slug/title in refs so the unmount handler always reads the
  // latest values without re-subscribing the listener.
  const bookSlugRef = useRef(bookSlug)
  const bookTitleRef = useRef(bookTitle)

  useEffect(() => {
    bookSlugRef.current = bookSlug
  }, [bookSlug])
  useEffect(() => {
    bookTitleRef.current = bookTitle
  }, [bookTitle])

  useEffect(() => {
    startedAtRef.current = new Date()
    return () => {
      // Save the session summary when the reader unmounts.
      const slug = bookSlugRef.current
      const title = bookTitleRef.current
      const startedAt = startedAtRef.current
      const total = secondsRef.current
      if (startedAt && total >= 5) {
        appendReaderSessionHistory({
          startedAt: startedAt.toISOString(),
          endedAt: new Date().toISOString(),
          seconds: total,
          bookSlug: slug ?? '',
          bookTitle: title ?? '',
        })
        // Dispatch a CustomEvent so the root-level SessionSummaryToast
        // component (rendered in the layout, survives reader unmount) can
        // show a farewell toast with the session stats.
        window.dispatchEvent(
          new CustomEvent('ky:reader-session-ended', {
            detail: {
              seconds: total,
              bookSlug: slug ?? '',
              bookTitle: title ?? '',
            },
          }),
        )
      }
    }
  }, [])

  useEffect(() => {
    secondsRef.current = seconds
  }, [seconds])

  useEffect(() => {
    const onVisibility = () => setPaused(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', onVisibility)

    intervalRef.current = setInterval(() => {
      if (paused || document.visibilityState !== 'visible') return
      setSeconds((s) => s + 1)
      sinceLastFlushRef.current += 1
      if (
        !disableXPFlush &&
        sinceLastFlushRef.current >= XP_FLUSH_INTERVAL_SECONDS
      ) {
        sinceLastFlushRef.current = 0
        if (!xpFlushInFlightRef.current) {
          xpFlushInFlightRef.current = true
          // Time-based XP — pass pagesRead:0 so we don't double-count page XP.
          postXP({ pagesRead: 0 })
            .catch(() => {})
            .finally(() => {
              xpFlushInFlightRef.current = false
            })
        }
      }
    }, 1000)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [paused, disableXPFlush])

  /** Reset the timer back to zero (e.g. when switching books). */
  const reset = useCallback(() => {
    setSeconds(0)
    secondsRef.current = 0
    sinceLastFlushRef.current = 0
    startedAtRef.current = new Date()
  }, [])

  return {
    seconds,
    paused,
    reset,
    /** Total minutes read this session (rounded down). */
    minutes: Math.floor(seconds / 60),
    /** XP gained from reading time this session (approximate). */
    xpFromTime: Math.floor(seconds / XP_FLUSH_INTERVAL_SECONDS) * XP_PER_FLUSH,
  }
}

/**
 * Clears all stored reader session history. Returns the number of entries
 * removed. Safe to call from server code (no-ops).
 */
export function clearReaderSessionHistory(): number {
  if (typeof window === 'undefined') return 0
  const prev = readReaderSessionHistory()
  try {
    localStorage.removeItem(STORAGE_KEYS.readerSessionHistory)
  } catch {
    /* ignore */
  }
  return prev.length
}
