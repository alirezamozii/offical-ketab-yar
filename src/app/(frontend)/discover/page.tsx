import { redirect } from 'next/navigation'

/**
 * /discover — DELETED per user feedback.
 *
 * The Discovery section was removed entirely from the UI (header, bottom
 * nav, all references). The only piece worth keeping — the Top 10 Trending
 * list — was moved to /library (see src/components/library/top-trending.tsx).
 *
 * This route now permanently redirects to /library so any old bookmarks
 * or internal links don't 404.
 */
export default function DiscoverRedirect() {
  redirect('/library')
}
