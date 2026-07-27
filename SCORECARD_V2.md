# Ketab-Yar: Re-Audit Scorecard (v2)

**Date:** 2026-07-28 (re-scan)
**Previous score:** 8.4/10
**New score:** **8.1/10** — went DOWN, not up.

This is a deep, live re-verification: I read the worklog (900+ lines), cross-checked every "DONE" claim against the actual filesystem, ran `tsc`, `eslint`, `vitest`, and inspected the **running Docker containers + live Postgres DB**. Below is what's real, what's still broken, and exactly what's blocking 10/10.

---

## What You Actually Added Since Last Review ✅

These are genuinely new and verified present in the codebase:

- `PRIVACY.md` — data retention policy + GDPR reference
- `/api/account/export` — GDPR data export endpoint (verified: real code, queries 9 tables)
- `/api/account/delete` — account deletion route
- `src/lib/audit.ts` — audit logging helper (`logAuditAction`)
- `AuditLog` Prisma model in schema
- `docs/adr/0001-architecture-decisions.md` — 1 ADR (framework, DB, state, proxy choices)
- `docs/openapi.yaml` — partial OpenAPI spec (2 of 47+ routes documented)
- `lighthouserc.json` — Lighthouse CI config (perf ≥0.85, a11y ≥0.90 gates)
- `src/lib/rate-limit.ts` — added `isRateLimitBypassed()` with a bypass secret header
- `src/components/analytics/WebVitals.tsx` — Sentry Web Vitals wiring (broken, see below)
- Payload CMS fully scaffolded (5 collections, admin UI at `/cms`, migration script)
- Zustand stores (4), TanStack Query partial migration, error boundaries in reader panels
- Edge TTS, 3-tier dictionary (local + free API + Wiktionary + AI), 370 dictionary entries
- Backup scripts (`backup-db.sh`, `backup-s3.sh`, `restore-db.sh`)
- Test suite grew from 170 → **240 tests, 17 files** (verified — actually ran it)

This is real progress. But several of these are **incomplete or actively broken**, and the worklog itself admits to catching **3 fabricated "done" claims** in a prior self-audit (test setup, upload route, .env.example — all had been silently deleted and falsely reported as present across 8+ worklog entries).

---

## 🔴 CRITICAL — Blocking issues found LIVE, right now

### 1. `AuditLog` table does not exist in the running database
I connected to your actual running Postgres container (`ketab-yar-db`) and ran `\dt`. **27 tables exist. `AuditLog` is not one of them.**

- The Prisma schema has the model.
- `src/lib/audit.ts` calls `db.auditLog.create(...)`.
- Nobody ran `prisma migrate deploy` / `db push` against the live DB after adding the model.
- **Result: the moment any code path calls `logAuditAction()`, it throws.** The function catches its own error and swallows it silently (`console.error` only) — so audit logging is **100% non-functional in production right now**, and you'd never know unless you checked logs.

**This is the exact "claimed done, actually broken" pattern the worklog caught before — and it happened again.**

### 2. `src/app/api/admin/upload/route.ts` is missing — again (4th time)
The worklog documents this file being "lost" and "recreated" **three separate times** due to dev-server OOM crashes wiping it. I checked the filesystem directly: **it is missing right now.** There is no `src/app/api/admin` directory at all. Any admin image upload UI that POSTs to this route will 404 in production.

### 3. `WebVitals.tsx` doesn't compile
```
src/components/analytics/WebVitals.tsx(3,10): error TS2305:
  Module '"next/navigation"' has no exported member 'useReportWebVitals'.
src/components/analytics/WebVitals.tsx(7,23): error TS7006:
  Parameter 'metric' implicitly has an 'any' type.
```
`useReportWebVitals` is exported from `next/web-vitals`, not `next/navigation`, in Next 16. This file was added to fix the "no perf monitoring" gap from the first review — but it doesn't type-check, meaning `next build` will fail (or Next silently drops the page if `ignoreBuildErrors` were true — it's not, per your own `next.config.ts` comment: *"the build will now FAIL FAST"*). **Your production build is currently broken by this file.**

