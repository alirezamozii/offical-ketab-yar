import { PageTransition } from '@/components/layout/page-transition'

/**
 * Next.js template — re-mounts on every navigation.
 * Wraps page content in <PageTransition /> for a subtle fade + slide.
 * (Does not apply to layout.tsx itself, only to page content.)
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>
}
