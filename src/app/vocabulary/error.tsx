'use client'

import { Button } from '@/components/ui/button'
import { Home, Languages, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

/**
 * /vocabulary error boundary — catches errors on the vocabulary hub
 * (`/vocabulary`) and all sub-routes (`/vocabulary/game`,
 * `/vocabulary/listen`, `/vocabulary/spell`, `/vocabulary/practice`).
 *
 * Per task spec, the headline is "واژگان بارگذاری نشد" with a
 * "تلاش دوباره" primary action. Vocabulary data is user-scoped and
 * stored in Postgres, so most errors are transient DB hiccups.
 */
export default function VocabularyError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const primaryRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    console.error('[ketab-yar] /vocabulary error boundary:', {
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
        <Languages className="h-10 w-10" aria-hidden="true" />
      </span>

      <h1 className="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
        واژگان بارگذاری نشد
      </h1>
      <p className="mt-3 max-w-md text-pretty text-muted-foreground">
        در نمایش واژگان شما مشکلی پیش آمد. می‌توانید دوباره تلاش کنید یا به
        صفحه خانه برگردید. واژگان ذخیره‌شده شما از بین نرفته‌اند.
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
          aria-label="تلاش دوباره برای بارگذاری واژگان"
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
