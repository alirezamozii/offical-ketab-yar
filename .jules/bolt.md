## 2026-06-21 - Avoid JSON.parse(JSON.stringify) in Next.js Server Components
**Learning:** Passing plain JavaScript objects from Server Components to Client Components in Next.js App Router does not require `JSON.parse(JSON.stringify(data))`. Doing so is a performance anti-pattern because it unnecessarily blocks the main thread for serialization and deserialization of potentially large datasets.
**Action:** Pass plain objects directly without manual serialization to improve Server Component rendering performance.
