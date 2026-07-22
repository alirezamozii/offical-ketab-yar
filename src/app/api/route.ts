import { NextResponse } from 'next/server'

/**
 * Root API endpoint — lightweight service descriptor.
 *
 * Used by ops/monitoring to confirm the API surface is reachable without
 * touching the database. Returns a JSON object with the app name, version,
 * a pointer to the docs (the site root), the current status, and a
 * high-level endpoint directory. Intentionally cheap — no DB ping, no
 * auth, no logging — so it can double as a health-check ping.
 */
export async function GET() {
  return NextResponse.json({
    name: 'Ketab-Yar API',
    version: '0.2.0',
    docs: '/',
    status: 'ok',
    endpoints: [
      '/api/health/live',
      '/api/health/ready',
      '/api/books',
      '/api/books/[slug]/pages',
      '/api/authors',
      '/api/genres',
      '/api/search',
      '/api/reviews',
      '/api/reviews/vote',
      '/api/reading/progress',
      '/api/leaderboard',
      '/api/achievements',
      '/api/goals',
      '/api/challenges',
      '/api/xp',
      '/api/stats',
      '/api/vocabulary',
      '/api/collections',
      '/api/quotes',
      '/api/blog',
      '/api/blog/[slug]',
      '/api/account/delete',
      '/api/account/export',
      '/api/support',
      '/api/og',
    ],
  })
}
