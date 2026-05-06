## 2026-05-06 - Adding ARIA labels to reader toolbar
**Learning:** The reader component relies heavily on icon-only buttons for its top toolbar controls. These buttons lacked screen reader context, making the interface completely inaccessible for visually impaired users. This is a common pattern for reader apps to save space, but requires strict a11y adherence.
**Action:** Always ensure any icon-only button, especially in dense control bars, has a descriptive `aria-label` attribute applied.
