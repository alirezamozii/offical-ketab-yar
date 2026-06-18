## 2025-02-27 - Optimized Derived State Synchronization
**Learning:** The application was frequently using an anti-pattern of duplicating source state into a separate filtered state (e.g., `words` -> `filteredWords`) and syncing them via `useEffect`. This approach caused unnecessary double-renders (one for the source state update, and another for the `useEffect` triggering the filtered state update).
**Action:** Use `useMemo` to compute derived state directly during the render cycle, which prevents unnecessary re-renders and reduces the risk of state synchronization bugs.
