## 2024-05-15 - Missing ARIA Labels on Playlist Card Buttons
**Learning:** Found multiple icon-only buttons in the PlaylistCard component without accessible names, creating a poor experience for screen reader users when following or deleting playlists.
**Action:** Add aria-label to all icon-only buttons in PlaylistCard to ensure action intents are clearly communicated.
