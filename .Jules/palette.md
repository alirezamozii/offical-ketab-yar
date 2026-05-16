## 2026-05-16 - Accessibility Pattern: Icon-only Buttons
**Learning:** The app frequently uses shadcn `<Button size="icon">` components (e.g., for play pronunciation, follow, delete, close) without accompanying `aria-label` attributes. This makes these interactive elements inaccessible to screen reader users who only hear "button" instead of the button's action.
**Action:** Add descriptive, localized (Persian) `aria-label` attributes to all icon-only buttons to ensure actions like "تلفظ" (Pronounce) or "بستن تنظیمات" (Close settings) are properly announced by screen readers.
