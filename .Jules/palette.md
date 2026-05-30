## 2024-05-30 - Pairing loading states with ARIA labels
**Learning:** When using icon-only toggle buttons (like Follow/Unfollow), screen reader users need context when the state is changing. The `aria-label` should explicitly describe the action being taken or the next available action (e.g. 'Unfollow playlist' when already following).
**Action:** Ensure that all toggle buttons, especially those that trigger async actions, show a loading state AND have a state-dependent `aria-label`.
