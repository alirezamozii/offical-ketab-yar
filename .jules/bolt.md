## 2024-05-10 - Avoid JSON Serialization in Server to Client Props
**Learning:** In Next.js App Router, passing plain JavaScript objects (without Dates or functions) from Server Components to Client Components does not require `JSON.parse(JSON.stringify(data))`. Doing so is a performance anti-pattern because React handles the serialization automatically.
**Action:** When passing data arrays/objects between Server and Client Components, verify the contents are plain JavaScript primitives and pass them directly without manual stringification to save CPU cycles.
