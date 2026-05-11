## 2026-05-11 - Added ARIA labels to Icon Buttons
**Learning:** When using components like `lucide-react` inside standard `shadcn/ui` buttons, it's essential to supply `aria-label` and `title` to the button element so screen readers can properly identify the action, since the icon alone isn't sufficient.
**Action:** Always verify that buttons lacking visible text include a descriptive `aria-label`.
