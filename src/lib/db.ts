import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbOfflineUntil?: number;
};

/**
 * Prisma client singleton.
 *
 * ── HMR safety ───────────────────────────────────────────────────────────
 * In dev, the cached PrismaClient instance can fall behind schema changes
 * (HMR keeps `globalThis` alive across reloads). If the cached instance is
 * missing a known model (we probe for `userStats`), drop it and instantiate
 * a fresh client. This prevents "unknown model" errors after `prisma db push`
 * adds a new model mid-session.
 *
 * ── Logging ──────────────────────────────────────────────────────────────
 * `['error', 'warn']` is the correct production log level. Do NOT add
 * `'query'` to this list in production — it serializes every SQL statement
 * to stdout, which (a) tanks throughput on a hot API, (b) leaks user data
 * into logs, and (c) inflates log volume by 10–100×. If you need query
 * introspection during local development, temporarily change to
 * `['query', 'error', 'warn']` — never commit that.
 *
 * ── Connection pooling (Postgres) ────────────────────────────────────────
 * The DATABASE_URL includes `?connection_limit=10&pool_timeout=20` for
 * Postgres. A good rule of thumb for a Next.js server is
 * `connection_limit = (CPU cores × 2 + 1)` for the web tier, leaving
 * headroom for migrations / background jobs. Consider `pgbouncer` for
 * serverless / edge deployments where function instances spin up many
 * short-lived clients.
 */
function getDb(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && 'userStats' in cached) return cached;
  const client = new PrismaClient({ log: ['error', 'warn'] });
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client;

  return client;
}

export const db = getDb();

export function isDbOffline(): boolean {
  if (
    process.env.DB_OFFLINE === 'true' ||
    process.env.DB_OFFLINE === '1' ||
    process.env.USE_SQLITE === 'true' ||
    Boolean(process.env.NETLIFY) ||
    Boolean(process.env.VERCEL) ||
    !process.env.DATABASE_URL ||
    process.env.DATABASE_URL.includes('127.0.0.1') ||
    process.env.DATABASE_URL.includes('localhost')
  ) {
    return true;
  }
  return (
    typeof globalForPrisma.dbOfflineUntil === 'number' &&
    Date.now() < globalForPrisma.dbOfflineUntil
  );
}

export function tripDbOffline(cooldownMs = 30000) {
  globalForPrisma.dbOfflineUntil = Date.now() + cooldownMs;
}

export function resetDbOffline() {
  globalForPrisma.dbOfflineUntil = 0;
}

export async function safeQuery<T>(
  queryFn: () => Promise<T>,
  fallback: T,
  timeoutMs = 2000,
): Promise<T> {
  if (isDbOffline()) {
    return fallback;
  }

  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      tripDbOffline(15000);
      resolve(fallback);
    }, timeoutMs);
  });

  try {
    const queryPromise = queryFn()
      .then((res) => {
        resetDbOffline();
        return res;
      })
      .catch((err: unknown) => {
        const msg = (err as { message?: string })?.message || '';
        const code = (err as { code?: string })?.code || '';
        if (code === 'P1001' || msg.includes("Can't reach database server")) {
          tripDbOffline(30000);
        }
        return fallback;
      });

    const result = await Promise.race([queryPromise, timeout]);
    return result;
  } catch (err: unknown) {
    const msg = (err as { message?: string })?.message || '';
    const code = (err as { code?: string })?.code || '';
    if (code === 'P1001' || msg.includes("Can't reach database server")) {
      tripDbOffline(30000);
    }
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
