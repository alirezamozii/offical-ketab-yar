'use client'

/**
 * use-reader-xp — owns reading-time tracking, streak ticking, and the
 * page-read XP award + server progress write.
 *
 * Responsibilities (split out of the god-hook):
 *   • `useReadingSessionTimer` — per-session elapsed-seconds counter +
 *     time-based XP flush every 60s (already visibility-aware; lives in
 *     its own module).
 *   • The 15s `recordReadingTick` streak interval — **with a
 *     `document.visibilityState === 'visible'` guard** so reading-time
 *     XP and streak credit don't accrue while the tab is in the
 *     background. This was a P0 correctness bug in the god-hook (audit
 *     03 §3.1).
 *   • On paragraph change (after the initial restore), POST to
 *     `/api/reading/progress` + award XP for newly-read paragraphs +
 *     the one-time completion bonus. **All fetches are wrapped in an
 *     AbortController** that's aborted on unmount or when a new
 *     paragraph change supersedes the in-flight request.
 *
 * Refs (`restoredRef`, `lastAwardedParagraphRef`,
 * `completionAwardedRef`) are owned by `use-reader-scroll.ts` and
 * passed in — they're shared because the load-on-mount effect that
 * sets them lives in the scroll hook (next to the restore-scroll
 * behaviour).
 */

import { recordReadingTick } from '@/hooks/reader/use-reading-streak'
import { useReadingSessionTimer } from '@/hooks/reader/use-reading-session-timer'
import { postXP } from '@/lib/xp-events'
import { getStorageKey } from '@/lib/storage-keys'
import {
  mergeLocalProgress,
} from '@/hooks/reader/use-local-progress'
import type { ReaderBook } from '@/lib/reader/types'
import { useEffect, useRef, type MutableRefObject } from 'react'

interface UseReaderXpOptions {
  book: ReaderBook
  totalPages: number
  currentParagraph: number
  scrollPercent: number
  /** Shared with use-reader-scroll.ts — true once the saved position is restored. */
  restoredRef: MutableRefObject<boolean>
  /** Shared with use-reader-scroll.ts — highest paragraph index already counted. */
  lastAwardedParagraphRef: MutableRefObject<number>
  /** Shared with use-reader-scroll.ts — whether the completion bonus is awarded. */
  completionAwardedRef: MutableRefObject<boolean>
}

