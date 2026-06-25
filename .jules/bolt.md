## 2026-06-25 - Promise.any for Fallback Keys is an Anti-Pattern
**Learning:** Using `Promise.any()` to test fallback API keys concurrently destroys the prioritization logic, burns API quota N times faster, and leaks background requests. `Promise.any()` should NOT be used for prioritized fallback sequences.
**Action:** Keep fallback logic sequential to ensure priority (e.g. use DB keys before fallback key) and avoid unnecessary API quota consumption.
## 2026-06-25 - Derived State Anti-Pattern with useState/useEffect
**Learning:** Managing derived state (like a filtered list from an active tab) using a secondary `useState` and syncing it with `useEffect` is an anti-pattern. It causes an initial render with old state followed by a second render with the updated state, leading to performance hiccups and potential UI flickering.
**Action:** Use `useMemo` to dynamically compute derived state directly during the render phase based on the primary state variables.
