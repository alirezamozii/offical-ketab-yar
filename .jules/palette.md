## 2025-02-18 - Dynamic ARIA labels for icon-only action buttons
**Learning:** When using icon-only buttons for actions that toggle state (like following/unfollowing), dynamic ARIA labels based on the state clearly convey the action that *will* happen. Providing item context (e.g. Playlist Name) in delete actions is also vital for screen reader clarity.
**Action:** Always dynamically generate ARIA labels for state-dependent toggle buttons and inject item context (like `item.name`) into destructive action labels.