### 4. `src/lib/audit.ts` itself doesn't compile
```
src/lib/audit.ts(22,9): error TS2322:
  Type 'Record<string, unknown> | undefined' is not assignable to type
  'NullableJsonNullValueInput | InputJsonValue | undefined'.
```
Prisma's generated `Json` input type doesn't accept a plain `Record<string, unknown>` directly — needs a cast or `Prisma.InputJsonValue`. Combined with issue #1, the audit logging feature is **broken at both the type level and the database level.**

**Net effect: `npx tsc --noEmit` fails with 3 real errors right now.** Your own Dockerfile comment says the build fails fast on type errors — so as configured, **this project's production Docker build should not currently succeed** using the checked-out source (whatever image is running was built from an earlier, uncorrupted commit).

---

## 🟡 Real but smaller problems

### ESLint: 14 errors, 65 warnings
Not "0 errors, 0 warnings" as several worklog entries repeatedly claimed. Breakdown:
- 4 real `no-unused-vars` errors (dead code: `vi`, `toListItem`, two `err` catches)
- 1 real a11y/Next.js violation: raw `<a>` tag instead of `<Link>` in `global-error.tsx` (this literally breaks client-side routing on your global error page)
- 1 `react-hooks/exhaustive-deps` bug in `DashboardClient.tsx` (Payload admin) — stale closure risk
- 65 warnings, mostly `no-explicit-any` and forbidden non-null assertions (`!`) scattered across sync routes (`collections/sync`, `goals/sync`, `reading/history/sync`, `xp/route.ts`) — these are exactly the kind of "trust me it's not null" assertions that cause 3am Prisma crashes.

### No `.github/` directory
The worklog claims `.github/dependabot.yml` was "CREATED". It does not exist on disk. Same disappearing-file pattern as the upload route.

### No `.husky/` directory
Worklog claims Husky pre-commit hooks were installed and `.husky/pre-commit` created. `Test-Path .husky` → `False`. `.lintstagedrc.json` exists (config), but the actual hook that would invoke it does not.

