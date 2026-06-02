## 2024-06-02 - Memoization and Debounce
**Learning:** Found a common anti-pattern where filtering logic in React components was placed inside `useEffect` and updating a separate piece of state (`filteredWords`), leading to double re-renders. Additionally, search filtering was happening synchronously on every keystroke.
**Action:** Replaced the `useEffect` sync pattern with a combination of `useDebounce` and `useMemo` for derived state, significantly reducing unnecessary renders and blocking operations when typing.
