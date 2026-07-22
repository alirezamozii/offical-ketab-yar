# ─────────────────────────────────────────────────────────────────────────────
# Ketab-Yar — production Dockerfile
#
# Multi-stage build:
#   1. deps   — install bun + production dependencies (cached layer)
#   2. builder — copy source, prisma generate, next build (standalone output)
#   3. runner  — minimal node:22-alpine image, non-root, dumb-init PID 1
#
# Key safety properties:
#   • The dev SQLite DB is excluded via .dockerignore — never ships to prod.
#   • We do NOT run `prisma db push` / `prisma migrate` here — the operator
#     runs migrations against the production Postgres DB explicitly (see
#     docker-compose.yml: `db:push` is opt-in via a one-shot compose run).
#   • The runtime runs as non-root user `nextjs` (UID 1001).
#   • `dumb-init` reaps zombies and forwards signals (Ctrl-C, SIGTERM).
#   • HEALTHCHECK hits /api/health/live so Docker restarts hung processes.
#   • openssl is installed because Prisma's query engine binary on Alpine
#     links against libssl/libcrypto. Without it you'll get a cryptic
#     `Error: Cannot find module @prisma/client/runtime/library` or
#     `libssl.so.3: cannot open shared object file` at first DB call.
#
# Build:
#   docker build -t ketab-yar:latest .
#
# Run (standalone, with Postgres URL):
#   docker run -p 3000:3000 \
#     -e DATABASE_URL='postgresql://ky:ky@db:5432/ketabyar?schema=public' \
#     -e NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
#     -e NEXTAUTH_URL='https://your-domain.tld' \
#     ketab-yar:latest
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: deps ────────────────────────────────────────────────────────────
FROM oven/bun:1-alpine AS deps

# Bun ships with its own runtime; we only need openssl for prisma generate
# in the builder stage, but installing it here keeps the lockfile layer
# reproducible across machines.
RUN apk add --no-cache openssl

WORKDIR /app

# Copy only manifests first → cache hits when source changes.
COPY package.json bun.lock* ./
COPY prisma ./prisma

# Install ALL deps (dev included) — the builder needs prisma, typescript,
# eslint, etc. The runner stage will use a clean production install.
RUN bun install --frozen-lockfile

# ── Stage 2: builder ─────────────────────────────────────────────────────────
FROM oven/bun:1-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Bring over installed deps from stage 1.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Copy the rest of the source. (.dockerignore filters out db/*.db, .next,
# node_modules, skills, upload, audits, ketab-yar-clone, etc.)
COPY . .

# Disable Next.js telemetry and set build-time placeholders for env validation
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_STANDALONE="true" \
    DATABASE_URL="postgresql://ky:dummy@127.0.0.1:5432/ketabyar?schema=public" \
    NEXTAUTH_SECRET="development_secret_key_at_least_16_characters_long" \
    NEXTAUTH_URL="http://127.0.0.1:3000" \
    PAYLOAD_SECRET="development_secret_key_at_least_16_characters_long" \
    NODE_OPTIONS="--max-old-space-size=2048"

# Generate the Prisma client (writes to node_modules/.prisma + @prisma/client).
# This must run before `next build` so the standalone bundler can trace the
# generated client into the output.
RUN bun run db:generate

# Build the standalone Next.js app.
RUN bun run build

# ── Stage 3: runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

# openssl  → Prisma's query engine links against libcrypto/libssl.
# dumb-init → tiny PID-1 init that reaps zombies and forwards signals.
# tini is also acceptable; we use dumb-init because it's smaller and the
# `dumb-init node server.js` invocation reads more clearly.
RUN apk add --no-cache openssl dumb-init

# Non-root user. node:22-alpine ships with `node` (UID 1000); we add a
# dedicated `nextjs` user (UID 1001) so the process never runs as root
# and cannot write to system paths even if a vuln is exploited.
RUN addgroup --system --gid 1001 nextjs \
 && adduser  --system --uid 1001 --ingroup nextjs nextjs

WORKDIR /app

# Mark the app as production.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Copy the standalone server (already includes a minimal node_modules tree).
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
# Copy static assets (.next/static) and public/ — Next.js standalone does
# NOT bundle these, they must be served from disk.
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/public ./public

# Copy the Prisma schema + generated client so migrations / queries work
# at runtime. The standalone bundler usually traces @prisma/client into
# .next/standalone/node_modules, but we copy node_modules/.prisma
# explicitly in case the trace missed it (it sometimes does for native
# binaries like the Prisma query engine on Alpine).
COPY --from=builder --chown=nextjs:nextjs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nextjs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nextjs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

# dumb-init as PID 1 → proper signal handling + zombie reaping.
CMD ["dumb-init", "node", "server.js"]

# Liveness probe — Docker restarts the container if this fails 3× in a row.
# We hit /api/health/live (process-alive check, no DB call) so a transient
# DB blip doesn't cause a restart loop. Use /api/health/ready for the
# orchestrator-level readiness gate (see docker-compose.yml healthcheck
# on the `app` service).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health/live || exit 1
