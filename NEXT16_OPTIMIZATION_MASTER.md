# ⚡ NEXT.JS 16 PERFORMANCE & OPTIMIZATION MASTER GUIDE
**Target:** 100 Lighthouse Score, Sub-Second LCP, Low INP (<50ms), 0 CLS, Low-RAM Server Footprint (<300MB), & 60fps on Low-End Mobile Devices.

> **AGENT INSTRUCTION:** You are operating as a Senior Next.js 16 & React 19 Performance Architect. You must audit, refactor, and write code strictly adhering to the architectural rules, caching primitives, database protocols, and rendering standards defined in this document. Always retrieve version-matched documentation when necessary. Never guess Next.js 16 APIs. Optimize aggressively for minimal main-thread execution on client devices and minimal RAM/CPU footprint on low-budget VPS servers.

---

## 🏗️ SECTION 1: AI-NATIVE WORKFLOW & ENVIRONMENT SETUP

### 1.1 The `AGENTS.md` Rule
- **Rule:** Always read version-matched documentation located locally at `node_modules/next/dist/docs/` or framework definitions before creating complex caching, routing, or rendering logic.
- **Action:** Maintain a root `AGENTS.md` specifying exact project conventions, package versions (Next 16, React 19, Tailwind v4, Prisma, Payload CMS), and architectural patterns.

### 1.2 Enable Browser Log Forwarding (Next.js 16+)
- **Action:** Ensure `next.config.ts` pipes client browser logs to the server terminal in development so terminal-based AI agents and developers instantly capture hydration errors, uncaught promise rejections, and performance warnings.
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};
```

---

## 💻 SECTION 2: LOW-BUDGET VPS & SERVER INFRASTRUCTURE

*Optimizations to run Next.js 16 flawlessly on low-cost $5/mo VPS instances (512MB - 1GB RAM, single vCPU).*

### 2.1 Next.js Standalone Output Mode
- **The Issue:** Default `next start` retains all `node_modules` dependencies in memory, consuming 500MB - 1GB+ RAM at startup.
- **The Fix:** Enable `output: 'standalone'` in `next.config.ts`. Next.js traces dependency trees and creates a self-contained, heavily pruned Node.js server footprint (~80-150MB RAM).
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: process.env.NEXT_STANDALONE === "true" ? "standalone" : undefined,
  productionBrowserSourceMaps: false, // Saves 20-30% memory during build and runtime
  outputFileTracingExcludes: {
    '*': ['node:*', 'node:inspector', 'node:crypto', '**/@swc/core*'],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "date-fns",
      "recharts",
      "@radix-ui/react-avatar",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-dialog",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@tanstack/react-query",
    ],
  },
};
```

### 2.2 Node & Bun Runtime Memory Limits
- **The Fix:** Set `NODE_OPTIONS="--max-old-space-size=512"` in environment configurations or systemd unit files to trigger garbage collection proactively before VPS OOM (Out Of Memory) killer strikes.

### 2.3 Offload VPS Traffic with Edge CDN & Reverse Proxy (Caddy/Cloudflare)
- **The Fix:** Put a Cloudflare Proxy or Caddy in front of the Next.js server. Use `s-maxage` and `stale-while-revalidate` HTTP headers on public routes so 90%+ of GET requests are served directly from edge caches without hitting the VPS process.

---

## 📱 SECTION 3: LOW-END MOBILE UX & DOM OPTIMIZATION

*Optimizations to ensure smooth 60fps scrolling, minimal main-thread blocking, and battery savings on low-end smartphones.*

### 3.1 CSS Hardware Acceleration & Animation Hygiene
- **The Issue:** Animating `height`, `width`, `top`, or `margin` forces low-end mobile CPUs to trigger layout recalculation and paint on every frame, producing heavy lag.
- **The Fix:** ONLY animate `transform` (e.g. `translate3d`, `scale`) and `opacity`. These run directly on the GPU compositor thread.
- **Framer Motion:** Wrap non-critical Framer Motion code with `<LazyMotion features={domAnimation}>` so heavy layout calculation bundles load on-demand.

### 3.2 List Virtualization & DOM Pruning
- **The Issue:** Rendering 100+ complex card components creates thousands of DOM nodes. Older mobile browsers freeze while scrolling or parsing HTML.
- **The Fix:** Virtualize long lists with `@tanstack/react-virtual` or `react-window`. Only render DOM nodes currently inside the viewport (+ a small buffer).

### 3.3 CSS `content-visibility: auto` (Off-Screen Rendering Pruning)
- **Action:** Apply `content-visibility: auto; contain-intrinsic-size: 1px 500px;` to heavy sections below the fold. The browser skips rendering off-screen DOM trees entirely until the user scrolls to them.

---

## ⚛️ SECTION 4: COMPONENT ARCHITECTURE & THE `"use client"` QUARANTINE

### 4.1 Push Client Components to the Leaves
- **❌ BAD:** Adding `"use client"` at the top of `app/page.tsx` or layout wrappers because a single interactive element (like a modal trigger or theme toggle) needs client state. This sends the entire page JS tree to the client bundle.
- **✅ GOOD:** Keep page components as Server Components. Extract interactive sub-elements into small single-purpose client components (`<InteractiveButton />`).

### 4.2 Interleaving Server & Client Components (`children` pattern)
- **Rule:** When a Client Component wrapper (e.g. state provider, animations container) wraps large layout areas, pass inner Server Components as `children` or JSX props:
```tsx
// ClientWrapper.tsx ("use client")
export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  return <div onClick={() => setActive(!active)}>{children}</div>;
}

// ServerPage.tsx (Server Component)
export default function Page() {
  return (
    <ClientWrapper>
      <AsyncHeavyServerDataComponent />
    </ClientWrapper>
  );
}
```

