'use client'

import { ErrorUI } from '@/components/error-boundary/error-ui'

export default function Error({
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
      loggerLabel="Root Error"
    />
  )
}
 
