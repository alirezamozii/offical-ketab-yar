## 2026-06-04 - Accessible and Interactive Icon-Only Buttons

**Learning:** Icon-only buttons for async actions (like Follow/Unfollow) lack context for screen readers and can confuse users if there is no immediate visual feedback during the request.
**Action:** Always combine context-specific `aria-label` attributes (e.g., "دنبال کردن پلی‌لیست [نام]") with a visual loading state (like `Loader2` with `animate-spin`) on icon-only buttons to ensure clear, accessible feedback for all users.
