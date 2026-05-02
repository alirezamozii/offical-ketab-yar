## 2024-05-02 - Icon-Only Button Accessibility
**Learning:** Found several icon-only buttons across components (`playlist-card`, `advanced-flashcard-system`, `professional-reader`) lacking `aria-label`s, breaking screen reader navigation. Some components had `sr-only` spans, but others relied solely on visual icons.
**Action:** Consistently add descriptive, translated `aria-label` attributes to all `<Button size="icon">` components without text children.
