## 2024-05-19 - Debouncing immediate string filters

**Learning:** When using search inputs to immediately filter complex list components in React, the `useState` value updates immediately on each keystroke, which cascades to an immediate re-render of the list if `filter` is computed on the fly. This can block the main thread and cause noticeable lag.
**Action:** Use a `useDebounce` hook (with a typical ~300ms delay) to wrap the search query, and wrap the resulting filter logic in `useMemo` dependent on the `debouncedValue`. This delays the re-render computation until typing has paused, vastly improving input response time.
