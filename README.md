# Ketab-Yar (کتاب‌یار)

A bilingual (Persian / English) book-reader web app with AI-powered comprehension
aids, a built-in dictionary, spaced-repetition vocabulary training, gamified
reading streaks, and an admin CMS for content authors.

The app is Persian-first (RTL layout, Persian numerals, Persian UI copy) but
the books themselves are English — the reader's job is to help Persian
speakers read English books fluently.

---

## Tech stack

| Layer            | Choice                                              |
| ---------------- | --------------------------------------------------- |
| Framework        | Next.js 16 (App Router, Turbopack)                  |
| Language         | TypeScript 5 (strict)                               |
| Runtime          | Node 22+ (dev / prod), Bun (scripts / package mgr)  |
| UI               | React 19, Tailwind CSS 4, shadcn/ui (Radix-based)   |
| Animation        | framer-motion                                       |
| Charts           | recharts (code-split per-route via `next/dynamic`)  |
| Rich text        | @mdxeditor/editor (admin only, code-split)          |
| Database         | Prisma 6 + SQLite (dev) / PostgreSQL (prod)         |
| Auth             | NextAuth v4 (HMAC-signed session cookie, Google OAuth) |
| AI               | z-ai-web-dev-sdk (chat / translate / summarize / TTS) |
| PWA              | Serwist (service worker for offline reading)        |
| Observability    | Sentry (Next.js SDK)                                |
| Testing          | Vitest + Testing Library + jsdom                    |
| Linting          | ESLint 9 (eslint-config-next)                       |
| Reverse proxy    | Caddy (auto-HTTPS via Let's Encrypt)                |
| Containerization | Docker (multi-stage build, `output: "standalone"`)  |

The palette is **gold / bronze on dark** — no indigo, no blue. The book covers
are procedural (gradient + texture + spine + dog-ear) so they always render
on-brand even before an uploaded cover image exists.

---

## Getting started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.3 (or npm / pnpm — adjust commands accordingly)
- Node 22+
- (For prod) Docker + Docker Compose

### Install

```bash
bun install
```

### Configure env

```bash
cp .env.example .env
# Edit .env — at minimum set:
#   NEXTAUTH_SECRET  (run: openssl rand -base64 32)
#   NEXTAUTH_URL     (http://localhost:3000 for dev)
#   OWNER_EMAIL      (your email — auto-promoted to ADMIN on first login)
# Optional:
#   GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET  (for Google OAuth)
#   SIGNUP_MODE  (open | closed | invite)
```

### Set up the database

Dev uses SQLite (zero-config — Prisma creates `db/ketabyar.db` automatically):

```bash
bun run db:push     # Create tables from prisma/schema.prisma
bun run db:seed     # Optional: load sample books / authors
```

### Run the dev server

```bash
bun run dev
# → http://localhost:3000
```

The dev server uses Turbopack. Logs go to stdout (and `dev.log` if you use
`bun run dev:turbo`).

---

## Scripts

| Script                | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| `bun run dev`         | Start dev server on :3000 (Turbopack)                        |
| `bun run dev:webpack` | Start dev server with the legacy webpack bundler             |
| `bun run build`       | Production build (Turbopack) + copy static/public to standalone |
| `bun run start`       | Run the standalone prod server (after `build`)               |
| `bun run lint`        | ESLint                                                        |
| `bun run test`        | Vitest (single run)                                          |
| `bun run test:watch`  | Vitest in watch mode                                         |
| `bun run test:coverage` | Vitest with coverage                                       |
| `bun run db:push`     | Push `prisma/schema.prisma` to the DB (creates / alters tables) |
| `bun run db:generate` | Regenerate the Prisma client                                 |
| `bun run db:migrate`  | Create + apply a migration (dev only)                        |
| `bun run db:reset`    | Drop + recreate the DB (dev only — destructive)              |
| `bun run db:seed`     | Load sample data from `prisma/seed.ts`                       |
| `bun run analyze`     | Production build with `ANALYZE=true` (install @next/bundle-analyzer to get the report) |
| `bun run docker:build`| Build the Docker image (`ketab-yar:latest`)                  |
| `bun run docker:up`   | Start the full Docker Compose stack                          |
| `bun run docker:down` | Stop the stack                                                |
| `bun run docker:logs` | Tail the app container logs                                  |

---

## Environment variables

See [`.env.example`](.env.example) for the full list with descriptions. Summary:

| Variable                  | Required | Purpose                                        |
| ------------------------- | -------- | ---------------------------------------------- |
| `DATABASE_URL`            | yes      | SQLite path (dev) or Postgres URL (prod)       |
| `NEXTAUTH_SECRET`         | yes      | HMAC seed for session cookies                  |
| `NEXTAUTH_URL`            | yes      | Public app URL (callback / cookie scope)       |
| `GOOGLE_CLIENT_ID`        | no       | Google OAuth (skip to disable Google login)    |
| `GOOGLE_CLIENT_SECRET`    | no       | Google OAuth secret                            |
| `OWNER_EMAIL`             | no       | Auto-promoted to ADMIN on first login          |
| `ADMIN_EMAIL_WHITELIST`   | no       | Comma-separated admin emails                   |
| `SIGNUP_MODE`             | no       | `open` (default) / `closed` / `invite`         |
| `NEXT_PUBLIC_SITE_URL`    | no       | Canonical site URL for SEO / OG / JSON-LD      |
| `DOMAIN`                  | Docker   | Public domain (Caddy routing + ACME)           |
| `POSTGRES_USER`           | Docker   | Postgres user (defaults to `ky`)               |
| `POSTGRES_PASSWORD`       | Docker   | Postgres password                              |
| `POSTGRES_DB`             | Docker   | Postgres db name (defaults to `ketabyar`)      |
| `ACME_EMAIL`              | Docker   | Let's Encrypt notification email               |

---

## Deployment (Docker)

The repo ships with a multi-stage `Dockerfile` (build → standalone output →
runtime image), a `docker-compose.yml` orchestrating the app + Postgres + Caddy,
and a production `Caddyfile.prod` with auto-HTTPS.

### Quick start

```bash
cp .env.example .env
# Edit .env — set DOMAIN, NEXTAUTH_SECRET, POSTGRES_PASSWORD, GOOGLE_CLIENT_*

docker compose up -d --build
# → https://${DOMAIN}
```

### What the stack does

- **db** — PostgreSQL 16 (persistent volume, nightly `pg_dump` cron).
- **app** — Next.js standalone server (`node server.js`).
- **caddy** — Reverse proxy: terminates TLS (Let's Encrypt ACME for `${DOMAIN}`),
  forwards to the app, serves the `public/` static assets with long cache
  headers, and writes structured access logs.

### Logs & health checks

- `bun run docker:logs` — tail the app container.
- `curl https://${DOMAIN}/api/health/live` — liveness probe (always 200 if the
  process is up).
- `curl https://${DOMAIN}/api/health/ready` — readiness probe (checks DB
  connection).
- `curl https://${DOMAIN}/api/version` — current version / build env / timestamp
  (no auth, no cache).

---

## Project structure

```
.
├── prisma/
│   ├── schema.prisma         # Data model (single source of truth for DB)
│   ├── seed.ts               # Dev seed (sample books, authors, blog posts)
│   └── seed-prod.ts          # Prod seed (minimal — owner account, default settings)
├── public/
│   ├── sw.js                 # Pre-built service worker (Serwist runtime caching)
│   └── ...                   # Static assets (icons, fonts, OG defaults)
├── src/
│   ├── app/                  # Next.js App Router (pages + API routes)
│   │   ├── (auth)/           # Auth pages (signin, signup)
│   │   ├── (routes)/...      # Page routes (server components by default: authors, blog, books, dashboard, library, etc.)
│   │   ├── admin/            # Admin CMS (requireAdmin gated)
│   │   ├── api/              # Route handlers (REST API, ~47 routes)
│   │   ├── layout.tsx        # Root layout (HTML shell, providers, fonts)
│   │   ├── globals.css       # Tailwind v4 + theme tokens (gold/bronze palette)
│   │   └── sw.ts             # Service worker source (compiled to public/sw.js)
│   ├── components/
│   │   ├── ui/               # shadcn/ui primitives (Button, Card, Dialog, ...)
│   │   ├── books/            # Book cards, cover, reviews, favorites (Book-related components)
│   │   ├── reader/           # In-book reading experience (overlays, panels, dictionary — 18 files)
│   │   ├── dashboard/        # Per-user dashboard widgets (20 files)
│   │   ├── admin/            # Admin CMS (book / blog / author / quote editors)
│   │   ├── stats/            # Year-in-Review charts (recharts, code-split)
│   │   ├── goals/            # Reading-goal tracker (recharts, code-split)
│   │   ├── vocabulary/       # SRS vocabulary trainer (5 mini-games)
│   │   └── ...               # layout, home, library, search, etc.
│   ├── hooks/                # React hooks
│   │   ├── reader/           # Reader hooks (18 files)
│   │   └── ...               # use-tts, use-persian-locale, etc.
│   ├── lib/                  # Framework-agnostic utilities
│   │   ├── store/            # Zustand stores
│   │   ├── data/             # Data access layer (Prisma, with direct fetch at src/lib/data/index.ts)
│   │   ├── api/              # TanStack Query helpers
│   │   ├── ai/               # z-ai-web-dev-sdk wrapper (chat/translate/summarize)
│   │   ├── db.ts             # Prisma client singleton
│   │   ├── auth.ts           # NextAuth config (Google provider, admin callbacks)
│   │   ├── auth-session.ts   # requireUser / requireAdmin server guards
│   │   ├── session.ts        # HMAC-signed guest cookie + getEffectiveOwner()
│   │   ├── rate-limit.ts     # In-memory token-bucket rate limiter
│   │   ├── cache.ts          # In-memory TTL cache + in-flight dedup
│   │   ├── logger.ts         # Structured JSON logger (zero-dep)
│   │   ├── achievements.ts   # Achievement definitions + state computation
│   │   ├── gamification.ts   # XP / level / streak math
│   │   └── ...
│   ├── middleware.ts         # Per-request nonce + CSP header
│   └── instrumentation.ts    # Sentry server-side init
├── Dockerfile                # Multi-stage build (build → standalone runtime)
├── docker-compose.yml        # app + db + caddy stack
├── Caddyfile                 # Dev reverse proxy (HTTP only)
├── Caddyfile.prod            # Prod reverse proxy (auto-HTTPS, ACME)
├── next.config.ts            # Next.js config (security headers, images, Sentry)
├── sentry.{client,server,edge}.config.ts  # Sentry SDK configs
├── vitest.config.ts          # Test runner config (jsdom environment)
└── eslint.config.mjs         # Flat ESLint config
```

---

## Architecture

### Data Flow

#### Server Components
- Fetch data directly from Prisma via [index.ts](file:///d:/coding%20project/keyab_yar/src/lib/data/index.ts)
- Pass as props to client components
- Generate SEO metadata dynamically via `generateMetadata`

#### Client Components
- State management: Zustand stores in [store/](file:///d:/coding%20project/keyab_yar/src/lib/store)
- Server-state caching and synchronization: TanStack Query (`@tanstack/react-query`)
- UI-only local state: React `useState`

#### API Routes
- Authentication: NextAuth.js v4 (JWT strategy, Google OAuth)
- Input Validation: Zod schemas
- Rate limiting: In-memory token bucket in [rate-limit.ts](file:///d:/coding%20project/keyab_yar/src/lib/rate-limit.ts)
- Caching: In-memory TTL cache in [cache.ts](file:///d:/coding%20project/keyab_yar/src/lib/cache.ts)

### Security Model

- **Guest cookie**: HMAC-signed (`<id>.<sig>`) using `NEXTAUTH_SECRET`
- **User identity**: `userId` (signed in) OR `guestId` (anonymous) — never both
- **Schema constraints**: `@@unique([userId, ...])` + `@@unique([guestId, ...])` on all user-data models in the database to prevent collisions
- **Admin routes**: `requireAdmin()` returns 404 (hides the endpoint existence rather than returning a 403 Forbidden)
- **AI routes**: Rate-limited (per-IP + per-identity) to prevent abuse
- **CSP**: Per-request nonce via middleware in [middleware.ts](file:///d:/coding%20project/keyab_yar/src/middleware.ts)

### Key Decisions

1. **SQLite for dev, PostgreSQL for prod**: Keeps the local database schema portable and lightweight, while Docker containers handle Postgres in production.
2. **Zustand over Redux**: Simpler setup, selector-based, avoids wrapping the app in a `Provider` which preserves Server Components.
3. **TanStack Query over raw fetch**: Built-in caching, automatic retries, and background refetching.
4. **Procedural book covers**: Generates covers (gradient + texture + spine + dog-ear) dynamically, avoiding network image dependencies and keeping UI on-brand.
5. **Edge TTS (free) + Z-AI fallback**: Zero-cost, high-quality neural voices with robust AI failover.
6. **3-tier dictionary**: Leverages local database, free dictionary API, Wiktionary, and AI translation fallback.

---

## Conventions

- **Server components by default.** Only mark a component `'use client'` if it
  needs hooks, browser APIs, or interactivity. Heavy client components (charts,
  editors) are code-split with `next/dynamic` + `ssr: false` via a thin client
  "loader" wrapper (Next.js 16 forbids `ssr: false` inside Server Components).
- **All user-facing text in Persian (Farsi).** Use Persian numerals
  (`۱۰۲۴` not `1024`) — `toPersianNumber` in `lib/gamification.ts` does the
  conversion. UI strings live inline (no i18n library) — search for the
  Persian text to find the source.
- **Gold / bronze palette only.** No indigo / blue. Theme tokens are in
  `src/app/globals.css` (`--gold-500`, `--bronze-400`, etc.). The
  `variant="glow"` button is the primary CTA style.
- **API routes** use zod for input validation (`parseBody` from
  `lib/api-validate`), `rateLimit` from `lib/rate-limit`, and return Persian
  error messages via `lib/api-error` / `lib/error`. Never leak upstream
  error text to the client.
- **Caching.** `lib/cache.ts` is an in-memory TTL cache with in-flight
  promise deduplication (prevents thundering-herd on cold-cache API hits).
  Use `cache.wrap(key, fn, ttlMs)` for read-through caching.
- **Tests** live next to the code under `__tests__/` (e.g. `lib/__tests__/`).
  Run with `bun run test`. Don't write tests that hit the network — mock
  upstreams with `vi.fn()`.
- **Security headers** are set in `next.config.ts` (static) + `src/middleware.ts`
  (per-request CSP nonce with `strict-dynamic`). The nonce rotates per request
  via `crypto.randomUUID()`.

---

## License

Proprietary. All rights reserved.
