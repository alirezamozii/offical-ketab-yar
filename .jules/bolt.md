## 2024-06-28 - Optimize derived state filtering in VocabularyManager
**Learning:** Using `useState` combined with `useEffect` to manually sync derived state (like filtering a list of words based on an active tab) causes unnecessary double-renders when data is fetched or the active tab changes.
**Action:** Avoid `useEffect` for derived state synchronization. Use `useMemo` instead to compute the filtered list synchronously during render based on the current state. This improves React performance by eliminating redundant render cycles.
