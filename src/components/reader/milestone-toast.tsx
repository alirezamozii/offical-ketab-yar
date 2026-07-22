'use client'

/**
 * MilestoneToast — listens for `ky:reading-milestone` CustomEvents
 * (dispatched by useReaderState when the user crosses 25% / 50% / 75% of a
 * book for the first time in a session) and shows a small encouraging toast.
 *
 * Each milestone has its own emoji + message:
 *   25% → 📖 "یک‌چهارم کتاب را خواندید! ادامه دهید."
 *   50% → ⭐ "نیمی از کتاب را پشت سر گذاشتید! عالی است."
 *   75% → 🔥 "سه‌چهارم کتاب! به پایان نزدیک می‌شوید."
 *
 * Rendered in the root layout so it survives reader unmount.
 */

import { useEffect } from 'react'
import { toast } from 'sonner'
import { toPersianDigits } from '@/lib/typography'

const MILESTONE_COPY: Record<number, { emoji: string; msg: string }> = {
  25: { emoji: '📖', msg: 'یک‌چهارم کتاب را خواندید! ادامه دهید.' },
  50: { emoji: '⭐', msg: 'نیمی از کتاب را پشت سر گذاشتید! عالی است.' },
  75: { emoji: '🔥', msg: 'سه‌چهارم کتاب! به پایان نزدیک می‌شوید.' },
}

export function MilestoneToast() {
  useEffect(() => {
    const onMilestone = (e: Event) => {
      const ce = e as CustomEvent<{ milestone: number; bookSlug: string; bookTitle: string }>
      const { milestone } = ce.detail ?? {}
      const copy = MILESTONE_COPY[milestone]
      if (!copy) return

      toast.success(`پیشرفت ${toPersianDigits(milestone)}٪`, {
        description: `${copy.emoji} ${copy.msg}`,
        duration: 4000,
        icon: <span className="text-lg">{copy.emoji}</span>,
        style: {
          background:
            'linear-gradient(135deg, rgba(250,249,247,0.98), rgba(235,228,217,0.95))',
          border: '1px solid rgba(184,149,106,0.3)',
          boxShadow: '0 4px 20px rgba(184,149,106,0.12)',
        },
        classNames: {
          title: 'text-foreground font-bold',
          description: 'text-muted-foreground text-sm',
        },
      })
    }

    window.addEventListener('ky:reading-milestone', onMilestone)
    return () => window.removeEventListener('ky:reading-milestone', onMilestone)
  }, [])

  return null
}
