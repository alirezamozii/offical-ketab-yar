/**
 * sentry.client.config.ts
 * ---------------------------------------------------------------
 * Sentry browser-side initialisation.
 *
 * Loaded from `src/instrumentation.ts` (or, for the browser, by
 * `@sentry/nextjs`'s automatic client entry) — see the Next.js + Sentry
 * docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 *
 * Configuration highlights:
 *  • DSN comes from `NEXT_PUBLIC_SENTRY_DSN` (public, safe to expose — it
 *    only authorises sending events to your Sentry project).
 *  • Disabled entirely in dev (`NODE_ENV === 'development'`) so local
 *    exceptions don't pollute the Sentry project. Override with
 *    `NEXT_PUBLIC_SENTRY_ENABLED=1` if you need to test Sentry locally.
 *  • `tracesSampleRate: 0.1` in production — captures 10 % of performance
 *    transactions. Tune per-project; 10 % is a sensible default for a
 *    medium-traffic reader app.
 *  • `beforeSend` scrubs PII from event payloads:
 *      - email addresses (in any string field, request URL, breadcrumb)
 *      - IP addresses (in request headers + the `request.headers` bag)
 *      - user.email / user.ip_address are stripped before upload
 *    This keeps the deployment GDPR-friendly by default.
 *
 * Owner: Tests + Monitoring (R2-I).
 */
import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN
const isProd = process.env.NODE_ENV === 'production'
const explicitlyEnabled = process.env.NEXT_PUBLIC_SENTRY_ENABLED === '1'

// Email regex — matches the common `local-part@domain.tld` form. We also
// catch `mailto:` URLs which would otherwise leak the address in a URL field.
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const MAILTO_RE = /mailto:[^"'<\s]+/gi
// IPv4 regex — matches dotted-quad addresses anywhere in a string.
const IPV4_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
// IPv6 (simplified — catches the common `2001:db8::1` and `::1` forms).
const IPV6_RE = /\b(?:[A-Fa-f0-9]{1,4}:){2,7}[A-Fa-f0-9]{1,4}\b/g

/** Recursively walk a JSON-able value, redacting strings in place. */
function scrubString(s: string): string {
  return s
    .replace(EMAIL_RE, '[REDACTED:email]')
    .replace(MAILTO_RE, '[REDACTED:mailto]')
    .replace(IPV4_RE, '[REDACTED:ipv4]')
    .replace(IPV6_RE, '[REDACTED:ipv6]')
}

/** Walk an arbitrary event payload and redact PII from every string field. */
function scrubValue(value: unknown): unknown {
  if (typeof value === 'string') return scrubString(value)
  if (Array.isArray(value)) return value.map(scrubValue)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // Skip keys whose presence alone is a PII leak — drop the whole field.
      if (k === 'email' || k === 'ip_address' || k === 'ipAddress') {
        out[k] = '[REDACTED]'
      } else if (k === 'cookie' || k === 'Cookie' || k === 'set-cookie' || k === 'authorization' || k === 'Authorization') {
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

  // 10 % performance sample rate in prod. Dev is fully disabled above so
  // this only affects production traffic. Tune per-project.
  tracesSampleRate: isProd ? 0.1 : 1.0,

  // Capture 100 % of (slow) release-health sessions — these are tiny and
  // give us crash-free-session metrics for free.
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 1.0,

  // Don't send breadcrumbs for console.debug / console.log — too noisy.
  beforeSend(event) {
    if (!event) return null

    // Scrub the request URL + headers.
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
      if (event.request.cookies) {
        event.request.cookies = { '[REDACTED]': 'cookies' }
      }
    }

    // Scrub user.email / user.ip_address.
    if (event.user) {
      if (event.user.email) event.user.email = '[REDACTED]'
      if (event.user.ip_address) event.user.ip_address = '[REDACTED]'
    }

    // Walk breadcrumbs and redact PII from `message` fields.
    if (Array.isArray(event.breadcrumbs)) {
      event.breadcrumbs = event.breadcrumbs.map((b) => ({
        ...b,
        message: b.message ? scrubString(b.message) : b.message,
        data: (b.data ? scrubValue(b.data) : b.data) as Record<string, unknown> | undefined,
      }))
    }

    // Walk `extra` and `contexts` for PII (free-form string bags).
    if (event.extra) event.extra = scrubValue(event.extra) as Record<string, unknown>
    if (event.contexts) event.contexts = scrubValue(event.contexts) as typeof event.contexts

    return event
  },

  // Ignore noisy, unactionable errors (browser extensions, network blips).
  ignoreErrors: [
    // Browser extensions inject scripts that throw on cross-origin frames.
    'top.GLOBALS',
    'ResizeObserver loop completed with undelivered notifications',
    // Random network errors that the user can't do anything about.
    'Network request failed',
    'Failed to fetch',
  ],
})
