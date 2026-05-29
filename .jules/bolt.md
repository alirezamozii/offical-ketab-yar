## 2024-05-29 - Client-side Filtering Performance

**Learning:** The application extensively uses direct `useState` variables tied to text inputs for filtering lists and categories (e.g., `searchQuery` in `help-client.tsx`, `library-header.tsx`, `vocabulary-manager.tsx`, and `words/page.tsx`). Because there is no debouncing, every keystroke triggers an immediate re-render of complex components and expensive filter calculations on large lists (like vocabulary words or books). React's state updates are synchronous by default in this context, leading to jank and main thread blocking while typing.

**Action:** Implement and use a standard `useDebounce` hook across the application. When filtering lists based on text input, use the debounced value for the actual filtering logic, while keeping the input element fully responsive by tying its `value` to the immediate (non-debounced) state. This decouples the typing experience from the expensive filtering re-renders.
