## 2026-06-29 - React Query on Radix UI TabsContent
**Learning:** Radix UI's `<TabsContent>` unmounts and remounts its children by default when switching tabs. Using `useEffect` for data fetching inside tab components causes redundant network requests.
**Action:** Always prefer `@tanstack/react-query`'s `useQuery` to cache data when dealing with Radix UI tabs, avoiding unnecessary refetching on switch.
