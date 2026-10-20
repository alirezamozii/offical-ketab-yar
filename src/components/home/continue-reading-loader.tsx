'use client'

import { getLocalProgress } from '@/hooks/reader/use-local-progress'
import { lazy, Suspense, useEffect, useState } from 'react'

const ContinueReading = lazy(() =>
  import('@/components/home/continue-reading').then((module) => ({
    default: module.ContinueReading,
  })),
)

/**
 * Avoid downloading the full continue-reading carousel for first-time users.
 * The existing widget already waited for client storage before it could render;
 * this lightweight gate performs that same check before requesting its bundle.
 */
export function ContinueReadingLoader() {
  const [hasProgress, setHasProgress] = useState(false)

  useEffect(() => {
    const progress = getLocalProgress()
    setHasProgress(Object.values(progress).some((entry) => entry.percent > 0))
  }, [])

  if (!hasProgress) return null
  return (
    <Suspense fallback={null}>
      <ContinueReading />
    </Suspense>
  )
}
