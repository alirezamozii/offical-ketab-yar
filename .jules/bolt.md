## 2025-03-09 - React.memo Optimization
**Learning:** In list and grid views where components like `BookCard` and `BookListItemComponent` receive stable object props from arrays, rendering loops cause unnecessary child renders on parent updates. Using `React.memo` is highly effective here.
**Action:** Use `React.memo` for list item components to prevent expensive DOM/Framer Motion calculations on parent updates when props haven't actually changed.
