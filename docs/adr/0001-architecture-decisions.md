# ADR 0001: Core Architecture & Framework Choices

- **Status**: Approved
- **Date**: 2026-07-28
- **Context**: Ketab-Yar is a production bilingual reading platform serving readers with fast page loading, offline PWA access, and AI dictionary tools.

## Key Technical Decisions

### 1. Framework: Next.js App Router (Standalone Node)
- **Decision**: Single-monolith deployment using Next.js App Router and Docker Compose.
- **Rationale**: Simplifies operations, removes microservice network overhead, and enables seamless Server Side Rendering (SSR) alongside dynamic API routes.

### 2. Database: PostgreSQL with Prisma ORM
- **Decision**: Primary relational database using PostgreSQL, managed through Prisma ORM schemas.
- **Rationale**: Strict type safety, auto-generated migrations, connection pooling support, and relational integrity across users, books, chapters, and reviews.

### 3. Client State: Zustand over Redux
- **Decision**: Zustand for reader settings, bookmarks, and vocabulary state.
- **Rationale**: Minimal boilerplate, unopinionated persistence middleware, zero context-provider wrapping needed for state access.

### 4. Reverse Proxy & Security: Caddy Server
- **Decision**: Caddy frontend proxy handling SSL termination via Let's Encrypt, HTTP/3, and automatic security headers.
- **Rationale**: Zero-config HTTPS certificate management and lightweight resource utilization.
