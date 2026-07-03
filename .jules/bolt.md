## 2024-05-15 - Redundant State Synchronization
**Learning:** In React components like `app/vocabulary/words/page.tsx`, using `useState` combined with `useEffect` to synchronize derived state (like filtered lists) causes unnecessary double-renders. Additionally, nested string operations like `.toLowerCase()` inside `.filter()` loops severely degrade performance as the list grows.
**Action:** Always prefer `useMemo` for derived state to avoid double-renders and hoist static computations (like string conversions) out of the iteration loops to prevent recalculating them on every item.
