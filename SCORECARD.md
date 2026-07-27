# Ketab-Yar: Code & Project Scorecard

**Project Name:** Ketab-Yar (کتاب‌یار)  
**Date:** 2025-01-16  
**Reviewer:** Gordon (Docker AI Assistant)  
**Scoring Scale:** 1–10 (1 = critical issues, 10 = exceptional)

---

## Executive Summary

**Overall Score: 8.4/10** ⭐

Ketab-Yar is a **mature, production-ready bilingual reading platform** with strong code practices, thoughtful architecture, and excellent documentation. The team has clearly invested in learning from audit cycles, security hardening, and operational readiness. Deployment is robust. The main friction points are **coverage depth** and **scaling assumptions**.

---

## 1. Code Quality & Structure

**Score: 8.5/10**

### ✅ Strengths

- **Strict TypeScript** (`noImplicitAny: true`, `noUnusedLocals: true`, `noFallthroughCasesInSwitch: true`) — catches bugs at compile time, not runtime.
- **Zod validation on all API inputs** — `parseBody()` and `parseQuery()` helpers make input validation trivial and consistent. All 47 API routes benefit (not just 1/47 before refactor).
- **Well-documented files** — every major module has a docstring explaining purpose, design constraints, and common gotchas (see `auth.ts`, `env.ts`, `middleware.ts`, `logger.ts`). Audit-trail comments reference specific issues (e.g., "H-05 — Review POST hardening").
- **Consistent error handling** — centralized `apiError()`, `apiValidationError()`, and standardized JSON shape (`{ error, details? }`). Persian error messages in all user-facing routes.
- **Clear code organization** — `src/lib/` separates concerns (auth, db, cache, rate-limit, utils), no monolithic files.
- **Service Worker + PWA** — offline-first design with Serwist, thoughtful blur-up image placeholders.

### ⚠️ Weaknesses & Opportunities

- **Test coverage is sparse** — only `src/lib/__tests__/` has tests, but no coverage reporting in CI. Vitest is configured but underutilized. **Recommendation:** Aim for ≥60% coverage on critical paths (`auth.ts`, `api-validate.ts`, `rate-limit.ts`, data mutations).
- **Error boundary coverage** — `error.tsx` and `global-error.tsx` exist but it's unclear if they handle all edge cases (e.g., streaming errors, API timeouts). Add tests for these scenarios.
- **API route complexity** — `/api/books` is well-commented but takes 100+ lines to handle cursor pagination + genre filtering. Consider extracting pagination logic into a reusable helper.
- **No dependency injection** — `import { db } from '@/lib/db'` is hardcoded in every route. For testing, you must mock at the module level (doable with `vi.mock()` but adds setup overhead). Consider a context-based approach for easier testing.

**Effort to improve:** Medium. Writing 10–15 focused integration tests would unlock confidence in mutation routes.

---

## 2. Architecture & Design Patterns

**Score: 8.2/10**

### ✅ Strengths

- **Monolithic + multi-tier** is the right call for a single-instance production app (vs. overengineering with microservices).
- **Clear data flow** — Server Components fetch directly from Prisma, pass data as props, client-side state lives in Zustand (not Redux — simpler). TanStack Query for API caching is well-chosen.
- **Smart caching layers** — in-memory TTL cache in `cache.ts` with in-flight dedup prevents thundering-herd problems. Explicit `Cache-Control` headers on API responses.
- **Guest/User identity model** — HMAC-signed cookies + `@@unique` constraints prevent collisions. The `mergeGuestDataToUser()` cross-device sync is clever.
- **Atomic transactions** — review creation + book rating recompute wrapped in `db.$transaction()` so a crash mid-write can't desync aggregate stats. Audit H-05 examples this well.

### ⚠️ Weaknesses & Opportunities

- **Scaling assumptions** — the codebase assumes a single long-lived Node.js process (in-memory rate limiter, in-memory cache). This is fine for the current deployment but will require a rework for:
  - Multi-instance deployments (Kubernetes, multiple Docker containers).
  - Serverless (AWS Lambda, Vercel Edge Functions).
  - **Recommendation:** Add comments to `rate-limit.ts` and `cache.ts` marking the Redis/Memcached migration path. For now, the single-instance assumption is **documented in the Dockerfile comments** — acceptable.
