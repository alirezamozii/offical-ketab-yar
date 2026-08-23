'use client'

import { Button } from '@/components/ui/button'
import { Home, Library, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

/**
 * /library error boundary — catches errors on the main library page
 * (`/library`) and the genres page (`/library/genres`). Most library
 * errors are transient (a DB read failed, a search index is rebuilding),
 * so the primary action is "تلاش دوباره" (retry) and the secondary is
 * "بازگشت به خانه".
 */
export default function LibraryError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const primaryRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    console.error('[ketab-yar] /library error boundary:', {
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
        <Library className="h-10 w-10" aria-hidden="true" />
      </span>

      <h1 className="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
        کتابخانه بارگذاری نشد
      </h1>
      <p className="mt-3 max-w-md text-pretty text-muted-foreground">
        در بارگذاری فهرست کتاب‌ها خطایی رخ داد. این مشکل معمولاً موقتی است —
        لطفاً دوباره تلاش کنید. اگر مشکل ادامه داشت، به صفحه خانه برگردید.
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
          aria-label="تلاش دوباره برای بارگذاری کتابخانه"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          تلاش دوباره
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">
            <Home className="h-4 w-4" aria-hidden="true" />
            بازگشت به خانه
          </Link>
        </Button>
      </div>
    </div>
  )
}
