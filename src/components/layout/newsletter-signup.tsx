'use client'

/**
 * src/components/layout/newsletter-signup.tsx
 * ---------------------------------------------------------------
 * Compact newsletter signup form for the site footer. Lets visitors
 * subscribe to updates (new books, features, reading tips) with just
 * their email — no account required.
 *
 * Design:
 *  - Inline form (email input + subscribe button) that fits in the
 *    footer's brand column
 *  - Client-side email validation (RFC-simple regex)
 *  - Success state with checkmark + Persian confirmation message
 *  - Error state with Persian message (rate-limited, invalid email)
 *  - Rate-limited client-side (1 submit / 10s) to prevent spam
 *  - Stores emails in localStorage `ky_newsletter_emails` as a
 *    lightweight fallback (no backend needed in dev — production
 *    would POST to /api/newsletter/subscribe)
 *
 * Owner: CRON-REVIEW-202607171331
 * ---------------------------------------------------------------
 */

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const STORAGE_KEY = 'ky_newsletter_subscribed'
const RATE_LIMIT_MS = 10_000

// Simple email regex — good enough for client-side pre-validation.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Status = 'idle' | 'loading' | 'success' | 'error'

export function NewsletterSignup() {
  const reduceMotion = useReducedMotion()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [lastSubmit, setLastSubmit] = useState(0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()

    // Client-side validation
    if (!trimmed) {
      setStatus('error')
      setErrorMsg('لطفاً ایمیل خود را وارد کنید.')
      return
    }
    if (!EMAIL_RE.test(trimmed)) {
      setStatus('error')
      setErrorMsg('فرمت ایمیل نامعتبر است.')
      return
    }

    // Rate limit
    const now = Date.now()
    if (now - lastSubmit < RATE_LIMIT_MS) {
      setStatus('error')
      setErrorMsg('لطفاً چند ثانیه صبر کنید و دوباره تلاش کنید.')
      return
    }
    setLastSubmit(now)

    setStatus('loading')
    setErrorMsg('')

    try {
      // Simulate API call (production would POST to /api/newsletter/subscribe)
      // For now, store in localStorage as a dev fallback.
      await new Promise((resolve) => setTimeout(resolve, 800))

      try {
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
        if (!Array.isArray(existing) || !existing.includes(trimmed)) {
          existing.push(trimmed)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
        }
      } catch {
        /* ignore storage errors */
      }

      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
      setErrorMsg('مشکلی پیش آمد. بعداً تلاش کنید.')
    }
  }

  // Success state — compact confirmation
  if (status === 'success') {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400"
        role="status"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>عضو خبرنامه شدید! ✨</span>
      </motion.div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
        <Mail className="h-3.5 w-3.5 text-gold-600 dark:text-gold-400" aria-hidden="true" />
        خبرنامه کتاب‌یار
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        از کتاب‌ها و مطالب جدید باخبر شوید.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-1.5" noValidate>
        <Input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status === 'error') setStatus('idle')
          }}
          placeholder="ایمیل شما"
          className="h-8 flex-1 rounded-lg text-xs"
          aria-label="ایمیل برای عضویت در خبرنامه"
          aria-invalid={status === 'error'}
          disabled={status === 'loading'}
          dir="ltr"
        />
        <Button
          type="submit"
          size="sm"
          variant="glow"
          className="h-8 shrink-0 gap-1 px-2.5"
          disabled={status === 'loading' || !email.trim()}
          aria-label="عضویت در خبرنامه"
        >
          {status === 'loading' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="sr-only">عضویت</span>
            </>
          )}
        </Button>
      </form>
      {status === 'error' && (
        <p className="text-[10px] text-red-600 dark:text-red-400" role="alert">
          {errorMsg}
        </p>
      )}
    </div>
  )
}
