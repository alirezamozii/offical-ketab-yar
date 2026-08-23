# AGENT INSTRUCTIONS & REPOSITORY CONVENTIONS

> **IMPORTANT:** Read `NEXT16_OPTIMIZATION_MASTER.md` before making architectural, caching, routing, or performance changes.

## 🛠️ Tech Stack & Architecture
- **Framework:** Next.js 16.1 (App Router) + React 19
- **Styling:** Tailwind CSS v4 + Radix UI + Lucide React + Lenis
- **Database & CMS:** Prisma ORM 6.11 + Payload CMS 3.86 + PostgreSQL
- **State & Data:** TanStack Query v5 + Zustand 5
- **Performance Guidelines:** See `NEXT16_OPTIMIZATION_MASTER.md` in root.

## ⚡ Key Guidelines
1. **Server Components by Default:** Keep page wrappers server-rendered. Push `"use client"` down to small interactive leaf components.
2. **Next.js 16 Async Requests:** Always `await` request context props (`params`, `searchParams`, `cookies()`, `headers()`).
3. **Database Selection:** Always use explicit Prisma `select` clauses or restricted Payload query `depth` to minimize server memory and network payload overhead.
4. **Hardware Acceleration:** Restrict client-side UI animations to `transform` and `opacity` to maintain 60fps on low-end mobile devices.
5. **VPS Memory Footprint:** Maintain standalone build mode configurations (`NEXT_STANDALONE=true`) and optimize package imports.
