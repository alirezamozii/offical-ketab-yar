'use client'

/**
 * SupportForm — the actual interactive form for /support.
 *
 * Replaces the previous form stub which had no `onSubmit` handler (Audit 10
 * flagged this as a product-completeness blocker; A9 fixes it).
 *
 * Features:
 *   • Controlled inputs with Persian placeholders + RTL-aware layout.
 *   • Inline character counter on the message field (mirrors the review-form
 *     pattern in `books/review-form.tsx`).
 *   • Loading state — button shows a spinner + disabled while submitting.
 *   • Success state — sonner toast + form reset.
 *   • Error state — sonner toast with the Persian error message from the API.
 *   • Rate-limit aware — surfaces the API's 429 response with a friendly
 *     Persian message.
 */

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const MAX_NAME = 80
const MAX_EMAIL = 160
const MAX_SUBJECT = 160
const MAX_MESSAGE = 4000
const MIN_MESSAGE = 10
const AMBER_AT = 3500

export function SupportForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const len = message.length
  const counterTone =
    len >= MAX_MESSAGE
      ? 'text-red-600 dark:text-red-400'
      : len >= AMBER_AT
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-muted-foreground'

  function reset() {
    setName('')
    setEmail('')
    setSubject('')
    setMessage('')
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // Client-side guards — full validation is on the server (zod), but these
    // short-circuits save a round-trip and give instant Persian feedback.
    if (!name.trim()) {
      toast.error('نام خود را وارد کنید')
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('یک ایمیل معتبر وارد کنید')
      return
    }
    if (!subject.trim()) {
      toast.error('موضوع پیام را وارد کنید')
      return
    }
    if (message.trim().length < MIN_MESSAGE) {
      toast.error(`پیام باید حداقل ${MIN_MESSAGE} کاراکتر باشد`)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        retryAfter?: number
      }

      if (!res.ok) {
        if (res.status === 429) {
          const secs = data.retryAfter
          const hint = secs
            ? `حداکثر ${Math.max(1, Math.round(secs / 60))} دقیقه دیگر تلاش کنید.`
            : 'بعداً دوباره تلاش کنید.'
          toast.error(
            data.error ??
              'تعداد درخواست‌های شما بیش از حد مجاز است. ' + hint,
          )
        } else {
          toast.error(data.error ?? 'ارسال پیام ناموفق بود')
        }
        return
      }

      toast.success('پیام شما با موفقیت ارسال شد. ممنون از ارتباطتان!')
      reset()
      setDone(true)
    } catch {
      toast.error('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success banner — shown after a successful submit. The user can still
  //    send another ticket if they want (the button below resets the form).
  if (done) {
    return (
      <div className="space-y-4 rounded-2xl border border-gold-500/40 bg-gold-500/8 p-6 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/15 text-gold-600 dark:text-gold-400">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h2 className="text-xl font-bold">پیام شما رسید</h2>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
          تیم پشتیبانی کتاب‌یار معمولاً ظرف ۲۴ ساعت پاسخ می‌دهد. اگر ایمیل
          خود را بررسی کردید و پاسخی دریافت نکردید، پوشه اسپم را نیز ببینید.
        </p>
        <Button
          variant="outline"
          onClick={() => setDone(false)}
          className="mx-auto"
        >
          ارسال پیام جدید
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="name">نام</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="نام شما"
          maxLength={MAX_NAME}
          autoComplete="name"
          required
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">ایمیل</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          dir="ltr"
          maxLength={MAX_EMAIL}
          autoComplete="email"
          required
          disabled={submitting}
        />
        <p className="text-xs text-muted-foreground">
          پاسخ را به این ایمیل می‌فرستیم.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">موضوع</Label>
        <Input
          id="subject"
          name="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="مثلاً: گزارش مشکل در صفحه مطالعه"
          maxLength={MAX_SUBJECT}
          required
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="msg">پیام</Label>
        <Textarea
          id="msg"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="پیام خود را بنویسید..."
          maxLength={MAX_MESSAGE}
          required
          disabled={submitting}
        />
        <div
          className="flex items-center justify-between text-xs"
          aria-live="polite"
        >
          <span className="text-muted-foreground">
            حداقل {MIN_MESSAGE} کاراکتر
          </span>
          <span className={cn('font-medium tabular-nums', counterTone)}>
            {len} / {MAX_MESSAGE}
          </span>
        </div>
      </div>

      <Button
        type="submit"
        variant="glow"
        className="w-full"
        disabled={submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            در حال ارسال...
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" />
            ارسال پیام
          </>
        )}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <AlertCircle className="h-3.5 w-3.5 text-gold-500" />
        برای پاسخگویی سریع‌تر، ایمیل معتبر وارد کنید.
      </p>
    </form>
  )
}
