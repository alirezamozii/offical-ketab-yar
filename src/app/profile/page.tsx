import { redirect } from 'next/navigation'

/**
 * /profile — MERGED into /dashboard per user feedback.
 *
 * The standalone Profile page was a duplicate of the Dashboard with extra
 * settings (theme, storage cleanup, daily goal slider). All identity +
 * stats + achievements now live on the Dashboard. Settings live on
 * /settings. This route permanently redirects to /dashboard so old
 * bookmarks keep working.
 */
export default function ProfileRedirect() {
  redirect('/dashboard')
}
