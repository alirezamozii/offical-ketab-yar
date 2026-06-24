## 2026-06-24 - Derived State Anti-Patterns in React Components
**Learning:** The use of `useState` synced with `useEffect` for derived state is a common anti-pattern that leads to unnecessary double-renders (first the main render, then the useEffect fires, triggering another state update and render). In `VocabularyManager`, this caused a flash of incorrect data when updating items.
**Action:** Always prefer `useMemo` for derived state like filtered lists, as it computes synchronously during rendering, avoiding the extra render cycle entirely.
