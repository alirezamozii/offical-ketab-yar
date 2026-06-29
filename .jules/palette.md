## 2026-06-29 - Adding ARIA labels to icon-only buttons
**Learning:** Icon-only buttons (using lucide-react icons) without accessible names are opaque to screen readers. For multilingual applications like Ketab Yar, it is crucial to match the ARIA label language to the specific component context.
**Action:** Always verify that every icon-only button has a descriptive aria-label property. Adjust the language of the label to match the surrounding UI context.
