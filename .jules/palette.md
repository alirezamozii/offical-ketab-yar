## 2026-07-05 - Adding loading states to icon-only buttons
**Learning:** Using `Loader2` from `lucide-react` replacing the icon directly prevents layout shifts while communicating background actions clearly to the user. Dialog action buttons close instantly, so placing the loading indicator on the dialog trigger itself ensures the loading state remains visible during the operation.
**Action:** Consistently replace the icon inside `<Button size="icon">` with `Loader2` when an async action is pending, instead of rendering both simultaneously.
