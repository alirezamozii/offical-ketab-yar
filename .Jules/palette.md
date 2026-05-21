## 2024-05-18 - Missing ARIA labels and loading states on Playlist Card
**Learning:** Icon-only buttons often lack accessibility context (like ARIA labels) and asynchronous actions don't always provide immediate feedback (like loading spinners), leading to a confusing UX.
**Action:** Ensure that all icon-only interactive elements receive descriptive `aria-label` attributes and that buttons triggering asynchronous functions give clear visual feedback (e.g., using `Loader2` while disabled) to reassure the user that the action is processing.
