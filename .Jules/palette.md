## 2024-06-05 - Added contextual ARIA labels
**Learning:** When adding ARIA labels to icon-only action buttons in list components (like a list of friends, playlists, or vocabulary words), using the item's specific contextual text (e.g. `حذف پلی‌لیست ${playlist.name}` instead of just 'حذف') greatly improves the screen reader experience.
**Action:** Always interpolate unique item identifiers/names into ARIA labels within mapped lists to provide clear context for users relying on assistive technology.
