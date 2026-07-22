/**
 * /api/health/ready — readiness probe.
 *
 * Runs a trivial DB query (`db.user.count()`) to confirm Prisma can reach
 * the database. Returns 200 + `{ status: 'ready', db: 'ok' }` if the DB
 * responds, 503 + `{ status: 'not ready', db: 'error', error }` if it
 * doesn't.
 *
 * Use this for K8s readinessProbe / Docker HEALTHCHECK / a pre-deploy
 * smoke test: a non-200 means traffic should NOT be routed here.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
} as const

export async function GET() {
  try {
    // Trivial query — exercises the full Prisma → Postgres path. A timeout
    // or rejected connection bubbles up to the catch below.
    await db.user.count()
    return NextResponse.json(
      { status: 'ready', db: 'ok', timestamp: new Date().toISOString() },
      { status: 200, headers: NO_STORE_HEADERS },
    )
  } catch (err) {
    // H-15: log the raw error server-side but return a generic message —
    // readiness probes are sometimes scraped by monitoring tools / exposed
    // to internal users, and Prisma errors can leak connection-string
    // fragments or file paths.
    console.error('[/api/health/ready] DB check failed:', err)
    return NextResponse.json(
      {
        status: 'not ready',
        db: 'error',
        error: 'database unreachable',
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}
