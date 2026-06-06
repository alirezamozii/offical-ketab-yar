## 2026-06-06 - Remove unnecessary JSON serialization overhead in Server Components
**Learning:** In Next.js App Router, passing plain JavaScript objects (without Dates or functions) from Server Components to Client Components does not require `JSON.parse(JSON.stringify(data))`. Doing so is a performance anti-pattern and should be avoided.
**Action:** Replaced `JSON.parse(JSON.stringify(data))` with direct prop passing when the data is already a plain JavaScript object.
