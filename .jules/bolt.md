## 2024-05-18 - Replacing useEffect with useMemo for Derived State
**Learning:** Using `useState` and `useEffect` to manually sync derived state (like a filtered list based on search or tabs) is an anti-pattern that causes unnecessary double-renders (first the main state updates, then the effect triggers setting the filtered state, causing a second render).
**Action:** Always prefer `useMemo` to compute derived state directly during render to ensure UI updates atomically and efficiently, without the performance penalty of a second render pass.
