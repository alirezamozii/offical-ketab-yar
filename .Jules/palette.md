## 2026-05-19 - Accessible async icon-only buttons
**Learning:** Wrapping async actions on icon-only buttons with visual loading indicators (like `Loader2`) prevents multiple clicks and provides clear feedback, while precise state-dependent `aria-label` attributes are essential for screen reader users to understand the current action (e.g. Follow vs Unfollow).
**Action:** Always include `aria-label` on icon-only buttons, and if they perform an asynchronous operation, implement an internal loading state using `Loader2` and disable the button while loading.
