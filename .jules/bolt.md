## 2026-06-11 - Derived State Anti-Pattern with Filtered Lists
**Learning:** Combining `useState` and `useEffect` to manually sync derived state (e.g. `filteredWords` from `words`) causes redundant, back-to-back re-renders. When the dependency (`words` or `activeTab`) changes, React renders once, then runs the effect, which updates state and triggers a second render.
**Action:** Use `useMemo` for synchronous filtering of lists. This computes the derived value during the render phase itself, completely eliminating the second render cycle and preventing potential UI stuttering.
