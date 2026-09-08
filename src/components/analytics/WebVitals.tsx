'use client'

import { useReportWebVitals } from 'next/web-vitals'

type WebVitalsMetric = Parameters<Parameters<typeof useReportWebVitals>[0]>[0]

export function WebVitals() {
  useReportWebVitals((metric: WebVitalsMetric) => {
    // Match instrumentation-client: an unconfigured SDK has nowhere to send
    // metrics. Avoid downloading it on every first paint without a DSN.
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN ||
        (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_SENTRY_ENABLED !== '1')) return
    const rating = 'rating' in metric ? String((metric as { rating?: string }).rating) : 'good'
    import('@sentry/nextjs').then((Sentry) => {
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
    }).catch(() => {})
  })

  return null
}
