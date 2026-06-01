## 2025-06-01 - Avoid useEffect for derived state
**Learning:** Using `useEffect` to sync state (e.g., `filteredWords` based on `words` and `searchQuery`) causes unnecessary double re-renders and degrades performance in React components.
**Action:** Always prefer `useMemo` for derived state calculations. Combine with a `useDebounce` hook to throttle expensive operations like filtering based on user input.
