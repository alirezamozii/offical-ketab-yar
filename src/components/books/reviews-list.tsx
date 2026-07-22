'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { motion, useReducedMotion } from 'framer-motion'
import { Star, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { cn } from '@/lib/utils'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface ReviewWithVote {
  id: string
  userName: string
  userAvatar: string
  rating: number
  comment: string
  createdAt: string
}

interface VoteData {
  up: number
  down: number
  myVote: 'up' | 'down' | null
}

type SortKey = 'helpful' | 'newest' | 'highest' | 'lowest'

const SORT_LABELS: Record<SortKey, string> = {
  helpful: 'مفیدترین',
  newest: 'جدیدترین',
  highest: 'بالاترین امتیاز',
  lowest: 'پایین‌ترین امتیاز',
}

const NEW_REVIEW_KEY = STORAGE_KEYS.newReview

/**
 * ReviewsList — pure grid of reviews. Sorts by the provided `sort` key.
 * Renders a "جدید" gold badge on the review whose id matches `newReviewId`.
 *
 * Avatar rendering — three layers, in priority order:
 *   1. If the review shipped a real `userAvatar` URL, render it as an <img>.
 *   2. Otherwise, render a deterministic gold-toned gradient circle seeded
 *      by the user's name (each name maps to a stable hue within the gold/
 *      amber/rose family — never random per render).
 *   3. Inside the circle, show the first letter of the user's name (Persian
 *      or Latin, whichever the name starts with).
 */
export function ReviewsList({
  reviews,
  sort = 'helpful',
  newReviewId,
}: {
  reviews: ReviewWithVote[]
  sort?: SortKey
  newReviewId?: string | null
}) {
  const queryClient = useQueryClient()
  const [guestId, setGuestId] = useState('guest')
  const reduceMotion = useReducedMotion()
  const { formatRelativeTime } = usePersianLocale()

  useEffect(() => {
    const match = document.cookie.match(/ky_guest=([^;]+)/)
    if (match) setGuestId(match[1])
  }, [])

  const { data: votes = {} } = useQuery<Record<string, VoteData>>({
    queryKey: ['votes', guestId],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/vote?guestId=${guestId}`)
      if (!res.ok) return {}
      return res.json()
    },
    enabled: guestId !== 'guest',
    staleTime: 60 * 1000,
  })

  const voteMutation = useMutation({
    mutationFn: async ({ reviewId, direction }: { reviewId: string; direction: 'up' | 'down' }) => {
      const res = await fetch('/api/reviews/vote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reviewId, direction, guestId }),
      })
      if (!res.ok) throw new Error('Vote failed')
      return res.json()
    },
    onMutate: async ({ reviewId, direction }) => {
      await queryClient.cancelQueries({ queryKey: ['votes', guestId] })
      const previousVotes = queryClient.getQueryData<Record<string, VoteData>>(['votes', guestId]) || {}
      
      const current = previousVotes[reviewId] || { up: 0, down: 0, myVote: null }
      const newVote = current.myVote === direction ? null : direction
      let upDiff = 0
      let downDiff = 0
      
      if (current.myVote === 'up') upDiff -= 1
      if (current.myVote === 'down') downDiff -= 1
      
      if (newVote === 'up') upDiff += 1
      if (newVote === 'down') downDiff += 1
      
      const nextVotes = {
        ...previousVotes,
        [reviewId]: {
          up: Math.max(0, current.up + upDiff),
          down: Math.max(0, current.down + downDiff),
          myVote: newVote,
        },
      }
      
      queryClient.setQueryData(['votes', guestId], nextVotes)
      return { previousVotes }
    },
    onError: (_err, _variables, context) => {
      if (context) {
        queryClient.setQueryData(['votes', guestId], context.previousVotes)
      }
    },
    onSuccess: (data) => {
      if (data.reviewId) {
        queryClient.setQueryData(['votes', guestId], (prev: any) => ({
          ...prev,
          [data.reviewId]: { up: data.up, down: data.down, myVote: data.myVote },
        }))
      }
    },
  })

  const vote = (reviewId: string, direction: 'up' | 'down') => {
    voteMutation.mutate({ reviewId, direction })
  }

  const sorted = useMemo(() => {
    const arr = [...reviews]
    arr.sort((a, b) => {
      if (sort === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      if (sort === 'highest' || sort === 'lowest') {
        const dir = sort === 'highest' ? -1 : 1
        if (b.rating !== a.rating) return dir * (b.rating - a.rating)
        // tie-break by helpfulness
        const va = votes[a.id]
        const vb = votes[b.id]
        const ha = va ? va.up - va.down : 0
        const hb = vb ? vb.up - vb.down : 0
        if (hb !== ha) return hb - ha
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      // helpful (default)
      const va = votes[a.id]
      const vb = votes[b.id]
      const ha = va ? va.up - va.down : 0
      const hb = vb ? vb.up - vb.down : 0
      if (hb !== ha) return hb - ha
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    return arr
  }, [reviews, sort, votes])

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {sorted.map((r) => {
        const v = votes[r.id] || { up: 0, down: 0, myVote: null }
        const isNew = newReviewId === r.id
        return (
          <motion.div
            key={r.id}
            layout={!reduceMotion}
            initial={isNew && !reduceMotion ? { opacity: 0, y: -8, scale: 0.98 } : false}
            animate={isNew && !reduceMotion ? { opacity: 1, y: 0, scale: 1 } : undefined}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className={cn(
              'group/review relative flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition-colors',
              'hover:border-gold-500/40 hover:shadow-md hover:shadow-gold-500/5',
              isNew
                ? 'border-gold-500/60 ring-2 ring-gold-500/30'
                : 'border-border/60',
            )}
          >
            {isNew && (
              <span className="absolute -top-2 right-4 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                جدید
              </span>
            )}
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <ReviewAvatar name={r.userName} avatarUrl={r.userAvatar} />
                <div className="min-w-0 space-y-0.5">
                  <p className="line-clamp-1 font-semibold leading-tight">{r.userName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatRelativeTime(r.createdAt)}
                  </p>
                </div>
              </div>
              <div
                className="flex shrink-0 gap-0.5"
                aria-label={`امتیاز: ${r.rating} از ۵`}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < r.rating
                        ? 'h-3.5 w-3.5 fill-gold-500 text-gold-500'
                        : 'h-3.5 w-3.5 text-muted-foreground/40'
                    }
                  />
                ))}
              </div>
            </div>
            <p className="flex-1 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
              {r.comment}
            </p>

            {/* Voting */}
            <div className="mt-3 flex items-center gap-2 border-t border-border/50 pt-3">
              <span className="text-[11px] text-muted-foreground">
                آیا مفید بود؟
              </span>
              <motion.button
                whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                onClick={() => vote(r.id, 'up')}
                className={cn(
                  'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  v.myVote === 'up'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-border text-muted-foreground hover:border-emerald-500/50 hover:text-emerald-600',
                )}
                aria-pressed={v.myVote === 'up'}
                aria-label="مفید بود"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                {v.up > 0 && <span className="tabular-nums">{v.up}</span>}
              </motion.button>
              <motion.button
                whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                onClick={() => vote(r.id, 'down')}
                className={cn(
                  'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  v.myVote === 'down'
                    ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400'
                    : 'border-border text-muted-foreground hover:border-red-500/50 hover:text-red-600',
                )}
                aria-pressed={v.myVote === 'down'}
                aria-label="مفید نبود"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                {v.down > 0 && <span className="tabular-nums">{v.down}</span>}
              </motion.button>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

/** Palette of warm gold/amber/rose/emerald gradient pairs used for the
 *  generated avatars. Stays inside the brand color rule (no indigo/blue). */
const AVATAR_GRADIENTS = [
  'from-gold-400 to-gold-600',
  'from-amber-400 to-orange-600',
  'from-rose-400 to-pink-600',
  'from-emerald-400 to-teal-600',
  'from-yellow-400 to-amber-600',
  'from-orange-400 to-red-600',
  'from-teal-400 to-emerald-600',
  'from-amber-500 to-rose-500',
]

function pickAvatarGradient(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length]
}

function ReviewAvatar({
  name,
  avatarUrl,
}: {
  name: string
  avatarUrl?: string
}) {
  const grad = pickAvatarGradient(name)
  const initial = name.trim().slice(0, 1).toUpperCase() || '؟'
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external user avatar (e.g. Google OAuth); next/image would need remotePatterns in next.config.ts which is owned by another agent. unoptimized <Image> would also work but adds no value here.
      <img
        src={avatarUrl}
        alt=""
        className="h-9 w-9 shrink-0 rounded-full border border-white/20 object-cover shadow-md"
        loading="lazy"
        decoding="async"
      />
    )
  }
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-md ring-1 ring-white/20',
        grad,
      )}
      aria-hidden="true"
    >
      {initial}
    </div>
  )
}

/**
 * RatingDistribution — 5★ to 1★ horizontal bars showing how many reviews
 * fall into each bucket. Pure SSR / presentational.
 *
 * The bars animate from 0% → final width on mount (framer-motion, gated by
 * reduced-motion). Each star bucket has a count + percentage label.
 */
export function RatingDistribution({
  reviews,
}: {
  reviews: ReviewWithVote[]
}) {
  const reduceMotion = useReducedMotion()
  const total = reviews.length
  const buckets = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length
    const pct = total > 0 ? Math.round((count / total) * 100) : 0
    return { star, count, pct }
  })

  return (
    <div className="space-y-2" aria-label="توزیع امتیازها">
      {buckets.map(({ star, count, pct }) => (
        <div
          key={star}
          className="flex items-center gap-2 text-xs"
          role="img"
          aria-label={`${count} نفر به این کتاب ${star} ستاره دادند`}
        >
          <span className="flex w-12 shrink-0 items-center gap-1 font-medium">
            <span className="tabular-nums">{star}</span>
            <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-to-l from-gold-400 to-gold-600"
              initial={reduceMotion ? false : { width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <span className="w-10 shrink-0 text-start text-muted-foreground tabular-nums">
            {count > 0 ? `${pct}٪` : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * ReviewsSection — client island that owns the sort state + the "جدید"
 * badge state. Reads sessionStorage on mount to detect a freshly-submitted
 * review (set by ReviewFormWrapper), highlights it with a badge, and scrolls
 * it into view.
 */
export function ReviewsSection({
  reviews,
}: {
  reviews: ReviewWithVote[]
}) {
  const [sort, setSort] = useState<SortKey>('helpful')
  const [newReviewId, setNewReviewId] = useState<string | null>(null)

  useEffect(() => {
    let t: number | undefined
    try {
      const id = sessionStorage.getItem(NEW_REVIEW_KEY)
      if (id) {
        sessionStorage.removeItem(NEW_REVIEW_KEY)
        setNewReviewId(id)
        // Scroll the section into view (the new review is at the top after sort)
        const el = document.getElementById('ky-reviews-anchor')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        // Clear the badge after 12 seconds so it doesn't linger forever.
        t = window.setTimeout(() => setNewReviewId(null), 12000)
      }
    } catch {
      /* sessionStorage may be unavailable */
    }
    return () => {
      if (t !== undefined) window.clearTimeout(t)
    }
  }, [])

  if (reviews.length === 0) {
    return null
  }

  return (
    <div className="space-y-5">
      {/* Distribution + sort */}
      <div className="grid gap-4 rounded-2xl border border-border/60 bg-card/60 p-4 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-6">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            توزیع امتیازها
          </p>
          <RatingDistribution reviews={reviews} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="ky-review-sort"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            مرتب‌سازی
          </label>
          <Select
            value={sort}
            onValueChange={(v) => setSort(v as SortKey)}
          >
            <SelectTrigger
              id="ky-review-sort"
              size="sm"
              className="w-44"
              aria-label="مرتب‌سازی نظرات"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {SORT_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ReviewsList
        reviews={reviews}
        sort={sort}
        newReviewId={newReviewId}
      />
    </div>
  )
}
