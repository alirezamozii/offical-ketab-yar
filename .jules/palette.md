## 2024-06-17 - Add ARIA label and loading state to delete button

**Learning:** When using async operations on icon-only buttons (like deleting offline books), it's important to provide visual feedback (like a spinning `Loader2` from `lucide-react`) and disable the button to prevent multiple clicks. It is also critical for accessibility to add an `aria-label` that includes specific context (e.g., `Delete book: The Great Gatsby`) rather than just `Delete`, so screen readers know exactly what is being deleted.

**Action:** Always verify if an icon-only button performs an async operation. If it does, ensure it has an `aria-label` with item-specific context, a disabled state while processing, and a visual loading indicator instead of the static icon.
