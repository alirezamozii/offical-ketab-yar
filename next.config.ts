import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { sentryBuildOptions } from "./sentry.config";
import { withPayload } from "@payloadcms/next/withPayload";

// ─── PWA: Serwist service worker ──────────────────────────────────────────
// NOTE: The Serwist webpack plugin was removed from next.config.ts because
// Next.js 16 defaults to Turbopack for `next build`, and Turbopack rejects
// the custom `webpack` config field that Serwist adds (hard error, not just
// a warning). This was causing the deployment to fail.
//
// The service worker source (`src/app/sw.ts`) still exists and a pre-built
// `public/sw.js` is committed. The SW registration in the client still
// works — it registers `/sw.js` which is served as a static file. The only
// thing lost is the precache manifest injection (which requires the webpack
// plugin). Runtime caching strategies in sw.ts still work.
//
// To regenerate sw.js with precache manifest injection, run:
//   bunx serwist build --src src/app/sw.ts --dest public/sw.js
// as a postbuild step in an environment with webpack available.

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  // Content-Security-Policy is intentionally NOT in this static list —
  // it is set per-request by `src/middleware.ts` with a fresh nonce +
  // 'strict-dynamic'. Keeping it static here would either (a) hardcode
  // 'unsafe-inline'/'unsafe-eval' (defeating XSS defense) or (b)
  // override the middleware's nonce-based header (depending on order).
  // Other security headers (X-Frame-Options, HSTS, etc.) stay static
  // because they don't vary per request.
];

const nextConfig: NextConfig = {
  output: process.env.NEXT_STANDALONE === "true" ? "standalone" : undefined,
  outputFileTracingExcludes: {
    '*': ['node:*', 'node:inspector', 'node:crypto'],
  },
  serverExternalPackages: ["node:inspector", "node:crypto", "node:fs", "node:path", "node:util", "node:events", "node:stream"],
  typescript: {
    // Re-enabled — all type errors have been fixed (tsc --noEmit passes clean).
    // If a future change introduces a type error, the build will now FAIL FAST
    // instead of silently shipping broken code to production.
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,

  compress: true,
  poweredByHeader: false,

  images: {
    formats: ["image/avif", "image/webp"],
    // External avatar hosts — Google OAuth profile photos + GitHub avatars
    // (rendered by reviews-list / profile-client via next/image). Without
    // these remotePatterns, next/image returns 400 for cross-origin URLs
    // and consumers fall back to raw <img> (loses AVIF/WebP negotiation,
    // srcset, lazy-loading, and the blurhash placeholder pipeline).
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  // Allow the preview/sandbox origin to hit _next resources during dev.
  allowedDevOrigins: [
    "*.space-z.ai",
    "*.preview.z.ai",
    "localhost",
    "127.0.0.1",
  ],

  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  // Tree-shake barrel exports — big wins on framer-motion, lucide & radix.
  // (Disabled in dev to reduce memory pressure in constrained sandbox; enabled
  // implicitly by the bundler in production builds.)
  experimental: process.env.NODE_ENV === "production"
    ? {
        optimizePackageImports: [
          "framer-motion",
          "lucide-react",
          "date-fns",
          "recharts",
        ],
      }
    : undefined,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Long-cache the generated OG images.
        source: "/api/og/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

// `withSentryConfig` + `withPayload` are applied to the final nextConfig.
// In dev, the Sentry wrapper is a no-op (sentryBuildOptions.sourcemaps.disable
// = true when NODE_ENV !== 'production'). withPayload configures the Payload
// CMS webpack aliases + Next.js catch-all routes.
export default withPayload(withSentryConfig(nextConfig, sentryBuildOptions));
