## 2026-05-23 - Context-specific ARIA labels and Loading States in Lists
**Learning:** When dealing with lists of items where an action (like delete) is represented by an icon, a generic ARIA label like 'Delete' is insufficient for screen readers as it lacks context. Additionally, missing loading states on async actions can cause confusion and double clicks.
**Action:** Always provide context in ARIA labels using item specifics (e.g., `Delete ${item.name}`). For async actions on icon-only buttons, use a loading spinner (`Loader2` with `animate-spin`) and a disabled state during the operation.
