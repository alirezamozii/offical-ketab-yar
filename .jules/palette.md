## 2024-07-06 - Component Context Localization for Screen Readers
**Learning:** When dealing with lists of items or iterative cards (like playlists) in a localized app (e.g., Farsi/Persian), it is critical that `aria-label`s use localized strings (e.g., `لغو دنبال کردن ${playlist.name}`) to maintain accessibility consistency for native screen reader users, rather than defaulting to English fallbacks.
**Action:** Always match the language of dynamically generated ARIA labels to the primary language of the surrounding UI text.