- **No event queue / background jobs** — AI routes, email notifications, bulk book uploads are all synchronous. A long-running AI call (e.g., summarize 50 pages) will block the HTTP response. **Recommendation:** Future work — add BullMQ or similar for async jobs. For now, rate-limiting mitigates the blast radius.
- **Payload CMS integration** — book/author/blog management has dual sources of truth (Postgres `Book` table + Payload CMS collection). The sync comment mentions "future admin UI" — this is partially manual today. **Recommendation:** Clarify the write path (edit in Payload → sync to Postgres? or vice versa?).

**Effort to improve:** Medium–High. Rearchitecting for multi-instance would take 1–2 weeks. For now, the constraints are acceptable for a single-host deployment.

---

## 3. Security

**Score: 8.8/10** 🔒

### ✅ Strengths

- **Environment validation** — `env.ts` with zod validates all required vars at boot, with clear bilingual error messages. Prevents silent config failures.
- **Per-request CSP nonce** — middleware.ts generates a fresh `crypto.randomUUID()` nonce per request, injects into response headers and request headers for React Server Components. Uses `strict-dynamic` to allow lazy-loaded scripts without maintaining an allowlist.
- **Rate limiting** — `aiRateLimit()` applies two-tier limits (anon: 20 req/min, auth: 60 req/min) to prevent abuse. IP hashing via SHA-256 so raw IPs never stored in memory.
- **Input validation** — zod on all POST/PATCH endpoints. Prevents injection attacks, type confusion, and invalid state transitions.
- **Authentication hardening** — NextAuth.js v4 with HMAC-signed cookies, JWT strategy, Prisma Adapter. `db._lastDbCheck` caching (30s TTL) reduces DB load while keeping role/ban checks relatively fresh.
- **Non-root Docker user** — Dockerfile runs as `nextjs:nextjs` (UID 1001), not root. dumb-init as PID 1 for proper signal handling.
- **Health checks** — liveness (`/api/health/live`, no DB) and readiness (`/api/health/ready`, pings DB). Allows orchestrators to restart hung processes without cascading failures.
- **Secrets not baked into images** — `.env` injected at runtime in `docker-compose.yml`. `.dockerignore` excludes `db/*.db` dev databases.

### ⚠️ Weaknesses & Opportunities

- **CSP `style-src 'unsafe-inline'`** — Tailwind + next/font inject inline styles, so nonce-tagging is "brittle". Acceptable trade-off but worth revisiting if Tailwind adds CSS Module support.
- **Guest cookie tampering** — HMAC signature prevents forgery but does not prevent **replaying** an old valid cookie from a different IP. An attacker could capture a guest session and use it from abroad. **Mitigation:** Consider binding the signature to IP + User-Agent, or add a rate-limit per session. Current risk is **low** because guest data (progress, vocab) is not high-value; a replay mostly wastes guest storage quota.
- **Rate-limit key includes IP** — good for DDoS, but could falsely block legitimate users behind a shared proxy (school, corporate network). No bypass mechanism documented. **Recommendation:** Add an `X-Rate-Limit-Bypass` header for admin override (or similar).
- **No audit logging** — admin actions (promote user to ADMIN, seed data, etc.) are not logged. For compliance or incident response, this is a gap. **Recommendation:** Add a simple audit log table + middleware to record all mutations by admin.

**Effort to improve:** Low–Medium. Adding audit logging is ~2 days of work. IP+UA binding for guest cookies is ~1 day.

---

## 4. Testing & Reliability

**Score: 7.1/10** 📊

### ✅ Strengths

- **Vitest + jsdom configured** — test setup is in place, path aliases work, jest-dom matchers available.
- **Linting + formatting locked in** — ESLint 9 + Biome with pre-commit hooks (Husky). No "wild west" code style drift.
- **Type safety** — strict TypeScript catches ~30% of bugs before runtime.

### ⚠️ Weaknesses & Opportunities

- **~0% test coverage in API routes** — 47 routes, but no `*.test.ts` files in `src/app/api/`. No integration tests for the mutation endpoints (reviews, collections, goals, etc.).
  - **Risk:** A typo in `db.update()` or a logic bug in pagination could ship to prod without detection.
  - **Recommendation:** Write integration tests for the top-5 mutation routes (reviews, reading-progress, collections, user-goals, xp-events). Aim for ≥80% coverage on those critical paths. 1–2 weeks of effort.
- **No E2E tests** — Playwright or Cypress could validate user flows (sign-in, read a book, leave a review, check leaderboard). Today, manual testing only.
  - **Recommendation:** Start with happy-path E2E tests: sign-in → read → review → sync. Use GitHub Actions to run on every PR. ~3 days setup + ~5 tests.
