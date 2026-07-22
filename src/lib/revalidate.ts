/**
 * src/lib/revalidate.ts — central helpers for cache invalidation.
 *
 * Next.js caches route-handler output and statically-rendered pages. Admin
 * mutations write to the DB but, without these helpers, public pages
 * (`/library`, `/books/[slug]`, `/authors/[slug]`, `/blog`, `/leaderboard`)
 * would keep serving stale data until the next deploy.
 *
 * Each helper revalidates:
 *   - the relevant list pages (so new/removed items appear)
 *   - the home page (which often features books / authors / blog posts)
 *   - any specific detail page whose slug is passed in
 *
 * Pass BOTH the old and the new slug when a mutation renames or moves an
 * entity (e.g. book PATCH can change its slug, blog PATCH can rename a
 * post). Otherwise the old URL stays stale until the next deploy.
 */

import { revalidatePath } from 'next/cache'

/**
 * Revalidate public pages affected by a book mutation.
 *
 * Call after create / update / delete / page-edit / chapter-edit / import
 * on a book. `authorSlug` accepts variadic args so callers can pass both
 * the previous and the new author slug when a book is re-assigned.
 */
export function revalidateBook(
  bookSlug?: string | null,
  ...authorSlugs: (string | undefined | null)[]
): void {
  revalidatePath('/library')
  revalidatePath('/books')
  revalidatePath('/')
  if (bookSlug) {
    revalidatePath(`/books/${bookSlug}`)
  }
  for (const slug of authorSlugs) {
    if (slug) revalidatePath(`/authors/${slug}`)
  }
}

/**
 * Revalidate public pages affected by an author mutation.
 * Pass both the previous and the new slug when renaming.
 */
export function revalidateAuthor(
  ...authorSlugs: (string | undefined | null)[]
): void {
  revalidatePath('/authors')
  revalidatePath('/')
  for (const slug of authorSlugs) {
    if (slug) revalidatePath(`/authors/${slug}`)
  }
}

/**
 * Revalidate public pages affected by a blog post mutation.
 * Pass both the previous and the new slug when renaming.
 */
export function revalidateBlog(
  ...postSlugs: (string | undefined | null)[]
): void {
  revalidatePath('/blog')
  revalidatePath('/')
  for (const slug of postSlugs) {
    if (slug) revalidatePath(`/blog/${slug}`)
  }
}

/**
 * Revalidate pages that surface user data (leaderboard, user list).
 * Call after a ban / role change / delete on a user.
 */
export function revalidateUsers(): void {
  revalidatePath('/leaderboard')
  revalidatePath('/users')
}