---

## 🚀 SECTION 5: ROUTING, STREAMING, & REACT 19 / NEXT.JS 16 APIS

### 5.1 Async Request APIs (Next.js 16 Standard)
- **Rule:** In Next.js 16, request-specific context objects (`params`, `searchParams`, `cookies()`, `headers()`) are Promises and MUST be awaited.
```tsx
// ✅ Correct Next.js 16 Page Signature
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ query?: string }>;
}) {
  const { id } = await params;
  const { query } = await searchParams;
  return <DetailComponent id={id} query={query} />;
}
```

### 5.2 Mandatory `loading.tsx` & Granular `<Suspense>` Boundaries
- **The Issue:** `await db.query()` in a server page without streaming delays TTFB (Time To First Byte), causing browser white screens.
- **The Fix:** Place a `loading.tsx` skeleton boundary in route segments. For page components with multiple data fetches, wrap individual slow components in `<Suspense fallback={<Skeleton />}>` so critical shell HTML streams instantly.

### 5.3 React 19 Actions & Optimistic UI
- **Action:** Replace legacy API route mutation calls with Server Actions (`"use server"`).
- **Client Form Handling:** Use `useActionState` for form submission pending states and `useOptimistic` for instant UI updates before server confirmation.

---

## 💾 SECTION 6: DATABASE LATENCY, PRISMA, & PAYLOAD CMS OPTIMIZATION

### 6.1 Database Connection Pooling
- **The Issue:** Serverless/Edge requests opening raw TCP connections to PostgreSQL quickly hit `max_connections` limits and crash.
- **The Fix:** Always connect through PgBouncer or a connection pooler (e.g. Supabase Supavisor, Prisma Accelerate). Limit `connection_limit=5` in the database URL on low-RAM VPS deployments.

### 6.2 Prisma Field Selection & Payload CMS Query Depth
- **❌ BAD:** `await prisma.book.findMany()` fetching all 40 columns including raw body text when only title and ID are displayed.
- **✅ GOOD:** Use explicit `select`:
```ts
const books = await prisma.book.findMany({
  select: { id: true, title: true, slug: true, coverImage: true },
});
```
- **Payload CMS:** Set `depth: 0` or `depth: 1` on Payload queries to prevent deep recursive join fetches of related documents unless strictly necessary.

### 6.3 Fast Session / Auth Inspections
- **The Issue:** Verification calls hitting third-party auth services on every single server component render add 200ms - 1000ms latency.
- **The Fix:** Validate local JWT session cookies directly from request headers (`await cookies()`) for initial render, reserving full remote network re-validations for sensitive mutation endpoints.

---

## 💾 SECTION 7: NEXT.JS 16 CACHING & DATA PROTOCOLS

### 7.1 Caching Granularity (`"use cache"` & Tagging)
- **`"use cache"`:** Declare at function or file level for static or expensive compute results.
- **`cacheTag('tag-name')` / `revalidateTag('tag-name')`:** Use semantic tags to invalidate specific entity caches on mutation rather than clearing global route caches.
- **`revalidatePath('/route')`:** Execute inside Server Actions following data mutations to purge dynamic UI caches deterministically.

### 7.2 Cache Safety
- **Rule:** NEVER use global `"use cache"` on functions accessing user-specific session data or private credentials. Use `"use cache private"` or scope cache keys strictly by `userId`.

---

## 💯 SECTION 8: LIGHTHOUSE 100 & CORE WEB VITALS (LCP, INP, CLS)

### 8.1 Image Optimization (`next/image`)
- **Rule:** Never use standard raw HTML `<img>` tags for internal or primary images.
- **LCP Image:** Apply `priority` attribute to the above-the-fold hero image. Set `loading="eager"`.
- **Below-the-fold Images:** Rely on default `loading="lazy"`. Always define `sizes` (e.g. `sizes="(max-width: 768px) 100vw, 50vw"`) to ensure devices download appropriately scaled responsive images.
- **Formats:** Set `formats: ["image/avif", "image/webp"]` in `next.config.ts`.

### 8.2 Self-Hosted Web Fonts (`next/font`)
- **Rule:** Never load fonts via external `<link href="https://fonts.googleapis.com">` tags. Use `next/font/google` or `next/font/local` to self-host font files automatically at build time with `display: 'swap'`.

### 8.3 Third-Party Script Optimization (`next/script`)
- **Rule:** Load analytics, tracking, or support scripts with `<Script strategy="lazyOnload" />` or `<Script strategy="afterInteractive" />` to keep main-thread execution free during initial page load.

### 8.4 Modular & Dynamic Imports (Bundle Trimming)
- **Action:** Replace full module barrel imports (`import _ from 'lodash'`) with direct path imports (`import debounce from 'lodash/debounce'`).
- **Dynamic Imports:** Code-split heavy client components (rich text editors, chart libraries, heavy dialogs) using `dynamic(() => import('./HeavyModal'), { ssr: false })`.

### 8.5 Service Worker & PWA Caching (Serwist / Workbox)
- **Action:** Cache static app shell assets (JS/CSS/fonts) and offline fallback pages via Serwist service worker strategies to guarantee instant second-visit load times.

---

## 🧪 SECTION 9: AUDIT & TESTING WORKFLOW

1. **Production Build Simulation:** Always test performance on production builds (`npm run build && npm run start`), as development builds contain diagnostic overhead.
2. **Network & CPU Throttling:** Validate mobile UX in Chrome DevTools using "Slow 4G" network and "4x CPU Throttling".
3. **Automated Site Audit:** Run Lighthouse or Unlighthouse across dynamic routes: `npx unlighthouse --site http://localhost:3000`.
4. **React Profiler:** Inspect long tasks (>50ms) and unnecessary re-renders using React Developer Tools Profiler.
