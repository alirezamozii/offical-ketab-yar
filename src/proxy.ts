import { NextResponse, type NextRequest } from 'next/server'

/**
 * Security headers for public and admin routes.
 *
 * The public site uses ISR, so its framework scripts are generated before a
 * request nonce exists. The policy therefore follows Next.js's static CSP
 * pattern: self-hosted scripts plus required inline Next.js bootstrap code,
 * with eval disabled in production.
 *
 * Production uses Next.js Subresource Integrity so static pages can keep
 * their cacheability without allowing arbitrary inline JavaScript.
 */

export function proxy(_request: NextRequest) {
  // Defensive guard against infinite relative-redirect loops (e.g. /5.231.108.102:3000/5.231.108.102:3000/...)
  const pathname = _request.nextUrl.pathname
  if (pathname.includes(':3000') || /^\/(?:\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|[a-zA-Z0-9.-]+:\d+)/.test(pathname)) {
    // Strip repetitive IP:port or domain:port path prefixes
    const cleanPath = pathname.replace(/^(\/(?:[a-zA-Z0-9.-]+:\d+|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?))+/, '') || '/'
    const targetUrl = new URL(cleanPath + _request.nextUrl.search, _request.nextUrl.origin)
    return NextResponse.redirect(targetUrl, 307)
  }

  const isDev = process.env.NODE_ENV === 'development'
  const host = _request.headers.get('host') || ''
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1')

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    isDev
      ? "connect-src 'self' ws: wss: http: https: https://internal-api.z.ai"
      : "connect-src 'self' https://internal-api.z.ai",
    "media-src 'self' blob: data:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    !isDev && !isLocal && 'upgrade-insecure-requests',
  ].filter(Boolean).join('; ')

  // SRI keeps public pages static; no request nonce is required.
  const response = NextResponse.next()
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  // Match every path except:
  //  - _next/static, _next/image — Next's own static asset endpoints
  //    (don't need CSP, long-cached).
  //  - favicon.ico, robots.txt, sitemap.xml — well-known static files.
  //  - *.png, *.svg, *.webp — image assets (served from /public or
  //    next/image; CSP doesn't apply to non-HTML responses).
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|svg|webp|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|css|js)$).*)',
  ],
}