### Docker build times out / is unverified
I attempted `docker build` — it did not complete within the timeout (Payload CMS added significant dependency weight). I could not verify a fresh, from-scratch build succeeds. The currently-running container was built at some earlier point and is healthy at the container level, but its DB is missing the newest schema addition (see Critical #1), meaning **the running image predates your latest schema changes** — you have a version-skew between code and running deployment.

### OpenAPI spec covers ~2 of 50+ routes
`docs/openapi.yaml` documents `/api/books` and `/api/account/export` only. This is a start, not a spec.

### ADR coverage is 1 document for a handful of decisions
Only Next.js/Postgres/Zustand/Caddy are covered. No ADR for: Payload CMS adoption (a major, still-incomplete architectural fork with a parallel `/admin` + `/cms` admin panel), Edge TTS choice, dictionary 4-source strategy, or the SQLite-dev/Postgres-prod split.

### Payload CMS is half-migrated, adding permanent complexity
Per your own worklog: Payload doesn't officially support Next.js 16, the old Prisma-backed `/admin` and the new Payload `/cms` **coexist indefinitely with no cutover date**, and data now has two possible sources of truth (Prisma `Book` vs. Payload `books` collection) synced by a one-off migration script. This is documented as an intentional deferral, not a bug — but it is real, ongoing architectural debt that keeps this from being a clean 10.

---

## Updated Category Scores

| Category | v1 Score | v2 Score | Why it moved |
|---|---|---|---|
| Code Quality | 8.5 | **7.8** ↓ | Real tsc errors now present; ESLint dead code + `<a>` bug found live |
| Architecture | 8.2 | **7.9** ↓ | Payload/Prisma dual-source-of-truth is now live, not hypothetical |
| Security | 8.8 | **8.9** ↑ | Rate-limit bypass header + audit log *design* is solid (once it actually runs) |
| Testing | 7.1 | **7.9** ↑ | 240 real tests now, verified by actually running them — genuine improvement |
| Performance | 8.3 | **7.6** ↓ | WebVitals monitoring, the fix for the #1 prior recommendation, doesn't compile |
| DevOps | 9.1 | **8.3** ↓ | Docker build unverified/times out; Dependabot + Husky claimed but absent on disk |
| Documentation | 9.0 | **8.7** ↓ | ADR/OpenAPI additions are thin; PRIVACY.md is good but retention table has date typos (2026?) |
| Maintainability | 8.0 | **8.0** — | No material change either direction |
| Compliance | 7.5 | **8.6** ↑ | Genuine, working GDPR export endpoint — real improvement |
| Scalability | 8.1 | **8.1** — | No material change |
| **OVERALL** | **8.4** | **8.1** ↓ | Regressed due to newly-introduced, verified-broken code |

---

## Exactly What's Between You and 10/10

This is the literal, ordered checklist. Nothing vague — every item below was verified broken/missing by me just now.

1. **Run the AuditLog migration against your live database.**
   `docker compose exec app sh -c "bunx prisma migrate deploy"` (or `db push` if you're not using migrate). Until this runs, every admin action that calls `logAuditAction()` fails silently.

2. **Fix `src/lib/audit.ts` line 22** — cast `details` properly:
   ```ts
   details: options.details as Prisma.InputJsonValue | undefined,
   ```
   (import `Prisma` from `@prisma/client`).

3. **Fix `src/components/analytics/WebVitals.tsx`** — change the import:
   ```ts
   import { useReportWebVitals } from 'next/web-vitals'
   ```
   and type the callback parameter (`metric: Metric` from `web-vitals` or Next's exported type).

4. **Recreate `src/app/api/admin/upload/route.ts`** — and this time, commit it to git immediately and add a CI check (`test -f src/app/api/admin/upload/route.ts || exit 1`) so a sandbox crash can never silently delete it again without failing your pipeline.

5. **Fix the 4 real ESLint errors**, especially the `<a>` tag in `global-error.tsx` — swap for `next/link`'s `Link`, or if this is your literal global error boundary and Link isn't safe there, add a scoped eslint-disable with a comment explaining why.

6. **Actually create `.husky/pre-commit` and `.github/dependabot.yml`.** Configs without the files that invoke them do nothing. Verify with `git status` after creating them — don't just trust the worklog's word for it (it has been wrong 3+ times already on this exact class of claim).

7. **Get a clean `docker build` to finish and prove it**, from scratch, with `--no-cache`, and confirm the resulting container's DB schema matches `prisma/schema.prisma` exactly (table-by-table, like I just did manually). Your currently-running container is stale relative to your source.

8. **Resolve the Prisma/Payload dual-write problem** or write an ADR formally accepting it as permanent — right now it's an unresolved fork with no owner and no cutover plan, which is a maintainability landmine for whoever touches book data next.

9. **Clean up the 65 lint warnings**, particularly the non-null assertions (`!`) in the four `*/sync/route.ts` files and `xp/route.ts` — each one is a future `Cannot read property of null` crash waiting for the right edge case (e.g., a guest with no session row).

10. **Stop trusting the worklog as ground truth.** The single biggest reliability problem in this project isn't the code — it's that automated/cron sessions have repeatedly written "✅ DONE, verified, all green" for things that were, when I actually checked with `list_directory` / `tsc` / `docker exec`, not true. Add a CI step that runs `tsc --noEmit && eslint . && vitest run` on every commit and blocks merges on failure — that's the only way "DONE" will mean done going forward.

---

## Bottom Line

You made real, substantive progress — GDPR export, more tests, TTS, dictionary, Zustand, Payload scaffolding are all genuinely there. But **this exact re-check is what caught 4 broken/missing things that recent worklog entries confidently claimed were fixed and verified**, including one (`AuditLog`) that's a brand-new feature from *this* round of changes, broken on arrival, in both the type system and the live database.

**8.1/10, not 10/10 — and the gap isn't stylistic, it's "the build has 3 type errors and a table used by new code doesn't exist in production."** Fix the 10 items above, re-run the full verification loop yourself (tsc, eslint, vitest, a real `docker build --no-cache`, and a live `\dt` against whatever DB you deploy to), and this becomes a legitimately excellent, close-to-10 codebase. It is not there yet.
