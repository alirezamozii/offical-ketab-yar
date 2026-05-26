## 2024-05-26 - Removed manual serialization anti-pattern
**Learning:** Next.js automatically serializes props passed from Server Components to Client Components. Manually using `JSON.parse(JSON.stringify())` on plain JavaScript objects is a performance anti-pattern and should be avoided.
**Action:** Do not manually serialize plain objects when passing them from Server Components to Client Components.