export function useReaderXp({
  book,
  totalPages,
  currentParagraph,
  scrollPercent,
  restoredRef,
  lastAwardedParagraphRef,
  completionAwardedRef,
}: UseReaderXpOptions) {
  const { seconds: sessionSeconds, minutes: sessionMinutes } =
    useReadingSessionTimer({
      bookSlug: book.slug,
      bookTitle: book.title,
    })

  // AbortController for the in-flight progress POST. Aborted on unmount
  // and when a new paragraph change supersedes. (The XP POST goes through
  // `postXP` which doesn't accept a signal — that's fine because the
  // `lastAwardedParagraphRef` dedup already prevents double-awards at the
  // request level.)
  const progressAbortRef = useRef<AbortController | null>(null)

  // ---- XP award + server progress on paragraph change ----
  // Writes the consolidated ProgressEntry to `ky_progress[slug]` (including
  // `scrollPercent` + `lastReadAt`) so the scroll-save effect and this one
  // share the same single source of truth. Uses `mergeLocalProgress` to
  // avoid clobbering `scrollPercent` from a recent scroll tick.
  //
  // NOTE: the deps array intentionally omits `scrollPercent` (matching the
  // original god-hook behaviour) so this effect only fires on paragraph
  // change, not on every scroll tick. The scroll-save effect in
  // `use-reader-scroll.ts` handles per-scroll writes. The stale-closure
  // read of `scrollPercent` here is a pre-existing quirk that doesn't
  // affect correctness (the value is only used in the localStorage merge,
  // which the scroll-save effect overwrites with the fresh value within
  // ~400ms).
  useEffect(() => {
    if (!book.slug || !restoredRef.current) return
    const percent = Math.round(
      ((currentParagraph + 1) / Math.max(totalPages, 1)) * 100,
    )
    mergeLocalProgress(book.slug, {
      currentPage: currentParagraph,
      totalPages,
      percent,
      scrollPercent,
      ts: Date.now(),
      lastReadAt: Date.now(),
    })

    // Only award XP for paragraphs BEYOND the highest one we've already counted.
    const last = lastAwardedParagraphRef.current
    const delta = currentParagraph - last
    let pagesToAward = 0
    let awardCompletion = false
    if (delta > 0) {
      pagesToAward = delta
      lastAwardedParagraphRef.current = currentParagraph
      if (
        currentParagraph >= totalPages - 1 &&
        !completionAwardedRef.current
      ) {
        awardCompletion = true
        completionAwardedRef.current = true
        try {
          localStorage.setItem(getStorageKey('bookComplete', book.slug), '1')
        } catch {}
        // Dispatch a CustomEvent so the BookCompletionCelebration component
        // (rendered in the reader) can show a confetti + congratulations modal.
        window.dispatchEvent(
          new CustomEvent('ky:book-completed', {
            detail: {
              bookSlug: book.slug,
              bookTitle: book.title,
              bookLevel: book.level,
            },
          }),
        )
      }
    }

    // Abort the previous in-flight progress request before issuing a new one.
    progressAbortRef.current?.abort()
    const progressCtrl = new AbortController()
    progressAbortRef.current = progressCtrl

    const id = window.setTimeout(() => {
      fetch('/api/reading/progress', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          bookSlug: book.slug,
          currentPage: currentParagraph + 1,
          totalPages,
        }),
        signal: progressCtrl.signal,
      }).catch(() => {})

      if (pagesToAward > 0 || awardCompletion) {
        postXP({
          pagesRead: pagesToAward,
          completedBook: awardCompletion,
          bookLevel: book.level || '',
        }).catch(() => {})
      }
    }, 800)
    return () => {
      window.clearTimeout(id)
    }
    // H-20: `scrollPercent` is intentionally omitted from the deps array —
    // it changes on every scroll tick (~60fps), which would re-fire this
    // effect on every frame and flood the server with progress POSTs. The
    // effect only needs to fire on `currentParagraph` change; the latest
    // `scrollPercent` is read as a stale closure value and written to
    // localStorage here, then overwritten by the per-scroll save effect in
    // `use-reader-scroll.ts` within ~400ms. Pre-existing behaviour, now
    // explicitly silenced for the linter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentParagraph, book.slug, book.title, totalPages, book.level, completionAwardedRef, lastAwardedParagraphRef, restoredRef])

  // ---- Reading-time tracking (for streak) ----
  // **visibilityState guard (P0):** the original god-hook awarded a streak
  // tick every 15s regardless of whether the tab was visible — meaning a
  // user could game their streak by leaving a book open in a background
  // tab. We now (a) check `document.visibilityState === 'visible'` inside
  // the interval callback AND (b) listen for `visibilitychange` so the
  // tick is paused entirely when the tab is hidden (no wasted CPU).
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null
    const start = () => {
      if (id != null) return
      id = setInterval(() => {
        if (document.visibilityState !== 'visible') return
        recordReadingTick(15) // 15s per tick
      }, 15 * 1000)
    }
    const stop = () => {
      if (id != null) {
        clearInterval(id)
        id = null
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stop()
      } else {
        start()
      }
    }
    if (typeof document === 'undefined') return
    if (document.visibilityState === 'visible') start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      stop()
    }
  }, [])

  // ---- Abort in-flight progress POST on unmount ----
  useEffect(() => {
    return () => {
      progressAbortRef.current?.abort()
    }
  }, [])

  return {
    sessionSeconds,
    sessionMinutes,
  }
}
