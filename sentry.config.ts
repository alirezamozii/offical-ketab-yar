/**
 * sentry.config.ts
 * ---------------------------------------------------------------
 * Sentry wizard / `withSentryConfig` build-time options.
 *
 * This file is consumed by `@sentry/nextjs`'s `withSentryConfig` wrapper
 * applied to `next.config.ts`. The actual `withSentryConfig(nextConfig, options)`
 * call is the responsibility of the agent that owns `next.config.ts`
 * (the file is shared with the Serwist wrapper and the security-headers
 * config — out of scope for R2-I per the task constraints).
 *
 * The config-owner agent (R1-A) should import this object and pass it as
 * the second argument to `withSentryConfig`:
 *
 *   ```ts
 *   // next.config.ts (NOT this file)
 *   import { withSentryConfig } from '@sentry/nextjs'
 *   import { sentryBuildOptions } from './sentry.config'
 *   export default withSentryConfig(nextConfig, sentryBuildOptions)
 *   ```
 *
 * Until that wrapper is added, Sentry still INITIALISES at runtime via
 * `src/instrumentation.ts` (which loads `sentry.{client,server,edge}.config.ts`)
 * — so error events ARE captured. What's missing without the build wrapper
 * is source-map upload (so stack traces in Sentry show original TypeScript
 * source) and the Next.js build-time tree-shaking of Sentry's code in
 * non-server bundles.
 *
 * Owner: Tests + Monitoring (R2-I).
 */
import type { SentryBuildOptions } from '@sentry/nextjs'

/**
 * Build-time Sentry options.
 *
 *  • `org` / `project`: read from env so the same config works across
 *    projects / Sentry orgs. CI sets SENTRY_ORG / SENTRY_PROJECT /
 *    SENTRY_AUTH_TOKEN when source-map upload is wired up.
 *  • `sourcemaps.disable`: skip upload in dev — only production builds
 *    (NODE_ENV=production + SENTRY_AUTH_TOKEN) upload.
 *  • `sourcemaps.deleteSourcemapsAfterUpload`: don't ship .map files in the
 *    production bundle (saves bytes + hides original source from public).
 *  • `disableLogger`: tree-shake Sentry's debug logger from prod bundles.
 *  • `widenClientFileUpload`: include Next.js runtime files in the upload
 *    so frames inside `_next/static/chunks/` resolve to original source.
 *  • `tunnelRoute`: route Sentry events through `/monitoring` on our origin
 *    to evade ad-blockers (which often block sentry.io).
 */
export const sentryBuildOptions: SentryBuildOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Release tracking — use git SHA in CI. This lets Sentry track which
  // release introduced/fixed each error.
  release: {
    name: process.env.SENTRY_RELEASE || process.env.GITHUB_SHA || undefined,
    create: true,
    finalize: true,
    setCommits: { auto: true },
  },

  // Only upload sourcemaps in production builds (CI sets NODE_ENV=production
  // + SENTRY_AUTH_TOKEN). In dev, no upload happens.
  sourcemaps: {
    disable: process.env.NODE_ENV !== 'production',
    deleteSourcemapsAfterUpload: true,
  },

  disableLogger: process.env.NODE_ENV === 'production',
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  silent: process.env.NODE_ENV === 'production',
}

/**
 * Default export — convenience so the next.config.ts wrapper can do:
 *
 *   import sentryConfig from './sentry.config'
 *   export default withSentryConfig(nextConfig, sentryConfig)
 */
export default sentryBuildOptions
