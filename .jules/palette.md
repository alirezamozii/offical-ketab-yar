## 2024-06-27 - Playlist Card Accessibility
**Learning:** Icon-only buttons used for async actions (like Follow/Unfollow) often lack both screen reader context and visible loading states, leading to poor UX and accessibility.
**Action:** Always wrap async actions on icon-only buttons with visual loading indicators (e.g., `Loader2` from `lucide-react`) and provide precise, state-dependent `aria-label` attributes using specific item context (e.g., `` `لغو دنبال کردن ${playlist.name}` ``).
