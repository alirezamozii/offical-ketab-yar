/**
 * /api/health/live — liveness probe.
 *
 * Returns 200 as long as the Node.js process is alive and able to handle
 * requests. Does NOT touch the database or any other dependency.
 *
 * Wire this to your load balancer / orchestrator (Caddy health_uri, Docker
 * HEALTHCHECK, K8s livenessProbe) so the process gets restarted if it hangs.
 */

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    { status: 'alive', timestamp: new Date().toISOString() },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    },
  )
}
