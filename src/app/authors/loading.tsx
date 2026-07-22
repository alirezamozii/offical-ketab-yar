import { AuthorsDirectorySkeleton } from '@/components/authors/authors-skeleton'

export default function AuthorsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <AuthorsDirectorySkeleton count={9} />
    </div>
  )
}
