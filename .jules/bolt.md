## 2024-06-14 - Replace useEffect derived state with useMemo
**Learning:** Found an anti-pattern where filtering lists used `useState` combined with `useEffect` to sync the state. This causes double-renders when discrete states (like active tabs) or inputs change, leading to janky UI updates.
**Action:** Always use `useMemo` for derived state like filtered lists. For discrete selections like tabs, `useMemo` is sufficient. For continuous rapid inputs like search queries, combine `useMemo` with a debounce hook to prevent excessive computations.
