## 2025-06-05 - Avoid `JSON.parse(JSON.stringify())` in Next.js Server Components
**Learning:** In Next.js App Router, passing plain JavaScript objects (without Dates or functions) from Server Components to Client Components does not require `JSON.parse(JSON.stringify(data))`. Doing so is a performance anti-pattern that causes unnecessary CPU overhead, as Next.js natively handles serializing plain JS objects.
**Action:** Avoid using `JSON.parse(JSON.stringify())` when passing data to Client Components. Just pass the plain JS object directly.
