'use client'

/**
 * SessionSummaryToast — listens for `ky:reader-session-ended` CustomEvents
 * (dispatched by useReadingSessionTimer when the reader unmounts) and shows
 * a premium sonner toast summarizing the reading session.
 *
 * Rendered in the root layout so it survives reader unmount (the reader
 * component is gone by the time the toast fires, but this component is still
 * mounted and can safely call `toast()`).
 *
 * The toast shows:
 *   • Book title
 *   • Time spent reading (in Persian digits, MM:SS or HH:MM:SS)
 *   • An encouraging message bucketed by session length
 *   • A subtle gold gradient accent + book icon
 */

import { BookOpen } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { formatSessionTime } from '@/hooks/reader/use-reading-session-timer'

/** Encouraging copy bucketed by session length (seconds). */
function motivationalMessage(seconds: number): string {
  if (seconds < 60) return 'هر قدمی شروع یک سفر است.'
  if (seconds < 300) return 'خوب خوندی! به زبان انگلیسی نزدیک‌تر شدی.'
  if (seconds < 600) return 'جلسه‌ی عالی بود — عادت مطالعه داره شکل می‌گیره.'
  if (seconds < 1800) return 'فوق‌العاده! این استمرار کلید موفقیته.'
  return 'استاد! این جلسه یک شاهکار بود.'
}

/** Estimate pages read from session time (avg ~90s/page for a bilingual reader). */
function estimatePages(seconds: number): number {
  return Math.max(0, Math.round(seconds / 90))
}

export function SessionSummaryToast() {
  useEffect(() => {
    const onSessionEnded = (e: Event) => {
      const ce = e as CustomEvent<{
        seconds: number
        bookSlug: string
        bookTitle: string
      }>
      const { seconds, bookTitle } = ce.detail ?? {}
      if (!seconds || seconds < 5) return

      const timeStr = formatSessionTime(seconds)
      const pages = estimatePages(seconds)
      const msg = motivationalMessage(seconds)
      const title = bookTitle || 'کتاب'

      toast.success('جلسه مطالعه ثبت شد', {
        description: `${msg}\n⏱ ${timeStr} · 📖 ${title}${pages > 0 ? ` · ~${pages} صفحه` : ''}`,
        duration: 6000,
        icon: <BookOpen className="h-5 w-5 text-gold-600 dark:text-gold-400" />,
        style: {
          background:
            'linear-gradient(135deg, rgba(250,249,247,0.98), rgba(235,228,217,0.95))',
          border: '1px solid rgba(184,149,106,0.3)',
          boxShadow: '0 8px 32px rgba(184,149,106,0.15)',
        },
        classNames: {
          title: 'text-foreground font-bold',
          description: 'text-muted-foreground whitespace-pre-line text-sm',
        },
      })
    }

    window.addEventListener('ky:reader-session-ended', onSessionEnded)
    return () => window.removeEventListener('ky:reader-session-ended', onSessionEnded)
  }, [])

  return null
}
