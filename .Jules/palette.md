## 2026-05-26 - ARIA Labels and Loading States on Icon-Only Async Buttons
**Learning:** Icon-only buttons used for async actions (like Follow or Delete) often lack accessibility context and immediate visual feedback when an action is in progress.
**Action:** Always wrap async actions on icon-only buttons with visual loading indicators (such as `Loader2` from `lucide-react`) and provide precise, state-dependent `aria-label` attributes to ensure clarity for screen readers.
