## 2024-05-18 - [Added ARIA Labels to Playlist Card]
**Learning:** Added ARIA labels and loading states to icon-only buttons in `PlaylistCard` components. Pure non-visual accessibility improvements (like adding ARIA labels) do not strictly require Playwright visual verification screenshots, but adding loading states does, and using a temporary mock Next.js page is a reliable way to bypass auth or complex routing constraints during verification.
**Action:** Apply state-dependent ARIA labels and loading spinners consistently to icon-only buttons for accessibility and UX.
