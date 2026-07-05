## 2024-05-18 - Replacing `useState` & `useEffect` combinations for Derived State Filtering with `useMemo`
**Learning:** Using `useEffect` to synchronize derived state (like `filteredWords` dependent on `words` and `searchQuery` or `activeTab`) causes unnecessary double re-renders in React and makes the application slower. It is better to rely on memoized derived state.
**Action:** Consistently replace manual filtering states managed via `useEffect` with `useMemo` for derived lists to prevent performance regressions.
