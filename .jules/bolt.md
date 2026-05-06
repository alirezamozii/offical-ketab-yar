## 2024-05-06 - [Performance Improvement]
**Learning:** In Next.js App Router, passing plain JavaScript objects (without Dates or functions) from Server Components to Client Components does not require `JSON.parse(JSON.stringify(data))`. Doing so is a performance anti-pattern and should be avoided.
**Action:** Removed unnecessary `JSON.parse(JSON.stringify(books))` calls in Server Components when passing data to Client Components.
