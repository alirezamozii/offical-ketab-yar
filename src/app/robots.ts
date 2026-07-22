import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'

/**
 * robots.txt for ketab-yar (max-level SEO).
 *
 * Policy:
 *  - Allow everything by default.
 *  - Disallow:
 *      /admin/          — admin area (private, never indexable).
 *      /api/            — backend endpoints, not for indexing.
 *      /books/read/     — app-like reader; duplicate of canonical /books/{slug}.
 *      /dashboard       — private user dashboard (per-user, no indexable value).
 *      /profile         — private user profile.
 *      /vocabulary      — private per-user vocabulary + sub-routes.
 *      /vocabulary/     — catch-all for /vocabulary/practice, /vocabulary/game, ...
 *      /search          — dynamic search results page, no static value.
 *  - Add `Host:` directive to declare the canonical host.
 *  - Reference the dynamic sitemap at /sitemap.xml so search engines
 *    auto-discover it.
 *
 * Served automatically at /robots.txt by Next.js App Router.
 */

const SITE_URL = SITE.url

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/admin/',
        '/api/',
        '/books/read/',
        '/dashboard',
        '/profile',
        '/vocabulary',
        '/vocabulary/',
        '/search',
        '/onboarding',
        '/settings',
        '/goals',
        '/stats',
        '/achievements',
        '/collections',
      ],

    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
