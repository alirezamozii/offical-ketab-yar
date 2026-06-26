## 2024-05-18 - Missing ARIA labels on icon buttons in Reader
**Learning:** The `ProfessionalReader` and `VocabularyManager` components contain numerous icon-only buttons (like settings, chat, highlights, pronunciation) without `aria-label` attributes. This makes them inaccessible to screen readers, especially since the UI can be mixed English/Farsi.
**Action:** Add descriptive `aria-label`s to all icon-only buttons to ensure they convey their purpose properly.