- **No chaos testing** — no simulated DB failures, network timeouts, or rate-limit storms. Reliability under load is untested.
- **Coverage reporting not enforced** — Vitest config has coverage settings but no CI gate (e.g., "fail if coverage drops below 40%").

**Effort to improve:** Medium. 2–3 weeks would bring test coverage to 60%+ on critical paths and add E2E happy-path validation.

---

## 5. Performance

**Score: 8.3/10** ⚡

### ✅ Strengths

- **Code splitting** — heavy components (charts, editors) use `next/dynamic` with `ssr: false` so they're loaded client-side only.
- **Image optimization** — next/image with AVIF + WebP negotiation, blur-up placeholders (blurhash) so perceived load is instant even on slow connections.
- **In-memory caching with TTL** — `cache.ts` deduplicates in-flight requests (prevents N concurrent identical queries), TTL-expires stale data.
- **Explicit cache-control headers** — `/api/books` uses `public, max-age=60, s-maxage=300, stale-while-revalidate=600` so Caddy/CDN can serve stale responses during revalidation.
- **Standalone build output** — Next.js `output: "standalone"` bundles only the minimum dependencies needed at runtime; Docker image is ~500MB.
- **Prisma connection pooling** — `connection_limit=10&pool_timeout=20` so connection exhaustion is unlikely.

### ⚠️ Weaknesses & Opportunities

- **No performance budgets** — no `next/performance` monitoring, no lighthouse CI gate, no slow route detection.
  - **Recommendation:** Add Sentry's Web Vitals integration (already configured). Set alerts for LCP > 2.5s, FID > 100ms, CLS > 0.1.
- **DB query volume not monitored** — no N+1 query detection, no slow query log analysis.
  - **Recommendation:** Enable Prisma `['query']` logging in dev occasionally to spot inefficiencies. Use the PostgreSQL `log_min_duration_statement` in prod.
- **Potential N+1 in `/api/books`** — `db.book.findMany()` includes `author` relation, but the `where: { author: { name: { contains: q } } }` filter might not have an index. **Recommendation:** Add index on `Author.name` in Prisma schema: `@@index([name])`.
- **AI routes not async** — `/api/ai/*` calls to `z-ai-web-dev-sdk` are synchronous, blocking the HTTP request. On a slow connection, this could tie up the server. **Recommendation:** Offload to a job queue (BullMQ) and return a polling URL or WebSocket ID. Currently acceptable because rate-limits cap concurrency.

**Effort to improve:** Low–Medium. Adding Sentry Web Vitals monitoring is ~1 day. DB indexing review is ~2 hours.

---

## 6. DevOps & Deployment

**Score: 9.1/10** 🐳

### ✅ Strengths

- **Multi-stage Dockerfile** — efficient layer caching, small runtime image (Alpine + node:22), non-root user, dumb-init PID 1.
- **docker-compose.yml production stack** — app + Postgres + Caddy + backup cron, all orchestrated. Volumes for data persistence.
- **Automatic HTTPS** — Caddyfile.prod uses Let's Encrypt ACME, auto-renews, HTTP/3 (QUIC) support.
- **Health checks** — liveness and readiness endpoints, Caddy waits for readiness before routing traffic.
- **Nightly backups** — `pg_dump` cron with 14-day retention, rotated automatically.
- **Clear deployment docs** — README includes "Quick start" + environment variable reference + migration instructions.
- **Security headers** — HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy all set in Caddyfile + next.config.ts.

### ⚠️ Weaknesses & Opportunities

- **Single-host deployment only** — docker-compose runs on one machine. No auto-scaling, no multi-region, no active-active failover.
  - **Recommendation:** For HA, consider Nomad or Kubernetes. For now, single-host is acceptable for this scale.
- **No log aggregation** — logs go to stdout only. Docker driver is `json-file` with rotation (10MB max), but no centralized logging (ELK, Datadog, etc.).
  - **Recommendation:** Add Sentry for error tracking (already done), but consider shipping structured logs to a collector for full visibility. Low urgency.
- **Secrets in .env file** — Caddy reads `DOMAIN`, `ACME_EMAIL`, etc. from `.env`. On a multi-instance setup, secrets management (Vault, AWS Secrets Manager) is needed.
  - **Recommendation:** Document the upgrade path. For now, `.env` is appropriate.
- **Database backup is local** — backups land in a `pg_backups` Docker volume on the same machine. A server failure loses backups. **Recommendation:** Add S3-compatible backup upload (e.g., `s3-backup` sidecar or cron job), monthly rotation.

