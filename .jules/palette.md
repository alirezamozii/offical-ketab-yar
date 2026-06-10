## 2024-06-10 - Add loading state to Follow button in PlaylistCard
**Learning:** Icon-only buttons handling async actions (like following/unfollowing a playlist) need visual feedback to prevent users from clicking multiple times and triggering errors or inconsistent states.
**Action:** Always wrap async actions on icon-only buttons with a visual loading indicator (like `Loader2` from `lucide-react`) and provide state-dependent `aria-label` attributes to ensure context is clear for screen readers.
