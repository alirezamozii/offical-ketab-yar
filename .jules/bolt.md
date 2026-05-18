## 2024-05-18 - Missing Debounce on Search Inputs
**Learning:** Found multiple client-side components using inputs for search/filtering (`app/vocabulary/words/page.tsx`, `components/help/help-client.tsx`, etc) that lack debouncing, causing immediate re-renders/filtering on every keystroke. This is especially bad when filtering a large list of items on the client.
**Action:** Implement a generic `useDebounce` hook and apply it to search inputs to improve performance.
