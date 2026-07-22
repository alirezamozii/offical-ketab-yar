/**
 * src/instrumentation.ts
 * ---------------------------------------------------------------
 * Next.js instrumentation hook — runs ONCE at server boot, before any
 * request is served. This is the canonical place to initialise
 * observability / monitoring SDKs (Sentry, OpenTelemetry, etc.) per the
 * Next.js 16 docs:
 *
 *   https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 *
 * We use this hook to load the appropriate Sentry config for the current
 * runtime:
 *
 *   • `NEXT_RUNTIME === 'nodejs'` → load `../sentry.server.config.ts`
 *     (the standard Node.js Sentry SDK).
 *   • `NEXT_RUNTIME === 'edge'`   → load `../sentry.edge.config.ts`
 *     (the Edge-runtime Sentry SDK, used in middleware + edge route handlers).
 *   • Browser runtime: the client config is loaded automatically by
 *     `@sentry/nextjs`'s client entry — no action needed here.
 *
 * The dynamic `import()` is conditional so the server bundle doesn't pull
 * in the edge SDK (and vice versa). Each config file is a no-op when
 * SENTRY_DSN is unset (the SDK's `enabled` flag is gated on the DSN).
 *
 * Owner: Tests + Monitoring (R2-I).
 */
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  } else if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError

