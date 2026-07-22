'use client'

import { WifiOff, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)
    const goOnline = () => {
      setIsOffline(false)
      setDismissed(false)
    }
    const goOffline = () => {
      setIsOffline(true)
      setDismissed(false)
    }

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (!isOffline || dismissed) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-16 z-50 flex justify-center px-4 md:bottom-4 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex w-full max-w-lg items-center justify-between gap-3 rounded-xl border border-gold-500/30 bg-background/95 p-3 shadow-lg-warm backdrop-blur-md">
        <div className="flex items-center gap-2 text-right">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-gold-600 dark:text-gold-400">
            <WifiOff className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-bold leading-tight">شما آفلاین هستید</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              کتاب‌های دانلودشده همچنان در دسترس هستند.{' '}
              <Link href="/offline" className="font-bold text-gold-600 underline hover:text-gold-500 dark:text-gold-400">
                مشاهده لیست آفلاین
              </Link>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="بستن"
          className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
