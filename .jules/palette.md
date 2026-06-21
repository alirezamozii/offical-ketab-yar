## 2024-06-21 - Added localized ARIA labels to book carousel controls
**Learning:** Carousel control buttons (previous/next, pagination dots) were either missing `aria-label` attributes or using English defaults in a Persian UI context, leading to poor screen reader accessibility.
**Action:** Added Persian `aria-label` attributes to the "Previous" and "Next" icon-only buttons and translated the existing English `aria-label` on the pagination dots to Persian, ensuring consistency in mixed-language UIs.
