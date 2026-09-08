/** Destructive CMS operations are limited to administrators and owners. */
export function canDeleteContent(user: unknown): boolean {
  if (!user || typeof user !== 'object' || !('role' in user)) return false
  return user.role === 'admin' || user.role === 'owner'
}
