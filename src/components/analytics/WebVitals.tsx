'use client'

import { useReportWebVitals } from 'next/web-vitals'
import * as Sentry from '@sentry/nextjs'

type WebVitalsMetric = Parameters<Parameters<typeof useReportWebVitals>[0]>[0]

export function WebVitals() {
  useReportWebVitals((metric: WebVitalsMetric) => {
    // Stream Web Vitals (LCP, FID, CLS, TTFB, INP, FCP) directly to Sentry
    const rating = 'rating' in metric ? String((metric as { rating?: string }).rating) : 'good'
    Sentry.addBreadcrumb({
      category: 'web-vitals',
      message: `${metric.name}: ${metric.value} (${rating})`,
      level: 'info',
      data: {
        id: metric.id,
        name: metric.name,
        value: metric.value,
        rating,
      },
    })
  })

  return null
}
