## 2024-06-07 - Add aria labels and loading state to PlaylistCard icons
**Learning:** Icon-only buttons lacking `aria-label`s are an accessibility hazard, and async follow/unfollow actions without an inline loading state leave users confused about the operation's progress. Also, running `npx prettier --write <file>` on legacy files formats the entire file and creates huge diffs.
**Action:** Always verify icon-only buttons include `aria-label`s and use `Loader2` for loading states on async actions. Manually format modified lines instead of running file-wide formatters to keep PRs focused.
