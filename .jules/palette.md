## 2024-06-14 - Added ARIA Labels to Icon-only Buttons
**Learning:** Added ARIA labels to icon-only buttons across the app to improve accessibility for screen readers. Found a consistent pattern of using `variant="ghost" size="icon"` or `size="icon"` without labels.
**Action:** When adding new icon-only buttons, always ensure an `aria-label` attribute is included, matching the language context of the surrounding UI.
