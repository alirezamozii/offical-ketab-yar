'use client'

import { Button } from '@/components/ui/button'
import { Home, RotateCcw, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import * as Sentry from '@sentry/nextjs'

/**
 * Root error boundary — catches any unhandled error in the route tree
 * below the root layout (i.e. every page that doesn't have its own
 * `error.tsx`). Renders inside the normal app shell (header/footer/nav
 * stay mounted), so the user can navigate away if `reset()` doesn't help.
 *
 * Never renders raw `error.message` / `error.stack` to the user — only
 * to the console. Users see a friendly Persian message + a digest chip
 * they can quote when reporting the bug.
 *
 * Sentry: the captured exception is forwarded to Sentry in the same
 * effect, with the Next.js `digest` attached as a tag so the support team
 * can correlate a user-reported digest with the Sentry event. The
 * `beforeSend` hook in `sentry.client.config.ts` scrubs PII (emails, IPs)
 * before upload.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const primaryRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    console.error('[ketab-yar] root error boundary:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
    })
    // Forward to Sentry — attach the Next.js digest so support can correlate
    // user-reported digests with Sentry events. The 2nd arg is the CaptureContext:
    // we tag the error with the boundary that captured it + the digest.
    Sentry.captureException(error, {
      tags: {
        boundary: 'root-error',
        digest: error.digest ?? 'no-digest',
      },
      extra: {
        url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      },
    })
    // Move focus to the primary action so keyboard users can retry immediately.
    primaryRef.current?.focus()
  }, [error])

  return (
    <div
      role="alert"
      className="relative mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-12 text-center sm:px-6"
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
        <TriangleAlert className="h-10 w-10" aria-hidden="true" />
      </span>

      {/* Headline + sub-message */}
      <h1 className="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
        مشکلی پیش آمد
      </h1>
      <p className="mt-3 max-w-md text-pretty text-muted-foreground">
        خطای غیرمنتظره‌ای رخ داد. می‌توانید دوباره تلاش کنید یا به صفحه خانه
        برگردید. اگر مشکل ادامه داشت، لطفاً با ما تماس بگیرید.
      </p>

      {/* Digest chip (optional, helps support trace the bug) */}
      {error.digest ? (
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
          aria-label="تلاش دوباره برای بارگذاری صفحه"
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
