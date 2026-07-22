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

export default buildConfig({
  // Admin panel — mounted at /admin (Payload's default)
  admin: {
    user: UsersCollection.slug,
    components: {
      views: {
        dashboard: {
          Component: '/payload/components/Dashboard#Dashboard',
        },
      },
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

  // Collections — content types managed by Payload
  collections: [
    UsersCollection,
    booksCollection,
    authorsCollection,
    blogPostsCollection,
    quotesCollection,
    mediaCollection,
  ],

  // Database — Postgres using the same DATABASE_URL as Prisma
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    push: true,
  }),

  // Rich text editor — Lexical (Payload's default)
  editor: lexicalEditor(),

  // Secret — used for Payload's internal JWT auth
  secret: process.env.PAYLOAD_SECRET || process.env.NEXTAUTH_SECRET || 'dev-payload-secret',

  // Typescript — generate types automatically
  typescript: {
    outputFile: 'src/payload-types.ts',
  },
})
