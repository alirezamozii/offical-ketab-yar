import { NextResponse } from 'next/server'

/**
 * GET /api/version — lightweight service-version probe.
 *
 * Returns the app name, version, build env, and server timestamp as JSON.
 * Used by:
 *   - Ops dashboards / health checks to confirm which version is live.
 *   - The Caddy reverse-proxy's `/api/version` passthrough (no auth).
 *   - Sentry release tracking (correlates errors to a deployed version).
 *
 * `Cache-Control: no-store` — the response is dynamic (timestamp) and
 * must never be cached by the browser, CDN, or SW. The endpoint is
 * intentionally unauthenticated so external monitors can probe it
 * without credentials; it leaks no sensitive info (just a version
 * string).
 *
 * Version is sourced from `package.json` (kept in sync manually —
 * bumping package.json `version` is part of the release checklist).
 */
export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json(
    {
      name: 'Ketab-Yar',
      version: '0.2.0',
      build: process.env.NODE_ENV ?? 'unknown',
      timestamp: new Date().toISOString(),
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}
