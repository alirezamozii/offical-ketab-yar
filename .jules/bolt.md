## 2024-06-20 - Memoization pattern instead of explicit state syncing
**Learning:** In Next.js client components, it's a performance anti-pattern to manually sync derived state (like `filteredWords`) using `useState` and `useEffect`. This can cause double-renders and unnecessary effect calls when the parent state (`words` or `searchQuery` or `activeTab`) changes.
**Action:** Replace `const [filtered, setFiltered] = useState(...)` and `useEffect(...)` with `const filtered = useMemo(...)` for derived filtering state.
