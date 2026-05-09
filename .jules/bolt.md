## 2026-05-09 - Remove unnecessary JSON serialization in Server Components
**Learning:** In Next.js App Router, passing plain JavaScript objects (without Dates or functions) from Server Components to Client Components does not require `JSON.parse(JSON.stringify(data))`. Doing so is a performance anti-pattern as Next.js automatically serializes the data during the SSR process.
**Action:** Pass plain objects directly from Server Components to Client Components without manual serialization to avoid unnecessary processing overhead.
