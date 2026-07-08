## 2026-07-08 - Prevent Derived State Re-renders
**Learning:** In React, using `useEffect` and `useState` to filter a list based on another state variable causes redundant re-renders. Converting  inside a  loop is a common performance pitfall for larger lists.
**Action:** Use `useMemo` to derive filtered lists dynamically instead of syncing state. When doing string comparisons inside `useMemo`, hoist any constant transformations (like `searchQuery.toLowerCase()`) outside the iteration loop to avoid recalculating it for every item.
## 2026-07-08 - Prevent Derived State Re-renders
**Learning:** In React, using `useEffect` and `useState` to filter a list based on another state variable causes redundant re-renders. Converting `.toLowerCase()` inside a `.filter()` loop is a common performance pitfall for larger lists.
**Action:** Use `useMemo` to derive filtered lists dynamically instead of syncing state. When doing string comparisons inside `useMemo`, hoist any constant transformations (like `searchQuery.toLowerCase()`) outside the iteration loop to avoid recalculating it for every item.