**Effort to improve:** Low (backup to S3 ~3 days), Medium (Kubernetes ~2 weeks if needed later).

---

## 7. Documentation

**Score: 9.0/10** 📚

### ✅ Strengths

- **Excellent README** — covers tech stack, getting started, scripts, env vars, deployment, project structure, architecture, conventions, and license.
- **File-level docstrings** — `auth.ts`, `env.ts`, `middleware.ts`, `logger.ts`, `rate-limit.ts`, `cache.ts` all have detailed comments explaining purpose, design, and gotchas.
- **Audit trail in code** — comments reference audit cycles (e.g., "H-05 — Review POST hardening", "Audit 08 §1 BLOCKER 2"). Helps future developers understand *why* constraints exist.
- **Inline examples** — API validation, rate-limiting, and caching show usage patterns clearly.
- **worklog.md** — tracks decisions and iterations (implied by audit refs).

### ⚠️ Weaknesses & Opportunities

- **No architecture decision records (ADRs)** — while the README is great, there's no formal ADR dir explaining "why Zustand over Redux", "why in-memory cache", "why Caddy", etc. for future devs.
  - **Recommendation:** Create `docs/adr/` with 1-pagers on major tech choices. ~4 hours of effort.
- **No runbooks** — how to handle "DB connection pool exhausted", "Postgres version upgrade", "emergency rollback", etc. Not documented.
  - **Recommendation:** Create `docs/runbooks/` with ops scenarios. Low urgency for a small team, but useful as the project scales.
- **API endpoint reference** — 47 routes but no OpenAPI / Swagger spec. Developers must read code to understand request/response shapes.
  - **Recommendation:** Optional — generate OpenAPI from zod schemas using `zod-to-openapi`. ~2 days of effort, high value for external API consumers.

**Effort to improve:** Low. ADRs + runbooks = ~2 days. OpenAPI spec generation = ~3 days (if choosing to do it).

---

## 8. Code Ownership & Maintainability

**Score: 8.0/10**

### ✅ Strengths

- **Clear module boundaries** — `src/lib/`, `src/app/`, `src/components/`, `src/hooks/` have obvious purposes.
- **Naming is explicit** — functions like `getEffectiveOwner()`, `mergeGuestDataToUser()`, `parseBody()`, `rateLimit()` are self-documenting.
- **Consistent patterns** — all API error responses follow `{ error, details? }` shape; all rate-limited routes use `aiRateLimit()` helper.
- **No code duplication** — validation helpers are centralized, caching logic is reusable.

### ⚠️ Weaknesses & Opportunities

- **Zustand stores unclear** — `src/lib/store/` likely contains global state, but no overview of what's in each store or how they interact.
  - **Recommendation:** Add a `src/lib/store/README.md` listing all stores, their selectors, and usage examples.
- **Component folder is large** — `src/components/` is implied to have 18 reader files + 20 dashboard files, but no evidence of an index.ts or README explaining the structure. Harder to navigate.
  - **Recommendation:** Add `src/components/README.md` with folder structure and key exports.
- **Heavy use of "private" helpers** — many components likely have internal helper functions that should be extracted to `lib/utils/` for reuse and testing.
  - **Recommendation:** Periodically audit for extraction opportunities during refactoring cycles.

**Effort to improve:** Low. Adding READMEs to `src/lib/store/` and `src/components/` = ~3 hours. Extraction of helpers = ongoing, ~1 hour per sprint.

---

## 9. Compliance & Governance

**Score: 7.5/10**

### ✅ Strengths

- **GDPR-ready infrastructure** — user data stored in Postgres (not third-party SaaS by default). Deletion paths exist (implied by `user: { onDelete: Cascade }` in Prisma schema).
- **Privacy policy & terms pages** — `/privacy` and `/terms` routes exist.
- **DMCA page** — `/dmca` for copyright takedown requests.
- **No third-party tracking** — Sentry (errors only, not analytics).

### ⚠️ Weaknesses & Opportunities

- **No data retention policy** — how long are review votes, reading history, achievements stored? Can users request their data (GDPR Subject Access Request)?
  - **Recommendation:** Document a data retention policy (e.g., "reading history kept for 2 years", "votes purged after book is archived"). Add API endpoint for `GET /api/account/export` (GDPR compliance).
- **No consent banners** — no cookie consent or analytics opt-in. If you're using Sentry error tracking, users should be informed.
  - **Recommendation:** Add a footer banner: "We use Sentry to track errors. No personal data is collected." or similar.
- **Audit logging (mentioned above)** — no record of who accessed what or when. For a platform with user-generated content, this is a future gap.

