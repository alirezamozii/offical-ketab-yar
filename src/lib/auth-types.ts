/**
 * src/lib/auth-types.ts — Decoupled session and user type definitions
 */

export type SessionUser = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role: string
  username?: string | null
  banned?: boolean
  onboardingCompleted?: boolean
  englishLevel?: string | null
}
