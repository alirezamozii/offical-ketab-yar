/**
 * src/payload.config.ts
 * ---------------------------------------------------------------
 * Payload CMS configuration — Hybrid architecture.
 *
 * Prisma owns user data (auth, sessions, stats, reading progress).
 * Payload owns content data (books, authors, blog posts, quotes).
 *
 * Both Prisma and Payload share the same Postgres database via
 * DATABASE_URL. Payload uses @payloadcms/db-postgres adapter.
 *
 * Owner: Phase 2 R-PL.1
 * ---------------------------------------------------------------
 */

import { buildConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { en } from '@payloadcms/translations/languages/en'
import { fa } from '@payloadcms/translations/languages/fa'
import { booksCollection } from './collections/Books'
import { authorsCollection } from './collections/Authors'
import { blogPostsCollection } from './collections/BlogPosts'
import { quotesCollection } from './collections/Quotes'
import { mediaCollection } from './collections/Media'
import { UsersCollection } from './collections/Users'

const payloadSecret = process.env.PAYLOAD_SECRET
const isProductionBuild = process.env.NEXT_PHASE === 'phase-production-build'
if (process.env.NODE_ENV === 'production' && !isProductionBuild && (!payloadSecret || payloadSecret.length < 32)) {
  throw new Error('PAYLOAD_SECRET must be set to at least 32 characters in production')
}

export default buildConfig({
  // Admin panel — mounted at /admin (Payload's default)
  admin: {
    user: UsersCollection.slug,
    components: {
      views: {
        dashboard: {
          Component: '@/payload/components/Dashboard#Dashboard',
        },
      },
      afterNavLinks: [
        '@/payload/components/QuickPanelNavLinks#QuickPanelNavLinks',
      ],
    },
    // Persian RTL support will be added via custom components later
    disable: false,
    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 812 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },

  i18n: {
    fallbackLanguage: 'en',
    supportedLanguages: {
      en,
      fa,
    },
  },

  // Collections — content types managed by Payload in logical workflow order
  collections: [
    authorsCollection,
    booksCollection,
    blogPostsCollection,
    quotesCollection,
    mediaCollection,
    UsersCollection,
  ],

  // Database — Postgres using the same DATABASE_URL as Prisma
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    schemaName: 'payload',
    // Payload owns its isolated `payload` schema. Keep schema sync enabled
    // until the project adopts Payload's own migration runner.
    push: true,
  }),

  // Rich text editor — Lexical (Payload's default)
  editor: lexicalEditor(),

  // Secret — used for Payload's internal JWT auth
  secret: payloadSecret || (isProductionBuild
    ? 'build-only-payload-secret-not-used-at-runtime'
    : 'dev-payload-secret-change-before-production'),

  // Typescript — generate types automatically
  typescript: {
    outputFile: 'src/payload-types.ts',
  },
})
