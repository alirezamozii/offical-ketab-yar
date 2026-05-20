## 2024-05-20 - Accessible loading state for Follow action
**Learning:** When using an icon-only button for async actions, changing the icon to a loading spinner without updating the `aria-label` can confuse screen reader users about the button's current state.
**Action:** Add state-dependent `aria-label` and `disabled` states alongside the visual `Loader2` indicator to assure both visual and screen reader users that their action is processing.
