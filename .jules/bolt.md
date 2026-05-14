## 2024-05-14 - Remove Redundant JSON Serialization in Next.js Server Components
**Learning:** In Next.js App Router, passing plain JavaScript objects (without Dates or functions) from Server Components to Client Components does not require `JSON.parse(JSON.stringify(data))`. The framework handles serialization natively. Using this pattern manually adds unnecessary CPU overhead during SSR.
**Action:** Scan for and remove `JSON.parse(JSON.stringify())` when passing props to Client Components.
