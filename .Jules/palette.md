## 2025-02-28 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Found a widespread pattern across the application where `size="icon"` buttons (using `lucide-react` icons like `<Trash2 />` or `<ArrowLeft />`) lacked `aria-label` attributes. This makes these crucial navigation and action controls completely inaccessible to screen reader users.
**Action:** Always verify that every `<Button size="icon">` (or any icon-only interactive element) has a descriptive `aria-label` attribute matching the app's language context (in this case, primarily Persian/Farsi).
