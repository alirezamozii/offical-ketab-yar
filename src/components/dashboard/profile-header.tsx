'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Calendar, Share2, Sparkles, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { toPersianNumber } from '@/lib/gamification'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface XPStats {
  totalXP: number
  level: number
  levelTitle: string
  progressPercentage: number
  xpForNextLevel: number
  pagesRead: number
  booksCompleted: number
  streakDays: number
}

const MEMBER_SINCE_KEY = STORAGE_KEYS.memberSince

function getMemberSince(): string {
  if (typeof window === 'undefined') return new Date().toISOString()
  try {
    const v = localStorage.getItem(MEMBER_SINCE_KEY)
    if (v) return v
    const now = new Date().toISOString()
    localStorage.setItem(MEMBER_SINCE_KEY, now)
    return now
  } catch {
    return new Date().toISOString()
  }
}

/**
 * ProfileHeader — replaces the old greeting widget + the standalone
 * profile page header per user feedback:
 *   • Combines avatar + name + level + share button into one place
 *   • No "صبح بخیر/ظهر بخیر" greeting (removed per user feedback)
 *   • Single source of truth for identity (was duplicated in /profile)
 *   • Share button at the top right (per user feedback: "یه دکمه اشترک
 *     گداری بالا هم باشه که مین کار مکینه کنار پورفال لول")
 */
export function ProfileHeader() {
  const reduceMotion = useReducedMotion()
  const { formatDate } = usePersianLocale()
  const [xp, setXp] = useState<XPStats | null>(null)
  const [memberSince, setMemberSince] = useState<string>('')

  useEffect(() => {
    setMemberSince(getMemberSince())
    fetch('/api/xp')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: XPStats | null) => setXp(d))
      .catch(() => {})
  }, [])

  // Share handler — uses the Web Share API if available, falls back to
  // copying a text summary to the clipboard.
  async function handleShare() {
    const level = xp?.level ? toPersianNumber(xp.level) : '۱'
    const xpStr = xp?.totalXP ? toPersianNumber(xp.totalXP) : '۰'
    const streak = xp?.streakDays ? toPersianNumber(xp.streakDays) : '۰'
    const text = `کتاب‌یار | سطح ${level} · ${xpStr} امتیاز · ${streak} روز استمرار — KETABYAR.IR`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'کتاب‌یار', text, url: 'https://ketabyar.ir' })
      } else {
        await navigator.clipboard.writeText(text)
        toast.success('آمار شما در کلیپ‌بورد کپی شد')
      }
    } catch {
      // user dismissed share sheet — silent
    }
  }

  const memberSinceDate = memberSince ? formatDate(new Date(memberSince), 'long') : ''

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl border border-gold-500/30 bg-gradient-to-br from-gold-500/10 via-card to-card p-5 shadow-sm sm:p-7"
      aria-label="هویت کاربر"
    >
      {/* ambient gold halos */}
      <div
        className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-gold-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-gold-700/15 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar — circular with gold ring. Uses a generic User icon
              since we don't have user-uploaded avatars (no auth yet). */}
          <div className="relative">
            <span
              aria-hidden="true"
              className="absolute -inset-1 rounded-full bg-gold-500/30 blur-md"
            />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-700 text-white shadow-lg ring-2 ring-background">
              <User className="h-8 w-8" />
            </div>
            {/* Level badge floating on the avatar corner */}
            {xp?.level && (
              <span className="absolute -bottom-1 -right-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 px-1.5 text-xs font-extrabold text-amber-950 shadow-md ring-2 ring-background">
                {toPersianNumber(xp.level)}
              </span>
            )}
          </div>

          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              <span className="text-gradient-gold">داشبورد کتاب‌یار</span>
            </h1>
            {xp?.levelTitle && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-gold-700 dark:text-gold-400">
                <Sparkles className="h-3.5 w-3.5" />
                {xp.levelTitle}
              </p>
            )}
            {memberSinceDate && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                عضو از {memberSinceDate}
              </p>
            )}
          </div>
        </div>

        {/* Share button — top-right, per user feedback */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="gap-2"
          aria-label="اشتراک‌گذاری آمار شما"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">اشتراک‌گذاری</span>
        </Button>
      </div>
    </motion.header>
  )
}
