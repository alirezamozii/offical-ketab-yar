## 2024-05-14 - Remove Unnecessary JSON Serialization
**Learning:** Using `JSON.parse(JSON.stringify(data))` to pass plain objects (without Dates or functions) from Server Components to Client Components in Next.js App Router is a performance anti-pattern. Next.js handles this natively.
**Action:** Always pass plain objects directly from Server Components to Client Components without manual serialization to avoid redundant CPU overhead.
