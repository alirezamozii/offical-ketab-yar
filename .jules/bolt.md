## 2025-06-27 - Caching Data in Radix UI Tabs
**Learning:** Radix UI's `<TabsContent>` unmounts and remounts its children when switching tabs. Using `useEffect` with local state inside these tab contents creates a performance anti-pattern because the data is refetched on every tab change.
**Action:** Replaced `useEffect` with `useQuery` (from `@tanstack/react-query`) in tabbed content to cache data. This eliminates redundant network requests and provides an instant UI update on tab switches.
