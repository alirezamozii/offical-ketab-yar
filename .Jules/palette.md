## 2024-05-18 - Reader Overlay Accessibility
**Learning:** The reader interface overlays (like `ProfessionalReader`) have multiple icon-only control buttons that lacked context for screen readers and visual hover tooltips, making the interface less discoverable.
**Action:** When adding new controls to reader toolbars, always include `aria-label` and `title` attributes immediately upon creation to ensure accessibility and better tooltips.
