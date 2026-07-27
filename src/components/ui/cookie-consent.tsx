'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ShieldCheck } from 'lucide-react'

const CONSENT_KEY = 'ky_cookie_consent_accepted'

export function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(CONSENT_KEY)
      if (!accepted) {
        setShow(true)
      }
    } catch {
      // localStorage disabled or error
    }
  }, [])

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'true')
    } catch {}
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      role="region"
      aria-label="اطلاعیه کوکی و حریم خصوصی"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-2xl border border-border/80 bg-background/95 p-4 shadow-xl backdrop-blur-md dark:bg-background/90"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-500/15 text-gold-600 dark:text-gold-400">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="flex-1 text-xs sm:text-sm">
          <p className="font-semibold text-foreground">حریم خصوصی و عملکرد</p>
          <p className="mt-1 text-muted-foreground">
            کتاب‌یار جهت بهبود عملکرد و ثبت خطاها (از طریق Sentry) از حافظه محلی و کوکی‌های امنیتی استفاده می‌کند. هیچ‌گونه داده شخصی به ثالث فروخته نمی‌شود.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button onClick={handleAccept} size="sm" variant="glow">
              متوجه شدم و قبول دارم
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
