
## 2024-05-18 - Missing ARIA labels and feedback on icon-only buttons in PlaylistCard
**Learning:** Found that `PlaylistCard` was missing `aria-label`s on its 'Follow' and 'Delete' icon-only buttons, reducing accessibility for screen reader users. Also observed that the 'Follow' button lacked a visual loading state during async operations, which could lead to poor user feedback and double-clicking.
**Action:** Always wrap async actions on icon-only buttons with visual loading indicators (like `Loader2`) and provide precise, state-dependent `aria-label` attributes to ensure clear context and feedback.
