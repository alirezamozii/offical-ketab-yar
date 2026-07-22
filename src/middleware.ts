import { NextResponse, type NextRequest } from 'next/server'

/**
 * Per-request CSP nonce middleware.
 *
 * Generates a fresh `crypto.randomUUID()` nonce per request, injects it
 * into the `Content-Security-Policy` header as `script-src 'self'
 * 'nonce-<nonce>' 'strict-dynamic'`, and forwards the response. With
 * `strict-dynamic`, scripts loaded by a trusted (nonce-bearing) script
 * are allowed to load their own dependencies — so we don't need to
 * maintain an allowlist of every dynamic-script origin.
 *
 * Why a nonce (instead of `'unsafe-inline'`):
 *  - The static CSP in `next.config.ts` (now removed) used
 *    `'unsafe-inline'` + `'unsafe-eval'` to let Next.js dev/inline
 *    runtime scripts run. That defeats the XSS defense CSP is supposed
 *    to provide.
 *  - In Next.js 16 production builds, all inline runtime scripts are
 *    automatically tagged with the per-request nonce set on the
 *    `x-nonce` request header / response header — provided middleware
 *    emits the nonce in the CSP. This is the recommended pattern from
 *    the Next.js security docs.
 *
 * Why `strict-dynamic`:
 *  - recharts, framer-motion, lenis, and our own bundle emit scripts
 *    that may lazily load other scripts. With `strict-dynamic`, any
 *    script that runs because of a nonce (or another trusted loader
 *    script) can spawn further script loads — without us hand-maintaining
 *    an allowlist of every CDN or lazy chunk origin.
 *
 * The CSP allows:
 *  - default-src 'self' — deny-by-default for everything CSP doesn't
 *    explicitly allow.
 *  - script-src 'self' 'nonce-<nonce>' 'strict-dynamic' — only our
 *    own scripts + nonce-tagged inline scripts + their dynamically-
 *    loaded dependents. NOTE: in dev, Next.js HMR needs `eval` —
 *    `strict-dynamic` covers that because the dev runtime is loaded
 *    with the nonce.
 *  - style-src 'self' 'unsafe-inline' — Tailwind + next/font inject
 *    inline styles; nonce-tagging styles is brittle so we keep
 *    `'unsafe-inline'` here (CSS-based XSS is much rarer than JS-based).
 *  - img-src 'self' data: blob: https: — procedural covers (data:),
 *    blob previews (blob:), external avatar hosts (Google / GitHub),
 *    and any future HTTPS image host.
 *  - font-src 'self' data: — next/font self-hosts; data: for inlined.
 *  - connect-src 'self' https://internal-api.z.ai — our API + the
 *    internal Z-AI gateway. (All user-facing AI calls go through our
 *    own /api/ai/* routes, which call the gateway server-side.)
 *  - media-src 'self' blob: data: — TTS audio returned as blobs +
 *    procedural audio fallbacks.
 *  - object-src 'none' — no Flash/Java/plugins.
 *  - base-uri 'self' — prevent <base> hijacking.
 *  - frame-ancestors 'none' — equivalent to X-Frame-Options DENY but
 *    CSP-native. Clickjacking defense.
 *  - form-action 'self' — forms can only submit to our origin.
 *  - upgrade-insecure-requests — rewrite http:// to https://.
 *
 * Matcher: all paths EXCEPT static assets (the dev server / Caddy
 * already long-caches these, and serving them through middleware just
 * wastes a nonce generation per request).
 */

export function middleware(_request: NextRequest) {
  const nonce = crypto.randomUUID()
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://internal-api.z.ai",
    "media-src 'self' blob: data:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ')

  // Forward to the request so Next.js can tag inline runtime scripts
  // with this nonce in production. (Use a request header rather than a
  // response header so React Server Components can read it during render
  // — Next.js picks it up from `x-nonce` automatically.)
  const requestHeaders = new Headers(_request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })
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
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png$|.*\\.svg$|.*\\.webp$).*)',
  ],
}
