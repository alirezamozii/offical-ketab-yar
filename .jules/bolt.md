## 2024-05-18 - React.memo on Grid Components
**Learning:** Found that `BookCard` and `BookListItemComponent` are rendered in large lists (like `BookGrid` and `BookCarouselSection`) without memoization. Given that Next.js App Router heavily relies on React's rendering lifecycle, missing memoization on list items can cause significant performance bottlenecks when parent components state updates.
**Action:** Wrapped both `BookCard` and `BookListItemComponent` in `React.memo()`. Always check components that are mapped in lists for memoization opportunities.
