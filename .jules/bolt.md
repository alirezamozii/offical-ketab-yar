## 2024-05-17 - Avoid JSON Serialization in Server Components
**Learning:** In Next.js App Router, passing plain JavaScript objects (without Dates or functions) from Server Components to Client Components does not require `JSON.parse(JSON.stringify(data))`. Doing so is a performance anti-pattern that adds unnecessary CPU overhead and memory usage.
**Action:** Remove `JSON.parse(JSON.stringify())` when passing plain objects to Client Components.
