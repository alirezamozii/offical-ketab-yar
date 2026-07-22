'use client'

/**
 * RecentSessionsWidget — displays the user's recent reading sessions from
 * localStorage (tracked by useReadingSessionTimer but never shown in UI until now).
 *
 * Shows a timeline of the last 8 sessions with:
 *   • Book title + cover color swatch
 *   • Session duration (formatted Persian MM:SS / HH:MM)
 *   • Relative time ("۲ ساعت پیش")
 *   • A subtle gold-accented timeline rail
 *
 * Empty state: a friendly prompt to start reading.
 *
 * Data source: `readReaderSessionHistory()` from use-reading-session-timer.
 * This is a client-only widget (localStorage data) — renders a skeleton
 * during SSR to avoid hydration mismatch.
 */

import { motion, useReducedMotion } from 'framer-motion'
import { BookOpen, Clock, History } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  readReaderSessionHistory,
  formatSessionTime,
  type ReaderSessionHistoryEntry,
} from '@/hooks/reader/use-reading-session-timer'
import { usePersianLocale } from '@/hooks/use-persian-locale'

function SessionItem({
  session,
  index,
}: {
  session: ReaderSessionHistoryEntry
  index: number
}) {
  const reduceMotion = useReducedMotion()
  const { formatRelativeTime } = usePersianLocale()
  const startedAt = new Date(session.startedAt)

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex items-start gap-3 pb-4 last:pb-0"
    >
      {/* Timeline rail dot */}
      <div className="relative flex-shrink-0">
        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gold-400/20 to-gold-700/10 ring-1 ring-gold-500/30">
          <BookOpen className="h-4 w-4 text-gold-600 dark:text-gold-400" />
        </div>
        {/* Connecting line to the next item */}
        {index < 7 && (
          <div
            aria-hidden="true"
            className="absolute top-9 left-1/2 h-[calc(100%-1rem)] w-px -translate-x-1/2 bg-gradient-to-b from-gold-500/30 to-transparent"
          />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <Link
            href={`/books/read/${session.bookSlug}`}
            className="truncate text-sm font-bold text-foreground hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
          >
            {session.bookTitle || session.bookSlug}
          </Link>
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatSessionTime(session.seconds)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatRelativeTime(startedAt)}
        </p>
      </div>
    </motion.div>
  )
}

function SessionSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted/50" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted/50" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted/40" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function RecentSessionsWidget() {
  const [sessions, setSessions] = useState<ReaderSessionHistoryEntry[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setSessions(readReaderSessionHistory().slice(0, 8))
    setMounted(true)
  }, [])

  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/15 text-gold-600 dark:text-gold-400">
          <History className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">جلسات اخیر مطالعه</h3>
          <p className="text-xs text-muted-foreground">
            آخرین بارهایی که کتاب خوانده‌اید
          </p>
        </div>
      </div>

      {!mounted ? (
        <SessionSkeleton />
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 py-8 text-center">
          <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            هنوز جلسه مطالعه‌ای ثبت نشده است.
          </p>
          <Link
            href="/library"
            className="mt-3 inline-block text-xs font-semibold text-gold-600 hover:underline dark:text-gold-400"
          >
            شروع مطالعه →
          </Link>
        </div>
      ) : (
        <div className="space-y-1">
          {sessions.map((s, i) => (
            <SessionItem key={`${s.bookSlug}-${s.startedAt}-${i}`} session={s} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
