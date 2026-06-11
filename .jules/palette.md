## 2025-02-23 - Translating ARIA Labels in Multilingual Components
**Learning:** Interactive components often include English ARIA labels (e.g., `aria-label="Go to slide 1"`) by default, even when the visual UI is in another language (e.g., Persian). This creates a jarring experience for screen reader users expecting localized context.
**Action:** Always verify that `aria-label` attributes are manually translated to match the UI's primary language, especially for dynamic or generated elements like pagination dots or carousel controls.
