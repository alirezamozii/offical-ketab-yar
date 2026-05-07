## 2024-05-07 - Inefficient Props Serialization in Server Components

**Learning:** In Next.js App Router, passing plain JavaScript objects (without Dates or functions) from Server Components to Client Components does not require `JSON.parse(JSON.stringify(data))`. Doing so is a performance anti-pattern because React automatically serializes standard objects, so manually serializing them incurs unnecessary CPU overhead and creates redundant garbage collection pressure.

**Action:** Removed manual `JSON.parse(JSON.stringify())` calls in `HighestRatedBooks`, `RecentlyAddedBooks`, and `MostReadBooks` server components when passing transformed data to `BookCarouselSectionClient`. Ensure plain JS objects are passed directly in future components.
