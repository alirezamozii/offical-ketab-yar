'use client'

import { ErrorUI } from '@/components/error-boundary/error-ui'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorUI
      error={error}
      onReset={reset}
      loggerLabel="Auth Error"
      title="خطا در احراز هویت"
      description="نگران نباشید، می‌توانیم این مشکل را حل کنیم"
    />
  )
}
 
