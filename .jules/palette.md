## 2024-06-12 - Icon-only buttons need context-aware ARIA labels
**Learning:** Icon-only buttons without `aria-label` are inaccessible to screen readers. For dynamic components like user lists, generic labels (e.g., "Delete") are insufficient.
**Action:** Always add `aria-label` to icon-only buttons. For list items or context-specific actions, interpolate unique identifiers into the label (e.g., `aria-label={"حذف " + friend.full_name}`). Ensure labels match the surrounding UI language context (e.g., Persian labels for Persian UI).
