## 2025-06-24 - Playlist Card Accessibility & Feedback
**Learning:** Icon-only action buttons (like follow/heart or delete/trash) in list views lack context for screen readers and miss visual loading feedback during async operations, leading to uncertainty if the action registered.
**Action:** Always add state-dependent `aria-label`s to icon buttons and wrap their icons in a conditionally rendered loading spinner (e.g. `Loader2` from `lucide-react`) when tied to async operations.
