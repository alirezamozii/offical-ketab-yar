'use client'

import { Button } from '@/components/ui/button'
import { BookOpen, Home, Library, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

/**
 * Reader error boundary — `/books/read/[slug]`.
 *
 * The professional reader is a full-screen island that takes over the layout
 * (no header / footer / bottom-nav). Any unhandled error thrown inside the
 * reader route would otherwise bubble up to the root `error.tsx`, which is
 * visually wrong.
 *
 * This boundary matches the reader's full-screen feel and is offline-aware:
 *   • Fills the viewport (min-h-screen) with the warm sepia/dark palette.
 *   • Detects if the error is due to being offline and shows specific guidance.
 *   • Recovery actions: تلاش مجدد (reset) → /books/[slug] (book detail) → /
 */
export default function ReaderError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const primaryRef = useRef<HTMLButtonElement>(null)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)
    const goOnline = () => setIsOffline(false)
    const goOffline = () => setIsOffline(true)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  useEffect(() => {
    console.error('[ketab-yar] /books/read/[slug] error boundary:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      url:
        typeof window !== 'undefined' ? window.location.href : 'SSR',
    })
    // Move focus to the primary action so keyboard users can retry immediately.
    primaryRef.current?.focus()
  }, [error])

  return (
    <div
      role="alert"
      className="relative flex min-h-screen w-full flex-col items-center justify-center px-4 py-12 text-center"
    >
      {/* soft warm glow behind the icon */}
      <div
        aria-hidden
        className="absolute top-1/3 -z-10 h-64 w-64 -translate-y-1/2 rounded-full bg-gold-500/10 blur-3xl"
      />

      {/* Brand wordmark */}
      <span className="mb-8 text-gradient-gold text-sm font-bold tracking-wide">
        کتاب‌یار
      </span>

      {/* Icon */}
      <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gold-500/15 text-gold-600 shadow-md-warm dark:text-gold-400">
        <BookOpen className="h-10 w-10" aria-hidden="true" />
      </span>

      {/* Headline + sub-message */}
      <h1 className="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {isOffline ? 'شما آفلاین هستید' : 'خطا در بارگذاری کتاب'}
      </h1>
      <p className="mt-3 max-w-md text-pretty text-muted-foreground font-sans">
        {isOffline
          ? 'این کتاب هنوز برای مطالعه آفلاین دانلود یا کش نشده است. لطفاً ابتدا اتصال اینترنت خود را برقرار کرده و روی دکمه «دانلود برای مطالعه آفلاین» در صفحه کتاب کلیک کنید.'
          : 'متأسفانه بارگذاری این کتاب با خطا مواجه شد. شاید اتصال اینترنت شما قطع شده باشد یا مشکلی در سرور رخ داده باشد. می‌توانید دوباره تلاش کنید یا به صفحه کتاب بازگردید.'}
      </p>

      {/* Digest chip — helps support trace the bug */}
      {!isOffline && error.digest ? (
        <span className="mt-4 rounded-full border border-border/60 bg-muted/40 px-3 py-1 font-mono text-[10px] text-muted-foreground/70">
          شناسه: {error.digest}
        </span>
      ) : null}

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          ref={primaryRef}
          onClick={reset}
          variant="glow"
          size="lg"
          aria-label="تلاش دوباره برای بارگذاری کتاب"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          تلاش مجدد
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/library">
            <Library className="h-4 w-4" aria-hidden="true" />
            بازگشت به کتابخانه
          </Link>
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/">
            <Home className="h-4 w-4" aria-hidden="true" />
            بازگشت به خانه
          </Link>
        </Button>
      </div>
    </div>
  )
}
