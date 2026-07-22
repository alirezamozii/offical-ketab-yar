'use client'

import { Button } from '@/components/ui/button'
import { Home, RotateCcw, SearchX } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

/**
 * /search error boundary — catches errors on the search page. The
 * search page is mostly client-side (debounced fetch to
 * `/api/search`), so an unhandled error here usually means the API
 * route itself threw during the initial SSR or a client-side render.
 */
export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const primaryRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    console.error('[ketab-yar] /search error boundary:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
    })
    primaryRef.current?.focus()
  }, [error])

  return (
    <div
      role="alert"
      className="relative mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-12 text-center sm:px-6"
    >
      <div
        aria-hidden
        className="absolute top-1/3 -z-10 h-64 w-64 -translate-y-1/2 rounded-full bg-gold-500/10 blur-3xl"
      />

      <span className="mb-8 text-gradient-gold text-sm font-bold tracking-wide">
        کتاب‌یار
      </span>

      <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gold-500/15 text-gold-600 shadow-md-warm dark:text-gold-400">
        <SearchX className="h-10 w-10" aria-hidden="true" />
      </span>

      <h1 className="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
        جستجو در دسترس نیست
      </h1>
      <p className="mt-3 max-w-md text-pretty text-muted-foreground">
        در عملیات جستجو خطایی رخ داد. لطفاً دوباره تلاش کنید. اگر مشکل
        ادامه داشت، می‌توانید از کتابخانه برای مرور کتاب‌ها استفاده کنید.
      </p>

      {error.digest ? (
        <span className="mt-4 rounded-full border border-border/60 bg-muted/40 px-3 py-1 font-mono text-[10px] text-muted-foreground/70">
          شناسه: {error.digest}
        </span>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          ref={primaryRef}
          onClick={reset}
          variant="glow"
          size="lg"
          aria-label="تلاش دوباره برای جستجو"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          تلاش دوباره
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/library">
            <SearchX className="h-4 w-4" aria-hidden="true" />
            مرور کتابخانه
          </Link>
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/">
            <Home className="h-4 w-4" aria-hidden="true" />
            خانه
          </Link>
        </Button>
      </div>
    </div>
  )
}
