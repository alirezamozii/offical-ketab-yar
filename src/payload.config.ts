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

import { buildConfig } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { en } from '@payloadcms/translations/languages/en';
import { fa } from '@payloadcms/translations/languages/fa';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { booksCollection } from './collections/Books';
import { authorsCollection } from './collections/Authors';
import { blogPostsCollection } from './collections/BlogPosts';
import { quotesCollection } from './collections/Quotes';
import { mediaCollection } from './collections/Media';
import { UsersCollection } from './collections/Users';

const defaultPayloadSecret = 'bookzi_production_payload_secret_key_minimum_32_characters_default';
const payloadSecret =
  process.env.PAYLOAD_SECRET || process.env.NEXTAUTH_SECRET || defaultPayloadSecret;

function getSqliteUrl(): string {
  if (process.env.SQLITE_DATABASE_URL) {
    return process.env.SQLITE_DATABASE_URL;
  }

  const isServerless = Boolean(
    process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL,
  );

  const tmpDbPath = path.join('/tmp', 'payload.db');

  if (isServerless) {
    try {
      const candidates = [
        path.join(process.cwd(), 'db', 'payload.db'),
        path.resolve('db/payload.db'),
        path.join('/var/task', 'db', 'payload.db'),
        path.join(__dirname, '..', '..', 'db', 'payload.db'),
      ];

      let foundSource: string | null = null;
      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          foundSource = cand;
          break;
        }
      }

      if (foundSource) {
        if (!fs.existsSync(tmpDbPath) || fs.statSync(tmpDbPath).size === 0) {
          fs.copyFileSync(foundSource, tmpDbPath);
        }
      }
      return `file:${tmpDbPath}`;
    } catch (e) {
      console.warn('[payload.config] Serverless /tmp copy fallback warning:', e);
      return `file:${tmpDbPath}`;
    }
  }

  return 'file:./db/payload.db';
}

const shouldUseSqlite =
  process.env.USE_SQLITE === 'true' ||
  process.env.DB_OFFLINE === 'true' ||
  Boolean(process.env.NETLIFY) ||
  Boolean(process.env.VERCEL) ||
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes('127.0.0.1') ||
  process.env.DATABASE_URL.includes('localhost');

export default buildConfig({
  sharp,
  // Admin panel — mounted at /admin (Payload's default)
  admin: {
    user: UsersCollection.slug,
    components: {
      views: {
        dashboard: {
          Component: '@/payload/components/Dashboard#Dashboard',
        },
      },
      afterNavLinks: ['@/payload/components/QuickPanelNavLinks#QuickPanelNavLinks'],
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

  // Database — SQLite for serverless/local/offline, Postgres when valid DATABASE_URL is available
  db: shouldUseSqlite
    ? sqliteAdapter({
        client: {
          url: getSqliteUrl(),
        },
        push: true,
      })
    : postgresAdapter({
        pool: {
          connectionString: process.env.DATABASE_URL,
        },
        schemaName: 'payload',
        push: true,
      }),

  // Rich text editor — Lexical (Payload's default)
  editor: lexicalEditor(),

  // Secret — used for Payload's internal JWT auth
  secret: payloadSecret,

  onInit: async (payload) => {
    try {
      const adminEmail = 'alirezakaregar05@gmail.com';
      const adminPass = 'Kar147852369';
      const users = await payload.find({
        collection: 'users',
        where: {
          email: {
            equals: adminEmail,
          },
        },
      });
      if (users.totalDocs === 0) {
        await payload.create({
          collection: 'users',
          data: {
            email: adminEmail,
            password: adminPass,
            name: 'Alireza',
            role: 'owner',
          },
        });
        payload.logger.info(`[Payload onInit] Successfully created owner account: ${adminEmail}`);
      } else {
        const user = users.docs[0];
        await payload.update({
          collection: 'users',
          id: user.id,
          data: {
            password: adminPass,
            role: 'owner',
          },
        });
        payload.logger.info(`[Payload onInit] Verified/updated owner credentials: ${adminEmail}`);
      }
    } catch (err) {
      payload.logger.error(`[Payload onInit Error] Could not bootstrap admin: ${err}`);
    }
  },

  // Typescript — generate types automatically
  typescript: {
    outputFile: 'src/payload-types.ts',
  },
});