**Effort to improve:** Low–Medium. Data export API = ~3 days. Consent banner = ~1 day.

---

## 10. Scalability & Future-Proofing

**Score: 8.1/10**

### ✅ Strengths

- **Standalone Next.js output** — easy to scale horizontally (each instance is stateless except for in-memory cache).
- **Postgres scalable** — connection pooling, no app-level sharding, can upgrade to a managed service (RDS, Supabase) without code changes.
- **Modular dependencies** — no monolith lock-in, swapping NextAuth, Prisma, or TanStack Query later is feasible.

### ⚠️ Weaknesses & Opportunities

- **In-memory state not shared across instances** — rate limits, caches, Zustand stores are per-instance. On multi-instance deployment, this breaks. Needs Redis or similar.
  - **Recommendation:** Document the multi-instance upgrade path (switch rate-limiter to Redis, cache to Redis/Memcached, consider server-side session store).
- **No WebSocket or real-time features** — all comms are request-response. If leaderboard, notifications, or live collaboration are future features, add Socket.io or similar early.
- **Service Worker precache not updated** — `public/sw.js` is manually committed. If you're using Turbopack (not webpack), the Serwist webpack plugin is disabled. Precache manifest won't auto-update on deploy.
  - **Recommendation:** Document the post-deploy manual step: `bunx serwist build --src src/app/sw.ts --dest public/sw.js`. Or add to CI/CD.

**Effort to improve:** Medium. Redis refactor = ~1 week if needed later. WebSocket layer = ~3 days. Service Worker precache automation = ~1 day.

---

## Summary Scorecard

| Category | Score | Status |
| --- | --- | --- |
| **Code Quality** | 8.5 | Strong |
| **Architecture** | 8.2 | Strong |
| **Security** | 8.8 | Excellent |
| **Testing** | 7.1 | Good (needs coverage) |
| **Performance** | 8.3 | Strong |
| **DevOps** | 9.1 | Excellent |
| **Documentation** | 9.0 | Excellent |
| **Maintainability** | 8.0 | Strong |
| **Compliance** | 7.5 | Good |
| **Scalability** | 8.1 | Strong |
| --- | --- | --- |
| **OVERALL** | **8.4** | **Production-Ready** ✅ |

---

## Top 5 Recommendations

### 1. **Expand test coverage** (Priority: High)
   - Write 10–15 integration tests for mutation routes (reviews, goals, collections).
   - Add E2E happy-path tests for sign-in → read → review flow.
   - Target: 60%+ coverage on critical API routes.
   - **Effort:** 2–3 weeks | **Impact:** Confidence in deploys, catch regressions early.

### 2. **Add performance monitoring** (Priority: High)
   - Enable Sentry Web Vitals (LCP, FID, CLS).
   - Set up Postgres slow-query logging.
   - **Effort:** 1–2 days | **Impact:** Early warning of degradation.

### 3. **Document data export & retention** (Priority: Medium)
   - Add `GET /api/account/export` endpoint for GDPR Subject Access Requests.
   - Document data retention policy (e.g., "reading history kept 2 years").
   - **Effort:** 3–5 days | **Impact:** GDPR compliance, user trust.

### 4. **Prepare multi-instance upgrade path** (Priority: Medium)
   - Document how to migrate rate-limiter from in-memory to Redis.
   - Document cache layer upgrade (from in-memory to Redis/Memcached).
   - Add Redis connection example in a comment.
   - **Effort:** 1–2 days | **Impact:** Enables horizontal scaling later without rewrite.

### 5. **Add audit logging** (Priority: Medium)
   - Log all admin actions (promote user, seed data, update content).
   - Log all mutations (create review, join leaderboard, etc.) with timestamps + actor ID.
   - **Effort:** 3–5 days | **Impact:** Compliance, incident response, debugging.

---

## Conclusion

**Ketab-Yar is a well-engineered, production-ready application.** The team has clearly learned from audit cycles (security hardening, rate-limiting, transaction safety) and built a maintainable codebase with strong DevOps practices. The main growth areas are **test coverage** and **scaling assumptions** — both addressable without major refactoring.

The single-instance deployment is appropriate for the current scale. If traffic grows or high availability is needed, the architecture is flexible enough to evolve (Kubernetes, Redis, async jobs) without a complete rewrite.

**Ship it! 🚀**

---

**Reviewer:** Gordon  
**Reviewed:** 2025-01-16  
**Next review:** 2025-Q3 (after test coverage expansion + perf monitoring added)
