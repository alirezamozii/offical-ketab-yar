'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { motion, useReducedMotion } from 'framer-motion'
import { Loader2, Sparkles, Star, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface SubmittedReview {
  id: string
  userName: string
  rating: number
  comment: string
  createdAt: string
}

interface ReviewFormProps {
  bookSlug: string
  onSubmitted: (review: SubmittedReview) => void
}

const MIN_LEN = 3
const MAX_LEN = 1000
const AMBER_AT = 800

const RATING_LABELS: Record<number, string> = {
  1: 'ضعیف',
  2: 'متوسط',
  3: 'خوب',
  4: 'خیلی خوب',
  5: 'عالی',
}

export function ReviewForm({ bookSlug, onSubmitted }: ReviewFormProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const reduceMotion = useReducedMotion()

  const len = comment.length
  const counterTone =
    len >= MAX_LEN
      ? 'text-red-600 dark:text-red-400'
      : len >= AMBER_AT
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-muted-foreground'

  async function submit() {
    if (!name.trim()) {
      toast.error('نام خود را وارد کنید')
      return
    }
    if (comment.trim().length < MIN_LEN) {
      toast.error('نظر شما خیلی کوتاه است')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          bookSlug,
          userName: name.trim(),
          rating,
          comment: comment.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'خطا در ثبت نظر')
        return
      }
      toast.success('نظر شما ثبت شد. ممنون!')
      setOpen(false)
      setName('')
      setComment('')
      setRating(5)
      onSubmitted({
        id: data.id,
        userName: data.userName,
        rating: data.rating,
        comment: data.comment,
        createdAt: data.createdAt,
      })
    } catch {
      toast.error('خطا در ارتباط با سرور')
    } finally {
      setSubmitting(false)
    }
  }

  // The star selector listens to hover for the preview, click to commit,
  // and arrow-key navigation for keyboard users. The displayed value is
  // `hover || rating`, so a hover preview always wins while the pointer
  // is over a star.
  const displayRating = hover || rating
  const ratingLabel = RATING_LABELS[displayRating] ?? RATING_LABELS[rating]

  function onStarKey(e: React.KeyboardEvent<HTMLButtonElement>, n: number) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.min(5, n + 1)
      setRating(next)
      setHover(next)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = Math.max(1, n - 1)
      setRating(prev)
      setHover(prev)
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      setRating(n)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) setOpen(o) }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Star className="h-4 w-4" />
          ثبت نظر
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-2xl border-2 p-0 sm:max-w-lg"
      >
        <DialogTitle className="sr-only">ثبت نظر شما</DialogTitle>
        <DialogDescription className="sr-only">
          برای این کتاب امتیاز بدهید و نظر خود را بنویسید.
        </DialogDescription>

        <div className="relative flex items-center justify-between border-b border-border px-5 py-4">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" />
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gold-500/15 text-gold-600 dark:text-gold-400">
              <Sparkles className="h-4 w-4" />
            </span>
            ثبت نظر شما
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => !submitting && setOpen(false)}
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="space-y-2">
            <Label htmlFor="rv-name">نام</Label>
            <Input
              id="rv-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="نام شما"
              maxLength={60}
            />
          </div>

          <div className="space-y-2">
            <Label>امتیاز شما</Label>
            {/* Star selector — 5 interactive stars with hover preview.
                The big stars are the primary selector; the chip below
                shows the textual label of the currently-previewed rating
                so the user knows what 4 vs 5 stars actually means. */}
            <div className="flex flex-col gap-2">
              <div
                className="flex items-center gap-1.5"
                role="radiogroup"
                aria-label="امتیاز شما به این کتاب"
              >
                {[1, 2, 3, 4, 5].map((n) => {
                  const active = displayRating >= n
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={`${n} ستاره — ${RATING_LABELS[n]}`}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      onFocus={() => setHover(n)}
                      onBlur={() => setHover(0)}
                      onClick={() => setRating(n)}
                      onKeyDown={(e) => onStarKey(e, n)}
                      className={cn(
                        'relative transition-transform duration-200 ease-out-expo tap-target',
                        !reduceMotion && 'hover:scale-110',
                        !reduceMotion && active && 'scale-105',
                      )}
                    >
                      <Star
                        className={cn(
                          'h-8 w-8 transition-colors duration-200',
                          active
                            ? 'fill-gold-500 text-gold-500 drop-shadow-[0_1px_2px_rgba(202,155,38,0.4)]'
                            : 'text-muted-foreground/40 hover:text-muted-foreground/70',
                        )}
                      />
                    </button>
                  )
                })}
                <span className="ms-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <span className="tabular-nums">{displayRating}</span>
                  <span className="text-muted-foreground/50">از</span>
                  <span className="tabular-nums">۵</span>
                  <motion.span
                    key={ratingLabel}
                    initial={reduceMotion ? undefined : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-full bg-gold-500/15 px-2 py-0.5 text-xs font-semibold text-gold-700 dark:text-gold-300"
                  >
                    {ratingLabel}
                  </motion.span>
                </span>
              </div>
              {/* 5-bucket progress hint — a 5-segment bar that fills
                  up to the current rating, mirroring the star state
                  in a more glanceable form. */}
              <div className="flex gap-1" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors duration-200',
                      displayRating >= n ? 'bg-gold-500' : 'bg-muted',
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rv-comment">نظر</Label>
            <Textarea
              id="rv-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="دیدگاه خود را درباره کتاب بنویسید..."
              maxLength={MAX_LEN}
            />
            <div
              className="flex items-center justify-between text-xs"
              aria-live="polite"
            >
              <span className="text-muted-foreground">
                حداقل {MIN_LEN} کاراکتر
              </span>
              <span className={cn('font-medium tabular-nums', counterTone)}>
                {len} / {MAX_LEN}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3">
          <Button
            variant="ghost"
            onClick={() => !submitting && setOpen(false)}
          >
            انصراف
          </Button>
          <Button onClick={submit} disabled={submitting} variant="glow">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال ثبت...
              </>
            ) : (
              'ثبت نظر'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
