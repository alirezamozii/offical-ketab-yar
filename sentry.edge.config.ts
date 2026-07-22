/**
 * sentry.edge.config.ts
 * ---------------------------------------------------------------
 * Sentry Edge-runtime initialisation.
 *
 * Loaded from `src/instrumentation.ts` ONLY when `process.env.NEXT_RUNTIME === 'edge'`
 * (i.e. middleware + any route handler with `export const runtime = 'edge'`).
 *
 * The Edge runtime uses the same browser-style Sentry SDK as the client
 * (because it's V8 isolates, not Node), so the configuration mirrors the
 * client config — but reads the SERVER-side `SENTRY_DSN` env var (Edge
 * runtime has access to server-only env vars, unlike the browser).
 *
 * Owner: Tests + Monitoring (R2-I).
 */
import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN
const isProd = process.env.NODE_ENV === 'production'
const explicitlyEnabled = process.env.SENTRY_ENABLED === '1'

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const IPV4_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
const IPV6_RE = /\b(?:[A-Fa-f0-9]{1,4}:){2,7}[A-Fa-f0-9]{1,4}\b/g

function scrubString(s: string): string {
  return s
    .replace(EMAIL_RE, '[REDACTED:email]')
    .replace(IPV4_RE, '[REDACTED:ipv4]')
    .replace(IPV6_RE, '[REDACTED:ipv6]')
}

function scrubValue(value: unknown): unknown {
  if (typeof value === 'string') return scrubString(value)
  if (Array.isArray(value)) return value.map(scrubValue)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === 'email' || k === 'ip_address' || k === 'ipAddress') {
        out[k] = '[REDACTED]'
      } else if (k === 'cookie' || k === 'Cookie' || k === 'set-cookie' || k === 'authorization' || k === 'Authorization' || k === 'x-forwarded-for' || k === 'x-real-ip') {
        out[k] = '[REDACTED:header]'
      } else {
        out[k] = scrubValue(v)
      }
    }
    return out
  }
  return value
}

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: isProd || explicitlyEnabled,
  environment: process.env.NODE_ENV ?? 'production',

  tracesSampleRate: isProd ? 0.1 : 1.0,

  beforeSend(event) {
    if (!event) return null
    if (event.request) {
      if (typeof event.request.url === 'string') {
        event.request.url = scrubString(event.request.url)
      }
      if (event.request.headers) {
        if (event.request.headers) {
        const scrubbed: Record<string, string> = {}
        for (const [k, v] of Object.entries(event.request.headers)) {
          scrubbed[k] = typeof v === 'string' ? scrubString(v) : '[REDACTED]'
        }
        event.request.headers = scrubbed
      }
      }
    }
    if (event.user) {
      if (event.user.email) event.user.email = '[REDACTED]'
      if (event.user.ip_address) event.user.ip_address = '[REDACTED]'
    }
    if (Array.isArray(event.breadcrumbs)) {
      event.breadcrumbs = event.breadcrumbs.map((b) => ({
        ...b,
        message: b.message ? scrubString(b.message) : b.message,
        data: (b.data ? scrubValue(b.data) : b.data) as Record<string, unknown> | undefined,
      }))
    }
    if (event.extra) event.extra = scrubValue(event.extra) as Record<string, unknown>
    return event
  },

  ignoreErrors: [
    'ResizeObserver loop completed with undelivered notifications',
    'Network request failed',
  ],
})
