'use client'

import Link from 'next/link'
import Image from 'next/image'
import { BlogCover } from '@/components/blog/blog-cover'
import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Calendar, Clock, BookOpen, User, Eye, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { usePersianLocale } from '@/hooks/use-persian-locale'

/**
 * BlogPageClient — public blog index.
 *
 * Fetches paginated published posts from `/api/blog?page=1` and renders a
 * reading-friendly list (cover image, title, excerpt, Jalali publish date,
 * reading-time estimate, author chip, view count). Falls back to an honest
 * «به‌زودی مقالات جدید منتشر می‌شوند» empty state when no posts exist.
 *
 * The brand-new `/blog/[slug]` public detail page lives at
 * `app/blog/[slug]/page.tsx` and is linked from each card.
 */

interface BlogAuthor {
  id: string
  name?: string | null
  username?: string | null
  image?: string | null
}

interface BlogPostListItem {
  id: string
  slug: string
  title: string
  excerpt: string
  coverUrl?: string
  coverBlurhash?: string
  tags: string[]
  publishedAt: string | null
  viewCount: number
  readingMinutes: number
  author: BlogAuthor
}

interface BlogListResponse {
  ok: boolean
  posts: BlogPostListItem[]
  page: number
  limit: number
  total: number
  totalPages: number
}

type LoadState = 'loading' | 'ready' | 'error'

export function BlogPageClient() {
  const reduceMotion = useReducedMotion()
  const { formatDate, toPersianDigits, formatNumber } = usePersianLocale()

  const [state, setState] = useState<LoadState>('loading')
  const [posts, setPosts] = useState<BlogPostListItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    let alive = true
    setState('loading')
    fetch(`/api/blog?page=${page}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('failed')
        return (await r.json()) as BlogListResponse
      })
      .then((data) => {
        if (!alive) return
        setPosts(data.posts || [])
        setTotalPages(data.totalPages || 1)
        setState('ready')
      })
      .catch(() => {
        if (!alive) return
        setPosts([])
        setState('error')
      })
    return () => {
      alive = false
    }
  }, [page])

  const showEmpty = state === 'ready' && posts.length === 0
  const showLoading = state === 'loading'
  const showError = state === 'error'

  // Stable initials for the author avatar fallback (first letters of name or @username).
  const authorInitials = useMemo(
    () => (a: BlogAuthor) => {
      const base = (a.name || a.username || 'KY').trim()
      const parts = base.split(/\s+/).filter(Boolean)
      if (parts.length === 0) return 'KY'
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
      return (parts[0][0] + parts[1][0]).toUpperCase()
    },
    [],
  )

  // ---- Empty state --------------------------------------------------------
  if (showEmpty) {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-2xl px-4 py-20 text-center sm:py-28"
      >
        <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400/30 to-gold-600/20 text-gold-700 dark:text-gold-300">
          <BookOpen className="h-8 w-8" />
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          به‌زودی مقالات جدید منتشر می‌شوند
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          ما در حال آماده‌سازی مقالاتی درباره یادگیری زبان با کتاب، معرفی
          کتاب‌های کلاسیک و نکات مطالعه هستیم. به‌محض انتشار اولین مقاله،
          اینجا قرار می‌گیرد.
        </p>
        <Button asChild variant="glow" className="mt-8 gap-2">
          <Link href="/library" aria-label="مرور کتابخانه">
            <BookOpen className="h-4 w-4" />
            مرور کتاب‌ها
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </motion.div>
    )
  }

  // ---- Error state --------------------------------------------------------
  if (showError) {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-2xl px-4 py-20 text-center sm:py-28"
      >
        <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <BookOpen className="h-8 w-8" />
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          بارگذاری مقالات ناموفق بود
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          لطفاً چند لحظه دیگر صفحه را بازنشانی کنید یا از مرور کتابخانه استفاده
          کنید.
        </p>
        <Button
          variant="outline"
          className="mt-8 gap-2"
          onClick={() => setPage((p) => p)}
        >
          <Sparkles className="h-4 w-4" />
          تلاش مجدد
        </Button>
      </motion.div>
    )
  }

  // ---- Main list ----------------------------------------------------------
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="space-y-2 pb-8">
        <span className="inline-block rounded-full bg-gold-500/15 px-3 py-1 text-xs font-bold text-gold-700 dark:text-gold-400">
          بلاگ کتاب‌یار
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          یادگیری زبان با کتاب
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          مقالاتی درباره مطالعه دوزبانه، معرفی کتاب‌های کلاسیک و نکات عملی برای
          یادگیری زبان انگلیسی.
        </p>
      </div>

      {showLoading ? (
        <div className="divide-y divide-border/60">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-5 py-6">
              <Skeleton className="hidden h-32 w-44 shrink-0 rounded-xl sm:block" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="divide-y divide-border/60">
            {posts.map((post, i) => (
              <motion.article
                key={post.id}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group py-6"
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="block space-y-3 transition-colors hover:text-primary"
                >
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {post.coverUrl ? (
                      <Image
                        src={post.coverUrl}
                        alt={`تصویر مقاله ${post.title}`}
                        width={176}
                        height={128}
                        className="hidden h-32 w-44 shrink-0 rounded-xl object-cover ring-1 ring-border/60 sm:block"
                      />
                    ) : (
                      <BlogCover
                        tag={post.tags[0]}
                        title={post.title}
                        variant="list"
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {post.tags[0] && (
                          <span className="rounded-full bg-gold-500/10 px-2 py-0.5 font-semibold text-gold-700 dark:text-gold-300">
                            {post.tags[0]}
                          </span>
                        )}
                        {post.publishedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(post.publishedAt, 'long')}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {toPersianDigits(post.readingMinutes)} دقیقه مطالعه
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatNumber(post.viewCount)}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold tracking-tight transition-colors group-hover:text-primary sm:text-2xl">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                          <Avatar className="h-6 w-6">
                            {post.author.image ? (
                              <AvatarImage
                                src={post.author.image}
                                alt={post.author.name || ''}
                              />
                            ) : null}
                            <AvatarFallback className="bg-gold-500/15 text-[10px] font-bold text-gold-700 dark:text-gold-300">
                              {authorInitials(post.author)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {post.author.name || post.author.username || 'کتاب‌یار'}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-gold-700 dark:text-gold-300">
                          ادامه مطلب
                          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="صفحه قبل"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-sm text-muted-foreground tabular-nums">
                {toPersianDigits(page)} از {toPersianDigits(totalPages)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="صفحه بعد"
              >
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
